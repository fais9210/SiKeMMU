import React, { useState, useMemo } from 'react';
import {
  LayoutDashboard,
  FileSpreadsheet,
  BookOpenCheck,
  Receipt,
  FileText,
  Users,
  Settings,
  ChevronRight,
  ChevronLeft,
  X,
  PackageOpen,
  Coins,
  Printer,
  Search,
  Sparkles,
  TrendingUp,
  PanelLeftClose,
  PanelLeft,
  GraduationCap,
  CalendarCheck,
} from 'lucide-react';

export type ActiveTab =
  | 'dashboard'
  | 'rapbm'
  | 'syahriah'
  | 'cashbook'
  | 'payroll'
  | 'presensi'
  | 'reports'
  | 'teachers'
  | 'inventory'
  | 'settings'
  | 'nota';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  unpaidTeachersCount?: number;
  teachersCount?: number;
  studentsCount?: number;
  transactionsCount?: number;
  isOpen: boolean;
  onClose: () => void;
  isCompact?: boolean;
  onToggleCompact?: () => void;
  onOpenQuickAction?: () => void;
  onOpenSettings?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  unpaidTeachersCount = 0,
  teachersCount,
  studentsCount,
  transactionsCount,
  isOpen,
  onClose,
  isCompact = false,
  onToggleCompact,
  onOpenQuickAction,
  onOpenSettings,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const menuSections = useMemo(
    () => [
      {
        category: 'Menu Utama',
        items: [
          {
            id: 'dashboard' as ActiveTab,
            label: 'Ringkasan Dashboard',
            description: 'Metrik & Grafis Keuangan',
            icon: LayoutDashboard,
            color: 'text-amber-400',
            badge: undefined,
          },
          {
            id: 'rapbm' as ActiveTab,
            label: 'RAPBM Madrasah',
            description: 'Rencana Anggaran & Belanja',
            icon: FileSpreadsheet,
            color: 'text-emerald-400',
            badge: undefined,
          },
          {
            id: 'cashbook' as ActiveTab,
            label: 'Buku Kas Real-time',
            description: 'Jurnal Masuk & Keluar',
            icon: BookOpenCheck,
            color: 'text-sky-400',
            badge: transactionsCount !== undefined ? `${transactionsCount} Trx` : undefined,
          },
        ],
      },
      {
        category: 'Transaksi & Keuangan',
        items: [
          {
            id: 'syahriah' as ActiveTab,
            label: 'Pembayaran Syahriah',
            description: 'Syahriyah, IMDA & IMNI Santri',
            icon: Coins,
            color: 'text-yellow-400',
            badge: studentsCount !== undefined ? `${studentsCount} Santri` : undefined,
          },
          {
            id: 'payroll' as ActiveTab,
            label: 'Slip Gaji Bisyaroh',
            description: 'Penggajian Ustadz & Staf',
            icon: Receipt,
            color: 'text-teal-400',
            badge: unpaidTeachersCount > 0 ? `${unpaidTeachersCount} Belum` : undefined,
            badgeVariant: 'warning',
          },
          {
            id: 'presensi' as ActiveTab,
            label: 'Presensi & Kehadiran Guru',
            description: 'Rekap Jam & Hitung Bisyaroh',
            icon: CalendarCheck,
            color: 'text-emerald-400',
            badge: undefined,
          },
          {
            id: 'nota' as ActiveTab,
            label: 'Cetak Nota RAPBM',
            description: 'Kwitansi & Bukti Kas',
            icon: Printer,
            color: 'text-purple-400',
            badge: undefined,
          },
        ],
      },
      {
        category: 'Master Data & Pengaturan',
        items: [
          {
            id: 'teachers' as ActiveTab,
            label: 'Master Ustadz & Staf',
            description: 'Data Pengajar & TU',
            icon: Users,
            color: 'text-cyan-400',
            badge: teachersCount !== undefined ? `${teachersCount} Org` : undefined,
          },
          {
            id: 'inventory' as ActiveTab,
            label: 'Inventaris Madrasah',
            description: 'Data Aset & Gedung',
            icon: PackageOpen,
            color: 'text-orange-400',
            badge: undefined,
          },
          {
            id: 'settings' as ActiveTab,
            label: 'Pengaturan Sistem',
            description: 'Kop, TTD & Offset Hijriah',
            icon: Settings,
            color: 'text-rose-400',
            badge: undefined,
          },
        ],
      },
    ],
    [unpaidTeachersCount, teachersCount, studentsCount, transactionsCount]
  );

  // Filter items if search query is entered
  const filteredSections = useMemo(() => {
    if (!searchQuery.trim()) return menuSections;
    const query = searchQuery.toLowerCase();
    return menuSections
      .map((section) => ({
        ...section,
        items: section.items.filter(
          (item) =>
            item.label.toLowerCase().includes(query) ||
            item.description.toLowerCase().includes(query) ||
            item.id.toLowerCase().includes(query)
        ),
      }))
      .filter((section) => section.items.length > 0);
  }, [menuSections, searchQuery]);

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-40 md:hidden transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        id="main-sidebar"
        className={`fixed md:sticky md:top-14 inset-y-0 left-0 z-50 md:z-10 bg-emerald-950 text-white flex-shrink-0 border-r border-emerald-800/90 flex flex-col justify-between transition-all duration-300 ease-in-out shadow-2xl md:shadow-none h-full md:h-[calc(100vh-3.5rem)] ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        } ${isCompact ? 'md:w-20' : 'w-72 max-w-[85vw] md:w-64'}`}
      >
        {/* Top Header & Search Area */}
        <div className="p-3.5 sm:p-4 space-y-3 flex-1 flex flex-col min-h-0 overflow-hidden">
          
          {/* Brand & Toggle Header */}
          <div className="flex items-center justify-between pb-2.5 border-b border-emerald-800/80">
            <div className={`flex items-center gap-2.5 min-w-0 ${isCompact ? 'md:justify-center md:w-full' : ''}`}>
              <div className="w-9 h-9 bg-emerald-500 rounded-xl flex items-center justify-center text-emerald-950 font-black shadow-md flex-shrink-0">
                <GraduationCap className="w-5 h-5 text-emerald-950" />
              </div>
              {!isCompact && (
                <div className="min-w-0 flex-1">
                  <h1 className="text-xs font-black tracking-wider uppercase text-white truncate">
                    Madrasah
                  </h1>
                  <p className="text-[10px] text-emerald-300/80 truncate">
                    Sistem Keuangan RAPBM
                  </p>
                </div>
              )}
            </div>

            {/* Mobile Close Button */}
            <button
              onClick={onClose}
              className="text-emerald-400 hover:text-white p-1 rounded-lg hover:bg-emerald-800 transition md:hidden"
              title="Tutup Menu"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Desktop Compact Toggle */}
            {onToggleCompact && (
              <button
                onClick={onToggleCompact}
                className="hidden md:flex text-emerald-400 hover:text-white p-1 rounded-lg hover:bg-emerald-800/70 transition"
                title={isCompact ? 'Perluas Menu' : 'Perkecil Menu'}
              >
                {isCompact ? <PanelLeft className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
              </button>
            )}
          </div>

          {/* Search Filter Box (Expanded mode only) */}
          {!isCompact && (
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-emerald-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari menu & fitur..."
                className="w-full bg-emerald-900/70 text-white placeholder-emerald-400/60 text-xs pl-8 pr-7 py-1.5 rounded-xl border border-emerald-800/90 focus:outline-none focus:border-amber-400/80 focus:bg-emerald-900 transition"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-emerald-400 hover:text-white text-xs"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}

          {/* Quick Action Trigger Button */}
          {onOpenQuickAction && !isCompact && (
            <button
              onClick={onOpenQuickAction}
              className="w-full flex items-center justify-between px-3 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-emerald-950 font-bold rounded-xl text-xs shadow-md transition-all active:scale-98"
            >
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-emerald-950" />
                <span>Menu Aksi Cepat</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Navigation Items List */}
          <div className="flex-1 overflow-y-auto pr-1 space-y-4 scrollbar-thin scrollbar-thumb-emerald-800">
            {filteredSections.map((section, idx) => (
              <div key={idx} className="space-y-1">
                {!isCompact && (
                  <div className="px-2 text-[10px] font-bold text-emerald-400/90 uppercase tracking-widest flex items-center justify-between">
                    <span>{section.category}</span>
                  </div>
                )}
                {isCompact && <div className="h-px bg-emerald-800/80 my-1 mx-2" />}

                <nav className="space-y-0.5">
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        id={`sidebar-link-${item.id}`}
                        onClick={() => {
                          setActiveTab(item.id);
                          if (typeof window !== 'undefined' && window.innerWidth < 768) {
                            onClose();
                          }
                        }}
                        title={isCompact ? `${item.label} - ${item.description}` : undefined}
                        className={`w-full flex items-center ${
                          isCompact ? 'justify-center p-2.5' : 'justify-between px-3 py-2'
                        } rounded-xl text-left transition-all duration-150 relative group ${
                          isActive
                            ? 'bg-emerald-800 text-white font-semibold shadow-inner border border-emerald-700/80'
                            : 'text-emerald-200/85 hover:bg-emerald-900/90 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center space-x-2.5 min-w-0">
                          <div
                            className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors flex-shrink-0 ${
                              isActive
                                ? 'bg-amber-400 text-emerald-950'
                                : 'bg-emerald-900/60 text-emerald-300 group-hover:bg-emerald-800 group-hover:text-amber-300'
                            }`}
                          >
                            <Icon className="w-4 h-4" />
                          </div>
                          {!isCompact && (
                            <div className="min-w-0 flex-1">
                              <span className="text-xs font-semibold block leading-tight truncate">
                                {item.label}
                              </span>
                              <span
                                className={`text-[9.5px] block truncate ${
                                  isActive ? 'text-emerald-200' : 'text-emerald-400/70'
                                }`}
                              >
                                {item.description}
                              </span>
                            </div>
                          )}
                        </div>

                        {!isCompact && (
                          <div className="flex items-center space-x-1.5 flex-shrink-0 ml-1">
                            {item.badge && (
                              <span
                                className={`font-bold text-[9px] px-1.5 py-0.5 rounded-full ${
                                  item.badgeVariant === 'warning'
                                    ? 'bg-amber-400 text-emerald-950 animate-pulse'
                                    : 'bg-emerald-800/90 text-emerald-200 border border-emerald-700/60'
                                }`}
                              >
                                {item.badge}
                              </span>
                            )}
                            <ChevronRight
                              className={`w-3.5 h-3.5 transition-transform ${
                                isActive ? 'text-amber-300 rotate-90' : 'text-emerald-600/70 group-hover:text-emerald-400'
                              }`}
                            />
                          </div>
                        )}

                        {/* Active Left Indicator Bar */}
                        {isActive && (
                          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-amber-400 rounded-r-full" />
                        )}
                      </button>
                    );
                  })}
                </nav>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Profile / Quick Info */}
        <div className="p-3 border-t border-emerald-800/80 bg-emerald-950 flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-full bg-emerald-700 border border-emerald-500 flex items-center justify-center font-bold text-[11px] text-white flex-shrink-0">
              BM
            </div>
            {!isCompact && (
              <div className="flex flex-col min-w-0">
                <span className="text-[11px] font-bold text-white leading-tight truncate">
                  Bendahara Madrasah
                </span>
                <span className="text-[9px] text-emerald-400 uppercase tracking-wider truncate">
                  Sistem Aktif
                </span>
              </div>
            )}
          </div>

          {!isCompact && onOpenSettings && (
            <button
              onClick={onOpenSettings}
              className="p-1.5 text-emerald-400 hover:text-white rounded-lg hover:bg-emerald-800/60 transition"
              title="Buka Pengaturan"
            >
              <Settings className="w-4 h-4" />
            </button>
          )}
        </div>
      </aside>
    </>
  );
};
