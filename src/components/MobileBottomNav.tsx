import React from 'react';
import {
  LayoutDashboard,
  FileSpreadsheet,
  BookOpenCheck,
  Receipt,
  Users,
  Menu,
  Coins
} from 'lucide-react';
import { ActiveTab } from './Sidebar';

interface MobileBottomNavProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenMore: () => void;
  unpaidTeachersCount?: number;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  setActiveTab,
  onOpenMore,
  unpaidTeachersCount = 0,
}) => {
  const navItems = [
    {
      id: 'dashboard' as ActiveTab,
      label: 'Ringkasan',
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
    },
    {
      id: 'payroll' as ActiveTab,
      label: 'Slip Gaji',
      icon: Receipt,
      badge: unpaidTeachersCount > 0,
    },
    {
      id: 'teachers' as ActiveTab,
      label: 'Pengajar',
      icon: Users,
    },
  ];


  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-emerald-950/95 backdrop-blur-md border-t border-emerald-800/80 text-white md:hidden shadow-2xl px-1 py-1.5 flex items-center justify-around">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl text-[10px] font-medium transition-all relative ${
              isActive
                ? 'text-amber-300 font-bold bg-emerald-800/80'
                : 'text-emerald-200/80 hover:text-white'
            }`}
          >
            <Icon className={`w-5 h-5 mb-0.5 ${isActive ? 'text-amber-300 scale-110' : 'text-emerald-300'}`} />
            <span className="truncate max-w-[60px]">{item.label}</span>
            {item.badge && (
              <span className="absolute top-1 right-2 w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            )}
          </button>
        );
      })}

      {/* Menu / Lainnya button */}
      <button
        onClick={onOpenMore}
        className="flex flex-col items-center justify-center py-1 px-2 rounded-xl text-[10px] font-medium text-emerald-200/80 hover:text-white transition-all"
        title="Buka Menu Lainnya"
      >
        <Menu className="w-5 h-5 mb-0.5 text-emerald-300" />
        <span>Lainnya</span>
      </button>
    </div>
  );
};
