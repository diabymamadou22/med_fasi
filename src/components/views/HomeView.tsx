import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Heart,
  Sparkles,
  MessageCircle,
  Images,
  ArrowRight,
  Feather,
  Quote,
  Gamepad2,
} from 'lucide-react';
import {
  CoupleProfile,
  PartnerId,
  SweetNote,
  ChatMessage,
  TimelineMemory,
  MissYouPulse,
} from '../../types';
import { PartnerAvatar } from '../PartnerAvatar';
import { soundEffects } from '../../lib/audio';
import { triggerHeartConfetti } from '../../lib/confetti';
import { triggerVibration } from '../../lib/notificationService';
import { EnglishGameTab } from './GamesView';

interface HomeViewProps {
  profile: CoupleProfile;
  activePartnerId: PartnerId;
  onSwitchPartner: (id: PartnerId) => void;
  onNavigateToTab: (tab: 'home' | 'chat' | 'games' | 'gallery') => void;
  onNavigateToGame?: (gameTab: EnglishGameTab) => void;
  onSendMissYou: (vibe: MissYouPulse['vibe'], message: string) => void;
  onOpenWriteNoteModal: () => void;
  notes?: SweetNote[];
  messages?: ChatMessage[];
  memories?: TimelineMemory[];
  onOpenProfileModal?: (partnerId?: PartnerId) => void;
}

// 4 attentions d'amour rapides & complices
const QUICK_PULSES: {
  vibe: MissYouPulse['vibe'];
  icon: string;
  label: string;
  message: string;
}[] = [
  {
    vibe: 'hug',
    icon: '🧸',
    label: 'Câlin',
    message: 'Gros câlin tout doux 🧸',
  },
  {
    vibe: 'kiss',
    icon: '💋',
    label: 'Bisou',
    message: 'Doux baisers tendres 💋',
  },
  {
    vibe: 'flame',
    icon: '🔥',
    label: 'Flamme',
    message: 'Petite flamme complice pour toi 🔥',
  },
  {
    vibe: 'thought',
    icon: '✨',
    label: 'Pensée',
    message: 'Une pensée d’amour pour toi ✨',
  },
];

