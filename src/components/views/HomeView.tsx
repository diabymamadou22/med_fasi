import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Heart,
  Sparkles,
  MessageCircle,
  Gamepad2,
  Images,
  Volume2,
  ArrowRight,
  Send,
  Feather,
  Smile,
  Quote,
  ChevronRight,
  Flame,
  Radio,
  Sparkle,
  Dices,
} from 'lucide-react';
import {
  CoupleProfile,
  PartnerId,
  SweetNote,
  ChatMessage,
  LoveVoucher,
  EnglishLexiconItem,
  WeeklyLearningChallenge,
  MissYouPulse,
} from '../../types';
import { PartnerAvatar } from '../PartnerAvatar';
import { soundEffects } from '../../lib/audio';
import { triggerHeartConfetti } from '../../lib/confetti';
import { speakEnglish } from '../../lib/englishSpeech';
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
  vouchers?: LoveVoucher[];
  lexicon?: EnglishLexiconItem[];
  weeklyChallenges?: WeeklyLearningChallenge[];
  onOpenChatWithDraft?: (text: string) => void;
  onOpenProfileModal?: (partnerId?: PartnerId) => void;
}

// Romantic quick pulses configuration
const QUICK_PULSES: {
  vibe: MissYouPulse['vibe'];
  icon: string;
  label: string;
  message: string;
  tagColor: string;
}[] = [
  {
    vibe: 'hug',
    icon: '🧸',
    label: 'Câlin doux',
    message: 'Gros câlin télépathique tout doux 🧸',
    tagColor: 'hover:border-rose-300 hover:bg-rose-50/70',
  },
  {
    vibe: 'kiss',
    icon: '💋',
    label: 'Bisou tendre',
    message: 'Pluie de doux baisers sur tes joues 💋',
    tagColor: 'hover:border-pink-300 hover:bg-pink-50/70',
  },
  {
    vibe: 'flame',
    icon: '🔥',
    label: 'Flamme coquine',
    message: 'Petite flamme complice qui crépite pour toi 🔥',
    tagColor: 'hover:border-amber-300 hover:bg-amber-50/70',
  },
  {
    vibe: 'thought',
    icon: '✨',
    label: 'Pensée magique',
    message: 'Une pensée d’amour pour illuminer ta journée ✨',
    tagColor: 'hover:border-violet-300 hover:bg-violet-50/70',
  },
];

