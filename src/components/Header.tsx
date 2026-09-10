import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, Sparkles, Settings, ArrowLeftRight, Bell } from 'lucide-react';
import { CoupleProfile, PartnerId, MissYouPulse } from '../types';
import { soundEffects } from '../lib/audio';

interface HeaderProps {
  profile: CoupleProfile;
  activePartnerId: PartnerId;
  onSwitchPartner: (id: PartnerId) => void;
  onOpenSettings: () => void;
  onSendMissYou: (vibe: MissYouPulse['vibe'], message: string) => void;
  unreadNotesCount: number;
  onGoToNotes: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  profile,
  activePartnerId,
  onSwitchPartner,
  onOpenSettings,
  onSendMissYou,
  unreadNotesCount,
  onGoToNotes,
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
    <header className="sticky top-0 z-30 bg-[#FAF7F5]/90 backdrop-blur-md border-b border-rose-100/80 px-4 sm:px-6 py-3 transition-all">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
        {/* Left: Couple Brand & Days counter */}
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="relative group cursor-pointer" onClick={onOpenSettings} title="Personnaliser notre couple">
            <div className="flex items-center -space-x-3">
              <img
                src={profile.partner1.avatar}
                alt={profile.partner1.name}
                className="w-10 h-10 sm:w-11 sm:h-11 rounded-full object-cover border-2 border-white shadow-sm ring-2 ring-rose-400/50"
              />
              <img
                src={profile.partner2.avatar}
                alt={profile.partner2.name}
                className="w-10 h-10 sm:w-11 sm:h-11 rounded-full object-cover border-2 border-white shadow-sm ring-2 ring-sky-400/50"
              />
            </div>
            <span className="absolute -bottom-1 left-4 w-4 h-4 bg-rose-500 rounded-full flex items-center justify-center text-[9px] text-white shadow-xs">
              ❤️
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-serif-romantic text-lg sm:text-xl font-bold tracking-tight text-stone-800">
                {profile.relationshipTitle}
              </h1>
              <button
                onClick={onOpenSettings}
                className="text-stone-400 hover:text-rose-600 transition-colors p-1"
                title="Paramètres du couple"
                id="btn-settings"
              >
                <Settings className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-xs text-stone-500 flex items-center gap-1.5 font-medium">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
              <span>{daysTogether} jours d'amour</span>
              <span className="hidden sm:inline text-rose-300">•</span>
              <span className="hidden sm:inline text-rose-600/80 font-handwriting text-sm">
                Toujours plus complices
              </span>
            </p>
          </div>
        </div>

        {/* Right: Partner Switcher & 'Tu me manques' Quick Action */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Unread Notes badge */}
          {unreadNotesCount > 0 && (
            <button
              onClick={onGoToNotes}
              className="relative p-2 rounded-full bg-rose-100/70 hover:bg-rose-200/80 text-rose-700 transition-colors"
              title={`${unreadNotesCount} billet(s) doux non lu(s)`}
              id="btn-unread-notes"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center animate-bounce shadow-xs">
                {unreadNotesCount}
              </span>
            </button>
          )}

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
              <img
                src={profile.partner1.avatar}
                alt={profile.partner1.name}
                className="w-4 h-4 rounded-full object-cover"
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
              <img
                src={profile.partner2.avatar}
                alt={profile.partner2.name}
                className="w-4 h-4 rounded-full object-cover"
              />
              <span>{profile.partner2.name}</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
