import React from 'react';
import { Mail, Clock, Gamepad2, Ticket } from 'lucide-react';

export type MainTab = 'journal' | 'timeline' | 'games' | 'vouchers';

interface NavigationProps {
  activeTab: MainTab;
  onSelectTab: (tab: MainTab) => void;
  unreadNotesCount: number;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  onSelectTab,
  unreadNotesCount,
}) => {
  const tabs = [
    {
      id: 'journal' as MainTab,
      label: 'Journal & Douceurs',
      shortLabel: 'Journal',
      sublabel: 'Billets, Humeurs & Gratitude',
      icon: Mail,
      badge: unreadNotesCount > 0 ? unreadNotesCount : undefined,
    },
    {
      id: 'timeline' as MainTab,
      label: 'Capsule & Timeline',
      shortLabel: 'Souvenirs',
      sublabel: 'Moments, Capsules & Carte',
      icon: Clock,
    },
    {
      id: 'games' as MainTab,
      label: 'Jeux & Complicité',
      shortLabel: 'Complicité',
      sublabel: 'Quiz, Date Picker & Défis',
      icon: Gamepad2,
    },
    {
      id: 'vouchers' as MainTab,
      label: 'Bons & Bucket List',
      shortLabel: 'Projets',
      sublabel: 'Coupons d\'amour & Souhaits',
      icon: Ticket,
    },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-4 pb-2">
      <nav className="flex items-center justify-between sm:justify-center gap-1.5 sm:gap-3 bg-white/70 backdrop-blur-md p-1.5 rounded-2xl border border-stone-200/70 shadow-xs overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`relative flex-1 sm:flex-initial flex items-center justify-center sm:justify-start gap-2 px-3 sm:px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-rose-500 text-white shadow-sm'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100/70'
              }`}
              id={`nav-tab-${tab.id}`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-rose-500'}`} />
              <span className="hidden md:inline">{tab.label}</span>
              <span className="md:hidden">{tab.shortLabel}</span>

              {tab.badge && (
                <span
                  className={`w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center ${
                    isActive ? 'bg-white text-rose-600' : 'bg-rose-500 text-white'
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
};
