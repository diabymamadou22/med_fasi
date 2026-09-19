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
      icon: Sparkles,
      color: 'text-amber-500',
    },
    {
      id: 'chat' as MainTab,
      label: 'Chat Intime',
      shortLabel: 'Chat',
      icon: MessageCircle,
      badge: unreadChatCount > 0 ? unreadChatCount : undefined,
      color: 'text-rose-500',
    },
    {
      id: 'games' as MainTab,
      label: 'Jeux & Flirt',
      shortLabel: 'Jeux',
      icon: Gamepad2,
      color: 'text-violet-500',
    },
    {
      id: 'gallery' as MainTab,
      label: 'Galerie Duo',
      shortLabel: 'Galerie',
      icon: Images,
      color: 'text-pink-500',
    },
  ];

  const handleTabClick = (tabId: MainTab) => {
    soundEffects.playSoftTap();
    onSelectTab(tabId);
  };

  return (
    <>
      {/* 1. Desktop & Tablet Top Navigation Bar */}
      <div className="hidden sm:block max-w-6xl mx-auto px-4 sm:px-6 pt-3 pb-1">
        <nav className="flex items-center justify-center gap-1.5 bg-white/80 backdrop-blur-md p-1.5 rounded-2xl border border-stone-200/80 shadow-[0_2px_12px_rgba(0,0,0,0.04)] overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <motion.button
                key={`desktop-tab-${tab.id}`}
                onClick={() => handleTabClick(tab.id)}
                whileTap={{ scale: 0.97 }}
                className={`relative flex items-center justify-start gap-2.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer select-none ${
                  isActive
                    ? 'text-white shadow-sm'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100/80'
                }`}
                id={`nav-tab-desktop-${tab.id}`}
              >
                {isActive && (
                  <motion.div
                    layoutId="desktop-active-pill"
                    className="absolute inset-0 bg-gradient-to-r from-rose-500 via-rose-600 to-pink-500 rounded-xl shadow-xs -z-10"
                    transition={{ type: 'spring', stiffness: 500, damping: 38 }}
                  />
                )}
                <Icon className={`w-4 h-4 relative z-10 ${isActive ? 'text-white' : tab.color}`} />
                <span className="relative z-10">{tab.label}</span>

                {tab.badge && (
                  <span
                    className={`relative z-10 px-1.5 py-0.2 rounded-full text-[10px] font-extrabold flex items-center justify-center shadow-xs ${
                      isActive ? 'bg-white text-rose-600' : 'bg-rose-500 text-white animate-pulse'
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

      {/* 2. Mobile Fixed Bottom Tab Bar (Thumb friendly, refined aesthetics) */}
      <nav
        aria-label="Navigation principale mobile"
        className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-rose-100/90 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] px-2 pt-1 pb-[max(0.55rem,env(safe-area-inset-bottom,0px))] flex items-center justify-around"
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <motion.button
              key={`mobile-tab-${tab.id}`}
              onClick={() => handleTabClick(tab.id)}
              whileTap={{ scale: 0.92 }}
              className={`relative flex-1 flex flex-col items-center justify-center py-1 min-h-[46px] rounded-xl cursor-pointer touch-manipulation select-none transition-colors ${
                isActive
                  ? 'text-rose-600 font-bold'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
              id={`nav-tab-mobile-${tab.id}`}
            >
              {isActive && (
                <motion.div
                  layoutId="mobile-active-tab-highlight"
                  className="absolute inset-x-1 inset-y-0.5 bg-rose-50 rounded-xl -z-10"
                  transition={{ type: 'spring', stiffness: 500, damping: 36 }}
                />
              )}
              <div
                className={`relative p-0.5 transition-transform duration-200 ${
                  isActive ? '-translate-y-0.5' : ''
                }`}
              >
                <Icon
                  className={`w-5 h-5 transition-all duration-200 ${
                    isActive ? 'text-rose-600 scale-110 drop-shadow-xs' : 'text-stone-400'
                  }`}
                />
                {tab.badge && (
                  <span className="absolute -top-1 -right-2 min-w-[16px] h-4 px-1 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center ring-2 ring-white">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span
                className={`text-[11px] tracking-tight leading-tight mt-0.5 transition-all duration-200 ${
                  isActive ? 'text-rose-600 font-bold' : 'text-stone-500 font-medium'
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