export const HomeView: React.FC<HomeViewProps> = ({
  profile,
  activePartnerId,
  onNavigateToTab,
  onSendMissYou,
  onOpenWriteNoteModal,
  notes = [],
  messages = [],
  memories = [],
  onOpenProfileModal,
}) => {
  const otherPartner = activePartnerId === 'p1' ? profile.partner2 : profile.partner1;
  const [pulseFeedback, setPulseFeedback] = useState<string | null>(null);

  // Salutation chaleureuse selon l'heure
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'Bonjour mon amour';
    if (hour >= 12 && hour < 18) return 'Bel après-midi';
    if (hour >= 18 && hour < 23) return 'Douce soirée à deux';
    return 'Bonne nuit tendresse';
  };

  // Compteur des jours d'amour
  const daysTogether = Math.max(
    1,
    Math.floor(
      (new Date().getTime() - new Date(profile.anniversaryDate).getTime()) /
        (1000 * 60 * 60 * 24)
    )
  );

  const formattedAnniversary = new Date(profile.anniversaryDate).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  // Dernier message du chat
  const latestMessage = messages.length > 0 ? messages[messages.length - 1] : null;
  const unreadCount = messages.filter(
    (m) => m.senderId !== activePartnerId && !m.readStatus
  ).length;

  // Dernier mot doux
  const latestNote = notes.length > 0 ? notes[notes.length - 1] : null;

  // Dernier souvenir de la galerie
  const latestMemory = memories.length > 0 ? memories[memories.length - 1] : null;

  // Envoi d'une onde d'amour
  const handleSendPulse = (vibe: MissYouPulse['vibe'], message: string, label: string) => {
    soundEffects.playHeartPulse();
    triggerHeartConfetti();
    triggerVibration([80, 40, 80]);
    onSendMissYou(vibe, message);
    setPulseFeedback(label);
    setTimeout(() => {
      setPulseFeedback(null);
    }, 2500);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-4 sm:py-6 space-y-5">
      {/* ========================================================
          1. LE CŒUR DU NID (HERO ÉPURÉ & ÉLÉGANT)
         ======================================================== */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-white via-rose-50/20 to-white border border-rose-100/80 p-5 sm:p-7 shadow-xs text-center"
        aria-label="Espace d'accueil du couple"
      >
        {/* Lueur d'ambiance discrète */}
        <div className="absolute -top-16 -right-16 w-40 h-40 bg-rose-200/30 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-40 h-40 bg-pink-100/40 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center">
          {/* Salutation sobre */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/90 border border-rose-100 text-xs text-stone-600 mb-4 shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-rose-500" />
            <span className="font-serif italic text-stone-700">{getGreeting()}</span>
          </div>

          {/* Les Deux Avatars Complices unis par un Cœur */}
          <div className="flex items-center justify-center gap-4 sm:gap-6 my-1">
            {/* Partenaire 1 */}
            <div
              onClick={() => onOpenProfileModal && onOpenProfileModal('p1')}
              className="flex flex-col items-center cursor-pointer group"
              title={`Profil de ${profile.partner1.name}`}
            >
              <PartnerAvatar
                name={profile.partner1.name}
                avatar={profile.partner1.avatar}
                partnerId="p1"
                size="xl"
                className="border-2 border-white shadow-xs group-hover:scale-105 transition-transform"
              />
              <span className="mt-1.5 text-sm font-semibold text-stone-800">
                {profile.partner1.name}
              </span>
            </div>

            {/* Cœur central battant */}
            <div className="px-1 flex items-center justify-center">
              <motion.div
                animate={{ scale: [1, 1.15, 1] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-rose-50 border border-rose-200/70 flex items-center justify-center shadow-2xs"
              >
                <Heart className="w-5 h-5 text-rose-500 fill-rose-500" />
              </motion.div>
            </div>

            {/* Partenaire 2 */}
            <div
              onClick={() => onOpenProfileModal && onOpenProfileModal('p2')}
              className="flex flex-col items-center cursor-pointer group"
              title={`Profil de ${profile.partner2.name}`}
            >
              <PartnerAvatar
                name={profile.partner2.name}
                avatar={profile.partner2.avatar}
                partnerId="p2"
                size="xl"
                className="border-2 border-white shadow-xs group-hover:scale-105 transition-transform"
              />
              <span className="mt-1.5 text-sm font-semibold text-stone-800">
                {profile.partner2.name}
              </span>
            </div>
          </div>

          {/* Compteur de jours ensemble */}
          <div className="mt-3">
            <h2 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-stone-800">
              <span className="bg-gradient-to-r from-rose-600 to-pink-600 bg-clip-text text-transparent">
                {daysTogether.toLocaleString('fr-FR')}
              </span>{' '}
              jours d’amour
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              Depuis le <span className="text-stone-700 font-medium">{formattedAnniversary}</span>
            </p>
          </div>

          {/* Notification toast d'envoi d'onde d'amour */}
          <AnimatePresence>
            {pulseFeedback && (
              <motion.div
                initial={{ opacity: 0, y: 6, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.95 }}
                className="mt-3 px-3.5 py-1.5 rounded-full bg-rose-600 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5"
              >
                <Heart className="w-3.5 h-3.5 fill-white" />
                <span>{pulseFeedback} envoyé à {otherPartner.name} !</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* 4 Boutons d'attention instantanés & épurés */}
          <div className="mt-4 w-full max-w-sm grid grid-cols-4 gap-2">
            {QUICK_PULSES.map((pulse) => (
              <motion.button
                key={pulse.vibe}
                whileTap={{ scale: 0.94 }}
                onClick={() => handleSendPulse(pulse.vibe, pulse.message, pulse.label)}
                className="flex flex-col items-center justify-center py-2 px-1 rounded-2xl bg-white hover:bg-rose-50/60 border border-stone-200/70 hover:border-rose-200 shadow-2xs transition-all cursor-pointer"
                title={pulse.message}
              >
                <span className="text-lg leading-none">{pulse.icon}</span>
                <span className="text-[11px] font-medium text-stone-600 mt-1">{pulse.label}</span>
              </motion.button>
            ))}
          </div>
        </div>
      </motion.section>

      {/* ========================================================
          2. LE BILLET DOUX (INTIMITÉ & TENDRESSE)
         ======================================================== */}
      <section
        aria-label="Mot doux du couple"
        className="rounded-3xl bg-gradient-to-br from-[#FFFDF9] via-[#FAF5EE] to-[#F5EFE6] border border-amber-200/70 p-4 sm:p-5 shadow-xs"
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-100/70 flex items-center justify-center text-amber-800">
              <Feather className="w-3.5 h-3.5" />
            </div>
            <h3 className="text-xs sm:text-sm font-bold text-stone-800">Billet Doux</h3>
          </div>
          <span className="text-[11px] font-serif italic text-amber-800/80">Pensée d’amour</span>
        </div>

        <div className="my-2 p-3.5 rounded-2xl bg-white/90 border border-amber-200/50 shadow-2xs relative">
          <Quote className="w-4 h-4 text-amber-300 absolute top-2 right-2 opacity-40" />
          {latestNote ? (
            <div>
              <p className="font-['Caveat',cursive] text-lg sm:text-xl text-stone-800 leading-snug">
                « {latestNote.content} »
              </p>
              <p className="text-[11px] text-amber-800 font-medium text-right mt-1.5">
                De {latestNote.senderId === 'p1' ? profile.partner1.name : profile.partner2.name} •{' '}
                {new Date(latestNote.date).toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'short',
                })}
              </p>
            </div>
          ) : (
            <p className="font-['Caveat',cursive] text-lg sm:text-xl text-stone-600 italic text-center py-1">
              « Tu es la plus belle chose qui me soit arrivée. Je t’aime un peu plus chaque jour. »
            </p>
          )}
        </div>

        <button
          onClick={onOpenWriteNoteModal}
          className="w-full mt-2 flex items-center justify-center gap-2 py-2 rounded-xl bg-gradient-to-r from-amber-700 to-amber-800 hover:from-amber-800 hover:to-amber-900 text-white text-xs font-semibold shadow-2xs transition-all cursor-pointer"
        >
          <Feather className="w-3.5 h-3.5 text-amber-200" />
          <span>Écrire un mot doux</span>
        </button>
      </section>

      {/* ========================================================
          3. LES 2 ACCÈS DIRECTS : CHAT & SOUVENIRS
         ======================================================== */}
      <section aria-label="Raccourcis intimes" className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        {/* Raccourci 1 : Chat Privé */}
        <motion.div
          whileTap={{ scale: 0.99 }}
          onClick={() => onNavigateToTab('chat')}
          className="group p-4 sm:p-5 rounded-3xl bg-white border border-stone-200/80 shadow-xs hover:border-rose-300 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
          id="card-nav-chat"
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600">
                <MessageCircle className="w-4 h-4" />
              </div>
              {unreadCount > 0 ? (
                <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-bold shadow-xs">
                  {unreadCount} nouveau{unreadCount > 1 ? 'x' : ''}
                </span>
              ) : (
                <span className="text-[10px] text-stone-400 font-medium">Salon privé</span>
              )}
            </div>

            <h4 className="text-sm font-bold text-stone-800 group-hover:text-rose-600 transition-colors">
              Chat & Vocaux
            </h4>

            {/* Aperçu du dernier message */}
            <p className="text-xs text-stone-500 mt-1 truncate">
              {latestMessage ? (
                <span>
                  <strong className="text-stone-700">
                    {latestMessage.senderId === activePartnerId ? 'Toi : ' : `${otherPartner.name} : `}
                  </strong>
                  {latestMessage.type === 'audio'
                    ? '🎤 Note vocale'
                    : latestMessage.type === 'image'
                    ? '📷 Photo'
                    : latestMessage.text}
                </span>
              ) : (
                'Envoyer un petit message doux...'
              )}
            </p>
          </div>

          <div className="mt-3 pt-2.5 border-t border-stone-100 flex items-center justify-between text-xs font-semibold text-rose-600">
            <span>Ouvrir la discussion</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </motion.div>

        {/* Raccourci 2 : Galerie & Souvenirs */}
        <motion.div
          whileTap={{ scale: 0.99 }}
          onClick={() => onNavigateToTab('gallery')}
          className="group p-4 sm:p-5 rounded-3xl bg-white border border-stone-200/80 shadow-xs hover:border-pink-300 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
          id="card-nav-gallery"
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 rounded-xl bg-pink-50 border border-pink-100 flex items-center justify-center text-pink-600">
                <Images className="w-4 h-4" />
              </div>
              <span className="text-[10px] text-stone-400 font-medium">
                {memories.length > 0 ? `${memories.length} souvenir${memories.length > 1 ? 's' : ''}` : 'Album'}
              </span>
            </div>

            <h4 className="text-sm font-bold text-stone-800 group-hover:text-pink-600 transition-colors">
              Album & Galerie
            </h4>

            <p className="text-xs text-stone-500 mt-1 truncate">
              {latestMemory?.title || 'Photos, vidéos et doux souvenirs partagés'}
            </p>
          </div>

          <div className="mt-3 pt-2.5 border-t border-stone-100 flex items-center justify-between text-xs font-semibold text-pink-600">
            <span>Voir nos souvenirs</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </motion.div>
      </section>

      {/* Raccourci discret pour les jeux complices */}
      <div className="text-center pt-1">
        <button
          onClick={() => onNavigateToTab('games')}
          className="inline-flex items-center gap-1.5 text-xs text-stone-500 hover:text-stone-800 transition-colors cursor-pointer py-1 px-3 rounded-full hover:bg-stone-100/70"
        >
          <Gamepad2 className="w-3.5 h-3.5 text-violet-500" />
          <span>Envie de jouer ensemble ? Roue des gages, quiz & blind test</span>
          <ArrowRight className="w-3 h-3 text-stone-400" />
        </button>
      </div>
    </div>
  );
};
