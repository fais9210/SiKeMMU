import React from 'react';
import {
  Calendar,
  DollarSign,
  Download,
  Moon,
  RefreshCw,
  SlidersHorizontal,
  Building2,
  Menu,
  ArrowLeft,
  ChevronRight,
} from 'lucide-react';
import { MadrasahInfo } from '../types';
import { getHijriDate, formatCurrency } from '../utils/hijri';
import { ActiveTab } from './Sidebar';

interface NavbarProps {
  madrasah: MadrasahInfo;
  selectedYear: string;
  availableYears: string[];
  onSelectYear: (year: string) => void;
  onAddNewYear: (newYear: string) => void;
  totalIncome: number;
  totalExpense: number;
  onOpenSettings: () => void;
  onExportRAPBMPDF: () => void;
  onExportCashflowPDF: () => void;
  isSyncing: boolean;
  onRefreshData: () => void;
  isSidebarOpen?: boolean;
  onToggleSidebar?: () => void;
  activeTab?: ActiveTab;
  onNavigateBack?: () => void;
}

const tabLabels: Record<ActiveTab, string> = {
  dashboard: 'Ringkasan Dashboard',
  rapbm: 'RAPBM Madrasah',
  syahriah: 'Pembayaran Syahriah',
  cashbook: 'Buku Kas Real-time',
  payroll: 'Slip Gaji Bisyaroh',
  nota: 'Cetak Nota RAPBM',
  teachers: 'Master Ustadz & Staf',
  inventory: 'Inventaris Madrasah',
  settings: 'Pengaturan Sistem',
  reports: 'Laporan Keuangan',
};

