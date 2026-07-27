import React from 'react';
import {
  LayoutDashboard,
  FileSpreadsheet,
  BookOpenCheck,
  Receipt,
  FileText,
  Users,
  Settings,
  ChevronRight,
  X,
  PackageOpen
} from 'lucide-react';

export type ActiveTab = 'dashboard' | 'rapbm' | 'cashbook' | 'payroll' | 'reports' | 'teachers' | 'inventory' | 'settings';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  unpaidTeachersCount?: number;
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, unpaidTeachersCount = 0, isOpen, onClose }) => {
  const menuItems = [
    {
      id: 'dashboard' as ActiveTab,
      label: 'Ringkasan Dashboard',
      description: 'Metrik & Grafis Keuangan',
      icon: LayoutDashboard,
    },
    {
      id: 'rapbm' as ActiveTab,
      label: 'RAPBM',
      description: 'Anggaran & Realita Doc',
      icon: FileSpreadsheet,
    },
    // {
    //   id: 'cashbook' as ActiveTab,
    //   label: 'Buku Kas Real-time',
    //   description: 'Jurnal Masuk & Keluar',
    //   icon: BookOpenCheck,
    // },
    {
      id: 'payroll' as ActiveTab,
      label: 'Slip Gaji Bisyaroh',
      description: 'Penggajian Ustadz & Staf',
      icon: Receipt,
      badge: unpaidTeachersCount > 0 ? `${unpaidTeachersCount} Guru` : undefined,
    },
    {
      id: 'reports' as ActiveTab,
      label: 'Modul Pelaporan PDF',
      description: 'Cetak Laporan Otomatis',
      icon: FileText,
    },
    {
      id: 'teachers' as ActiveTab,
      label: 'Master Ustadz & Staf',
      description: 'Data Pengajar & TU',
      icon: Users,
    },
    {
      id: 'inventory' as ActiveTab,
      label: 'Inventaris Madrasah',
      description: 'Data Aset & Gedung',
      icon: PackageOpen,
    },
    {
      id: 'settings' as ActiveTab,
      label: 'Pengaturan Madrasah',
      description: 'Kop, TTD & Offset Hijriah',
      icon: Settings,
    },
  ];

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 z-40 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        id="main-sidebar"
        className={`fixed md:relative inset-y-0 left-0 z-50 w-64 bg-emerald-900 text-white flex-shrink-0 border-r border-emerald-800 flex flex-col justify-between transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0 md:hidden'
        }`}
      >
        <div className="p-5 space-y-4">
          {/* Brand Header */}
          <div className="flex items-center justify-between pb-2 border-b border-emerald-800/80">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center text-emerald-950 font-black shadow-md">
                <Receipt className="w-5 h-5 text-emerald-950" />
              </div>
              <div>
                <h1 className="text-xs font-bold tracking-widest uppercase text-white">Madrasah</h1>
                <p className="text-[10px] text-emerald-300 opacity-90">Sistem Keuangan Terpadu</p>
              </div>
            </div>
            <button onClick={onClose} className="md:hidden text-emerald-300 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>

        <div className="px-1 text-[10px] font-bold text-emerald-400 uppercase tracking-widest">
          Navigasi Utama
        </div>

        <nav className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`sidebar-link-${item.id}`}
                onClick={() => {
                  setActiveTab(item.id);
                  onClose();
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-left transition-all duration-150 ${
                  isActive
                    ? 'bg-emerald-800 text-white font-semibold border border-emerald-700/60 shadow-sm'
                    : 'text-emerald-100/80 hover:bg-emerald-800/60 hover:text-white'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-amber-300' : 'text-emerald-400 opacity-80'}`} />
                  <div>
                    <span className="text-xs font-semibold block leading-none mb-0.5">{item.label}</span>
                    <span className={`text-[10px] block ${isActive ? 'text-emerald-200' : 'text-emerald-400/70'}`}>
                      {item.description}
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-1">
                  {item.badge && (
                    <span className="bg-amber-400 text-emerald-950 font-bold text-[9px] px-1.5 py-0.5 rounded-full">
                      {item.badge}
                    </span>
                  )}
                  <ChevronRight className={`w-3.5 h-3.5 transition-transform ${isActive ? 'text-amber-300 rotate-90' : 'text-emerald-600'}`} />
                </div>
              </button>
            );
          })}
        </nav>
      </div>

      <div className="p-4 border-t border-emerald-800 bg-emerald-950/90 flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-emerald-700 border-2 border-emerald-500 flex items-center justify-center font-bold text-xs text-white">
          MU
        </div>
        <div className="flex flex-col text-xs">
          <span className="text-[11px] font-bold text-white leading-snug">Admin Madrasah</span>
          <span className="text-[9px] text-emerald-400 uppercase tracking-wider">Bendahara Utama</span>
        </div>
      </div>
    </aside>
    </>
  );
};
