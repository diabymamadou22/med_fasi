import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Heart,
  Settings,
  Camera,
  Lock,
  Cloud,
  Bell,
  BellRing,
  MoreVertical,
  Download,
  Check,
  X,
  Sparkles,
  RotateCw,
} from 'lucide-react';
import { CoupleProfile, PartnerId, MissYouPulse } from '../types';
import { soundEffects } from '../lib/audio';
import { PartnerAvatar } from './PartnerAvatar';

interface HeaderProps {
  profile: CoupleProfile;
  activePartnerId: PartnerId;
  onSwitchPartner: (id: PartnerId) => void;
  onOpenSettings: () => void;
  onOpenPhotoPicker?: (partnerId: PartnerId) => void;
  onSendMissYou: (vibe: MissYouPulse['vibe'], message: string) => void;
  onGoToGallery?: () => void;
  isPinEnabled?: boolean;
  onLockApp?: () => void;
  isFirebaseConnected?: boolean;
  onOpenInstallModal?: () => void;
  onOpenNotifications?: () => void;
  isNotificationsActive?: boolean;
  onRefresh?: () => Promise<void> | void;
  isRefreshing?: boolean;
}

export const Header: React.FC<HeaderProps> = React.memo(({
  profile,
  activePartnerId,
  onSwitchPartner,
  onOpenSettings,
  onOpenPhotoPicker,
  onSendMissYou,
  onGoToGallery,
  isPinEnabled,
  onLockApp,
  isFirebaseConnected = true,
  onOpenInstallModal,
  onOpenNotifications,
  isNotificationsActive = false,
  onRefresh,
  isRefreshing = false,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [pulseSending, setPulseSending] = useState<string | null>(null);
  const [localRefreshing, setLocalRefreshing] = useState(false);
  const [showRefreshFeedback, setShowRefreshFeedback] = useState(false);

  const refreshing = isRefreshing || localRefreshing;

  const handleRefreshClick = async () => {
    if (refreshing) return;
    setLocalRefreshing(true);
    soundEffects.playSoftTap();
    try {
      if (onRefresh) {
        await onRefresh();
      }
      setShowRefreshFeedback(true);
      setTimeout(() => setShowRefreshFeedback(false), 2200);
    } catch (e) {
      console.warn('Manual refresh issue:', e);
    } finally {
      setTimeout(() => {
        setLocalRefreshing(false);
      }, 650);
    }
  };

  const currentPartner = activePartnerId === 'p1' ? profile.partner1 : profile.partner2;
  const otherPartner = activePartnerId === 'p1' ? profile.partner2 : profile.partner1;

  // Calculate days together
  const daysTogether = Math.max(
    1,
    Math.floor(
      (new Date().getTime() - new Date(profile.anniversaryDate).getTime()) /
        (1000 * 60 * 60 * 24)
    )
  );

  // Close menu on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsMenuOpen(false);
    };
    if (isMenuOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMenuOpen]);

  const handleQuickMissYou = (vibe: MissYouPulse['vibe'], msg: string) => {
    setPulseSending(vibe);
    soundEffects.playHeartPulse();
    onSendMissYou(vibe, msg);
    setTimeout(() => {
      setPulseSending(null);
      setIsMenuOpen(false);
    }, 600);
  };

  return (
    <header className="sticky top-0 z-30 bg-[#FAF7F5]/95 backdrop-blur-md border-b border-rose-100/70 px-3 sm:px-5 py-2 pt-[max(0.5rem,env(safe-area-inset-top,0px))] pl-[max(0.75rem,env(safe-area-inset-left,0px))] pr-[max(0.75rem,env(safe-area-inset-right,0px))] transition-all">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
        {/* Left: Couple Brand & Days counter & Photos */}
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <div className="relative group flex items-center shrink-0">
            <div className="flex items-center -space-x-2 sm:-space-x-2.5">
              {/* Partner 1 Avatar */}
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenPhotoPicker ? onOpenPhotoPicker('p1') : onOpenSettings();
                }}
                className="relative group/p1 cursor-pointer"
                title={`Profil de ${profile.partner1.name} (cliquer pour modifier)`}
              >
                <PartnerAvatar
                  name={profile.partner1.name}
                  avatar={profile.partner1.avatar}
                  partnerId="p1"
                  size="sm"
                  className="border-2 border-white shadow-2xs ring-1.5 ring-rose-400/80 group-hover/p1:ring-rose-500 transition-all"
                />
                <span className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover/p1:opacity-100 transition-opacity text-white">
                  <Camera className="w-2.5 h-2.5" />
                </span>
              </div>

              {/* Partner 2 Avatar */}
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenPhotoPicker ? onOpenPhotoPicker('p2') : onOpenSettings();
                }}
                className="relative group/p2 cursor-pointer"
                title={`Profil de ${profile.partner2.name} (cliquer pour modifier)`}
              >
                <PartnerAvatar
                  name={profile.partner2.name}
                  avatar={profile.partner2.avatar}
                  partnerId="p2"
                  size="sm"
                  className="border-2 border-white shadow-2xs ring-1.5 ring-sky-400/80 group-hover/p2:ring-sky-500 transition-all"
                />
                <span className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover/p2:opacity-100 transition-opacity text-white">
                  <Camera className="w-2.5 h-2.5" />
                </span>
              </div>
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-rose-500 rounded-full flex items-center justify-center text-[8px] text-white shadow-2xs">
              ❤️
            </span>
          </div>

          <div className="min-w-0 flex flex-col justify-center">
            <div className="flex items-center gap-1.5 min-w-0">
              <h1 className="font-serif-romantic text-sm sm:text-base font-bold tracking-tight text-stone-800 truncate leading-tight">
                {profile.relationshipTitle}
              </h1>
              <span
                className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                  isFirebaseConnected ? 'bg-emerald-500 shadow-2xs' : 'bg-stone-400'
                }`}
                title={
                  isFirebaseConnected
                    ? 'Cloud Firestore synchronisé en direct'
                    : 'Mode Hors-ligne local'
                }
              />
            </div>
            <p className="text-[11px] text-stone-500 font-medium flex items-center gap-1 leading-tight truncate">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse shrink-0" />
              <span>{daysTogether} j</span>
              <span className="hidden sm:inline">d'amour</span>
              <span className="hidden md:inline text-rose-300">•</span>
              <span className="hidden md:inline text-stone-400 text-[11px] font-normal">
                Chaque jour à tes côtés
              </span>
            </p>
          </div>
        </div>

        {/* Right: Actualiser Button & Single Sleek Vertical 3-Dots Menu Button */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Refresh Button */}
          <div className="relative">
            <motion.button
              type="button"
              whileTap={{ scale: 0.88 }}
              onClick={handleRefreshClick}
              disabled={refreshing}
              className={`w-8.5 h-8.5 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                refreshing
                  ? 'bg-rose-100 text-rose-600 border border-rose-200 shadow-xs'
                  : 'bg-white hover:bg-rose-50/80 text-stone-600 hover:text-rose-600 border border-stone-200/90 hover:border-rose-300 shadow-2xs active:scale-95'
              }`}
              title="Actualiser et synchroniser l'application"
              aria-label="Actualiser"
              id="btn-header-refresh"
            >
              <RotateCw
                className={`w-4 h-4 transition-transform ${
                  refreshing ? 'animate-spin text-rose-600' : ''
                }`}
              />
            </motion.button>

            {/* Micro sync feedback pill */}
            <AnimatePresence>
              {showRefreshFeedback && (
                <motion.div
                  initial={{ opacity: 0, y: 6, scale: 0.88 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 4, scale: 0.88 }}
                  transition={{ duration: 0.16 }}
                  className="absolute right-0 top-full mt-1.5 px-2.5 py-1 bg-stone-900/92 backdrop-blur-md text-white text-[11px] font-medium rounded-full shadow-lg whitespace-nowrap z-50 flex items-center gap-1.5 border border-stone-700 pointer-events-none"
                >
                  <Sparkles className="w-3 h-3 text-amber-300 animate-spin" />
                  <span>Synchronisé !</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* 3-Dots Menu Button */}
          <div className="relative shrink-0">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className={`w-8.5 h-8.5 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                isMenuOpen
                  ? 'bg-rose-500 text-white shadow-md scale-95'
                  : 'bg-white hover:bg-rose-50/80 text-stone-700 hover:text-rose-600 border border-stone-200/90 hover:border-rose-300 shadow-2xs active:scale-95'
              }`}
              title="Menu des options et paramètres"
              aria-label="Options de l'en-tête"
              id="btn-header-more-vertical"
            >
              <MoreVertical className="w-4.5 h-4.5" />
              {/* Direct indicator dot if notifications are active */}
              {isNotificationsActive && !isMenuOpen && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-emerald-500 ring-1.5 ring-white" />
              )}
            </button>

          {/* Vertical Dropdown Menu */}
          <AnimatePresence>
            {isMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsMenuOpen(false)}
                />
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.95 }}
                  transition={{ duration: 0.16 }}
                  className="absolute right-0 top-full mt-2 w-72 sm:w-80 p-3 bg-white/98 backdrop-blur-xl rounded-2xl shadow-2xl border border-rose-100/90 z-50 text-stone-800 space-y-3"
                  id="header-vertical-dropdown"
                >
                  {/* Menu Top: Relationship status */}
                  <div className="flex items-center justify-between pb-2 border-b border-rose-100/70">
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-stone-800 truncate">
                        {profile.relationshipTitle}
                      </p>
                      <p className="text-[10px] text-stone-400 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        <span>Synchronisé • {daysTogether} jours d'amour</span>
                      </p>
                    </div>
                    <button
                      onClick={() => setIsMenuOpen(false)}
                      className="p-1 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100 transition-colors"
                      title="Fermer le menu"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Section 1: Active Partner Switcher */}
                  <div>
                    <label className="block text-[11px] font-semibold text-stone-500 uppercase tracking-wider mb-1.5 px-0.5">
                      Qui utilise l'application ?
                    </label>
                    <div className="grid grid-cols-2 gap-1.5 bg-stone-50 p-1.5 rounded-xl border border-stone-100">
                      {/* Partner 1 Option */}
                      <button
                        type="button"
                        onClick={() => {
                          onSwitchPartner('p1');
                          setIsMenuOpen(false);
                        }}
                        className={`flex items-center gap-2 p-1.5 rounded-lg transition-all text-left cursor-pointer ${
                          activePartnerId === 'p1'
                            ? 'bg-rose-500 text-white shadow-xs font-semibold'
                            : 'hover:bg-white text-stone-700'
                        }`}
                      >
                        <PartnerAvatar
                          name={profile.partner1.name}
                          avatar={profile.partner1.avatar}
                          partnerId="p1"
                          size="xs"
                          className="w-5 h-5 text-[9px] shrink-0"
                        />
                        <span className="truncate text-xs">{profile.partner1.name}</span>
                        {activePartnerId === 'p1' && (
                          <Check className="w-3.5 h-3.5 ml-auto text-white shrink-0" />
                        )}
                      </button>

                      {/* Partner 2 Option */}
                      <button
                        type="button"
                        onClick={() => {
                          onSwitchPartner('p2');
                          setIsMenuOpen(false);
                        }}
                        className={`flex items-center gap-2 p-1.5 rounded-lg transition-all text-left cursor-pointer ${
                          activePartnerId === 'p2'
                            ? 'bg-sky-500 text-white shadow-xs font-semibold'
                            : 'hover:bg-white text-stone-700'
                        }`}
                      >
                        <PartnerAvatar
                          name={profile.partner2.name}
                          avatar={profile.partner2.avatar}
                          partnerId="p2"
                          size="xs"
                          className="w-5 h-5 text-[9px] shrink-0"
                        />
                        <span className="truncate text-xs">{profile.partner2.name}</span>
                        {activePartnerId === 'p2' && (
                          <Check className="w-3.5 h-3.5 ml-auto text-white shrink-0" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Section 2: "Tu me manques" Quick Vibes */}
                  <div>
                    <label className="block text-[11px] font-semibold text-rose-800 uppercase tracking-wider mb-1.5 px-0.5 flex items-center justify-between">
                      <span>Onde à {otherPartner.name}</span>
                      <Heart className="w-3 h-3 text-rose-500 fill-rose-500" />
                    </label>
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        type="button"
                        onClick={() =>
                          handleQuickMissYou('hug', 'Gros câlin télépathique tout doux 🧸')
                        }
                        className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl border border-rose-100 hover:border-rose-200 hover:bg-rose-50 transition-all text-left cursor-pointer ${
                          pulseSending === 'hug' ? 'bg-rose-100 scale-95' : 'bg-white'
                        }`}
                      >
                        <span className="text-sm">🧸</span>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-stone-800 truncate">Câlin</p>
                          <p className="text-[9px] text-stone-400 truncate">Tout doux</p>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          handleQuickMissYou('kiss', 'Pluie de doux baisers sur tes joues 💋')
                        }
                        className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl border border-rose-100 hover:border-rose-200 hover:bg-rose-50 transition-all text-left cursor-pointer ${
                          pulseSending === 'kiss' ? 'bg-rose-100 scale-95' : 'bg-white'
                        }`}
                      >
                        <span className="text-sm">💋</span>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-stone-800 truncate">Baisers</p>
                          <p className="text-[9px] text-stone-400 truncate">Tendresse</p>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          handleQuickMissYou('thought', 'Une grosse pensée amoureuse pour toi ✨')
                        }
                        className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl border border-rose-100 hover:border-rose-200 hover:bg-rose-50 transition-all text-left cursor-pointer ${
                          pulseSending === 'thought' ? 'bg-rose-100 scale-95' : 'bg-white'
                        }`}
                      >
                        <span className="text-sm">✨</span>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-stone-800 truncate">Pensée</p>
                          <p className="text-[9px] text-stone-400 truncate">Magique</p>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          handleQuickMissYou('flame', "Petite flamme d'amour qui crépite 🔥")
                        }
                        className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl border border-rose-100 hover:border-rose-200 hover:bg-rose-50 transition-all text-left cursor-pointer ${
                          pulseSending === 'flame' ? 'bg-rose-100 scale-95' : 'bg-white'
                        }`}
                      >
                        <span className="text-sm">🔥</span>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-stone-800 truncate">Flamme</p>
                          <p className="text-[9px] text-stone-400 truncate">Passion</p>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Section 3: Utilities & Settings Actions */}
                  <div className="space-y-1 pt-1 border-t border-rose-100/70">
                    {onOpenNotifications && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsMenuOpen(false);
                          onOpenNotifications();
                        }}
                        className="w-full flex items-center justify-between px-2.5 py-2 rounded-xl hover:bg-rose-50/80 text-stone-700 hover:text-rose-700 transition-colors text-xs font-medium cursor-pointer"
                        id="menu-item-notifications"
                      >
                        <div className="flex items-center gap-2.5">
                          {isNotificationsActive ? (
                            <BellRing className="w-4 h-4 text-rose-500" />
                          ) : (
                            <Bell className="w-4 h-4 text-stone-500" />
                          )}
                          <span>Notifications & Alertes</span>
                        </div>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                            isNotificationsActive
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-amber-100 text-amber-700'
                          }`}
                        >
                          {isNotificationsActive ? 'Actives' : 'À régler'}
                        </span>
                      </button>
                    )}

                    {isPinEnabled && onLockApp && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsMenuOpen(false);
                          onLockApp();
                        }}
                        className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl hover:bg-amber-50 text-stone-700 hover:text-amber-800 transition-colors text-xs font-medium cursor-pointer"
                        id="menu-item-lock"
                      >
                        <Lock className="w-4 h-4 text-amber-600" />
                        <span>Verrouiller l'espace (PIN)</span>
                      </button>
                    )}

                    {onOpenInstallModal && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsMenuOpen(false);
                          onOpenInstallModal();
                        }}
                        className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl hover:bg-rose-50/80 text-stone-700 hover:text-rose-700 transition-colors text-xs font-medium cursor-pointer"
                        id="menu-item-install"
                      >
                        <Download className="w-4 h-4 text-rose-500" />
                        <span>Installer sur mon écran</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        setIsMenuOpen(false);
                        onOpenSettings();
                      }}
                      className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl hover:bg-rose-50/80 text-stone-700 hover:text-rose-700 transition-colors text-xs font-medium cursor-pointer"
                      id="menu-item-settings"
                    >
                      <Settings className="w-4 h-4 text-stone-500" />
                      <span>Paramètres du couple</span>
                    </button>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
          </div>
        </div>
      </div>
    </header>
  );
});

