import React, { useState } from 'react';
import { Download, Printer, Building2, CheckCircle2, Home, Trash2, X, Grid2X2, FileText } from 'lucide-react';
import { MadrasahInfo, PayrollRecord } from '../types';
import { formatCurrency, formatHijriDateForAcademicYear } from '../utils/hijri';

interface SlipGajiModalProps {
  madrasah: MadrasahInfo;
  payroll: PayrollRecord;
  payrolls?: PayrollRecord[];
  onClose: () => void;
  onDownloadPDF: (p: PayrollRecord | PayrollRecord[]) => void;
  onDeletePayroll?: (id: string) => Promise<void>;
  onGoHome?: () => void;
}

export const SingleSlipCard: React.FC<{
  madrasah: MadrasahInfo;
  payroll: PayrollRecord;
  compact?: boolean;
}> = ({ madrasah, payroll, compact = false }) => {
  const displayHijriDate = formatHijriDateForAcademicYear(
    payroll.dateGeneratedHijri,
    payroll.tahunAjaran || madrasah.tahunAjaranHijri,
    payroll.monthHijri,
    madrasah.hijriOffsetDays
  );

  return (
    <div className={`bg-amber-50/30 border border-amber-200/80 rounded-xl ${compact ? 'p-2.5 space-y-1.5 text-[10px]' : 'p-6 space-y-6 text-xs'}`}>
      
      {/* Header / Kop */}
      <div className="text-center border-b-2 border-emerald-800 pb-1.5 space-y-0.5">
        <div className={`flex items-center justify-center space-x-1.5 text-emerald-900 font-black uppercase tracking-tight ${compact ? 'text-[11px]' : 'text-lg'}`}>
          <Building2 className={`${compact ? 'w-3.5 h-3.5' : 'w-6 h-6'} text-emerald-700 shrink-0`} />
          <span>{madrasah.namaMadrasah}</span>
        </div>
        <p className={`${compact ? 'text-[9px]' : 'text-xs'} text-slate-600 font-medium leading-tight`}>
          {madrasah.alamat}, Kec. {madrasah.kecamatan}, Kab. {madrasah.kabupaten}
        </p>
        <p className={`${compact ? 'text-[9px]' : 'text-[11px]'} text-emerald-800 font-semibold`}>
          Tahun Ajaran : {payroll.tahunAjaran || madrasah.tahunAjaranHijri}
        </p>
      </div>

      {/* Title */}
      <div className="text-center space-y-0.5">
        <h3 className={`font-extrabold text-slate-900 uppercase tracking-wide ${compact ? 'text-[10px]' : 'text-base'}`}>
          SLIP BISYAROH GURU & STAF
        </h3>
        <p className={`${compact ? 'text-[9px] px-2 py-0.5' : 'text-xs px-3 py-0.5'} text-amber-900 font-bold bg-amber-100 inline-block rounded-full border border-amber-300`}>
          Bulan : {payroll.monthHijri} ({payroll.monthGregorian})
        </p>
      </div>

      {/* Teacher Info Grid */}
      <div className={`grid grid-cols-2 gap-1.5 bg-white rounded-lg border border-slate-200 shadow-xs ${compact ? 'p-2 text-[9px]' : 'p-4 text-xs gap-4'}`}>
        <div className="space-y-0.5">
          <p><span className="text-slate-400">Nama Ustadz/ah :</span> <strong className="text-slate-900">{payroll.teacherName}</strong></p>
          <p><span className="text-slate-400">NIP / NUPTK     :</span> <span className="font-mono">{payroll.nipNu}</span></p>
          <p><span className="text-slate-400">Tugas / Jabatan  :</span> <span className="font-semibold text-emerald-800">{payroll.role}</span></p>
        </div>
        <div className="space-y-0.5 text-right">
          <p><span className="text-slate-400">Jam Mengajar :</span> <strong>{payroll.jamMengajar} Jam / Mgg</strong></p>
          <p><span className="text-slate-400">No. Kwitansi  :</span> <span className="font-mono text-slate-600">PAY-{payroll.id}</span></p>
          <p><span className="text-slate-400">Tanggal        :</span> <span>{displayHijriDate}</span></p>
        </div>
      </div>

      {/* Financial Breakdown Table */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-xs">
        <table className={`w-full text-left ${compact ? 'text-[9px]' : 'text-xs'}`}>
          <thead>
            <tr className="bg-emerald-900 text-white font-bold uppercase">
              <th className={`${compact ? 'py-1 px-2' : 'py-2.5 px-4'}`}>Rincian Bisyaroh & Tunjangan</th>
              <th className={`${compact ? 'py-1 px-2' : 'py-2.5 px-4'} text-right`}>Jumlah (Rp)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-800">
            <tr>
              <td className={`${compact ? 'py-0.5 px-2' : 'py-2 px-4'}`}>1. Bisyaroh Pokok Jam Mengajar</td>
              <td className={`${compact ? 'py-0.5 px-2' : 'py-2 px-4'} text-right font-medium`}>{formatCurrency(payroll.bisyarohPokok)}</td>
            </tr>
            <tr>
              <td className={`${compact ? 'py-0.5 px-2' : 'py-2 px-4'}`}>2. Tunjangan Jabatan & Kehadiran</td>
              <td className={`${compact ? 'py-0.5 px-2' : 'py-2 px-4'} text-right font-medium`}>{formatCurrency(payroll.tunjanganGuru)}</td>
            </tr>
            <tr>
              <td className={`${compact ? 'py-0.5 px-2' : 'py-2 px-4'}`}>3. Tunjangan Lain-lain</td>
              <td className={`${compact ? 'py-0.5 px-2' : 'py-2 px-4'} text-right font-medium`}>{formatCurrency(payroll.tunjanganLain)}</td>
            </tr>
            <tr className="bg-slate-50 font-bold text-slate-900">
              <td className={`${compact ? 'py-0.5 px-2' : 'py-2 px-4'}`}>TOTAL BISYAROH KOTOR</td>
              <td className={`${compact ? 'py-0.5 px-2' : 'py-2 px-4'} text-right`}>{formatCurrency(payroll.totalGajiKotor)}</td>
            </tr>
            <tr>
              <td className={`${compact ? 'py-0.5 px-2' : 'py-2 px-4'} text-rose-700`}>4. Potongan Infaq Syahriyah</td>
              <td className={`${compact ? 'py-0.5 px-2' : 'py-2 px-4'} text-right text-rose-700 font-medium`}>-{formatCurrency(payroll.potonganInfaq)}</td>
            </tr>
            <tr>
              <td className={`${compact ? 'py-0.5 px-2' : 'py-2 px-4'} text-rose-700`}>5. Potongan Tabungan Guru</td>
              <td className={`${compact ? 'py-0.5 px-2' : 'py-2 px-4'} text-right text-rose-700 font-medium`}>-{formatCurrency(payroll.potonganTabungan)}</td>
            </tr>
            {payroll.potonganLain > 0 && (
              <tr>
                <td className={`${compact ? 'py-0.5 px-2' : 'py-2 px-4'} text-rose-700`}>6. Potongan Lain-lain</td>
                <td className={`${compact ? 'py-0.5 px-2' : 'py-2 px-4'} text-right text-rose-700 font-medium`}>-{formatCurrency(payroll.potonganLain)}</td>
              </tr>
            )}
            <tr className="bg-rose-50 font-bold text-rose-900">
              <td className={`${compact ? 'py-0.5 px-2' : 'py-2 px-4'}`}>TOTAL POTONGAN</td>
              <td className={`${compact ? 'py-0.5 px-2' : 'py-2 px-4'} text-right`}>-{formatCurrency(payroll.totalPotongan)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Take Home Pay Box */}
      <div className={`bg-emerald-800 text-white rounded-lg flex items-center justify-between shadow-xs ${compact ? 'px-2.5 py-1.5' : 'p-4'}`}>
        <div>
          <span className={`text-emerald-200 uppercase font-bold tracking-wider block ${compact ? 'text-[8px]' : 'text-[11px]'}`}>
            Total Bisyaroh Bersih Diterima
          </span>
          <span className={`text-emerald-300 ${compact ? 'text-[8px]' : 'text-xs'}`}>Termasuk seluruh tunjangan</span>
        </div>
        <div className={`font-black text-amber-200 ${compact ? 'text-xs sm:text-sm' : 'text-xl sm:text-2xl'}`}>
          {formatCurrency(payroll.bisyarohBersih)}
        </div>
      </div>

      {/* Signatures */}
      <div className={`grid grid-cols-2 gap-2 text-center pt-1 ${compact ? 'text-[9px]' : 'text-xs gap-8 pt-4'}`}>
        <div className={`${compact ? 'space-y-4' : 'space-y-12'}`}>
          <div>
            <span className="text-slate-400 block font-medium">Penerima Bisyaroh,</span>
          </div>
          <div>
            <p className="font-bold text-slate-900 underline">{payroll.teacherName}</p>
            <p className="text-[10px] text-slate-500">{payroll.role}</p>
          </div>
        </div>

        <div className={`${compact ? 'space-y-4' : 'space-y-12'}`}>
          <div>
            <span className="text-slate-400 block font-medium">Karangmenggah, {displayHijriDate}</span>
            <span className="font-bold text-slate-800">Bendahara Madrasah</span>
          </div>
          <div>
            <p className="font-bold text-slate-900 underline">{madrasah.treasurerName}</p>
            <p className="text-[10px] text-slate-500">{madrasah.treasurerTitle}</p>
          </div>
        </div>
      </div>

    </div>
  );
};

export const SlipGajiModal: React.FC<SlipGajiModalProps> = ({
  madrasah,
  payroll,
  payrolls,
  onClose,
  onDownloadPDF,
  onDeletePayroll,
  onGoHome,
}) => {
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [viewMode, setViewMode] = useState<'a4_four' | 'single'>('a4_four');

  const isBatch = Array.isArray(payrolls) && payrolls.length > 0;
  const targetPayrolls = isBatch ? payrolls : [payroll];

  // Chunk payrolls into groups of 4 for A4 pages
  const pages: PayrollRecord[][] = [];
  if (isBatch) {
    for (let i = 0; i < targetPayrolls.length; i += 4) {
      pages.push(targetPayrolls.slice(i, i + 4));
    }
  } else {
    // Single teacher: duplicate 4 times for 1 A4 page with 4 identical slips
    pages.push([payroll, payroll, payroll, payroll]);
  }

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className={`relative bg-white rounded-2xl w-full max-h-[95vh] overflow-y-auto p-4 sm:p-6 shadow-2xl border border-slate-200 space-y-4 my-auto animate-in fade-in zoom-in duration-150 ${viewMode === 'a4_four' ? 'max-w-4xl' : 'max-w-2xl'}`}>
        
        {/* Top Control Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-4 print:hidden">
          <div className="flex items-center space-x-2 text-emerald-800 font-bold text-sm">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>
              {isBatch
                ? `Slip Bisyaroh Guru - Batch ${targetPayrolls.length} Guru (${pages.length} Kertas A4)`
                : 'Slip Bisyaroh Guru - Siap Cetak (4 Slip / A4)'}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Toggle View Mode */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
              <button
                onClick={() => setViewMode('a4_four')}
                className={`px-2.5 py-1 rounded-lg font-bold transition flex items-center space-x-1 ${
                  viewMode === 'a4_four' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Tampilkan 4 Slip per Kertas A4"
              >
                <Grid2X2 className="w-3.5 h-3.5" />
                <span>4 Slip / A4</span>
              </button>

              <button
                onClick={() => setViewMode('single')}
                className={`px-2.5 py-1 rounded-lg font-bold transition flex items-center space-x-1 ${
                  viewMode === 'single' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Tampilkan 1 Slip Single"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>1 Slip Single</span>
              </button>
            </div>

            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded-xl text-xs shadow-sm transition flex items-center space-x-1.5"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak ({pages.length} Lembar A4)</span>
            </button>

            <button
              onClick={() => onDownloadPDF(isBatch ? targetPayrolls : payroll)}
              className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs shadow-sm transition flex items-center space-x-1.5"
            >
              <Download className="w-4 h-4" />
              <span>Unduh PDF ({pages.length} A4)</span>
            </button>

            {!isBatch && onDeletePayroll && (
              <button
                onClick={() => setShowConfirmDelete(true)}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs shadow-sm transition flex items-center space-x-1.5"
                title="Hapus Slip Gaji Ini"
              >
                <Trash2 className="w-4 h-4" />
                <span>Hapus</span>
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
              className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl text-xs shadow-md transition flex items-center space-x-1.5"
              title="Tutup / Kembali"
            >
              <X className="w-4 h-4" />
              <span>Tutup</span>
            </button>
          </div>
        </div>

        {/* Printable & Preview Content */}
        {viewMode === 'a4_four' ? (
          <div className="space-y-6">
            <p className="text-[11px] text-amber-800 bg-amber-50 p-2.5 rounded-xl border border-amber-200 font-medium print:hidden">
              💡 <strong>Format Cetak 4 Slip per Kertas A4:</strong> {isBatch ? `Menampilkan total ${targetPayrolls.length} guru yang terbagi ke dalam ${pages.length} lembar kertas A4 (4 guru per lembar). Setiap kertas dapat dipotong menjadi 4 slip gaji independen.` : 'Menampilkan 4 salinan slip gaji pada 1 lembar A4 dengan garis potong.'}
            </p>

            {pages.map((pageItems, pageIdx) => (
              <div key={pageIdx} className="a4-print-sheet bg-white border border-slate-300 rounded-xl p-2 sm:p-3 shadow-md mx-auto grid grid-cols-1 sm:grid-cols-2 gap-2 relative">
                <div className="col-span-full flex items-center justify-between bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-200 text-[11px] font-bold text-emerald-900 print:hidden">
                  <span>📄 Lembar Kertas A4 #{pageIdx + 1} ({pageItems.length} Guru)</span>
                  <span>Total {targetPayrolls.length} Guru &bull; {pages.length} Halaman</span>
                </div>

                {pageItems.map((item, slotIdx) => (
                  <div key={item.id ? `${item.id}-${slotIdx}` : slotIdx} className="border border-dashed border-slate-300 p-1.5 rounded-lg relative">
                    <span className="absolute top-1 right-2 text-[9px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-bold border border-slate-200 print:hidden">
                      {isBatch ? `Guru #${pageIdx * 4 + slotIdx + 1}: ${item.teacherName}` : `Salinan #${slotIdx + 1}`}
                    </span>
                    <SingleSlipCard madrasah={madrasah} payroll={item} compact={true} />
                  </div>
                ))}
              </div>
            ))}
          </div>
        ) : (
          <div id="printable-slip">
            <SingleSlipCard madrasah={madrasah} payroll={payroll} compact={false} />
          </div>
        )}

        {/* Bottom Control Bar */}
        <div className="flex items-center justify-between pt-2 border-t print:hidden text-xs text-slate-500">
          <span>Target Kertas: <strong>A4 Portrait (210 x 297 mm)</strong></span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl text-xs shadow-md transition flex items-center space-x-2"
          >
            <X className="w-4 h-4" />
            <span>Tutup Slip Gaji</span>
          </button>
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

