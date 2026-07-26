import React, { useState } from 'react';
import {
  FileText,
  Download,
  Calendar,
  Building2,
  CheckCircle2,
  BarChart3,
  Receipt,
  FileSpreadsheet,
} from 'lucide-react';
import { MadrasahInfo, PayrollRecord, RAPBMItem, Transaction } from '../types';
import { formatCurrency, getHijriDate } from '../utils/hijri';

interface ReportsManagerProps {
  madrasah: MadrasahInfo;
  rapbmData: RAPBMItem[];
  transactions: Transaction[];
  payrolls: PayrollRecord[];
  onExportRAPBMPDF: () => void;
  onExportCashflowPDF: () => void;
}

export const ReportsManager: React.FC<ReportsManagerProps> = ({
  madrasah,
  rapbmData,
  transactions,
  payrolls,
  onExportRAPBMPDF,
  onExportCashflowPDF,
}) => {
  const [selectedReportType, setSelectedReportType] = useState<
    'RAPBM' | 'CASHFLOW' | 'PAYROLL'
  >('RAPBM');

  const currentHijri = getHijriDate(new Date(), madrasah.hijriOffsetDays);

  return (
    <div id="reports-manager-container" className="space-y-6">
      
      {/* Top Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-2">
        <div className="flex items-center space-x-2 text-emerald-700 font-bold text-xs uppercase tracking-wider">
          <FileText className="w-4 h-4" />
          <span>Modul Pelaporan Otomatis</span>
        </div>
        <h2 className="text-xl font-black text-slate-900 tracking-tight">
          Pencetakan Laporan Keuangan PDF Resmi
        </h2>
        <p className="text-xs text-slate-500 max-w-3xl leading-relaxed">
          Pilih jenis laporan untuk diunduh langsung dalam format PDF vector presisi tinggi, lengkap dengan Kop Surat Resmi <strong className="text-slate-800">{madrasah.namaMadrasah}</strong> dan lembar pengesahan TTD Pengurus, Kepala Madrasah, dan Bendahara.
        </p>
      </div>

      {/* Report Type Selection Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Report 1: RAPBM 1446-1447 H */}
        <div
          onClick={() => setSelectedReportType('RAPBM')}
          className={`p-5 rounded-2xl border-2 transition cursor-pointer space-y-3 ${
            selectedReportType === 'RAPBM'
              ? 'bg-emerald-50/50 border-emerald-600 shadow-md'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className={`p-2.5 rounded-xl ${selectedReportType === 'RAPBM' ? 'bg-emerald-700 text-white' : 'bg-slate-100 text-slate-700'}`}>
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            {selectedReportType === 'RAPBM' && (
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            )}
          </div>

          <div>
            <h3 className="font-bold text-base text-slate-900">Laporan Matriks RAPBM</h3>
            <p className="text-xs text-slate-500 mt-1">
              Rencana & Realita Anggaran Pendapatan dan Belanja Madrasah Tahun Ajaran {madrasah.tahunAjaranHijri}
            </p>
          </div>

          <div className="pt-2 text-[11px] font-semibold text-emerald-800">
            Terdiri dari 32+ item anggaran penerimaan & pengeluaran
          </div>
        </div>

        {/* Report 2: Buku Kas Umum */}
        <div
          onClick={() => setSelectedReportType('CASHFLOW')}
          className={`p-5 rounded-2xl border-2 transition cursor-pointer space-y-3 ${
            selectedReportType === 'CASHFLOW'
              ? 'bg-emerald-50/50 border-emerald-600 shadow-md'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className={`p-2.5 rounded-xl ${selectedReportType === 'CASHFLOW' ? 'bg-emerald-700 text-white' : 'bg-slate-100 text-slate-700'}`}>
              <BarChart3 className="w-5 h-5" />
            </div>
            {selectedReportType === 'CASHFLOW' && (
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            )}
          </div>

          <div>
            <h3 className="font-bold text-base text-slate-900">Buku Kas Umum (Arus Kas)</h3>
            <p className="text-xs text-slate-500 mt-1">
              Jurnal rincian penerimaan dan pengeluaran kas real-time lengkap dengan tanggal Hijriah & nomor bukti kwitansi.
            </p>
          </div>

          <div className="pt-2 text-[11px] font-semibold text-emerald-800">
            Format landscape & portrait otomatis
          </div>
        </div>

        {/* Report 3: Rekapitulasi Bisyaroh Guru */}
        <div
          onClick={() => setSelectedReportType('PAYROLL')}
          className={`p-5 rounded-2xl border-2 transition cursor-pointer space-y-3 ${
            selectedReportType === 'PAYROLL'
              ? 'bg-emerald-50/50 border-emerald-600 shadow-md'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className={`p-2.5 rounded-xl ${selectedReportType === 'PAYROLL' ? 'bg-emerald-700 text-white' : 'bg-slate-100 text-slate-700'}`}>
              <Receipt className="w-5 h-5" />
            </div>
            {selectedReportType === 'PAYROLL' && (
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            )}
          </div>

          <div>
            <h3 className="font-bold text-base text-slate-900">Rekap Bisyaroh & Slip Guru</h3>
            <p className="text-xs text-slate-500 mt-1">
              Daftar rekapitulasi penerimaan bisyaroh, jam mengajar, tunjangan jabatan & potongan infaq ustadz/ah.
            </p>
          </div>

          <div className="pt-2 text-[11px] font-semibold text-emerald-800">
            Mendukung pencetakan massal / slip A5
          </div>
        </div>

      </div>

      {/* Selected Report Action & Preview Box */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h3 className="font-extrabold text-lg text-slate-900">
              Pratinjau Parameter Laporan {selectedReportType}
            </h3>
            <p className="text-xs text-slate-500">
              Dokumen PDF akan dicetak menggunakan standar format resmi Kementerian Agama / Madrasah NU.
            </p>
          </div>

          <button
            onClick={() => {
              if (selectedReportType === 'RAPBM') onExportRAPBMPDF();
              if (selectedReportType === 'CASHFLOW') onExportCashflowPDF();
              if (selectedReportType === 'PAYROLL') onExportRAPBMPDF();
            }}
            className="px-6 py-3 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded-xl shadow-lg shadow-emerald-700/20 text-xs transition flex items-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Unduh Laporan {selectedReportType} PDF Sekarang</span>
          </button>
        </div>

        {/* Report Preview Metadata Details */}
        <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200/80 space-y-4">
          <div className="flex items-center space-x-3 text-slate-800 font-bold text-sm">
            <Building2 className="w-5 h-5 text-emerald-700" />
            <span>Format Kop Laporan Resmi PDF:</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs bg-white p-4 rounded-xl border border-slate-200">
            <div>
              <p className="text-slate-400">Institusi:</p>
              <p className="font-bold text-slate-900">{madrasah.namaMadrasah}</p>
              <p className="text-slate-500 mt-1">{madrasah.alamat}, Kec. {madrasah.kecamatan}, Kab. {madrasah.kabupaten}</p>
            </div>
            <div>
              <p className="text-slate-400">Tahun Ajaran & Tanggal CETAK:</p>
              <p className="font-bold text-slate-900">TA {madrasah.tahunAjaranHijri}</p>
              <p className="text-amber-800 font-semibold mt-1">Tanggal Hijriah: {currentHijri.formatted}</p>
            </div>
          </div>

          {/* Signatories Display */}
          <div className="border-t border-slate-200 pt-4">
            <p className="text-xs font-semibold text-slate-700 mb-3">Pejabat Penandatangan Laporan (Termasuk dalam PDF):</p>
            <div className="grid grid-cols-3 gap-3 text-center text-xs">
              <div className="bg-white p-3 rounded-xl border border-slate-200">
                <span className="text-slate-400 block text-[10px]">Pengurus:</span>
                <strong className="text-slate-800 block mt-0.5">{madrasah.pengurusName}</strong>
              </div>
              <div className="bg-white p-3 rounded-xl border border-slate-200">
                <span className="text-slate-400 block text-[10px]">Kepala Madrasah:</span>
                <strong className="text-slate-800 block mt-0.5">{madrasah.headmasterName}</strong>
              </div>
              <div className="bg-white p-3 rounded-xl border border-slate-200">
                <span className="text-slate-400 block text-[10px]">Bendahara:</span>
                <strong className="text-slate-800 block mt-0.5">{madrasah.treasurerName}</strong>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
