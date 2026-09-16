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
  Gift,
  Clock,
  Flame,
  Send,
  Camera,
  Layers,
  Smile,
  ShieldCheck,
  CheckCircle2,
  Dices,
  Sparkle,
  Feather,
  Quote,
  Star,
  ChevronRight,
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
import { triggerHeartConfetti, triggerCelebrationConfetti } from '../../lib/confetti';
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
  lexicon = [],
  weeklyChallenges = [],
  onOpenChatWithDraft,
  onOpenProfileModal,
}) => {
  const currentPartner = activePartnerId === 'p1' ? profile.partner1 : profile.partner2;
  const otherPartner = activePartnerId === 'p1' ? profile.partner2 : profile.partner1;

  const [activePulseMenu, setActivePulseMenu] = useState(false);
  const [pulseSentFeedback, setPulseSentFeedback] = useState<string | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  // Calculate days together
  const daysTogether = Math.max(
    1,
    Math.floor(
      (new Date().getTime() - new Date(profile.anniversaryDate).getTime()) /
        (1000 * 60 * 60 * 24)
    )
  );

  // Formatted anniversary date
  const formattedAnniversary = new Date(profile.anniversaryDate).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  // Latest message received from partner
  const latestMessage = messages.length > 0 ? messages[messages.length - 1] : null;
  const unreadMessagesCount = messages.filter(
    (m) => m.senderId !== activePartnerId && !m.readStatus
  ).length;

  // Latest sweet note
  const latestNote = notes.length > 0 ? notes[notes.length - 1] : null;

  // Active weekly challenge
  const activeWeeklyChallenge =
    weeklyChallenges.find((c) => c.isActive) ||
    weeklyChallenges[0] ||
    null;

  // Active unredeemed vouchers
  const unredeemedVouchers = vouchers.filter((v) => !v.isRedeemed);

  const handlePulseAction = (vibe: MissYouPulse['vibe'], message: string, label: string) => {
    soundEffects.playHeartPulse();
    triggerHeartConfetti();
    triggerVibration([100, 50, 100]);
    onSendMissYou(vibe, message);
    setPulseSentFeedback(label);
    setActivePulseMenu(false);
    setTimeout(() => {
      setPulseSentFeedback(null);
    }, 2800);
  };

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

  const handleLaunchChallengeInChat = (challenge: WeeklyLearningChallenge) => {
    soundEffects.playSoftTap();
    const draft = `🇬🇧 Défi Anglais du Cœur : "${challenge.targetEnglish}" (${challenge.targetFrench}) — À toi de me le dire ou me répondre ! ✨`;
    if (onOpenChatWithDraft) {
      onOpenChatWithDraft(draft);
    } else {
      onNavigateToTab('chat');
    }
  };

  const handleLaunchGame = (gameTab: EnglishGameTab) => {
    soundEffects.playSoftTap();
    if (onNavigateToGame) {
      onNavigateToGame(gameTab);
    } else {
      onNavigateToTab('games');
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-6 py-4 sm:py-8 space-y-6 sm:space-y-8 animate-fadeIn">
      {/* 1. Haute Couture Hero Banner */}
      <section
        aria-label="Accueil couple"
        className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-[#FFFDFB] via-[#FAF6F2] to-[#F5EFEB] border border-stone-200/80 shadow-[0_10px_35px_rgba(0,0,0,0.03)] p-5 sm:p-8"
      >
        {/* Subtle decorative background watermarks */}
        <div className="absolute -top-16 -right-16 w-64 h-64 bg-rose-200/25 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-64 h-64 bg-amber-200/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center text-center">
          {/* Top refined badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/80 border border-stone-200/70 text-[11px] font-medium text-stone-600 shadow-2xs mb-4">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span className="tracking-wide uppercase font-serif text-[10px] text-stone-700">
              Espace Intime & Exclusif
            </span>
            <span className="text-stone-300">•</span>
            <span className="text-rose-600 font-semibold">{profile.relationshipTitle}</span>
          </div>

          {/* Couple Avatars with romantic animated heart bridge */}
          <div className="flex items-center justify-center gap-4 sm:gap-6 my-2">
            {/* Partner 1 */}
            <div
              onClick={() => onOpenProfileModal && onOpenProfileModal('p1')}
              className="flex flex-col items-center group cursor-pointer"
              title={`Voir le profil de ${profile.partner1.name}`}
            >
              <div className="relative p-1 rounded-full bg-gradient-to-tr from-rose-300 to-amber-200 shadow-sm transition-transform group-hover:scale-105 duration-300">
                <PartnerAvatar
                  name={profile.partner1.name}
                  avatar={profile.partner1.avatar}
                  partnerId="p1"
                  size="xl"
                  className="border-2 border-white"
                />
                {activePartnerId === 'p1' && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-rose-500 text-white text-[9px] font-bold shadow-2xs">
                    Moi
                  </span>
                )}
              </div>
              <span className="mt-2 text-xs sm:text-sm font-semibold text-stone-800 tracking-tight">
                {profile.partner1.name}
              </span>
              <span className="text-[10px] text-stone-500 max-w-[90px] truncate">
                {profile.partner1.mood?.status || 'Rayonnante'}
              </span>
            </div>

            {/* Central Animated Heart Pulse */}
            <div className="flex flex-col items-center justify-center px-1">
              <div className="relative flex items-center justify-center">
                <motion.div
                  animate={{ scale: [1, 1.15, 1] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-rose-500/10 flex items-center justify-center"
                >
                  <Heart className="w-5 h-5 sm:w-6 sm:h-6 text-rose-500 fill-rose-500 drop-shadow-xs" />
                </motion.div>
                <div className="absolute -inset-1 border border-rose-300/40 rounded-full animate-ping opacity-30 pointer-events-none" />
              </div>
              <span className="text-[10px] font-mono text-rose-400 mt-1 font-semibold tracking-wider">
                DUO
              </span>
            </div>

            {/* Partner 2 */}
            <div
              onClick={() => onOpenProfileModal && onOpenProfileModal('p2')}
              className="flex flex-col items-center group cursor-pointer"
              title={`Voir le profil de ${profile.partner2.name}`}
            >
              <div className="relative p-1 rounded-full bg-gradient-to-tr from-sky-300 to-indigo-200 shadow-sm transition-transform group-hover:scale-105 duration-300">
                <PartnerAvatar
                  name={profile.partner2.name}
                  avatar={profile.partner2.avatar}
                  partnerId="p2"
                  size="xl"
                  className="border-2 border-white"
                />
                {activePartnerId === 'p2' && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-sky-600 text-white text-[9px] font-bold shadow-2xs">
                    Moi
                  </span>
                )}
              </div>
              <span className="mt-2 text-xs sm:text-sm font-semibold text-stone-800 tracking-tight">
                {profile.partner2.name}
              </span>
              <span className="text-[10px] text-stone-500 max-w-[90px] truncate">
                {profile.partner2.mood?.status || 'Amoureux'}
              </span>
            </div>
          </div>

          {/* Days Together Milestone Counter */}
          <div className="mt-4 sm:mt-5 text-center">
            <h2 className="font-serif text-2xl sm:text-4xl font-bold tracking-tight text-stone-800">
              <span className="text-rose-600">{daysTogether.toLocaleString('fr-FR')}</span> jours d'amour
            </h2>
            <p className="text-xs sm:text-sm text-stone-500 font-medium mt-1">
              Depuis notre premier jour ensemble le <span className="text-stone-700 font-semibold">{formattedAnniversary}</span>
            </p>
          </div>

          {/* Feedback message for pulse */}
          <AnimatePresence>
            {pulseSentFeedback && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                className="mt-3 px-4 py-1.5 rounded-full bg-rose-600 text-white text-xs font-semibold shadow-md flex items-center gap-1.5"
              >
                <Heart className="w-3.5 h-3.5 fill-white animate-bounce" />
                <span>{pulseSentFeedback} envoyé à {otherPartner.name} !</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Primary Quick Actions Bar (Miss you pulse & Partner Switcher) */}
          <div className="mt-5 sm:mt-6 flex flex-wrap items-center justify-center gap-2.5 sm:gap-3.5">
            {/* Quick Pulse Menu Button */}
            <div className="relative">
              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={() => setActivePulseMenu(!activePulseMenu)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white text-xs sm:text-sm font-semibold shadow-xs hover:shadow-md transition-all cursor-pointer"
                id="btn-home-send-pulse"
              >
                <Heart className="w-4 h-4 fill-white animate-pulse" />
                <span>Envoyer une onde à {otherPartner.name}</span>
                <Sparkles className="w-3.5 h-3.5 text-rose-200" />
              </motion.button>

              {/* Pulse Menu Popover */}
              <AnimatePresence>
                {activePulseMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.96 }}
                    className="absolute left-1/2 -translate-x-1/2 sm:left-0 sm:translate-x-0 mt-2 w-64 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-stone-200/80 p-2.5 z-40 text-left"
                  >
                    <div className="px-2 py-1 text-[11px] font-semibold text-stone-500 uppercase tracking-wider">
                      Onde d'amour instantanée
                    </div>
                    <div className="grid grid-cols-1 gap-1 mt-1">
                      <button
                        onClick={() =>
                          handlePulseAction('hug', 'Gros câlin télépathique tout doux 🧸', 'Câlin télépathique')
                        }
                        className="w-full flex items-center gap-2.5 p-2 rounded-xl text-xs hover:bg-rose-50 transition-colors text-stone-800 text-left cursor-pointer"
                      >
                        <span className="text-lg">🧸</span>
                        <div>
                          <p className="font-semibold text-stone-800">Câlin télépathique</p>
                          <p className="text-[10px] text-stone-500">Douce étreinte à distance</p>
                        </div>
                      </button>
                      <button
                        onClick={() =>
                          handlePulseAction('kiss', 'Pluie de doux baisers sur tes joues 💋', 'Doux baisers')
                        }
                        className="w-full flex items-center gap-2.5 p-2 rounded-xl text-xs hover:bg-rose-50 transition-colors text-stone-800 text-left cursor-pointer"
                      >
                        <span className="text-lg">💋</span>
                        <div>
                          <p className="font-semibold text-stone-800">Pluie de baisers</p>
                          <p className="text-[10px] text-stone-500">Pour te faire sourire</p>
                        </div>
                      </button>
                      <button
                        onClick={() =>
                          handlePulseAction('flame', 'Petite flamme passionnée qui crépite pour toi 🔥', 'Flamme complice')
                        }
                        className="w-full flex items-center gap-2.5 p-2 rounded-xl text-xs hover:bg-rose-50 transition-colors text-stone-800 text-left cursor-pointer"
                      >
                        <span className="text-lg">🔥</span>
                        <div>
                          <p className="font-semibold text-stone-800">Flamme complice</p>
                          <p className="text-[10px] text-stone-500">Pensée coquine & passionnée</p>
                        </div>
                      </button>
                      <button
                        onClick={() =>
                          handlePulseAction('thought', 'Une grosse pensée magique pour toi en ce moment ✨', 'Pensée magique')
                        }
                        className="w-full flex items-center gap-2.5 p-2 rounded-xl text-xs hover:bg-rose-50 transition-colors text-stone-800 text-left cursor-pointer"
                      >
                        <span className="text-lg">✨</span>
                        <div>
                          <p className="font-semibold text-stone-800">Pensée magique</p>
                          <p className="text-[10px] text-stone-500">Hâte de te serrer dans mes bras</p>
                        </div>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Quick Switch Partner Toggle */}
            <div className="inline-flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-white/85 border border-stone-200/70 text-xs font-semibold text-stone-600 shadow-2xs">
              <span className="text-[11px] text-stone-500">Connecté en tant que</span>
              <button
                onClick={() => onSwitchPartner(activePartnerId === 'p1' ? 'p2' : 'p1')}
                className="font-bold text-rose-600 hover:text-rose-700 underline decoration-rose-300 underline-offset-2 cursor-pointer transition-colors"
                title="Basculer vers l'autre partenaire"
              >
                {currentPartner.name}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Bento Grid: Chat Intime & Mot Doux du Jour */}
      <section className="grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-6">
        {/* Salon Privé (Chat Direct Preview) - 6 cols */}
        <div className="md:col-span-6 flex flex-col justify-between rounded-3xl bg-white/90 border border-stone-200/70 p-5 sm:p-6 shadow-xs hover:border-rose-200 transition-all">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600">
                  <MessageCircle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-stone-800">Salon de Chat Intime</h3>
                  <p className="text-[11px] text-stone-500">Messages, vocaux & photos en direct</p>
                </div>
              </div>
              {unreadMessagesCount > 0 ? (
                <span className="px-2.5 py-0.5 rounded-full bg-rose-500 text-white text-[11px] font-bold shadow-2xs animate-pulse">
                  {unreadMessagesCount} nouveau{unreadMessagesCount > 1 ? 'x' : ''}
                </span>
              ) : (
                <span className="flex items-center gap-1 text-[11px] text-emerald-600 font-medium bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Synchronisé
                </span>
              )}
            </div>

            {/* Last message preview bubble */}
            <div className="my-3 p-3.5 rounded-2xl bg-stone-50/80 border border-stone-100">
              {latestMessage ? (
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px] text-stone-500">
                    <span className="font-semibold text-stone-700">
                      {latestMessage.senderId === activePartnerId
                        ? 'Toi'
                        : otherPartner.name}
                    </span>
                    <span className="text-[10px]">
                      {new Date(latestMessage.timestamp).toLocaleTimeString('fr-FR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <p className="text-xs text-stone-700 line-clamp-2 italic">
                    {latestMessage.type === 'audio'
                      ? '🎤 [Message vocal enregistré]'
                      : latestMessage.type === 'image'
                      ? '📷 [Photo partagée]'
                      : `"${latestMessage.text}"`}
                  </p>
                </div>
              ) : (
                <p className="text-xs text-stone-500 italic text-center py-1">
                  Votre salon secret vous attend. Envoyez un mot doux pour débuter la journée...
                </p>
              )}
            </div>
          </div>

          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => onNavigateToTab('chat')}
            className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-stone-900 hover:bg-black text-white text-xs font-semibold shadow-xs hover:shadow-sm transition-all cursor-pointer group"
            id="btn-home-open-chat"
          >
            <span>Rejoindre la conversation</span>
            <ArrowRight className="w-3.5 h-3.5 text-stone-400 group-hover:translate-x-0.5 transition-transform" />
          </motion.button>
        </div>

        {/* Le Billet Doux en Vedette - 6 cols */}
        <div className="md:col-span-6 flex flex-col justify-between rounded-3xl bg-gradient-to-br from-[#FFFDF9] via-[#FAF4ED] to-[#F7EFE5] border border-amber-200/60 p-5 sm:p-6 shadow-xs">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-100/70 border border-amber-200/60 flex items-center justify-center text-amber-800">
                  <Feather className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-stone-800">Billet Doux & Pensée Secrète</h3>
                  <p className="text-[11px] text-stone-500">Mots d'amour pour réchauffer le cœur</p>
                </div>
              </div>
              <span className="text-amber-700 font-serif italic text-xs">Parfum d'amour</span>
            </div>

            {/* Note display */}
            <div className="my-3 p-4 rounded-2xl bg-white/70 backdrop-blur-xs border border-amber-200/50 shadow-2xs relative">
              <Quote className="w-4 h-4 text-amber-300 absolute top-2 right-2 opacity-50" />
              {latestNote ? (
                <div>
                  <p className="font-['Caveat',cursive] text-base sm:text-lg text-stone-800 leading-snug line-clamp-3">
                    « {latestNote.content} »
                  </p>
                  <p className="text-[10px] text-amber-800/80 font-medium text-right mt-2">
                    De {latestNote.senderId === 'p1' ? profile.partner1.name : profile.partner2.name} •{' '}
                    {new Date(latestNote.date).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'short',
                    })}
                  </p>
                </div>
              ) : (
                <p className="font-['Caveat',cursive] text-base sm:text-lg text-stone-600 italic text-center py-1">
                  « Tu es la plus belle chose qui me soit arrivée. Je t'aime un peu plus chaque seconde. »
                </p>
              )}
            </div>
          </div>

          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={onOpenWriteNoteModal}
            className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white text-xs font-semibold shadow-xs hover:shadow-sm transition-all cursor-pointer group"
            id="btn-home-write-note"
          >
            <Feather className="w-3.5 h-3.5 text-amber-200" />
            <span>Laisser un mot doux à {otherPartner.name}</span>
          </motion.button>
        </div>
      </section>

      {/* 3. Défi Anglais en Amoureux (English Learning Highlight) */}
      {activeWeeklyChallenge && (
        <section
          aria-label="Défi anglais en duo"
          className="rounded-3xl bg-gradient-to-r from-stone-900 via-stone-800 to-rose-950 text-white p-5 sm:p-7 shadow-md relative overflow-hidden"
        >
          <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-rose-500/10 to-transparent pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div className="space-y-2 max-w-xl">
              <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-rose-500/20 border border-rose-400/30 text-rose-300 text-[10px] font-bold uppercase tracking-wider">
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>Défi Anglais de la Semaine</span>
                <span>•</span>
                <span>Semaine {activeWeeklyChallenge.weekNumber}</span>
              </div>

              <h3 className="font-serif text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                <span>« {activeWeeklyChallenge.targetEnglish} »</span>
                <button
                  onClick={() => handlePlayPronunciation(activeWeeklyChallenge.targetEnglish)}
                  className={`p-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-rose-300 cursor-pointer ${
                    isPlayingAudio ? 'scale-110 text-amber-300 animate-pulse' : ''
                  }`}
                  title="Écouter la prononciation anglaise"
                >
                  <Volume2 className="w-4 h-4" />
                </button>
              </h3>

              <p className="text-xs text-stone-300">
                <span className="text-amber-300 font-semibold">{activeWeeklyChallenge.targetFrench}</span>
                {activeWeeklyChallenge.phonetic && (
                  <>
                    <span className="mx-2 text-stone-500">•</span>
                    <span className="italic text-stone-400">/{activeWeeklyChallenge.phonetic}/</span>
                  </>
                )}
              </p>

              <p className="text-xs text-stone-400">
                {activeWeeklyChallenge.tips || activeWeeklyChallenge.description}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row md:flex-col gap-2 shrink-0">
              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={() => handleLaunchChallengeInChat(activeWeeklyChallenge)}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                id="btn-home-english-challenge-chat"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Lancer dans le chat</span>
              </motion.button>

              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={() => handleLaunchGame('weekly_challenges')}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-stone-200 hover:text-white text-xs font-semibold border border-white/10 transition-colors cursor-pointer"
                id="btn-home-english-all-challenges"
              >
                <Gamepad2 className="w-4 h-4 text-rose-300" />
                <span>Voir tous les défis</span>
              </motion.button>
            </div>
          </div>
        </section>
      )}

      {/* 4. Le Salon des 5 Jeux & Flirt en Duo */}
      <section aria-label="Salon des jeux duo" className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-serif text-xl sm:text-2xl font-bold tracking-tight text-stone-800">
              Salon des Jeux & Flirt
            </h2>
            <p className="text-xs text-stone-500">
              5 expériences exclusives pour pimenter votre complicité à deux
            </p>
          </div>
          <button
            onClick={() => onNavigateToTab('games')}
            className="flex items-center gap-1 text-xs font-semibold text-rose-600 hover:text-rose-700 cursor-pointer"
          >
            <span>Explorer tout</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
          {/* Game 1: Roue des Gages */}
          <motion.div
            whileHover={{ y: -3 }}
            onClick={() => handleLaunchGame('roulette')}
            className="p-4 rounded-2xl bg-white border border-stone-200/70 shadow-xs hover:shadow-sm hover:border-rose-300 transition-all cursor-pointer flex flex-col justify-between group"
            id="card-game-roulette"
          >
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-2xl">🎡</span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 border border-rose-100">
                  Gages & Bisous
                </span>
              </div>
              <h3 className="text-sm font-bold text-stone-800 group-hover:text-rose-600 transition-colors">
                La Roue des Gages Amoureux
              </h3>
              <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                Tournez la roue interactive et accomplissez des gages romantiques, coquins ou complices à deux.
              </p>
            </div>
            <div className="mt-3 pt-2.5 border-t border-stone-100 flex items-center justify-between text-xs font-semibold text-rose-600">
              <span>Tourner la roue</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </motion.div>

          {/* Game 2: Cartes Flirt & Vérité */}
          <motion.div
            whileHover={{ y: -3 }}
            onClick={() => handleLaunchGame('cards')}
            className="p-4 rounded-2xl bg-white border border-stone-200/70 shadow-xs hover:shadow-sm hover:border-amber-300 transition-all cursor-pointer flex flex-col justify-between group"
            id="card-game-flirt-cards"
          >
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-2xl">🃏</span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-100">
                  Confidences
                </span>
              </div>
              <h3 className="text-sm font-bold text-stone-800 group-hover:text-amber-700 transition-colors">
                Cartes Flirt & Vérités
              </h3>
              <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                24 cartes de questions intimes, défis et vérités secrètes pour se redécouvrir sans filtre.
              </p>
            </div>
            <div className="mt-3 pt-2.5 border-t border-stone-100 flex items-center justify-between text-xs font-semibold text-amber-700">
              <span>Tirer une carte</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </motion.div>

          {/* Game 3: Love Blind Test */}
          <motion.div
            whileHover={{ y: -3 }}
            onClick={() => handleLaunchGame('trivia')}
            className="p-4 rounded-2xl bg-white border border-stone-200/70 shadow-xs hover:shadow-sm hover:border-sky-300 transition-all cursor-pointer flex flex-col justify-between group"
            id="card-game-blind-test"
          >
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-2xl">🎵</span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-100">
                  Quiz Couple
                </span>
              </div>
              <h3 className="text-sm font-bold text-stone-800 group-hover:text-sky-700 transition-colors">
                Love Blind Test & Quiz
              </h3>
              <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                Testez vos connaissances mutuelles : qui embrasse le mieux ? qui a dit je t'aime en premier ?
              </p>
            </div>
            <div className="mt-3 pt-2.5 border-t border-stone-100 flex items-center justify-between text-xs font-semibold text-sky-700">
              <span>Lancer le quiz</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </motion.div>

          {/* Game 4: Jeu de Rôle Romantique */}
          <motion.div
            whileHover={{ y: -3 }}
            onClick={() => handleLaunchGame('roleplay')}
            className="p-4 rounded-2xl bg-white border border-stone-200/70 shadow-xs hover:shadow-sm hover:border-purple-300 transition-all cursor-pointer flex flex-col justify-between group"
            id="card-game-roleplay"
          >
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-2xl">🎭</span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-100">
                  Improvisation
                </span>
              </div>
              <h3 className="text-sm font-bold text-stone-800 group-hover:text-purple-700 transition-colors">
                Jeu de Rôle Romantique
              </h3>
              <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                Incarnez des personnages et inventez des scénarios de drague et de séduction inédits.
              </p>
            </div>
            <div className="mt-3 pt-2.5 border-t border-stone-100 flex items-center justify-between text-xs font-semibold text-purple-700">
              <span>Commencer un scénario</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </motion.div>

          {/* Game 5: Bons pour Privilèges */}
          <motion.div
            whileHover={{ y: -3 }}
            onClick={() => handleLaunchGame('vouchers')}
            className="p-4 rounded-2xl bg-white border border-stone-200/70 shadow-xs hover:shadow-sm hover:border-emerald-300 transition-all cursor-pointer flex flex-col justify-between group sm:col-span-2 lg:col-span-2"
            id="card-game-vouchers"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">🎟️</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
                    {unredeemedVouchers.length} bon{unredeemedVouchers.length > 1 ? 's' : ''} disponible{unredeemedVouchers.length > 1 ? 's' : ''}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-stone-800 group-hover:text-emerald-700 transition-colors">
                  Bons Cadeaux d'Amour & Privilèges
                </h3>
                <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                  Bons pour un massage relaxant, un petit-déjeuner au lit ou une grasse matinée royale à réclamer quand vous voulez !
                </p>
              </div>
              <div className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-semibold">
                <span>Voir nos bons</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 5. Galerie Duo & Météo du Cœur */}
      <section className="grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-6">
        {/* Galerie Duo preview - 7 cols */}
        <div className="md:col-span-7 rounded-3xl bg-white/90 border border-stone-200/70 p-5 sm:p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600">
                  <Images className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-stone-800">Notre Galerie Duo</h3>
                  <p className="text-[11px] text-stone-500">Nos plus beaux instants en tête-à-tête</p>
                </div>
              </div>
              <button
                onClick={() => onNavigateToTab('gallery')}
                className="text-xs font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1 cursor-pointer"
              >
                <span>Voir la galerie</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Visual Polaroid preview */}
            <div className="grid grid-cols-2 gap-3 my-2">
              <div className="relative group overflow-hidden rounded-2xl bg-stone-100 aspect-4/3 border border-stone-200/60 shadow-2xs">
                <img
                  src={profile.partner1.avatar || 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&auto=format&fit=crop&q=80'}
                  alt={profile.partner1.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-90 flex items-end p-2.5">
                  <p className="text-white text-xs font-semibold truncate">{profile.partner1.name}</p>
                </div>
              </div>
              <div className="relative group overflow-hidden rounded-2xl bg-stone-100 aspect-4/3 border border-stone-200/60 shadow-2xs">
                <img
                  src={profile.partner2.avatar || 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=600&auto=format&fit=crop&q=80'}
                  alt={profile.partner2.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-90 flex items-end p-2.5">
                  <p className="text-white text-xs font-semibold truncate">{profile.partner2.name}</p>
                </div>
              </div>
            </div>
          </div>

          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => onNavigateToTab('gallery')}
            className="w-full mt-3 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold transition-colors cursor-pointer"
          >
            <Camera className="w-3.5 h-3.5 text-stone-600" />
            <span>Parcourir toutes nos photos partagées</span>
          </motion.button>
        </div>

        {/* Météo du Cœur (Humeurs & Besoins en direct) - 5 cols */}
        <div className="md:col-span-5 rounded-3xl bg-white/90 border border-stone-200/70 p-5 sm:p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-xl bg-pink-50 border border-pink-100 flex items-center justify-center text-pink-600">
                <Smile className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-stone-800">Météo du Cœur</h3>
                <p className="text-[11px] text-stone-500">Humeurs et besoins du moment</p>
              </div>
            </div>

            <div className="space-y-3">
              {/* Partner 1 status */}
              <div className="p-3 rounded-2xl bg-stone-50/80 border border-stone-100 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
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
                <span className="text-[10px] text-stone-500 bg-white px-2 py-0.5 rounded-md border border-stone-200">
                  {profile.partner1.mood?.need || "Besoin d'un câlin"}
                </span>
              </div>

              {/* Partner 2 status */}
              <div className="p-3 rounded-2xl bg-stone-50/80 border border-stone-100 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
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
                <span className="text-[10px] text-stone-500 bg-white px-2 py-0.5 rounded-md border border-stone-200">
                  {profile.partner2.mood?.need || 'Envie de te voir'}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-500">
            <span>Envie de changer d'humeur ?</span>
            <button
              onClick={() => onOpenProfileModal && onOpenProfileModal(activePartnerId)}
              className="text-rose-600 font-semibold hover:underline cursor-pointer"
            >
              Modifier mon humeur
            </button>
          </div>
        </div>
      </section>

      {/* Romantic Quote Footer */}
      <div className="text-center py-4">
        <p className="font-serif italic text-xs sm:text-sm text-stone-500 max-w-lg mx-auto">
          « Aimer, ce n'est pas se regarder l'un l'autre, c'est regarder ensemble dans la même direction. »
        </p>
        <p className="text-[10px] text-stone-400 mt-1 uppercase tracking-widest">
          {profile.relationshipTitle} • Toujours complices
        </p>
      </div>
    </div>
  );
};
