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
  Trash2,
  Filter,
} from 'lucide-react';
import { MadrasahInfo, PayrollRecord, Teacher } from '../types';
import { formatCurrency, getHijriDate } from '../utils/hijri';

interface PayrollManagerProps {
  madrasah: MadrasahInfo;
  selectedYear: string;
  availableYears?: string[];
  onSelectYear?: (year: string) => void;
  teachers: Teacher[];
  payrolls: PayrollRecord[];
  onAddPayroll: (pay: Omit<PayrollRecord, 'id'>) => Promise<void>;
  onDeletePayroll?: (id: string) => Promise<void>;
  onDeleteAllPayrolls?: () => Promise<void>;
  onSelectPayrollForModal: (pay: PayrollRecord) => void;
  onDownloadPDF: (pay: PayrollRecord) => void;
}

export const PayrollManager: React.FC<PayrollManagerProps> = ({
  madrasah,
  selectedYear,
  availableYears = ['1444 - 1445 H.', '1445 - 1446 H.', '1446 - 1447 H.', '1447 - 1448 H.', '1448 - 1449 H.'],
  onSelectYear,
  teachers,
  payrolls,
  onAddPayroll,
  onDeletePayroll,
  onDeleteAllPayrolls,
  onSelectPayrollForModal,
  onDownloadPDF,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilterYear, setSelectedFilterYear] = useState(selectedYear);
  const [selectedMonthHijri, setSelectedMonthHijri] = useState('Syawal');
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [formTahunAjaran, setFormTahunAjaran] = useState(selectedYear);
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
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeletePayroll, setConfirmDeletePayroll] = useState<{
    id: string;
    name: string;
    month: string;
    year: string;
  } | null>(null);
  const [confirmDeleteAll, setConfirmDeleteAll] = useState(false);

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

  const openIndividualModal = () => {
    setFormTahunAjaran(selectedFilterYear !== 'ALL' ? selectedFilterYear : selectedYear);
    setIsModalOpen(true);
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
        tahunAjaran: formTahunAjaran,
        teacherId: teacher.id,
        teacherName: teacher.name,
        nipNu: teacher.nipNu,
        role: teacher.role,
        monthHijri: selectedMonthHijri === 'ALL' ? 'Syawal' : selectedMonthHijri,
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

  // Bulk Generate Slips for All Active Teachers for the selected Hijri month & year
  const handleBulkGenerate = async () => {
    setIsGeneratingBulk(true);
    const targetYear = selectedFilterYear !== 'ALL' ? selectedFilterYear : selectedYear;
    const targetMonth = selectedMonthHijri !== 'ALL' ? selectedMonthHijri : 'Syawal';

    try {
      const activeTeachers = teachers.filter((t) => t.status === 'AKTIF');
      for (const t of activeTeachers) {
        // Check if already generated for this month & year
        const exists = payrolls.some(
          (p) =>
            p.teacherId === t.id &&
            p.monthHijri === targetMonth &&
            (p.tahunAjaran === targetYear || (!p.tahunAjaran && targetYear === '1446 - 1447 H.'))
        );
        if (!exists) {
          const bisyarohPokok = t.jamMengajar * t.tarifPerJam;
          const tunjanganGuruTotal =
            t.tunjanganJabatan + t.tunjanganMasaKerja + t.tunjanganKehadiran;
          const totalGajiKotor = bisyarohPokok + tunjanganGuruTotal;
          const totalPotongan = t.potonganInfaq + t.potonganTabungan;
          const bisyarohBersih = Math.max(0, totalGajiKotor - totalPotongan);

          await onAddPayroll({
            tahunAjaran: targetYear,
            teacherId: t.id,
            teacherName: t.name,
            nipNu: t.nipNu,
            role: t.role,
            monthHijri: targetMonth,
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
            notes: `Bisyaroh Otomatis ${targetMonth} (${targetYear})`,
          });
        }
      }
    } finally {
      setIsGeneratingBulk(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (onDeletePayroll) {
      setDeletingId(id);
      try {
        await onDeletePayroll(id);
      } finally {
        setDeletingId(null);
      }
    }
  };

  const filteredPayrolls = payrolls.filter((p) => {
    const matchYear =
      selectedFilterYear === 'ALL' ||
      p.tahunAjaran === selectedFilterYear ||
      (!p.tahunAjaran && selectedFilterYear === '1446 - 1447 H.');
    const matchMonth = selectedMonthHijri === 'ALL' || p.monthHijri === selectedMonthHijri;

    const term = searchTerm.trim().toLowerCase();
    const matchSearch =
      !term ||
      p.teacherName.toLowerCase().includes(term) ||
      p.nipNu.toLowerCase().includes(term) ||
      p.role.toLowerCase().includes(term) ||
      p.monthHijri.toLowerCase().includes(term) ||
      p.monthGregorian.toLowerCase().includes(term) ||
      p.dateGeneratedHijri.toLowerCase().includes(term) ||
      p.dateGeneratedGregorian.toLowerCase().includes(term) ||
      (p.tahunAjaran && p.tahunAjaran.toLowerCase().includes(term)) ||
      (p.notes && p.notes.toLowerCase().includes(term));

    return matchYear && matchMonth && matchSearch;
  });

  const totalBisyarohPaid = filteredPayrolls.reduce((sum, p) => sum + p.bisyarohBersih, 0);
  const activeYearLabel = selectedFilterYear !== 'ALL' ? selectedFilterYear : selectedYear;
  const activeMonthLabel = selectedMonthHijri !== 'ALL' ? selectedMonthHijri : 'Bulan Terpilih';

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

          <div className="flex flex-wrap items-center gap-2">
            {onDeleteAllPayrolls && payrolls.length > 0 && (
              <button
                id="btn-delete-all-payroll"
                type="button"
                onClick={() => setConfirmDeleteAll(true)}
                className="px-3.5 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-xl border border-rose-200 text-xs transition flex items-center space-x-1.5"
                title="Hapus seluruh data slip gaji di database"
              >
                <Trash2 className="w-4 h-4 text-rose-600" />
                <span>Hapus Semua Slip</span>
              </button>
            )}

            <button
              id="btn-bulk-payroll"
              onClick={handleBulkGenerate}
              disabled={isGeneratingBulk}
              className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl shadow-md text-xs transition flex items-center space-x-2 disabled:opacity-50"
              title={`Terbitkan slip otomatis untuk TA ${activeYearLabel}`}
            >
              <Zap className="w-4 h-4" />
              <span>
                {isGeneratingBulk
                  ? 'Memproses...'
                  : `Terbitkan Slip Bulk (${activeYearLabel})`}
              </span>
            </button>

            <button
              id="btn-add-single-payroll"
              onClick={openIndividualModal}
              className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded-xl shadow-md text-xs transition flex items-center space-x-2"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Buat Slip Individu</span>
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Cari ustadz / NIP / tanggal / jabatan / bulan..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 text-xs bg-slate-200 hover:bg-slate-300 rounded-full w-4 h-4 flex items-center justify-center font-bold transition"
                title="Bersihkan pencarian"
              >
                &times;
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs">
            {/* Year Filter */}
            <div className="flex items-center space-x-2 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl">
              <Filter className="w-3.5 h-3.5 text-emerald-700" />
              <span className="text-emerald-900 font-semibold">Tahun Ajaran:</span>
              <select
                value={selectedFilterYear}
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedFilterYear(val);
                  if (val !== 'ALL' && onSelectYear) {
                    onSelectYear(val);
                  }
                }}
                className="bg-white border border-emerald-300 rounded-lg px-2 py-1 font-bold text-emerald-950 text-xs focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              >
                <option value="ALL">-- Semua Tahun --</option>
                {availableYears.map((yr) => (
                  <option key={yr} value={yr}>
                    TA {yr}
                  </option>
                ))}
              </select>
            </div>

            {/* Month Filter */}
            <div className="flex items-center space-x-2 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl">
              <Calendar className="w-3.5 h-3.5 text-amber-700" />
              <span className="text-amber-900 font-semibold">Bulan Hijriyah:</span>
              <select
                value={selectedMonthHijri}
                onChange={(e) => setSelectedMonthHijri(e.target.value)}
                className="bg-white border border-amber-300 rounded-lg px-2 py-1 font-bold text-amber-950 text-xs focus:ring-2 focus:ring-amber-500 cursor-pointer"
              >
                <option value="ALL">-- Semua Bulan --</option>
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
      </div>

      {/* Payroll Records List */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200/80 flex items-center justify-between text-xs font-semibold text-slate-700">
          <div className="flex items-center space-x-2">
            <span>{filteredPayrolls.length} Slip Bisyaroh Diterbitkan</span>
            {selectedFilterYear !== 'ALL' && (
              <span className="bg-emerald-100 text-emerald-800 text-[10px] px-2 py-0.5 rounded-full font-bold">
                TA {selectedFilterYear}
              </span>
            )}
            {selectedMonthHijri !== 'ALL' && (
              <span className="bg-amber-100 text-amber-800 text-[10px] px-2 py-0.5 rounded-full font-bold">
                Bulan {selectedMonthHijri}
              </span>
            )}
          </div>
          <span className="text-emerald-800 font-bold">
            Total Bisyaroh Bersih: {formatCurrency(totalBisyarohPaid)}
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {filteredPayrolls.length === 0 ? (
            <div className="p-12 text-center space-y-2">
              <Receipt className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-sm font-semibold text-slate-700">Belum ada slip bisyaroh diterbitkan untuk filter ini</p>
              <p className="text-xs text-slate-400">
                Klik "Terbitkan Slip Bulk ({activeYearLabel})" atau pilih filter bulan/tahun lain.
              </p>
            </div>
          ) : (
            filteredPayrolls.map((pay) => (
              <div
                key={pay.id}
                className="p-4 hover:bg-slate-50/80 transition flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="font-bold text-sm text-slate-900">{pay.teacherName}</h4>
                    <span className="bg-amber-100 text-amber-900 text-[10px] px-2 py-0.5 rounded-full font-semibold border border-amber-200">
                      {pay.monthHijri}
                    </span>
                    <span className="bg-emerald-100 text-emerald-900 text-[10px] px-2 py-0.5 rounded-full font-bold border border-emerald-200">
                      TA {pay.tahunAjaran || selectedYear}
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
                      title="Lihat Detail Slip Gaji"
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

                    {onDeletePayroll && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setConfirmDeletePayroll({
                            id: pay.id,
                            name: pay.teacherName,
                            month: pay.monthHijri,
                            year: pay.tahunAjaran || selectedYear,
                          });
                        }}
                        disabled={deletingId === pay.id}
                        className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 hover:text-rose-800 rounded-lg border border-rose-200 transition flex items-center space-x-1 font-bold text-xs disabled:opacity-50"
                        title="Hapus Slip Gaji"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                        <span>Hapus</span>
                      </button>
                    )}
                  </div>
                </div>

              </div>
            ))
          )}
        </div>
      </div>

      {/* Individual Payroll Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-4 sm:p-6 shadow-2xl border border-slate-200 space-y-4">
            
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
                <label className="block font-semibold text-slate-700 mb-1">Tahun Ajaran</label>
                <select
                  value={formTahunAjaran}
                  onChange={(e) => setFormTahunAjaran(e.target.value)}
                  required
                  className="w-full p-2.5 bg-emerald-50 border border-emerald-300 rounded-xl font-bold text-emerald-950 focus:ring-2 focus:ring-emerald-500"
                >
                  {availableYears.map((yr) => (
                    <option key={yr} value={yr}>
                      TA {yr}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
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
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Bulan Hijriyah</label>
                  <select
                    value={selectedMonthHijri === 'ALL' ? 'Syawal' : selectedMonthHijri}
                    onChange={(e) => setSelectedMonthHijri(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-emerald-500"
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

      {/* Modal Confirm Delete Individual Slip */}
      {confirmDeletePayroll && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center space-x-3 text-rose-600">
              <div className="p-2.5 bg-rose-100 rounded-xl">
                <Trash2 className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg text-slate-900">Hapus Slip Bisyaroh</h3>
            </div>
            
            <p className="text-xs text-slate-600 leading-relaxed">
              Apakah Anda yakin ingin menghapus slip gaji <strong className="text-slate-900">{confirmDeletePayroll.name}</strong> ({confirmDeletePayroll.month} - TA {confirmDeletePayroll.year})?
            </p>
            <p className="text-[11px] text-amber-800 bg-amber-50 p-2.5 rounded-xl border border-amber-200">
              📌 Catatan: Catatan transaksi bisyaroh terkait di Buku Kas Umum dan realisasi RAPBM juga akan disesuaikan otomatis.
            </p>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t">
              <button
                type="button"
                onClick={() => setConfirmDeletePayroll(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={async () => {
                  const targetId = confirmDeletePayroll.id;
                  setConfirmDeletePayroll(null);
                  await handleDelete(targetId);
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs shadow-md transition flex items-center space-x-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>Ya, Hapus Slip</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Confirm Delete ALL Slips */}
      {confirmDeleteAll && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center space-x-3 text-rose-600">
              <div className="p-2.5 bg-rose-100 rounded-xl">
                <Trash2 className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg text-slate-900">Hapus Semua Slip Gaji</h3>
            </div>
            
            <p className="text-xs text-slate-600 leading-relaxed">
              Apakah Anda YAKIN ingin menghapus <strong>SEMUA {payrolls.length} data slip gaji</strong> yang tersimpan?
            </p>
            <p className="text-[11px] text-rose-800 bg-rose-50 p-2.5 rounded-xl border border-rose-200 font-medium">
              ⚠️ Perhatian: Seluruh catatan pengeluaran bisyaroh di Buku Kas Umum dan anggaran RAPBM terkait akan dibersihkan. Tindakan ini tidak dapat dibatalkan.
            </p>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t">
              <button
                type="button"
                onClick={() => setConfirmDeleteAll(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={async () => {
                  setConfirmDeleteAll(false);
                  if (onDeleteAllPayrolls) {
                    await onDeleteAllPayrolls();
                  }
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs shadow-md transition flex items-center space-x-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>Hapus Semua Data</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

