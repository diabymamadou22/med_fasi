import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, Sparkles, Settings, ArrowLeftRight, Camera, MapPin, Lock, Cloud, CloudCheck, Download, Smartphone, MessageCircle } from 'lucide-react';
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
  unreadNotesCount: number;
  unreadChatCount?: number;
  onGoToNotes: () => void;
  onGoToGallery?: () => void;
  onGoToChat?: () => void;
  isPinEnabled?: boolean;
  onLockApp?: () => void;
  isFirebaseConnected?: boolean;
  onOpenInstallModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  profile,
  activePartnerId,
  onSwitchPartner,
  onOpenSettings,
  onOpenPhotoPicker,
  onSendMissYou,
  unreadNotesCount,
  unreadChatCount = 0,
  onGoToNotes,
  onGoToGallery,
  onGoToChat,
  isPinEnabled,
  onLockApp,
  isFirebaseConnected = true,
  onOpenInstallModal,
}) => {
  const [showPulseMenu, setShowPulseMenu] = useState(false);
  const [pulseSending, setPulseSending] = useState(false);

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

  const handleQuickMissYou = (vibe: MissYouPulse['vibe'], msg: string) => {
    setPulseSending(true);
    soundEffects.playHeartPulse();
    onSendMissYou(vibe, msg);
    setTimeout(() => {
      setPulseSending(false);
      setShowPulseMenu(false);
    }, 600);
  };

  return (
    <header className="sticky top-0 z-30 bg-[#FAF7F5]/95 backdrop-blur-md border-b border-rose-100/80 px-3 sm:px-6 py-2 sm:py-3 transition-all">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3">
        {/* Top / Left: Couple Brand & Days counter & Photos */}
        <div className="flex items-center justify-between sm:justify-start gap-2.5 sm:gap-4">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="relative group flex items-center shrink-0">
              <div className="flex items-center -space-x-2.5 sm:-space-x-3">
                {/* Partner 1 Avatar with quick photo change */}
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenPhotoPicker ? onOpenPhotoPicker('p1') : onOpenSettings();
                  }}
                  className="relative group/p1 cursor-pointer"
                  title={`Profil de ${profile.partner1.name}`}
                >
                  <PartnerAvatar
                    name={profile.partner1.name}
                    avatar={profile.partner1.avatar}
                    partnerId="p1"
                    size="md"
                    className="border-2 border-white shadow-xs ring-2 ring-rose-400/60 group-hover/p1:ring-rose-500 transition-all"
                  />
                  <span className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover/p1:opacity-100 transition-opacity text-white">
                    <Camera className="w-3 h-3" />
                  </span>
                </div>

                {/* Partner 2 Avatar with quick photo change */}
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenPhotoPicker ? onOpenPhotoPicker('p2') : onOpenSettings();
                  }}
                  className="relative group/p2 cursor-pointer"
                  title={`Profil de ${profile.partner2.name}`}
                >
                  <PartnerAvatar
                    name={profile.partner2.name}
                    avatar={profile.partner2.avatar}
                    partnerId="p2"
                    size="md"
                    className="border-2 border-white shadow-xs ring-2 ring-sky-400/60 group-hover/p2:ring-sky-500 transition-all"
                  />
                  <span className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover/p2:opacity-100 transition-opacity text-white">
                    <Camera className="w-3 h-3" />
                  </span>
                </div>
              </div>
              <span className="absolute -bottom-1 left-3 sm:left-4 w-3.5 h-3.5 sm:w-4 sm:h-4 bg-rose-500 rounded-full flex items-center justify-center text-[8px] sm:text-[9px] text-white shadow-xs">
                ❤️
              </span>
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <h1 className="font-serif-romantic text-base sm:text-xl font-bold tracking-tight text-stone-800 truncate">
                  {profile.relationshipTitle}
                </h1>
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0 ${
                    isFirebaseConnected
                      ? 'bg-amber-50 text-amber-800 border border-amber-200/70'
                      : 'bg-stone-100 text-stone-600 border border-stone-200'
                  }`}
                  title={
                    isFirebaseConnected
                      ? 'Firebase Cloud Firestore synchronisé en temps réel'
                      : 'Mode Hors-ligne (LocalStorage local)'
                  }
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isFirebaseConnected ? 'bg-amber-500 animate-pulse' : 'bg-stone-400'
                    }`}
                  />
                  <Cloud className="w-3 h-3 text-amber-600 hidden xs:inline" />
                  <span className="hidden sm:inline">
                    {isFirebaseConnected ? 'Cloud Sync' : 'Local'}
                  </span>
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-stone-500 flex items-center gap-1 sm:gap-1.5 font-medium truncate">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse shrink-0" />
                <span>{daysTogether} jours d'amour</span>
                <span className="hidden sm:inline text-rose-300">•</span>
                <span className="hidden sm:inline text-stone-500 text-[11px]">
                  Chaque jour à tes côtés
                </span>
                <span className="hidden md:inline text-rose-300">•</span>
                <span className="hidden md:inline text-rose-600/80 font-handwriting text-sm">
                  Toujours plus complices
                </span>
              </p>
            </div>
          </div>

          {/* Quick action buttons on mobile */}
          <div className="flex items-center gap-1 sm:hidden">
            {onGoToChat && (
              <button
                onClick={onGoToChat}
                className="relative text-emerald-600 hover:text-emerald-700 p-2 rounded-full hover:bg-emerald-50 transition-colors cursor-pointer"
                title="Ouvrir WhatsApp Duo"
                id="btn-chat-mobile"
              >
                <MessageCircle className="w-4.5 h-4.5" />
                {unreadChatCount > 0 && (
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-white" />
                )}
              </button>
            )}

            {isPinEnabled && onLockApp && (
              <button
                onClick={onLockApp}
                className="text-stone-500 hover:text-amber-600 p-2 rounded-full hover:bg-stone-100 transition-colors cursor-pointer"
                title="Verrouiller l'espace"
                id="btn-quick-lock-mobile"
              >
                <Lock className="w-4 h-4" />
              </button>
            )}

            {onOpenInstallModal && (
              <button
                onClick={onOpenInstallModal}
                className="text-stone-500 hover:text-rose-600 p-1.5 rounded-full hover:bg-rose-50 transition-colors cursor-pointer flex items-center gap-1"
                title="Installer l'application sur votre téléphone"
                id="btn-install-app-mobile"
              >
                <img
                  src="/app-icon.png"
                  alt="App Icon"
                  className="w-5 h-5 rounded-md object-cover shadow-xs ring-1 ring-rose-300"
                />
              </button>
            )}

            <button
              onClick={onOpenSettings}
              className="text-stone-500 hover:text-rose-600 p-2 rounded-full hover:bg-stone-100 transition-colors cursor-pointer"
              title="Paramètres"
              id="btn-settings-mobile"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Right: Partner Switcher & 'Tu me manques' Quick Action */}
        <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-3 pt-1.5 sm:pt-0 border-t sm:border-t-0 border-rose-100/60">
          {/* Desktop utility buttons */}
          <div className="hidden sm:flex items-center gap-1">
            {onGoToChat && (
              <button
                onClick={onGoToChat}
                className="relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 text-xs font-semibold shadow-2xs hover:shadow-xs transition-all cursor-pointer group"
                title="Ouvrir le chat WhatsApp en direct"
                id="btn-chat-desktop"
              >
                <MessageCircle className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform" />
                <span>WhatsApp</span>
                {unreadChatCount > 0 && (
                  <span className="px-1.5 py-0.2 bg-emerald-600 text-white rounded-full text-[10px] font-bold">
                    {unreadChatCount}
                  </span>
                )}
              </button>
            )}

            {onOpenInstallModal && (
              <button
                onClick={onOpenInstallModal}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-rose-50 to-pink-50 hover:from-rose-100 hover:to-pink-100 border border-rose-200/80 text-rose-800 text-xs font-semibold shadow-2xs hover:shadow-xs transition-all cursor-pointer group"
                title="Installer l'application sur votre téléphone"
                id="btn-install-app-desktop"
              >
                <img
                  src="/app-icon.png"
                  alt="App Icon"
                  className="w-4 h-4 rounded object-cover shadow-xs ring-1 ring-rose-300 group-hover:scale-105 transition-transform"
                />
                <span>Installer l'App</span>
                <Download className="w-3 h-3 text-rose-500" />
              </button>
            )}
            <button
              onClick={onOpenSettings}
              className="text-stone-400 hover:text-rose-600 transition-colors p-1.5 rounded-lg hover:bg-rose-50 cursor-pointer"
              title="Paramètres du couple & personnalisation"
              id="btn-settings"
            >
              <Settings className="w-4 h-4" />
            </button>
            {isPinEnabled && onLockApp && (
              <button
                onClick={onLockApp}
                className="text-stone-400 hover:text-amber-600 transition-colors p-1.5 rounded-lg hover:bg-amber-50 cursor-pointer"
                title="Verrouiller l'espace (Code PIN)"
                id="btn-quick-lock"
              >
                <Lock className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Quick "Tu me manques" pulse trigger */}
          <div className="relative">
            <button
              onClick={() => setShowPulseMenu(!showPulseMenu)}
              className={`flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-full text-xs sm:text-sm font-semibold transition-all shadow-xs ${
                pulseSending
                  ? 'bg-rose-600 text-white scale-105 ring-4 ring-rose-200'
                  : 'bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white hover:shadow-md'
              }`}
              id="btn-miss-you-quick"
            >
              <Heart className={`w-4 h-4 fill-white ${pulseSending ? 'animate-ping' : 'animate-heartbeat'}`} />
              <span className="hidden xs:inline">Tu me manques</span>
              <Sparkles className="w-3 h-3 text-amber-200 hidden sm:inline" />
            </button>

            {/* Pulse Dropdown Menu */}
            <AnimatePresence>
              {showPulseMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.95 }}
                  className="absolute right-0 mt-2 w-64 p-3 bg-white rounded-2xl shadow-xl border border-rose-100 z-50 text-stone-800"
                >
                  <div className="text-xs font-semibold text-rose-800 mb-2 flex items-center justify-between">
                    <span>Envoyer une onde à {otherPartner.name}</span>
                    <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
                  </div>
                  <div className="grid grid-cols-1 gap-1.5">
                    <button
                      onClick={() =>
                        handleQuickMissYou('hug', 'Gros câlin télépathique tout doux 🧸')
                      }
                      className="w-full text-left px-2.5 py-2 text-xs rounded-xl hover:bg-rose-50 flex items-center gap-2.5 transition-colors"
                    >
                      <span className="text-base">🧸</span>
                      <div>
                        <p className="font-semibold text-stone-800">Câlin télépathique</p>
                        <p className="text-[10px] text-stone-500">Une étreinte instantanée</p>
                      </div>
                    </button>
                    <button
                      onClick={() =>
                        handleQuickMissYou('kiss', 'Pluie de doux baisers sur tes joues 💋')
                      }
                      className="w-full text-left px-2.5 py-2 text-xs rounded-xl hover:bg-rose-50 flex items-center gap-2.5 transition-colors"
                    >
                      <span className="text-base">💋</span>
                      <div>
                        <p className="font-semibold text-stone-800">Doux baisers</p>
                        <p className="text-[10px] text-stone-500">Pour te faire sourire</p>
                      </div>
                    </button>
                    <button
                      onClick={() =>
                        handleQuickMissYou('thought', 'Une grosse pensée amoureuse pour toi ✨')
                      }
                      className="w-full text-left px-2.5 py-2 text-xs rounded-xl hover:bg-rose-50 flex items-center gap-2.5 transition-colors"
                    >
                      <span className="text-base">✨</span>
                      <div>
                        <p className="font-semibold text-stone-800">Pensée magique</p>
                        <p className="text-[10px] text-stone-500">Hâte de te retrouver</p>
                      </div>
                    </button>
                    <button
                      onClick={() =>
                        handleQuickMissYou('flame', 'Petite flamme d\'amour qui crépite 🔥')
                      }
                      className="w-full text-left px-2.5 py-2 text-xs rounded-xl hover:bg-rose-50 flex items-center gap-2.5 transition-colors"
                    >
                      <span className="text-base">🔥</span>
                      <div>
                        <p className="font-semibold text-stone-800">Flamme complice</p>
                        <p className="text-[10px] text-stone-500">Pensée passionnée</p>
                      </div>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Active Partner Switcher Pill */}
          <div className="flex items-center bg-white/80 border border-stone-200/80 rounded-full p-1 shadow-2xs">
            <button
              onClick={() => onSwitchPartner('p1')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-all ${
                activePartnerId === 'p1'
                  ? 'bg-rose-500 text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
              id="switch-partner-p1"
              title={`Basculer sur ${profile.partner1.name}`}
            >
              <PartnerAvatar
                name={profile.partner1.name}
                avatar={profile.partner1.avatar}
                partnerId="p1"
                size="xs"
              />
              <span>{profile.partner1.name}</span>
            </button>
            <div className="px-0.5 text-stone-300">
              <ArrowLeftRight className="w-3 h-3" />
            </div>
            <button
              onClick={() => onSwitchPartner('p2')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-all ${
                activePartnerId === 'p2'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
              id="switch-partner-p2"
              title={`Basculer sur ${profile.partner2.name}`}
            >
              <PartnerAvatar
                name={profile.partner2.name}
                avatar={profile.partner2.avatar}
                partnerId="p2"
                size="xs"
              />
              <span>{profile.partner2.name}</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
