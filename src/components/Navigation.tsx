import React from 'react';
import { Mail, Clock, Gamepad2, Ticket, Images } from 'lucide-react';
import { soundEffects } from '../lib/audio';

export type MainTab = 'journal' | 'timeline' | 'gallery' | 'games' | 'vouchers';

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
      id: 'gallery' as MainTab,
      label: 'Galerie partagée',
      shortLabel: 'Galerie',
      sublabel: 'Nos photos en duo',
      icon: Images,
    },
    {
      id: 'games' as MainTab,
      label: 'Jeux & Complicité',
      shortLabel: 'Jeux',
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

  const handleTabClick = (tabId: MainTab) => {
    soundEffects.playSoftTap();
    onSelectTab(tabId);
  };

  return (
    <>
      {/* 1. Desktop & Tablet Top Navigation Bar */}
      <div className="hidden sm:block max-w-6xl mx-auto px-4 sm:px-6 pt-4 pb-2">
        <nav className="flex items-center justify-center gap-2 bg-white/70 backdrop-blur-md p-1.5 rounded-2xl border border-stone-200/70 shadow-xs overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.id)}
                className={`relative flex items-center justify-start gap-2 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-rose-500 text-white shadow-sm'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100/70'
                }`}
                id={`nav-tab-desktop-${tab.id}`}
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

      {/* 2. Mobile Fixed Bottom Tab Bar (Designed for Smartphone Thumb Reach) */}
      <nav
        aria-label="Navigation principale mobile"
        className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-rose-100/90 shadow-[0_-4px_25px_rgba(0,0,0,0.06)] px-1 pt-1.5 pb-[max(0.6rem,env(safe-area-inset-bottom))] flex items-center justify-around"
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              className={`relative flex-1 flex flex-col items-center justify-center py-1 px-1 min-h-[48px] rounded-xl transition-all cursor-pointer ${
                isActive
                  ? 'text-rose-600 font-bold'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
              id={`nav-tab-mobile-${tab.id}`}
            >
              <div
                className={`relative p-1 rounded-full transition-all ${
                  isActive ? 'bg-rose-100/80 -translate-y-0.5' : ''
                }`}
              >
                <Icon
                  className={`w-5 h-5 transition-transform ${
                    isActive ? 'text-rose-600 scale-110' : 'text-stone-500'
                  }`}
                />
                {tab.badge && (
                  <span className="absolute -top-1 -right-1.5 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center ring-2 ring-white">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span
                className={`text-[10px] tracking-tight transition-all leading-tight mt-0.5 ${
                  isActive ? 'text-rose-600 font-bold scale-105' : 'text-stone-500 font-medium'
                }`}
              >
                {tab.shortLabel}
              </span>
              {isActive && (
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-0.5" />
              )}
            </button>
          );
        })}
      </nav>
    </>
  );
};
