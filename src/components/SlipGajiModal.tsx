import React from 'react';
import { Download, Printer, Building2, CheckCircle2, ArrowLeft, Home, Trash2 } from 'lucide-react';
import { MadrasahInfo, PayrollRecord } from '../types';
import { formatCurrency } from '../utils/hijri';

interface SlipGajiModalProps {
  madrasah: MadrasahInfo;
  payroll: PayrollRecord;
  onClose: () => void;
  onDownloadPDF: (p: PayrollRecord) => void;
  onDeletePayroll?: (id: string) => Promise<void>;
  onGoHome?: () => void;
}

export const SlipGajiModal: React.FC<SlipGajiModalProps> = ({
  madrasah,
  payroll,
  onClose,
  onDownloadPDF,
  onDeletePayroll,
  onGoHome,
}) => {
  const [showConfirmDelete, setShowConfirmDelete] = React.useState(false);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6 my-8 animate-in fade-in zoom-in duration-150">
        
        {/* Top Control Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-4 print:hidden">
          <div className="flex items-center space-x-2 text-emerald-800 font-bold text-sm">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span>Slip Bisyaroh Guru - Salinan Resmi</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold rounded-xl text-xs transition flex items-center space-x-1.5"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Layar</span>
            </button>

            <button
              onClick={() => onDownloadPDF(payroll)}
              className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded-xl text-xs shadow-sm transition flex items-center space-x-1.5"
            >
              <Download className="w-4 h-4" />
              <span>Unduh PDF</span>
            </button>

            {onDeletePayroll && (
              <button
                onClick={() => setShowConfirmDelete(true)}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs shadow-sm transition flex items-center space-x-1.5"
                title="Hapus Slip Gaji Ini"
              >
                <Trash2 className="w-4 h-4" />
                <span>Hapus Slip</span>
              </button>
            )}

            {onGoHome && (
              <button
                onClick={onGoHome}
                className="px-3.5 py-1.5 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 font-bold rounded-xl text-xs shadow-sm transition flex items-center space-x-1.5"
              >
                <Home className="w-4 h-4" />
                <span>Beranda</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="px-3.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl text-xs shadow-sm transition flex items-center space-x-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Kembali</span>
            </button>
          </div>
        </div>

        {/* Printable Area */}
        <div id="printable-slip" className="bg-amber-50/30 border border-amber-200/80 rounded-2xl p-6 space-y-6">
          
          {/* Header / Kop */}
          <div className="text-center border-b-2 border-emerald-800 pb-4 space-y-1">
            <div className="flex items-center justify-center space-x-2 text-emerald-900 font-black text-lg uppercase tracking-tight">
              <Building2 className="w-6 h-6 text-emerald-700" />
              <span>{madrasah.namaMadrasah}</span>
            </div>
            <p className="text-xs text-slate-600 font-medium">
              {madrasah.alamat}, Kec. {madrasah.kecamatan}, Kab. {madrasah.kabupaten}
            </p>
            <p className="text-[11px] text-emerald-800 font-semibold">
              Tahun Ajaran : {madrasah.tahunAjaranHijri}
            </p>
          </div>

          {/* Title */}
          <div className="text-center space-y-0.5">
            <h3 className="font-extrabold text-slate-900 text-base uppercase tracking-wide">
              SLIP BISYAROH GURU & STAF
            </h3>
            <p className="text-xs text-amber-900 font-bold bg-amber-100 inline-block px-3 py-0.5 rounded-full border border-amber-300">
              Bulan : {payroll.monthHijri} ({payroll.monthGregorian})
            </p>
          </div>

          {/* Teacher Info Grid */}
          <div className="grid grid-cols-2 gap-4 text-xs bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="space-y-1">
              <p><span className="text-slate-400">Nama Ustadz/ah :</span> <strong className="text-slate-900">{payroll.teacherName}</strong></p>
              <p><span className="text-slate-400">NIP / NUPTK     :</span> <span className="font-mono">{payroll.nipNu}</span></p>
              <p><span className="text-slate-400">Tugas / Jabatan  :</span> <span className="font-semibold text-emerald-800">{payroll.role}</span></p>
            </div>
            <div className="space-y-1 text-right">
              <p><span className="text-slate-400">Jam Mengajar :</span> <strong>{payroll.jamMengajar} Jam / Minggu</strong></p>
              <p><span className="text-slate-400">No. Kwitansi  :</span> <span className="font-mono text-slate-600">PAY-{payroll.id}</span></p>
              <p><span className="text-slate-400">Tanggal        :</span> <span>{payroll.dateGeneratedHijri}</span></p>
            </div>
          </div>

          {/* Financial Breakdown Table */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-emerald-900 text-white font-bold uppercase">
                  <th className="py-2.5 px-4">Rincian Bisyaroh & Tunjangan</th>
                  <th className="py-2.5 px-4 text-right">Jumlah (Rp)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                <tr>
                  <td className="py-2 px-4">1. Bisyaroh Pokok Jam Mengajar</td>
                  <td className="py-2 px-4 text-right font-medium">{formatCurrency(payroll.bisyarohPokok)}</td>
                </tr>
                <tr>
                  <td className="py-2 px-4">2. Tunjangan Jabatan & Kehadiran</td>
                  <td className="py-2 px-4 text-right font-medium">{formatCurrency(payroll.tunjanganGuru)}</td>
                </tr>
                <tr>
                  <td className="py-2 px-4">3. Tunjangan Lain-lain</td>
                  <td className="py-2 px-4 text-right font-medium">{formatCurrency(payroll.tunjanganLain)}</td>
                </tr>
                <tr className="bg-slate-50 font-bold text-slate-900">
                  <td className="py-2 px-4">TOTAL BISYAROH KOTOR</td>
                  <td className="py-2 px-4 text-right">{formatCurrency(payroll.totalGajiKotor)}</td>
                </tr>
                <tr>
                  <td className="py-2 px-4 text-rose-700">4. Potongan Infaq Syahriyah</td>
                  <td className="py-2 px-4 text-right text-rose-700 font-medium">-{formatCurrency(payroll.potonganInfaq)}</td>
                </tr>
                <tr>
                  <td className="py-2 px-4 text-rose-700">5. Potongan Tabungan Guru</td>
                  <td className="py-2 px-4 text-right text-rose-700 font-medium">-{formatCurrency(payroll.potonganTabungan)}</td>
                </tr>
                {payroll.potonganLain > 0 && (
                  <tr>
                    <td className="py-2 px-4 text-rose-700">6. Potongan Lain-lain</td>
                    <td className="py-2 px-4 text-right text-rose-700 font-medium">-{formatCurrency(payroll.potonganLain)}</td>
                  </tr>
                )}
                <tr className="bg-rose-50 font-bold text-rose-900">
                  <td className="py-2 px-4">TOTAL POTONGAN</td>
                  <td className="py-2 px-4 text-right">-{formatCurrency(payroll.totalPotongan)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Take Home Pay Box */}
          <div className="bg-emerald-800 text-white p-4 rounded-xl flex items-center justify-between shadow-md">
            <div>
              <span className="text-[11px] text-emerald-200 uppercase font-bold tracking-wider block">
                Total Bisyaroh Bersih Diterima
              </span>
              <span className="text-xs text-emerald-300">Termasuk seluruh tunjangan setelah potongan</span>
            </div>
            <div className="text-xl sm:text-2xl font-black text-amber-200">
              {formatCurrency(payroll.bisyarohBersih)}
            </div>
          </div>

          {/* Signatures */}
          <div className="grid grid-cols-2 gap-8 text-center text-xs pt-4">
            <div className="space-y-12">
              <div>
                <span className="text-slate-400 block font-medium">Penerima Bisyaroh,</span>
              </div>
              <div>
                <p className="font-bold text-slate-900 underline">{payroll.teacherName}</p>
                <p className="text-[11px] text-slate-500">{payroll.role}</p>
              </div>
            </div>

            <div className="space-y-12">
              <div>
                <span className="text-slate-400 block font-medium">Karangmenggah, {payroll.dateGeneratedHijri}</span>
                <span className="font-bold text-slate-800">Bendahara Madrasah</span>
              </div>
              <div>
                <p className="font-bold text-slate-900 underline">{madrasah.treasurerName}</p>
                <p className="text-[11px] text-slate-500">{madrasah.treasurerTitle}</p>
              </div>
            </div>
          </div>

        </div>

        {/* Modal Confirm Delete */}
        {showConfirmDelete && (
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-left">
              <div className="flex items-center space-x-3 text-rose-600">
                <div className="p-2.5 bg-rose-100 rounded-xl">
                  <Trash2 className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-lg text-slate-900">Hapus Slip Bisyaroh</h3>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                Apakah Anda yakin ingin menghapus slip gaji <strong className="text-slate-900">{payroll.teacherName}</strong> ({payroll.monthHijri} - TA {payroll.tahunAjaran || madrasah.tahunAjaranHijri})?
              </p>
              <p className="text-[11px] text-amber-800 bg-amber-50 p-2.5 rounded-xl border border-amber-200">
                📌 Catatan: Catatan transaksi bisyaroh terkait di Buku Kas Umum dan realisasi RAPBM juga akan disesuaikan otomatis.
              </p>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setShowConfirmDelete(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    setShowConfirmDelete(false);
                    if (onDeletePayroll) {
                      await onDeletePayroll(payroll.id);
                    }
                    onClose();
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

      </div>
    </div>
  );
};
