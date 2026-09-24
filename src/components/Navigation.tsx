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

export const Navigation: React.FC<NavigationProps> = React.memo(({
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
        <nav className="flex items-center justify-center gap-1.5 bg-white/85 backdrop-blur-md p-1.5 rounded-2xl border border-stone-200/80 shadow-[0_4px_16px_rgba(0,0,0,0.04)] overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <motion.button
                key={`desktop-tab-${tab.id}`}
                onClick={() => handleTabClick(tab.id)}
                whileTap={{ scale: 0.96 }}
                className={`relative flex items-center justify-start gap-2.5 px-4.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer select-none ${
                  isActive
                    ? 'text-white shadow-xs'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100/70'
                }`}
                id={`nav-tab-desktop-${tab.id}`}
              >
                {isActive && (
                  <motion.div
                    layoutId="desktop-active-pill"
                    className="absolute inset-0 bg-gradient-to-r from-rose-500 via-rose-600 to-pink-500 rounded-xl shadow-xs -z-10"
                    transition={{ type: 'spring', stiffness: 480, damping: 36 }}
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

      {/* 2. Mobile Floating Glass Bottom Dock (Ultra-sleek, animated & thumb friendly) */}
      <div className="sm:hidden fixed bottom-0 inset-x-0 z-40 px-3 pb-[max(0.6rem,env(safe-area-inset-bottom,0.6rem))] pointer-events-none">
        <nav
          aria-label="Navigation principale mobile"
          className="pointer-events-auto max-w-md mx-auto bg-white/92 backdrop-blur-xl border border-white/80 shadow-[0_10px_35px_rgba(244,63,94,0.12),0_2px_10px_rgba(0,0,0,0.06)] rounded-2xl p-1.5 flex items-center justify-around relative ring-1 ring-stone-900/5 transition-all"
        >
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <motion.button
                key={`mobile-tab-${tab.id}`}
                onClick={() => handleTabClick(tab.id)}
                whileTap={{ scale: 0.88 }}
                className={`relative flex-1 flex flex-col items-center justify-center py-1 min-h-[50px] rounded-xl cursor-pointer touch-manipulation select-none transition-colors group ${
                  isActive ? 'text-rose-600' : 'text-stone-500 hover:text-stone-800'
                }`}
                id={`nav-tab-mobile-${tab.id}`}
              >
                {/* Floating active background bubble */}
                {isActive && (
                  <motion.div
                    layoutId="mobile-active-tab-highlight"
                    className="absolute inset-0 bg-gradient-to-tr from-rose-500/12 via-rose-500/18 to-pink-500/10 rounded-xl border border-rose-400/25 shadow-xs -z-10"
                    transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                  />
                )}

                {/* Animated Icon with Pop & Spring */}
                <motion.div
                  animate={
                    isActive
                      ? { scale: 1.15, y: -2 }
                      : { scale: 1, y: 0 }
                  }
                  transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                  className="relative p-0.5 flex items-center justify-center"
                >
                  <Icon
                    className={`w-5 h-5 transition-colors duration-200 ${
                      isActive
                        ? 'text-rose-600 drop-shadow-[0_2px_8px_rgba(244,63,94,0.35)]'
                        : 'text-stone-400 group-hover:text-stone-600'
                    }`}
                  />
                  {tab.badge && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-1.5 -right-2.5 min-w-[17px] h-[17px] px-1 rounded-full bg-gradient-to-r from-rose-500 to-pink-500 text-white text-[9px] font-extrabold flex items-center justify-center ring-2 ring-white shadow-xs animate-pulse"
                    >
                      {tab.badge}
                    </motion.span>
                  )}
                </motion.div>

                {/* Tab Label */}
                <span
                  className={`text-[10.5px] tracking-tight leading-tight mt-0.5 transition-all duration-200 ${
                    isActive ? 'text-rose-600 font-bold scale-[1.02]' : 'text-stone-500 font-medium'
                  }`}
                >
                  {tab.shortLabel}
                </span>

                {/* Glowing micro active dot / indicator line */}
                {isActive && (
                  <motion.span
                    layoutId="mobile-active-tab-dot"
                    className="w-3.5 h-1 rounded-full bg-gradient-to-r from-rose-500 to-pink-500 mt-0.5 shadow-[0_0_8px_rgba(244,63,94,0.6)]"
                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  />
                )}
              </motion.button>
            );
          })}
        </nav>
      </div>
    </>
  );
});
