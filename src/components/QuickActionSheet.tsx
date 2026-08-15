import React from 'react';
import {
  X,
  PlusCircle,
  Coins,
  Receipt,
  Printer,
  FileSpreadsheet,
  BookOpenCheck,
  Users,
  Settings,
  PackageOpen,
  ArrowDownLeft,
  ArrowUpRight,
  Download,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { ActiveTab } from './Sidebar';

interface QuickActionSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab: (tab: ActiveTab) => void;
  onOpenNewTransaction: () => void;
  onOpenSettings: () => void;
  onExportRAPBMPDF: () => void;
  onExportCashflowPDF: () => void;
  selectedYear: string;
}

export const QuickActionSheet: React.FC<QuickActionSheetProps> = ({
  isOpen,
  onClose,
  onNavigateTab,
  onOpenNewTransaction,
  onOpenSettings,
  onExportRAPBMPDF,
  onExportCashflowPDF,
  selectedYear,
}) => {
  if (!isOpen) return null;

  const quickActions = [
    {
      id: 'trx',
      label: 'Catat Kas Baru',
      sublabel: 'Pemasukan / Pengeluaran RAPBM',
      icon: PlusCircle,
      iconColor: 'text-emerald-400',
      bgColor: 'bg-emerald-800/80 hover:bg-emerald-700/90 border-emerald-700',
      action: () => {
        onClose();
        onOpenNewTransaction();
      },
    },
    {
      id: 'syahriah',
      label: 'Input Syahriah',
      sublabel: 'Syahriyah, IMDA & IMNI Santri',
      icon: Coins,
      iconColor: 'text-amber-400',
      bgColor: 'bg-amber-950/70 hover:bg-amber-900/80 border-amber-800/60',
      action: () => {
        onClose();
        onNavigateTab('syahriah');
      },
    },
    {
      id: 'payroll',
      label: 'Buat Slip Gaji',
      sublabel: 'Bisyaroh Ustadz & Staf TU',
      icon: Receipt,
      iconColor: 'text-sky-400',
      bgColor: 'bg-sky-950/70 hover:bg-sky-900/80 border-sky-800/60',
      action: () => {
        onClose();
        onNavigateTab('payroll');
      },
    },
    {
      id: 'nota',
      label: 'Cetak Nota RAPBM',
      sublabel: 'Kwitansi bukti pengeluaran',
      icon: Printer,
      iconColor: 'text-violet-400',
      bgColor: 'bg-violet-950/70 hover:bg-violet-900/80 border-violet-800/60',
      action: () => {
        onClose();
        onNavigateTab('nota');
      },
    },
    {
      id: 'pdf-rapbm',
      label: 'Ekspor RAPBM PDF',
      sublabel: `Tahun Ajaran ${selectedYear}`,
      icon: Download,
      iconColor: 'text-teal-400',
      bgColor: 'bg-teal-950/70 hover:bg-teal-900/80 border-teal-800/60',
      action: () => {
        onClose();
        onExportRAPBMPDF();
      },
    },
    {
      id: 'pdf-kas',
      label: 'Ekspor Buku Kas PDF',
      sublabel: 'Laporan arus kas & saldo',
      icon: BookOpenCheck,
      iconColor: 'text-rose-400',
      bgColor: 'bg-rose-950/70 hover:bg-rose-900/80 border-rose-800/60',
      action: () => {
        onClose();
        onExportCashflowPDF();
      },
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Sheet Content */}
      <div className="relative w-full max-w-lg bg-emerald-950 text-white rounded-t-3xl sm:rounded-3xl border border-emerald-800 shadow-2xl overflow-hidden z-10 max-h-[85vh] flex flex-col transform transition-transform animate-in slide-in-from-bottom duration-300">
        
        {/* Header handle for mobile touch */}
        <div className="w-12 h-1.5 bg-emerald-700/80 rounded-full mx-auto mt-3 mb-1 sm:hidden" />

        {/* Header */}
        <div className="px-5 py-4 border-b border-emerald-800/80 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-400/20 text-amber-300 flex items-center justify-center border border-amber-400/30">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">Menu Aksi Cepat</h3>
              <p className="text-[11px] text-emerald-300">Pilih tindakan langsung dalam 1 ketukan</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-emerald-400 hover:text-white rounded-xl hover:bg-emerald-800/60 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Grid */}
        <div className="p-4 overflow-y-auto grid grid-cols-2 gap-2.5">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.id}
                onClick={action.action}
                className={`flex flex-col text-left p-3.5 rounded-2xl border transition-all duration-150 active:scale-95 shadow-sm ${action.bgColor}`}
              >
                <div className="w-9 h-9 rounded-xl bg-emerald-950/80 flex items-center justify-center mb-2.5 border border-emerald-700/50 shadow-inner">
                  <Icon className={`w-5 h-5 ${action.iconColor}`} />
                </div>
                <span className="font-bold text-xs text-white leading-tight mb-1">
                  {action.label}
                </span>
                <span className="text-[10px] text-emerald-200/80 line-clamp-2 leading-tight">
                  {action.sublabel}
                </span>
              </button>
            );
          })}
        </div>

        {/* Footer shortcuts */}
        <div className="p-3 bg-emerald-900/60 border-t border-emerald-800/80 flex items-center justify-between text-xs text-emerald-300">
          <div className="flex items-center space-x-1.5 text-[11px]">
            <Calendar className="w-3.5 h-3.5 text-amber-400" />
            <span>Tahun Ajaran: <strong className="text-amber-300">{selectedYear}</strong></span>
          </div>
          <button
            onClick={() => {
              onClose();
              onOpenSettings();
            }}
            className="flex items-center space-x-1 text-[11px] font-semibold text-emerald-200 hover:text-white bg-emerald-800/60 hover:bg-emerald-800 px-2.5 py-1 rounded-lg transition"
          >
            <Settings className="w-3 h-3" />
            <span>Pengaturan</span>
          </button>
        </div>

      </div>
    </div>
  );
};
