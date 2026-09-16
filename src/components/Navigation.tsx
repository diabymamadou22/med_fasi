import React from 'react';
import { motion } from 'motion/react';
import { Sparkles, Images, MessageCircle, Gamepad2 } from 'lucide-react';
import { soundEffects } from '../lib/audio';

export type MainTab = 'home' | 'chat' | 'games' | 'gallery';

interface NavigationProps {
  activeTab: MainTab;
  onSelectTab: (tab: MainTab) => void;
  unreadChatCount?: number;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  onSelectTab,
  unreadChatCount = 0,
}) => {
  const tabs = [
    {
      id: 'home' as MainTab,
      label: 'Accueil',
      shortLabel: 'Accueil',
      sublabel: 'Notre nid d\'amour & tableau de bord',
      icon: Sparkles,
    },
    {
      id: 'chat' as MainTab,
      label: 'Chat Intime',
      shortLabel: 'Chat',
      sublabel: 'Messages & Vocaux en direct',
      icon: MessageCircle,
      badge: unreadChatCount > 0 ? unreadChatCount : undefined,
      badgeColor: 'bg-rose-500',
    },
    {
      id: 'games' as MainTab,
      label: 'Jeux & Flirt Duo',
      shortLabel: 'Jeux & Flirt',
      sublabel: 'Roue des gages, blind test & anglais',
      icon: Gamepad2,
    },
    {
      id: 'gallery' as MainTab,
      label: 'Galerie Duo',
      shortLabel: 'Galerie',
      sublabel: 'Nos photos en duo',
      icon: Images,
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
              <motion.button
                key={`desktop-tab-${tab.id}`}
                onClick={() => handleTabClick(tab.id)}
                whileTap={{ scale: 0.96 }}
                className={`relative flex items-center justify-start gap-2 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap cursor-pointer select-none ${
                  isActive
                    ? 'text-white'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100/70'
                }`}
                id={`nav-tab-desktop-${tab.id}`}
              >
                {isActive && (
                  <motion.div
                    layoutId="desktop-active-pill"
                    className="absolute inset-0 bg-rose-500 rounded-xl shadow-xs -z-10"
                    transition={{ type: 'spring', stiffness: 500, damping: 38 }}
                  />
                )}
                <Icon className={`w-4 h-4 relative z-10 ${isActive ? 'text-white' : 'text-rose-500'}`} />
                <span className="relative z-10 hidden md:inline">{tab.label}</span>
                <span className="relative z-10 md:hidden">{tab.shortLabel}</span>

                {tab.badge && (
                  <span
                    className={`relative z-10 w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center ${
                      isActive ? 'bg-white text-rose-600' : 'bg-rose-500 text-white'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </motion.button>
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
            <motion.button
              key={`mobile-tab-${tab.id}`}
              onClick={() => handleTabClick(tab.id)}
              whileTap={{ scale: 0.92 }}
              className={`relative flex-1 flex flex-col items-center justify-center py-1 px-1 min-h-[48px] rounded-xl cursor-pointer touch-manipulation select-none transition-colors ${
                isActive
                  ? 'text-rose-600 font-bold'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
              id={`nav-tab-mobile-${tab.id}`}
            >
              {isActive && (
                <motion.div
                  layoutId="mobile-active-tab-highlight"
                  className="absolute inset-x-1 inset-y-0.5 bg-rose-50/90 rounded-xl -z-10"
                  transition={{ type: 'spring', stiffness: 500, damping: 36 }}
                />
              )}
              <div
                className={`relative p-1 rounded-full transition-transform duration-200 ${
                  isActive ? '-translate-y-0.5' : ''
                }`}
              >
                <Icon
                  className={`w-5 h-5 transition-transform duration-200 ${
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
                className={`text-[10px] tracking-tight leading-tight mt-0.5 transition-all duration-200 ${
                  isActive ? 'text-rose-600 font-bold scale-105' : 'text-stone-500 font-medium'
                }`}
              >
                {tab.shortLabel}
              </span>
              {isActive && (
                <motion.span
                  layoutId="mobile-active-tab-dot"
                  className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-0.5"
                  transition={{ type: 'spring', stiffness: 500, damping: 36 }}
                />
              )}
            </motion.button>
          );
        })}
      </nav>
    </>
  );
};