export const HomeView: React.FC<HomeViewProps> = ({
  profile,
  activePartnerId,
  onSwitchPartner,
  onNavigateToTab,
  onNavigateToGame,
  onSendMissYou,
  onOpenWriteNoteModal,
  notes = [],
  messages = [],
  vouchers = [],
  weeklyChallenges = [],
  onOpenChatWithDraft,
  onOpenProfileModal,
}) => {
  const currentPartner = activePartnerId === 'p1' ? profile.partner1 : profile.partner2;
  const otherPartner = activePartnerId === 'p1' ? profile.partner2 : profile.partner1;

  const [pulseFeedback, setPulseFeedback] = useState<string | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  // Time-based romantic greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'Bonjour mon amour';
    if (hour >= 12 && hour < 18) return 'Bel après-midi complice';
    if (hour >= 18 && hour < 23) return 'Douce soirée à deux';
    return 'Bonne nuit tendresse';
  };

  // Calculate days together
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

  // Latest chat message
  const latestMessage = messages.length > 0 ? messages[messages.length - 1] : null;
  const unreadCount = messages.filter(
    (m) => m.senderId !== activePartnerId && !m.readStatus
  ).length;

  // Latest sweet note
  const latestNote = notes.length > 0 ? notes[notes.length - 1] : null;

  // Active weekly challenge
  const activeWeeklyChallenge =
    weeklyChallenges.find((c) => c.isActive) || weeklyChallenges[0] || null;

  // Handle instant love pulse
  const handleSendPulse = (vibe: MissYouPulse['vibe'], message: string, label: string) => {
    soundEffects.playHeartPulse();
    triggerHeartConfetti();
    triggerVibration([80, 40, 80]);
    onSendMissYou(vibe, message);
    setPulseFeedback(label);
    setTimeout(() => {
      setPulseFeedback(null);
    }, 2800);
  };

  // English pronunciation
  const handlePlayPronunciation = (text: string) => {
    setIsPlayingAudio(true);
    speakEnglish(text, {
      rate: 0.85,
      onEnd: () => setIsPlayingAudio(false),
    });
    setTimeout(() => {
      setIsPlayingAudio(false);
    }, 2500);
  };

  // Quick challenge jump to chat
  const handleLaunchChallengeInChat = (challenge: WeeklyLearningChallenge) => {
    soundEffects.playSoftTap();
    const draft = `🇬🇧 Défi Anglais du Cœur : "${challenge.targetEnglish}" (${challenge.targetFrench}) — À toi de jouer ! ✨`;
    if (onOpenChatWithDraft) {
      onOpenChatWithDraft(draft);
    } else {
      onNavigateToTab('chat');
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-5 sm:space-y-6">
      {/* ========================================================
          1. HERO COMPLICE : ACCUEIL CHIC, CHALEUREUX & ÉLÉGANT
         ======================================================== */}
      <motion.section
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-white via-[#FFF9F6] to-[#FFF4EE] border border-rose-100/90 p-5 sm:p-7 shadow-[0_4px_24px_rgba(244,63,94,0.05)]"
        aria-label="Espace d'accueil du couple"
      >
        {/* Soft background ambient glows */}
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-rose-200/40 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-amber-200/30 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center text-center">
          {/* Top refined pill with greeting */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/90 border border-rose-100 shadow-2xs text-xs text-stone-600 mb-3">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span className="font-serif italic text-stone-700">{getGreeting()}</span>
            <span className="text-stone-300">•</span>
            <span className="text-rose-600 font-semibold">{profile.relationshipTitle}</span>
          </div>

          {/* Couple Avatars with Living Heartbeat Link */}
          <div className="flex items-center justify-center gap-4 sm:gap-7 my-1">
            {/* Partner 1 */}
            <motion.div
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onOpenProfileModal && onOpenProfileModal('p1')}
              className="flex flex-col items-center cursor-pointer group"
              title={`Profil de ${profile.partner1.name}`}
              id="hero-avatar-p1"
            >
              <div className="relative p-1 rounded-full bg-gradient-to-tr from-rose-400 via-rose-300 to-amber-300 shadow-xs ring-2 ring-white">
                <PartnerAvatar
                  name={profile.partner1.name}
                  avatar={profile.partner1.avatar}
                  partnerId="p1"
                  size="xl"
                  className="border-2 border-white"
                />
                {activePartnerId === 'p1' && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-2 py-0.2 rounded-full bg-rose-500 text-white text-[9px] font-bold shadow-xs">
                    Moi
                  </span>
                )}
              </div>
              <span className="mt-1.5 text-sm font-semibold text-stone-800 tracking-tight">
                {profile.partner1.name}
              </span>
              <span className="text-[11px] text-rose-500/90 font-medium">
                {profile.partner1.mood?.status || 'Rayonnante'}
              </span>
            </motion.div>

            {/* Central Living Pulsing Heart */}
            <div className="flex flex-col items-center justify-center px-1">
              <div className="relative flex items-center justify-center">
                <motion.div
                  animate={{ scale: [1, 1.15, 1] }}
                  transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
                  className="w-11 h-11 sm:w-13 sm:h-13 rounded-full bg-rose-500/10 border border-rose-200/80 flex items-center justify-center shadow-xs"
                >
                  <Heart className="w-5 h-5 sm:w-6 sm:h-6 text-rose-500 fill-rose-500 drop-shadow-xs" />
                </motion.div>
                <div className="absolute -inset-1 border border-rose-300/40 rounded-full animate-ping opacity-30 pointer-events-none" />
              </div>
            </div>

            {/* Partner 2 */}
            <motion.div
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onOpenProfileModal && onOpenProfileModal('p2')}
              className="flex flex-col items-center cursor-pointer group"
              title={`Profil de ${profile.partner2.name}`}
              id="hero-avatar-p2"
            >
              <div className="relative p-1 rounded-full bg-gradient-to-tr from-sky-400 via-sky-300 to-indigo-300 shadow-xs ring-2 ring-white">
                <PartnerAvatar
                  name={profile.partner2.name}
                  avatar={profile.partner2.avatar}
                  partnerId="p2"
                  size="xl"
                  className="border-2 border-white"
                />
                {activePartnerId === 'p2' && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-2 py-0.2 rounded-full bg-sky-600 text-white text-[9px] font-bold shadow-xs">
                    Moi
                  </span>
                )}
              </div>
              <span className="mt-1.5 text-sm font-semibold text-stone-800 tracking-tight">
                {profile.partner2.name}
              </span>
              <span className="text-[11px] text-sky-600 font-medium">
                {profile.partner2.mood?.status || 'Amoureux'}
              </span>
            </motion.div>
          </div>

          {/* Days Together Milestone */}
          <div className="mt-3 text-center">
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

          {/* Toast feedback when sending love pulse */}
          <AnimatePresence>
            {pulseFeedback && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.95 }}
                className="mt-2.5 px-3.5 py-1.5 rounded-full bg-rose-600 text-white text-xs font-semibold shadow-md flex items-center gap-1.5"
              >
                <Heart className="w-3.5 h-3.5 fill-white animate-bounce" />
                <span>{pulseFeedback} envoyé à {otherPartner.name} !</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Quick "Ondes d'Amour" Instant Buttons */}
          <div className="mt-4 w-full max-w-md">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {QUICK_PULSES.map((pulse) => (
                <motion.button
                  key={pulse.vibe}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleSendPulse(pulse.vibe, pulse.message, pulse.label)}
                  className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-white/90 border border-stone-200/80 shadow-2xs text-xs font-semibold text-stone-700 transition-all cursor-pointer ${pulse.tagColor}`}
                  title={pulse.message}
                >
                  <span className="text-sm">{pulse.icon}</span>
                  <span className="truncate">{pulse.label}</span>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Active profile switch indicator */}
          <div className="mt-3 pt-2.5 border-t border-stone-200/60 w-full flex items-center justify-center gap-2 text-xs text-stone-500">
            <span>Connecté(e) en tant que <strong className="text-stone-800">{currentPartner.name}</strong></span>
            <span className="text-stone-300">•</span>
            <button
              onClick={() => onSwitchPartner(activePartnerId === 'p1' ? 'p2' : 'p1')}
              className="text-rose-600 font-semibold hover:underline cursor-pointer transition-colors"
            >
              Passer à {otherPartner.name}
            </button>
          </div>
        </div>
      </motion.section>

      {/* ========================================================
          2. LES 4 PILIERS DU NID (NAVIGATION SIMPLE & ÉLÉGANTE)
         ======================================================== */}
      <section aria-label="Espaces du couple" className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          {/* Card 1: Salon de Chat Intime */}
          <motion.div
            whileHover={{ y: -3 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => onNavigateToTab('chat')}
            className="group p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-white to-rose-50/30 border border-stone-200/80 shadow-xs hover:border-rose-300 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
            id="card-nav-chat"
          >
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <div className="w-9 h-9 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 group-hover:scale-105 transition-transform">
                  <MessageCircle className="w-4.5 h-4.5" />
                </div>
                {unreadCount > 0 ? (
                  <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-bold shadow-xs animate-pulse">
                    {unreadCount} nouveau{unreadCount > 1 ? 'x' : ''}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    En direct
                  </span>
                )}
              </div>

              <h4 className="text-sm sm:text-base font-bold text-stone-800 group-hover:text-rose-600 transition-colors">
                Chat Privé & Vocaux
              </h4>
              <p className="text-xs text-stone-500 mt-0.5">
                Messages instantanés, vocaux et photos en duo.
              </p>

              {/* Latest message preview */}
              <div className="mt-2.5 p-2.5 rounded-xl bg-stone-50/80 border border-stone-100 text-xs text-stone-600">
                {latestMessage ? (
                  <p className="truncate">
                    <span className="font-semibold text-stone-700">
                      {latestMessage.senderId === activePartnerId ? 'Toi : ' : `${otherPartner.name} : `}
                    </span>
                    {latestMessage.type === 'audio'
                      ? '🎤 Note vocale'
                      : latestMessage.type === 'image'
                      ? '📷 Photo'
                      : latestMessage.text}
                  </p>
                ) : (
                  <p className="text-stone-400 italic">Votre salon secret vous attend...</p>
                )}
              </div>
            </div>

            <div className="mt-3 pt-2.5 border-t border-stone-100 flex items-center justify-between text-xs font-semibold text-rose-600">
              <span>Ouvrir le chat</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </motion.div>

          {/* Card 2: Salon des Jeux & Flirt */}
          <motion.div
            whileHover={{ y: -3 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => onNavigateToTab('games')}
            className="group p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-white to-amber-50/30 border border-stone-200/80 shadow-xs hover:border-amber-300 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
            id="card-nav-games"
          >
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <div className="w-9 h-9 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-700 group-hover:scale-105 transition-transform">
                  <Gamepad2 className="w-4.5 h-4.5" />
                </div>
                <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold">
                  Jeux & Flirt
                </span>
              </div>

              <h4 className="text-sm sm:text-base font-bold text-stone-800 group-hover:text-amber-700 transition-colors">
                Jeux & Défis Complices
              </h4>
              <p className="text-xs text-stone-500 mt-0.5">
                Roue des gages, cartes vérité, blind tests & quiz couple.
              </p>

              <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                <span className="px-2 py-0.5 rounded-lg bg-amber-50/70 text-[10px] font-medium text-amber-800 border border-amber-100">
                  🎡 Roue des gages
                </span>
                <span className="px-2 py-0.5 rounded-lg bg-rose-50/70 text-[10px] font-medium text-rose-700 border border-rose-100">
                  🃏 Cartes intimes
                </span>
                <span className="px-2 py-0.5 rounded-lg bg-indigo-50/70 text-[10px] font-medium text-indigo-700 border border-indigo-100">
                  🎵 Blind Test
                </span>
              </div>
            </div>

            <div className="mt-3 pt-2.5 border-t border-stone-100 flex items-center justify-between text-xs font-semibold text-amber-700">
              <span>Jouer ensemble</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </motion.div>

          {/* Card 3: Défi Anglais du Jour */}
          {activeWeeklyChallenge && (
            <motion.div
              whileHover={{ y: -3 }}
              className="p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-white to-violet-50/30 border border-stone-200/80 shadow-xs hover:border-violet-300 hover:shadow-md transition-all flex flex-col justify-between"
              id="card-nav-english"
            >
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <div className="w-9 h-9 rounded-2xl bg-violet-50 border border-violet-100 flex items-center justify-center text-violet-700">
                    <Sparkle className="w-4.5 h-4.5" />
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-violet-50 text-violet-700 border border-violet-200 text-[10px] font-bold">
                    Anglais Romantique
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <h4 className="text-sm sm:text-base font-bold text-stone-800">
                    « {activeWeeklyChallenge.targetEnglish} »
                  </h4>
                  <button
                    onClick={() => handlePlayPronunciation(activeWeeklyChallenge.targetEnglish)}
                    className={`p-1.5 rounded-full bg-violet-50 hover:bg-violet-100 text-violet-700 transition-colors cursor-pointer ${
                      isPlayingAudio ? 'scale-110 text-violet-900 animate-pulse' : ''
                    }`}
                    title="Écouter la prononciation audio"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                </div>

                <p className="text-xs font-semibold text-violet-700 mt-1">
                  {activeWeeklyChallenge.targetFrench}
                </p>
              </div>

              <div className="mt-3 pt-2.5 border-t border-stone-100 flex items-center gap-2">
                <button
                  onClick={() => handleLaunchChallengeInChat(activeWeeklyChallenge)}
                  className="flex-1 py-1.5 px-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Dire dans le chat</span>
                </button>
                <button
                  onClick={() => {
                    if (onNavigateToGame) onNavigateToGame('weekly_challenges');
                    else onNavigateToTab('games');
                  }}
                  className="py-1.5 px-3 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Lexique
                </button>
              </div>
            </motion.div>
          )}

          {/* Card 4: Notre Galerie Partagée */}
          <motion.div
            whileHover={{ y: -3 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => onNavigateToTab('gallery')}
            className="group p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-white to-pink-50/30 border border-stone-200/80 shadow-xs hover:border-pink-300 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
            id="card-nav-gallery"
          >
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <div className="w-9 h-9 rounded-2xl bg-pink-50 border border-pink-100 flex items-center justify-center text-pink-600 group-hover:scale-105 transition-transform">
                  <Images className="w-4.5 h-4.5" />
                </div>
                <span className="px-2 py-0.5 rounded-full bg-pink-50 text-pink-700 border border-pink-200 text-[10px] font-bold">
                  Photos & Vidéos
                </span>
              </div>

              <h4 className="text-sm sm:text-base font-bold text-stone-800 group-hover:text-pink-600 transition-colors">
                Galerie & Album Duo
              </h4>
              <p className="text-xs text-stone-500 mt-0.5">
                Tous vos souvenirs immortalisés en duo.
              </p>

              {/* Photo preview avatars */}
              <div className="mt-2.5 flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg overflow-hidden bg-stone-100 border border-stone-200 shadow-2xs">
                  <img
                    src={profile.partner1.avatar || 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&auto=format&fit=crop&q=80'}
                    alt={profile.partner1.name}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="w-8 h-8 rounded-lg overflow-hidden bg-stone-100 border border-stone-200 shadow-2xs">
                  <img
                    src={profile.partner2.avatar || 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=300&auto=format&fit=crop&q=80'}
                    alt={profile.partner2.name}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <span className="text-[11px] text-pink-600 font-semibold bg-pink-50 px-2 py-1 rounded-lg border border-pink-100">
                  Album partagé
                </span>
              </div>
            </div>

            <div className="mt-3 pt-2.5 border-t border-stone-100 flex items-center justify-between text-xs font-semibold text-pink-600">
              <span>Voir l’album</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </motion.div>
        </div>
      </section>

      {/* ========================================================
          3. MOTS DOUX & MÉTÉO DU CŒUR (INTIMITÉ & TENDRESSE)
         ======================================================== */}
      <section className="grid grid-cols-1 md:grid-cols-12 gap-3.5 sm:gap-4">
        {/* Le Billet Doux (7 cols) */}
        <motion.div
          whileHover={{ y: -2 }}
          className="md:col-span-7 rounded-3xl bg-gradient-to-br from-[#FFFDF9] via-[#FAF5EE] to-[#F5EFE6] border border-amber-200/80 p-4 sm:p-5 shadow-xs flex flex-col justify-between"
          id="section-billet-doux"
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-100/80 border border-amber-200/80 flex items-center justify-center text-amber-800">
                  <Feather className="w-3.5 h-3.5" />
                </div>
                <h4 className="text-xs sm:text-sm font-bold text-stone-800">Billet Doux du Jour</h4>
              </div>
              <span className="text-[11px] font-serif italic text-amber-800/80">Pensée d’amour</span>
            </div>

            <div className="my-2 p-3.5 rounded-2xl bg-white/85 backdrop-blur-xs border border-amber-200/50 shadow-2xs relative">
              <Quote className="w-4 h-4 text-amber-300 absolute top-2 right-2 opacity-50" />
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
                  « Tu es la plus belle chose qui me soit arrivée. Je t’aime un peu plus chaque seconde. »
                </p>
              )}
            </div>
          </div>

          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={onOpenWriteNoteModal}
            className="w-full mt-2 flex items-center justify-center gap-2 py-2 rounded-xl bg-gradient-to-r from-amber-700 to-amber-800 hover:from-amber-800 hover:to-amber-900 text-white text-xs font-semibold shadow-2xs transition-all cursor-pointer"
            id="btn-home-write-note"
          >
            <Feather className="w-3.5 h-3.5 text-amber-200" />
            <span>Écrire un mot doux</span>
          </motion.button>
        </motion.div>

        {/* Météo du Cœur (5 cols) */}
        <motion.div
          whileHover={{ y: -2 }}
          className="md:col-span-5 rounded-3xl bg-white border border-stone-200/80 p-4 sm:p-5 shadow-xs flex flex-col justify-between"
          id="section-meteo-du-coeur"
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-pink-50 border border-pink-100 flex items-center justify-center text-pink-600">
                  <Smile className="w-3.5 h-3.5" />
                </div>
                <h4 className="text-xs sm:text-sm font-bold text-stone-800">Météo du Cœur</h4>
              </div>
              <span className="text-[11px] text-stone-400 font-medium">Humeurs</span>
            </div>

            <div className="space-y-2 my-2">
              {/* Partner 1 Mood */}
              <div className="p-2 rounded-xl bg-stone-50 border border-stone-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <PartnerAvatar
                    name={profile.partner1.name}
                    avatar={profile.partner1.avatar}
                    partnerId="p1"
                    size="sm"
                  />
                  <div>
                    <p className="text-xs font-bold text-stone-800">{profile.partner1.name}</p>
                    <p className="text-[11px] text-rose-600 font-medium">
                      {profile.partner1.mood?.status || 'Rayonnante'}
                    </p>
                  </div>
                </div>
                <span className="text-[10px] text-stone-600 bg-white px-2 py-0.5 rounded-md border border-stone-200">
                  {profile.partner1.mood?.need || 'Câlin'}
                </span>
              </div>

              {/* Partner 2 Mood */}
              <div className="p-2 rounded-xl bg-stone-50 border border-stone-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <PartnerAvatar
                    name={profile.partner2.name}
                    avatar={profile.partner2.avatar}
                    partnerId="p2"
                    size="sm"
                  />
                  <div>
                    <p className="text-xs font-bold text-stone-800">{profile.partner2.name}</p>
                    <p className="text-[11px] text-sky-600 font-medium">
                      {profile.partner2.mood?.status || 'Amoureux'}
                    </p>
                  </div>
                </div>
                <span className="text-[10px] text-stone-600 bg-white px-2 py-0.5 rounded-md border border-stone-200">
                  {profile.partner2.mood?.need || 'Te voir'}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={() => onOpenProfileModal && onOpenProfileModal(activePartnerId)}
            className="w-full mt-2 py-1.5 text-center text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50/70 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
          >
            Changer mon humeur
          </button>
        </motion.div>
      </section>

      {/* Romantic Footer Note */}
      <div className="text-center py-2">
        <p className="font-serif italic text-xs text-stone-400">
          « Aimer, ce n’est pas se regarder l’un l’autre, c’est regarder ensemble dans la même direction. »
        </p>
      </div>
    </div>
  );
};
