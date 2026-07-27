import React from 'react';
import { Calendar, DollarSign, Download, Moon, RefreshCw, SlidersHorizontal, Building2, Menu, LogIn, LogOut, User as UserIcon } from 'lucide-react';
import { MadrasahInfo } from '../types';
import { getHijriDate, formatCurrency } from '../utils/hijri';
import { User } from 'firebase/auth';

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
  onToggleSidebar?: () => void;
  user?: User | null;
  onLogin?: () => void;
  onLogout?: () => void;
}

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
  onToggleSidebar,
  user,
  onLogin,
  onLogout,
}) => {
  const currentHijri = getHijriDate(new Date(), madrasah.hijriOffsetDays);
  const sisaKas = totalIncome - totalExpense;

  return (
    <header id="main-navbar" className="bg-emerald-900 text-white border-b border-emerald-800 sticky top-0 z-30 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          
          {/* Left Title & Brand */}
          <div className="flex items-center space-x-3">
            {onToggleSidebar && (
              <button
                onClick={onToggleSidebar}
                className="p-1.5 -ml-1.5 rounded-lg text-emerald-300 hover:bg-emerald-800 hover:text-white transition-colors"
                title="Toggle Sidebar"
              >
                <Menu className="w-5 h-5" />
              </button>
            )}
            <div id="madrasah-icon-badge" className="p-2 bg-emerald-800 rounded-lg text-emerald-300 border border-emerald-700 shadow-inner flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="font-bold text-base leading-tight tracking-wide text-amber-100">
                  {madrasah.namaMadrasah}
                </h1>
                <span className="bg-amber-400 text-emerald-950 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                  RAPBM {selectedYear}
                </span>
              </div>
              <p className="text-[11px] text-emerald-300/90">
                {madrasah.alamat}, Kec. {madrasah.kecamatan}, Kab. {madrasah.kabupaten}
              </p>
            </div>
          </div>

          {/* Center/Right Status Indicators & Actions */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            
            {/* YEAR SELECTOR DROPDOWN */}
            <div id="year-selector-badge" className="flex items-center space-x-2 bg-emerald-950/90 px-3 py-1 rounded-lg border border-emerald-700 text-amber-100 shadow-sm">
              <Calendar className="w-4 h-4 text-amber-400" />
              <div className="flex flex-col">
                <span className="text-[9px] uppercase font-bold text-emerald-400 tracking-wider">Pilih Tahun RAPBM</span>
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
                  className="bg-transparent font-bold text-xs text-amber-200 focus:outline-none cursor-pointer pr-1"
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
            <div id="hijri-date-badge" className="flex items-center space-x-2 bg-emerald-950/80 px-3 py-1 rounded-lg border border-emerald-700/60 text-emerald-200">
              <Moon className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              <div>
                <span className="text-[9px] text-emerald-400 block uppercase font-bold">Hari Ini</span>
                <span className="font-bold text-xs text-amber-200">{currentHijri.formatted}</span>
              </div>
            </div>

            {/* Sisa Kas Pill */}
            <div id="sisa-kas-badge" className="flex items-center space-x-2 bg-emerald-950/80 px-3 py-1 rounded-lg border border-emerald-700/60 text-emerald-200">
              <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
              <div>
                <span className="text-[9px] text-emerald-400 block uppercase font-bold">Sisa Kas</span>
                <span className={`font-bold text-xs ${sisaKas >= 0 ? 'text-emerald-300' : 'text-rose-400'}`}>
                  {formatCurrency(sisaKas)}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-1 ml-auto md:ml-0">
              <button
                id="btn-sync-refresh"
                onClick={onRefreshData}
                disabled={isSyncing}
                title="Refresh Sync Backend Data"
                className="p-1.5 bg-emerald-800 hover:bg-emerald-700 text-emerald-200 rounded-md border border-emerald-700 transition flex items-center justify-center disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              </button>

              <button
                id="btn-export-rapbm-top"
                onClick={onExportRAPBMPDF}
                className="px-2.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-md shadow-sm border border-amber-500 transition flex items-center space-x-1"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">PDF RAPBM</span>
              </button>

              <button
                id="btn-settings-top"
                onClick={onOpenSettings}
                className="p-1.5 bg-emerald-800 hover:bg-emerald-700 text-emerald-200 rounded-md border border-emerald-700 transition flex items-center justify-center"
                title="Pengaturan Madrasah & TTD"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
              </button>

              {user ? (
                <div className="flex items-center space-x-2 bg-emerald-950/80 px-2 py-1 rounded-md border border-emerald-700/60 text-emerald-100">
                  {user.photoURL ? (
                    <img src={user.photoURL} alt={user.displayName || 'User'} className="w-5 h-5 rounded-full" />
                  ) : (
                    <UserIcon className="w-4 h-4 text-emerald-300" />
                  )}
                  <span className="hidden lg:inline text-[11px] font-medium max-w-[100px] truncate">{user.displayName || user.email}</span>
                  {onLogout && (
                    <button
                      onClick={onLogout}
                      title="Keluar / Logout"
                      className="p-1 text-rose-300 hover:text-rose-100 hover:bg-emerald-800 rounded transition"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ) : (
                onLogin && (
                  <button
                    onClick={onLogin}
                    className="px-2.5 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white font-medium text-xs rounded-md border border-emerald-600 transition flex items-center space-x-1"
                    title="Masuk dengan akun Google (Opsional)"
                  >
                    <LogIn className="w-3.5 h-3.5 text-amber-300" />
                    <span className="hidden sm:inline">Google Auth</span>
                  </button>
                )
              )}
            </div>

          </div>

        </div>
      </div>
    </header>
  );
};
