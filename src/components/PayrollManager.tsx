import React, { useState } from 'react';
import {
  Receipt,
  PlusCircle,
  Search,
  Printer,
  Download,
  Users,
  Calendar,
  CheckCircle2,
  Sparkles,
  Zap,
} from 'lucide-react';
import { MadrasahInfo, PayrollRecord, Teacher } from '../types';
import { formatCurrency, getHijriDate } from '../utils/hijri';

interface PayrollManagerProps {
  madrasah: MadrasahInfo;
  selectedYear: string;
  teachers: Teacher[];
  payrolls: PayrollRecord[];
  onAddPayroll: (pay: Omit<PayrollRecord, 'id' | 'tahunAjaran'>) => Promise<void>;
  onSelectPayrollForModal: (pay: PayrollRecord) => void;
  onDownloadPDF: (pay: PayrollRecord) => void;
}

export const PayrollManager: React.FC<PayrollManagerProps> = ({
  madrasah,
  selectedYear,
  teachers,
  payrolls,
  onAddPayroll,
  onSelectPayrollForModal,
  onDownloadPDF,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMonthHijri, setSelectedMonthHijri] = useState('Syawal');
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [isGeneratingBulk, setIsGeneratingBulk] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New Payroll Form State
  const [jamMengajar, setJamMengajar] = useState<number>(0);
  const [tarifPerJam, setTarifPerJam] = useState<number>(25000);
  const [tunjanganGuru, setTunjanganGuru] = useState<number>(0);
  const [tunjanganLain, setTunjanganLain] = useState<number>(0);
  const [potonganInfaq, setPotonganInfaq] = useState<number>(15000);
  const [potonganTabungan, setPotonganTabungan] = useState<number>(25000);
  const [potonganLain, setPotonganLain] = useState<number>(0);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentHijri = getHijriDate(new Date(), madrasah.hijriOffsetDays);

  const handleTeacherChange = (teacherId: string) => {
    setSelectedTeacherId(teacherId);
    const teacher = teachers.find((t) => t.id === teacherId);
    if (teacher) {
      setJamMengajar(teacher.jamMengajar);
      setTarifPerJam(teacher.tarifPerJam);
      setTunjanganGuru(
        teacher.tunjanganJabatan + teacher.tunjanganMasaKerja + teacher.tunjanganKehadiran
      );
      setPotonganInfaq(teacher.potonganInfaq);
      setPotonganTabungan(teacher.potonganTabungan);
    }
  };

  const handleGenerateIndividual = async (e: React.FormEvent) => {
    e.preventDefault();
    const teacher = teachers.find((t) => t.id === selectedTeacherId);
    if (!teacher) return;

    setIsSubmitting(true);
    try {
      const bisyarohPokok = jamMengajar * tarifPerJam;
      const totalGajiKotor = bisyarohPokok + tunjanganGuru + tunjanganLain;
      const totalPotongan = potonganInfaq + potonganTabungan + potonganLain;
      const bisyarohBersih = Math.max(0, totalGajiKotor - totalPotongan);

      await onAddPayroll({
        teacherId: teacher.id,
        teacherName: teacher.name,
        nipNu: teacher.nipNu,
        role: teacher.role,
        monthHijri: selectedMonthHijri,
        monthGregorian: new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }),
        dateGeneratedHijri: currentHijri.formatted,
        dateGeneratedGregorian: new Date().toISOString().split('T')[0],
        jamMengajar,
        bisyarohPokok,
        tunjanganGuru,
        tunjanganLain,
        totalGajiKotor,
        potonganInfaq,
        potonganTabungan,
        potonganLain,
        totalPotongan,
        bisyarohBersih,
        status: 'LUNAS',
        notes,
      });

      setIsModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Bulk Generate Slips for All Active Teachers for the selected Hijri month
  const handleBulkGenerate = async () => {
    setIsGeneratingBulk(true);
    try {
      const activeTeachers = teachers.filter((t) => t.status === 'AKTIF');
      for (const t of activeTeachers) {
        // Check if already generated for this month
        const exists = payrolls.some(
          (p) => p.teacherId === t.id && p.monthHijri === selectedMonthHijri
        );
        if (!exists) {
          const bisyarohPokok = t.jamMengajar * t.tarifPerJam;
          const tunjanganGuruTotal =
            t.tunjanganJabatan + t.tunjanganMasaKerja + t.tunjanganKehadiran;
          const totalGajiKotor = bisyarohPokok + tunjanganGuruTotal;
          const totalPotongan = t.potonganInfaq + t.potonganTabungan;
          const bisyarohBersih = Math.max(0, totalGajiKotor - totalPotongan);

          await onAddPayroll({
            teacherId: t.id,
            teacherName: t.name,
            nipNu: t.nipNu,
            role: t.role,
            monthHijri: selectedMonthHijri,
            monthGregorian: new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }),
            dateGeneratedHijri: currentHijri.formatted,
            dateGeneratedGregorian: new Date().toISOString().split('T')[0],
            jamMengajar: t.jamMengajar,
            bisyarohPokok,
            tunjanganGuru: tunjanganGuruTotal,
            tunjanganLain: 0,
            totalGajiKotor,
            potonganInfaq: t.potonganInfaq,
            potonganTabungan: t.potonganTabungan,
            potonganLain: 0,
            totalPotongan,
            bisyarohBersih,
            status: 'LUNAS',
            notes: `Bisyaroh Otomatis ${selectedMonthHijri}`,
          });
        }
      }
    } finally {
      setIsGeneratingBulk(false);
    }
  };

  const filteredPayrolls = payrolls.filter(
    (p) =>
      p.teacherName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.monthHijri.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalBisyarohPaid = filteredPayrolls.reduce((sum, p) => sum + p.bisyarohBersih, 0);

  return (
    <div id="payroll-manager-container" className="space-y-6">
      
      {/* Top Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center space-x-2 text-amber-700 font-bold text-xs uppercase tracking-wider">
              <Receipt className="w-4 h-4" />
              <span>Modul Penggajian & Slip Bisyaroh</span>
            </div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight mt-1">
              Penggajian Ustadz, Guru & Staf TU
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Penerbitan slip bisyaroh berbasis jam mengajar, tunjangan jabatan/kehadiran, dan potongan infaq.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              id="btn-bulk-payroll"
              onClick={handleBulkGenerate}
              disabled={isGeneratingBulk}
              className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl shadow-md text-xs transition flex items-center space-x-2 disabled:opacity-50"
            >
              <Zap className="w-4 h-4" />
              <span>{isGeneratingBulk ? 'Memproses...' : 'Terbitkan Semua Slip Bulan Ini'}</span>
            </button>

            <button
              id="btn-add-single-payroll"
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded-xl shadow-md text-xs transition flex items-center space-x-2"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Buat Slip Individu</span>
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Cari nama ustadz / jabatan / bulan..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex items-center space-x-3 text-xs">
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-emerald-600" />
              <span className="text-slate-500 font-semibold">Bulan Hijriyah:</span>
            </div>
            <select
              value={selectedMonthHijri}
              onChange={(e) => setSelectedMonthHijri(e.target.value)}
              className="p-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-800 text-xs focus:ring-2 focus:ring-emerald-500"
            >
              <option value="Syawal">Syawal</option>
              <option value="Dz. Qo'dah">Dz. Qo'dah</option>
              <option value="Dz. Hijjah">Dz. Hijjah</option>
              <option value="Muharrom">Muharrom</option>
              <option value="Shafar">Shafar</option>
              <option value="Robiul Awal">Robiul Awal</option>
              <option value="Robiul Tsani">Robiul Tsani</option>
              <option value="Jumadal Awal">Jumadal Awal</option>
              <option value="Jumadal Tsani">Jumadal Tsani</option>
              <option value="Rajab">Rajab</option>
            </select>
          </div>
        </div>
      </div>

      {/* Payroll Records List */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200/80 flex items-center justify-between text-xs font-semibold text-slate-700">
          <span>{filteredPayrolls.length} Slip Bisyaroh Diterbitkan</span>
          <span className="text-emerald-800 font-bold">
            Total Bisyaroh Bersih Dicurahkan: {formatCurrency(totalBisyarohPaid)}
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {filteredPayrolls.length === 0 ? (
            <div className="p-12 text-center space-y-2">
              <Receipt className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-sm font-semibold text-slate-700">Belum ada slip bisyaroh diterbitkan</p>
              <p className="text-xs text-slate-400">
                Klik tombol "Terbitkan Semua Slip Bulan Ini" di atas untuk membuat slip bagi seluruh ustadz/ah secara otomatis.
              </p>
            </div>
          ) : (
            filteredPayrolls.map((pay) => (
              <div
                key={pay.id}
                className="p-4 hover:bg-slate-50/80 transition flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <h4 className="font-bold text-sm text-slate-900">{pay.teacherName}</h4>
                    <span className="bg-amber-100 text-amber-900 text-[10px] px-2 py-0.5 rounded-full font-semibold border border-amber-200">
                      {pay.monthHijri}
                    </span>
                  </div>

                  <p className="text-xs text-slate-500">
                    <strong className="text-slate-700">{pay.role}</strong> &bull; NIP: {pay.nipNu} &bull; {pay.jamMengajar} Jam Mengajar
                  </p>

                  <div className="flex items-center space-x-3 text-[11px] text-slate-500 pt-1">
                    <span>Gaji Kotor: <strong>{formatCurrency(pay.totalGajiKotor)}</strong></span>
                    <span>&bull;</span>
                    <span className="text-rose-600">Potongan: <strong>-{formatCurrency(pay.totalPotongan)}</strong></span>
                    <span>&bull;</span>
                    <span>Tanggal: {pay.dateGeneratedHijri}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between md:justify-end space-x-3">
                  <div className="text-right">
                    <span className="text-base font-black text-emerald-800 block">
                      {formatCurrency(pay.bisyarohBersih)}
                    </span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold uppercase">
                      {pay.status}
                    </span>
                  </div>

                  <div className="flex items-center space-x-1.5">
                    <button
                      onClick={() => onSelectPayrollForModal(pay)}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-amber-100 text-slate-800 hover:text-amber-900 rounded-lg text-xs font-semibold border border-slate-200 transition flex items-center space-x-1"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Lihat Slip</span>
                    </button>

                    <button
                      onClick={() => onDownloadPDF(pay)}
                      className="p-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg transition"
                      title="Unduh PDF Slip Bisyaroh"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                </div>

              </div>
            ))
          )}
        </div>
      </div>

      {/* Individual Payroll Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-900">Buat Slip Bisyaroh Individu</h3>
                <p className="text-xs text-slate-500">Input rincian bisyaroh dan tunjangan per ustadz/ah</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                &times;
              </button>
            </div>

            <form onSubmit={handleGenerateIndividual} className="space-y-3 text-xs">
              
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Pilih Ustadz / Staff TU</label>
                <select
                  value={selectedTeacherId}
                  onChange={(e) => handleTeacherChange(e.target.value)}
                  required
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">-- Pilih Ustadz / Staff --</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} - {t.role} ({t.jamMengajar} Jam)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Jam Mengajar / Minggu</label>
                  <input
                    type="number"
                    value={jamMengajar}
                    onChange={(e) => setJamMengajar(Number(e.target.value))}
                    required
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tarif Per Jam (Rp)</label>
                  <input
                    type="number"
                    value={tarifPerJam}
                    onChange={(e) => setTarifPerJam(Number(e.target.value))}
                    required
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tunjangan Jabatan & Kehadiran</label>
                  <input
                    type="number"
                    value={tunjanganGuru}
                    onChange={(e) => setTunjanganGuru(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tunjangan Lain-lain</label>
                  <input
                    type="number"
                    value={tunjanganLain}
                    onChange={(e) => setTunjanganLain(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Potongan Infaq Syahriyah</label>
                  <input
                    type="number"
                    value={potonganInfaq}
                    onChange={(e) => setPotonganInfaq(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-rose-700 font-semibold"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Potongan Tabungan Guru</label>
                  <input
                    type="number"
                    value={potonganTabungan}
                    onChange={(e) => setPotonganTabungan(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-rose-700 font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Catatan / Keterangan</label>
                <input
                  type="text"
                  placeholder="Catatan tambahan..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-medium"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !selectedTeacherId}
                  className="px-4 py-2 bg-emerald-700 text-white rounded-xl font-bold hover:bg-emerald-600 disabled:opacity-50"
                >
                  {isSubmitting ? 'Menerbitkan...' : 'Terbitkan Slip'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};