export const Navbar: React.FC<NavbarProps> = ({
  madrasah,
  selectedYear,
  availableYears,
  onSelectYear,
  onAddNewYear,
  totalIncome,
  totalExpense,
  onOpenSettings,
  onExportRAPBMPDF,
  onExportCashflowPDF,
  isSyncing,
  onRefreshData,
  isSidebarOpen,
  onToggleSidebar,
  activeTab = 'dashboard',
  onNavigateBack,
}) => {
  const currentHijri = getHijriDate(new Date(), madrasah.hijriOffsetDays);
  const sisaKas = totalIncome - totalExpense;
  const isNotDashboard = activeTab !== 'dashboard';

  return (
    <header id="main-navbar" className="bg-emerald-950 text-white border-b border-emerald-800 sticky top-0 z-30 shadow-md">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2.5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2.5">
          
          {/* Left Title, Back Button & Brand */}
          <div className="flex items-center space-x-2.5 min-w-0 w-full md:w-auto">
            
            {/* Mobile Back Button when not on Dashboard */}
            {isNotDashboard && onNavigateBack ? (
              <button
                onClick={onNavigateBack}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-emerald-950 font-bold text-xs shadow-md transition-all active:scale-95 flex-shrink-0"
                title="Kembali ke Halaman Sebelumnya / Dashboard"
              >
                <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
                <span className="text-[11px]">Kembali</span>
              </button>
            ) : onToggleSidebar ? (
              <button
                onClick={onToggleSidebar}
                className={`p-2 rounded-xl text-emerald-300 hover:bg-emerald-800 hover:text-white transition-colors flex-shrink-0 ${
                  isSidebarOpen ? 'bg-emerald-800/80 text-amber-300' : 'bg-emerald-900/60'
                }`}
                title={isSidebarOpen ? "Sembunyikan Menu" : "Buka Menu"}
              >
                <Menu className="w-4 h-4" />
              </button>
            ) : null}

            {/* Madrasah Logo Icon */}
            <div id="madrasah-icon-badge" className="p-1 bg-emerald-900 rounded-xl text-emerald-300 border border-emerald-700/80 shadow-inner flex items-center justify-center overflow-hidden w-9 h-9 flex-shrink-0">
              {madrasah.logoUrl ? (
                <img src={madrasah.logoUrl} alt="Logo Madrasah" className="w-full h-full object-contain rounded" />
              ) : (
                <Building2 className="w-4 h-4" />
              )}
            </div>

            {/* School Name & Page Context */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center space-x-1.5 flex-wrap">
                <h1 className="font-bold text-xs sm:text-sm leading-tight tracking-wide text-amber-100 truncate max-w-[170px] sm:max-w-none">
                  {madrasah.namaMadrasah}
                </h1>
                {isNotDashboard && (
                  <span className="hidden sm:inline-flex items-center text-[10px] bg-emerald-800 text-emerald-200 px-2 py-0.5 rounded-md border border-emerald-700">
                    <ChevronRight className="w-3 h-3 text-emerald-400 mr-0.5" />
                    {tabLabels[activeTab]}
                  </span>
                )}
                <span className="bg-amber-400 text-emerald-950 text-[9.5px] px-1.5 py-0.2 rounded-md font-bold uppercase tracking-wider flex-shrink-0">
                  {selectedYear}
                </span>
              </div>
              <p className="text-[10px] text-emerald-300/80 truncate">
                {madrasah.alamat}, Kec. {madrasah.kecamatan}
              </p>
            </div>
          </div>

          {/* Center/Right Status Indicators & Actions */}
          <div className="flex flex-wrap items-center gap-2 text-xs w-full md:w-auto justify-between sm:justify-end">
            
            {/* YEAR SELECTOR DROPDOWN */}
            <div id="year-selector-badge" className="flex items-center space-x-1.5 bg-emerald-900/90 px-2.5 py-1 rounded-xl border border-emerald-700/80 text-amber-100 shadow-sm flex-1 sm:flex-initial min-w-[125px]">
              <Calendar className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
              <div className="flex flex-col min-w-0 w-full">
                <span className="text-[8.5px] uppercase font-bold text-emerald-400 tracking-wider truncate">Tahun RAPBM</span>
                <select
                  id="navbar-year-select"
                  value={selectedYear}
                  onChange={(e) => {
                    if (e.target.value === 'ADD_NEW') {
                      onAddNewYear('');
                    } else {
                      onSelectYear(e.target.value);
                    }
                  }}
                  className="bg-transparent font-bold text-xs text-amber-200 focus:outline-none cursor-pointer pr-1 w-full truncate"
                >
                  {availableYears.map((y) => (
                    <option key={y} value={y} className="bg-emerald-900 text-white font-medium">
                      {y}
                    </option>
                  ))}
                  <option value="ADD_NEW" className="bg-emerald-950 text-amber-300 font-bold">
                    + Tambah Tahun Ajaran...
                  </option>
                </select>
              </div>
            </div>

            {/* Hijri Date Badge */}
            <div id="hijri-date-badge" className="hidden sm:flex items-center space-x-2 bg-emerald-900/80 px-3 py-1 rounded-xl border border-emerald-700/60 text-emerald-200">
              <Moon className="w-3.5 h-3.5 text-amber-400 animate-pulse flex-shrink-0" />
              <div>
                <span className="text-[8.5px] text-emerald-400 block uppercase font-bold">Hari Ini</span>
                <span className="font-bold text-xs text-amber-200">{currentHijri.formatted}</span>
              </div>
            </div>

            {/* Sisa Kas Pill */}
            <div id="sisa-kas-badge" className="flex items-center space-x-1.5 bg-emerald-900/80 px-2.5 py-1 rounded-xl border border-emerald-700/60 text-emerald-200 flex-1 sm:flex-initial">
              <DollarSign className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
              <div>
                <span className="text-[8.5px] text-emerald-400 block uppercase font-bold">Sisa Kas</span>
                <span className={`font-bold text-xs ${sisaKas >= 0 ? 'text-emerald-300' : 'text-rose-400'}`}>
                  {formatCurrency(sisaKas)}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-1.5 ml-auto sm:ml-0">
              <button
                id="btn-sync-refresh"
                onClick={onRefreshData}
                disabled={isSyncing}
                title="Refresh Sync Backend Data"
                className="p-1.5 bg-emerald-900 hover:bg-emerald-800 text-emerald-200 rounded-lg border border-emerald-700 transition flex items-center justify-center disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              </button>

              <button
                id="btn-export-rapbm-top"
                onClick={onExportRAPBMPDF}
                className="px-2.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-lg shadow-sm border border-amber-500 transition flex items-center space-x-1"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">PDF RAPBM</span>
              </button>

              <button
                id="btn-settings-top"
                onClick={onOpenSettings}
                className="p-1.5 bg-emerald-900 hover:bg-emerald-800 text-emerald-200 rounded-lg border border-emerald-700 transition flex items-center justify-center"
                title="Pengaturan Madrasah & TTD"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
              </button>
            </div>

          </div>

        </div>
      </div>
    </header>
  );
};
