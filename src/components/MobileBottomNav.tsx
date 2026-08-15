import React, { useState } from 'react';
import {
  LayoutDashboard,
  FileSpreadsheet,
  BookOpenCheck,
  Receipt,
  Users,
  Menu,
  Coins,
  Plus,
  Printer,
  PackageOpen,
  Settings,
  Sparkles,
  Search,
  X,
  FileText,
  ChevronRight,
  GraduationCap,
} from 'lucide-react';
import { ActiveTab } from './Sidebar';

interface MobileBottomNavProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenQuickAction: () => void;
  unpaidTeachersCount?: number;
  teachersCount?: number;
  studentsCount?: number;
  transactionsCount?: number;
  onOpenSettings?: () => void;
  onOpenNewTransaction?: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  setActiveTab,
  onOpenQuickAction,
  unpaidTeachersCount = 0,
  teachersCount,
  studentsCount,
  transactionsCount,
  onOpenSettings,
  onOpenNewTransaction,
}) => {
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const primaryNavItems = [
    {
      id: 'dashboard' as ActiveTab,
      label: 'Dashboard',
      icon: LayoutDashboard,
    },
    {
      id: 'rapbm' as ActiveTab,
      label: 'RAPBM',
      icon: FileSpreadsheet,
    },
    {
      id: 'syahriah' as ActiveTab,
      label: 'Syahriah',
      icon: Coins,
      badge: studentsCount !== undefined ? `${studentsCount}` : undefined,
    },
    {
      id: 'cashbook' as ActiveTab,
      label: 'Buku Kas',
      icon: BookOpenCheck,
    },
  ];

  const allMenuItems = [
    {
      id: 'dashboard' as ActiveTab,
      label: 'Ringkasan Dashboard',
      category: 'Utama',
      description: 'Grafik & Indikator Keuangan',
      icon: LayoutDashboard,
      color: 'text-amber-400',
      bgColor: 'bg-amber-950/60',
    },
    {
      id: 'rapbm' as ActiveTab,
      label: 'RAPBM Madrasah',
      category: 'Utama',
      description: 'Anggaran Penerimaan & Pengeluaran',
      icon: FileSpreadsheet,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-950/60',
    },
    {
      id: 'syahriah' as ActiveTab,
      label: 'Pembayaran Syahriah',
      category: 'Keuangan',
      description: 'Syahriyah, IMDA & IMNI Santri',
      icon: Coins,
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-950/60',
      badge: studentsCount ? `${studentsCount} Santri` : undefined,
    },
    {
      id: 'cashbook' as ActiveTab,
      label: 'Buku Kas Real-time',
      category: 'Utama',
      description: 'Jurnal Kas Masuk & Keluar',
      icon: BookOpenCheck,
      color: 'text-sky-400',
      bgColor: 'bg-sky-950/60',
      badge: transactionsCount ? `${transactionsCount} Trx` : undefined,
    },
    {
      id: 'payroll' as ActiveTab,
      label: 'Slip Gaji Bisyaroh',
      category: 'Keuangan',
      description: 'Gaji Guru Ustadz & Staf TU',
      icon: Receipt,
      color: 'text-teal-400',
      bgColor: 'bg-teal-950/60',
      badge: unpaidTeachersCount > 0 ? `${unpaidTeachersCount} Belum` : undefined,
      badgeWarn: unpaidTeachersCount > 0,
    },
    {
      id: 'nota' as ActiveTab,
      label: 'Cetak Nota RAPBM',
      category: 'Keuangan',
      description: 'Kwitansi & Bukti Pengeluaran',
      icon: Printer,
      color: 'text-purple-400',
      bgColor: 'bg-purple-950/60',
    },
    {
      id: 'teachers' as ActiveTab,
      label: 'Master Ustadz & TU',
      category: 'Master',
      description: 'Data Pengajar & Jam Mengajar',
      icon: Users,
      color: 'text-cyan-400',
      bgColor: 'bg-cyan-950/60',
      badge: teachersCount ? `${teachersCount} Guru` : undefined,
    },
    {
      id: 'inventory' as ActiveTab,
      label: 'Inventaris Madrasah',
      category: 'Master',
      description: 'Data Aset & Perlengkapan',
      icon: PackageOpen,
      color: 'text-orange-400',
      bgColor: 'bg-orange-950/60',
    },
    {
      id: 'settings' as ActiveTab,
      label: 'Pengaturan Sistem',
      category: 'Master',
      description: 'Identitas KOP, TTD & Kalender',
      icon: Settings,
      color: 'text-rose-400',
      bgColor: 'bg-rose-950/60',
    },
  ];

  const filteredMenuItems = allMenuItems.filter((item) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.label.toLowerCase().includes(q) ||
      item.description.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q)
    );
  });

  const handleSelectMenuItem = (id: ActiveTab) => {
    setIsMoreMenuOpen(false);
    setActiveTab(id);
  };

  return (
    <>
      {/* Floating Bottom Navigation Bar */}
      <nav
        id="mobile-bottom-bar"
        className="fixed bottom-0 left-0 right-0 z-40 bg-emerald-950/95 backdrop-blur-lg border-t border-emerald-800/80 text-white md:hidden shadow-2xl px-2 py-1 flex items-center justify-between transition-all"
      >
        {/* Left 2 Items */}
        <div className="flex items-center justify-around flex-1">
          {primaryNavItems.slice(0, 2).map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl text-[10px] font-medium transition-all relative ${
                  isActive
                    ? 'text-amber-300 font-bold bg-emerald-800/80'
                    : 'text-emerald-300/80 hover:text-white'
                }`}
              >
                <Icon className={`w-4 h-4 mb-0.5 ${isActive ? 'text-amber-300 scale-110' : 'text-emerald-400'}`} />
                <span className="truncate max-w-[55px] leading-tight">{item.label}</span>
                {item.badge && (
                  <span className="absolute -top-0.5 right-1 w-2 h-2 rounded-full bg-amber-400 ring-2 ring-emerald-950" />
                )}
              </button>
            );
          })}
        </div>

        {/* Center Floating Action Button (FAB) */}
        <div className="relative -top-3.5 px-1 flex-shrink-0">
          <button
            onClick={onOpenQuickAction}
            className="w-12 h-12 rounded-full bg-gradient-to-tr from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-emerald-950 flex items-center justify-center shadow-lg shadow-amber-500/30 border-2 border-emerald-900 active:scale-95 transition-all"
            title="Menu Aksi Cepat"
          >
            <Plus className="w-6 h-6 text-emerald-950 stroke-[2.5]" />
          </button>
        </div>

        {/* Right 2 Items + More Menu */}
        <div className="flex items-center justify-around flex-1">
          {primaryNavItems.slice(2, 4).map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl text-[10px] font-medium transition-all relative ${
                  isActive
                    ? 'text-amber-300 font-bold bg-emerald-800/80'
                    : 'text-emerald-300/80 hover:text-white'
                }`}
              >
                <Icon className={`w-4 h-4 mb-0.5 ${isActive ? 'text-amber-300 scale-110' : 'text-emerald-400'}`} />
                <span className="truncate max-w-[55px] leading-tight">{item.label}</span>
                {item.badge && (
                  <span className="absolute -top-0.5 right-1 w-2 h-2 rounded-full bg-amber-400 ring-2 ring-emerald-950" />
                )}
              </button>
            );
          })}

          {/* More / Full Menu Button */}
          <button
            onClick={() => setIsMoreMenuOpen(true)}
            className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl text-[10px] font-medium transition-all relative ${
              isMoreMenuOpen || ['payroll', 'nota', 'teachers', 'inventory', 'settings'].includes(activeTab)
                ? 'text-amber-300 font-bold bg-emerald-800/70'
                : 'text-emerald-300/80 hover:text-white'
            }`}
            title="Buka Menu Lengkap"
          >
            <Menu className="w-4 h-4 mb-0.5 text-emerald-400" />
            <span className="leading-tight">Menu</span>
            {unpaidTeachersCount > 0 && (
              <span className="absolute -top-0.5 right-1 w-2 h-2 rounded-full bg-rose-400 ring-2 ring-emerald-950 animate-ping" />
            )}
          </button>
        </div>
      </nav>

      {/* Comprehensive Mobile Menu Drawer / Bottom Sheet */}
      {isMoreMenuOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-0 animate-in fade-in duration-200">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity"
            onClick={() => setIsMoreMenuOpen(false)}
          />

          {/* Bottom Sheet Drawer */}
          <div className="relative w-full bg-emerald-950 text-white rounded-t-3xl border-t border-x border-emerald-800 shadow-2xl overflow-hidden z-10 max-h-[85vh] flex flex-col transform transition-transform animate-in slide-in-from-bottom duration-300">
            
            {/* Pull Bar */}
            <div className="w-12 h-1.5 bg-emerald-700/80 rounded-full mx-auto mt-3 mb-1" />

            {/* Sheet Header */}
            <div className="px-5 py-3.5 border-b border-emerald-800/80 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-800 text-amber-300 flex items-center justify-center font-bold">
                  <GraduationCap className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">Semua Menu & Fitur</h3>
                  <p className="text-[11px] text-emerald-300">Navigasi Terpadu Madrasah</p>
                </div>
              </div>
              <button
                onClick={() => setIsMoreMenuOpen(false)}
                className="p-1.5 text-emerald-400 hover:text-white rounded-xl hover:bg-emerald-800/60 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Live Search Bar */}
            <div className="p-3.5 border-b border-emerald-800/60 bg-emerald-900/40">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-emerald-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari menu, slip gaji, syahriah, guru..."
                  className="w-full bg-emerald-900 text-white placeholder-emerald-400/60 text-xs pl-8 pr-7 py-2 rounded-xl border border-emerald-800 focus:outline-none focus:border-amber-400 transition"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-emerald-400 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Menu Items Grid */}
            <div className="p-4 overflow-y-auto max-h-[55vh] space-y-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {filteredMenuItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleSelectMenuItem(item.id)}
                      className={`flex items-center justify-between p-3 rounded-2xl border transition-all text-left ${
                        isActive
                          ? 'bg-emerald-800 text-white border-amber-400/60 shadow-inner'
                          : 'bg-emerald-900/60 hover:bg-emerald-850 text-emerald-100 border-emerald-800/80'
                      }`}
                    >
                      <div className="flex items-center space-x-3 min-w-0">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                            isActive ? 'bg-amber-400 text-emerald-950 font-bold' : item.bgColor
                          }`}
                        >
                          <Icon className={`w-5 h-5 ${isActive ? 'text-emerald-950' : item.color}`} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center space-x-1.5">
                            <span className="font-bold text-xs text-white leading-tight truncate">
                              {item.label}
                            </span>
                            {item.badge && (
                              <span
                                className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                                  item.badgeWarn
                                    ? 'bg-amber-400 text-emerald-950'
                                    : 'bg-emerald-800 text-emerald-300 border border-emerald-700'
                                }`}
                              >
                                {item.badge}
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-emerald-300/80 truncate block leading-tight">
                            {item.description}
                          </span>
                        </div>
                      </div>
                      <ChevronRight
                        className={`w-4 h-4 flex-shrink-0 ${
                          isActive ? 'text-amber-300' : 'text-emerald-600'
                        }`}
                      />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Drawer Footer Actions */}
            <div className="p-3 bg-emerald-900/70 border-t border-emerald-800/80 flex items-center justify-between text-xs">
              <button
                onClick={() => {
                  setIsMoreMenuOpen(false);
                  if (onOpenNewTransaction) onOpenNewTransaction();
                }}
                className="flex items-center space-x-1.5 bg-emerald-800 hover:bg-emerald-700 text-emerald-100 px-3 py-1.5 rounded-xl font-semibold border border-emerald-700"
              >
                <Plus className="w-3.5 h-3.5 text-amber-400" />
                <span>Catat Kas</span>
              </button>

              <button
                onClick={() => {
                  setIsMoreMenuOpen(false);
                  if (onOpenSettings) onOpenSettings();
                }}
                className="flex items-center space-x-1.5 bg-emerald-800 hover:bg-emerald-700 text-emerald-100 px-3 py-1.5 rounded-xl font-semibold border border-emerald-700"
              >
                <Settings className="w-3.5 h-3.5 text-amber-400" />
                <span>Pengaturan Madrasah</span>
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
};
