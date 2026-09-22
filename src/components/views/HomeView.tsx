import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Heart,
  Sparkles,
  MessageCircle,
  Images,
  ArrowRight,
  Gamepad2,
  Calendar,
  Shuffle,
  Quote,
  Flame,
  Star,
  Compass,
  Smile,
} from 'lucide-react';
import {
  CoupleProfile,
  PartnerId,
  ChatMessage,
  TimelineMemory,
  MissYouPulse,
  SweetNote,
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
  onOpenWriteNoteModal?: () => void;
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

// Idées romantiques spontanées pour inspirer le couple
const ROMANTIC_IDEAS = [
  {
    title: 'Cinéma & Câlins sous le plaid',
    desc: 'Un film romantique, pop-corn chaud et lumière tamisée blottis ensemble.',
    icon: '🎬',
    tag: 'Soirée Cocooning',
  },
  {
    title: 'Massage complice aux huiles douces',
    desc: 'Musique de fond apaisante, bougies parfumées et gestes tendres.',
    icon: '🕯️',
    tag: 'Détente & Flirt',
  },
  {
    title: 'Dîner surprise aux chandelles',
    desc: 'Cuisiner son plat préféré ou commander son dessert favori en tête-à-tête.',
    icon: '🍷',
    tag: 'Gourmandise',
  },
  {
    title: 'Balade nocturne sous les étoiles',
    desc: 'Marcher main dans la main au calme et se murmurer des mots doux.',
    icon: '🌙',
    tag: 'Romantisme',
  },
  {
    title: 'Bain moussant parfumé à deux',
    desc: 'Une eau chaude parfumée, des bougies et une coupe pour trinquer à nous.',
    icon: '🫧',
    tag: 'Sensualité',
  },
  {
    title: 'Séance photos complices spontanées',
    desc: 'Faire des selfies décalés, des poses tendres et les ranger dans l’album secret.',
    icon: '📸',
    tag: 'Souvenirs',
  },
  {
    title: 'Questions indiscrètes & confidences',
    desc: 'Se poser 5 questions qu’on n’a jamais osé poser pour rire et se redécouvrir.',
    icon: '💬',
    tag: 'Connexion',
  },
];

// Citations d'amour poétiques et littéraires
const LOVE_QUOTES = [
  {
    quote: "Aimer, ce n’est pas se regarder l’un l’autre, c’est regarder ensemble dans la même direction.",
    author: "Antoine de Saint-Exupéry",
  },
  {
    quote: "Le cœur a ses raisons que la raison ne connaît point.",
    author: "Blaise Pascal",
  },
  {
    quote: "Je t'aime pour toutes les femmes que je n'ai pas connues. Je t'aime pour toutes les heures où je ne t'ai pas aimée.",
    author: "Paul Éluard",
  },
  {
    quote: "La vie est un sommeil, l'amour en est le rêve, et vous aurez vécu si vous avez aimé.",
    author: "Alfred de Musset",
  },
  {
    quote: "Il n'y a qu'un bonheur dans cette vie, c'est d'aimer et d'être aimé.",
    author: "George Sand",
  },
  {
    quote: "Dans un baiser, tu sauras tout ce qui a été tu.",
    author: "Pablo Neruda",
  },
  {
    quote: "Tu es ma plus belle évidence, mon port d'attache et mon éclat de joie quotidien.",
    author: "Pour vous deux",
  },
];

export const HomeView: React.FC<HomeViewProps> = ({
  profile,
  activePartnerId,
  onSwitchPartner,
  onNavigateToTab,
  onNavigateToGame,
  onSendMissYou,
  messages = [],
  memories = [],
  onOpenProfileModal,
}) => {
  const currentPartner = activePartnerId === 'p1' ? profile.partner1 : profile.partner2;
  const otherPartner = activePartnerId === 'p1' ? profile.partner2 : profile.partner1;
  const otherPartnerId: PartnerId = activePartnerId === 'p1' ? 'p2' : 'p1';

  const [pulseFeedback, setPulseFeedback] = useState<string | null>(null);
  const [ideaIndex, setIdeaIndex] = useState(0);
  const [quoteIndex, setQuoteIndex] = useState(0);

  // Salutation chaleureuse selon l'heure
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'Bonjour mon amour';
    if (hour >= 12 && hour < 18) return 'Bel après-midi';
    if (hour >= 18 && hour < 23) return 'Douce soirée à deux';
    return 'Bonne nuit tendresse';
  };

  // Calcul approfondi du temps d'amour
  const anniversary = new Date(profile.anniversaryDate);
  const now = new Date();
  const diffMs = Math.max(0, now.getTime() - anniversary.getTime());
  const daysTogether = Math.max(1, Math.floor(diffMs / (1000 * 60 * 60 * 24)));

  const years = Math.floor(daysTogether / 365.25);
  const remainingDays = Math.floor(daysTogether % 365.25);
  const months = Math.floor(remainingDays / 30.4375);

  let durationText = '';
  if (years > 0 && months > 0) {
    durationText = `${years} an${years > 1 ? 's' : ''} et ${months} mois`;
  } else if (years > 0) {
    durationText = `${years} an${years > 1 ? 's' : ''}`;
  } else if (months > 0) {
    durationText = `${months} mois`;
  } else {
    durationText = `${daysTogether} jour${daysTogether > 1 ? 's' : ''}`;
  }

  // Prochain anniversaire de couple
  const nextAnnivThisYear = new Date(now.getFullYear(), anniversary.getMonth(), anniversary.getDate());
  if (nextAnnivThisYear.getTime() < now.getTime()) {
    nextAnnivThisYear.setFullYear(now.getFullYear() + 1);
  }
  const daysUntilNextAnniv = Math.max(
    0,
    Math.ceil((nextAnnivThisYear.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  );
  const nextMilestoneYears = nextAnnivThisYear.getFullYear() - anniversary.getFullYear();

  const formattedAnniversary = anniversary.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  // Dernier message du chat
  const latestMessage = messages.length > 0 ? messages[messages.length - 1] : null;
  const unreadCount = messages.filter(
    (m) => m.senderId !== activePartnerId && !m.readStatus
  ).length;

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

  const handleNextIdea = () => {
    setIdeaIndex((prev) => (prev + 1) % ROMANTIC_IDEAS.length);
  };

  const handleNextQuote = () => {
    setQuoteIndex((prev) => (prev + 1) % LOVE_QUOTES.length);
  };

  const currentIdea = ROMANTIC_IDEAS[ideaIndex];
  const currentQuote = LOVE_QUOTES[quoteIndex];

  return (
    <div className="max-w-2xl mx-auto px-4 py-4 sm:py-6 space-y-5">
      {/* ========================================================
          1. LE CŒUR DU NID (HERO SANCTUAIRE ÉLÉGANT)
         ======================================================== */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-white via-rose-50/25 to-white border border-rose-100/90 p-5 sm:p-7 shadow-xs text-center"
        aria-label="Espace d'accueil du couple"
      >
        {/* Lueur d'ambiance douce et chaleureuse */}
        <div className="absolute -top-20 -right-20 w-48 h-48 bg-rose-200/25 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-pink-100/35 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center">
          {/* Badge Salutation & Connecté en tant que */}
          <div className="flex items-center gap-2 mb-3.5 flex-wrap justify-center">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/95 border border-rose-200/80 text-xs text-stone-700 shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-rose-500" />
              <span className="font-serif italic font-medium">{getGreeting()}</span>
            </div>

            <button
              onClick={() => onSwitchPartner(otherPartnerId)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-50 hover:bg-rose-100/80 border border-rose-200/70 text-[11px] font-medium text-rose-700 cursor-pointer transition-colors"
              title="Changer d'utilisateur actif"
            >
              <span>{currentPartner.name}</span>
              <span className="text-rose-400">⇄</span>
            </button>
          </div>

          {/* Les Deux Avatars Complices unis par un Cœur Battant */}
          <div className="flex items-center justify-center gap-4 sm:gap-7 my-2">
            {/* Partenaire 1 */}
            <div
              onClick={() => onOpenProfileModal && onOpenProfileModal('p1')}
              className="flex flex-col items-center cursor-pointer group"
              title={`Profil intime de ${profile.partner1.name}`}
            >
              <div className="relative">
                <PartnerAvatar
                  name={profile.partner1.name}
                  avatar={profile.partner1.avatar}
                  partnerId="p1"
                  size="xl"
                  className="border-2 border-white shadow-xs group-hover:scale-105 transition-transform"
                />
                {profile.partner1.mood?.status && (
                  <span className="absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded-full bg-white text-[10px] font-semibold text-rose-600 border border-rose-200 shadow-2xs">
                    {profile.partner1.mood.status}
                  </span>
                )}
              </div>
              <span className="mt-2 text-sm font-bold text-stone-800 group-hover:text-rose-600 transition-colors">
                {profile.partner1.name}
              </span>
            </div>

            {/* Cœur central battant & interactif */}
            <div className="px-1 flex flex-col items-center justify-center">
              <motion.button
                whileTap={{ scale: 0.85 }}
                onClick={() => handleSendPulse('thought', 'Je pense fort à toi mon amour ✨', 'Pensée')}
                aria-label="Envoyer une douce onde d'amour"
                className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-rose-500 to-pink-500 flex items-center justify-center shadow-md shadow-rose-200 hover:shadow-lg transition-all cursor-pointer group"
              >
                <motion.div
                  animate={{ scale: [1, 1.18, 1] }}
                  transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <Heart className="w-5 h-5 text-white fill-white group-hover:scale-110 transition-transform" />
                </motion.div>
              </motion.button>
              <span className="text-[10px] font-medium text-rose-500 mt-1">Unis</span>
            </div>

            {/* Partenaire 2 */}
            <div
              onClick={() => onOpenProfileModal && onOpenProfileModal('p2')}
              className="flex flex-col items-center cursor-pointer group"
              title={`Profil intime de ${profile.partner2.name}`}
            >
              <div className="relative">
                <PartnerAvatar
                  name={profile.partner2.name}
                  avatar={profile.partner2.avatar}
                  partnerId="p2"
                  size="xl"
                  className="border-2 border-white shadow-xs group-hover:scale-105 transition-transform"
                />
                {profile.partner2.mood?.status && (
                  <span className="absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded-full bg-white text-[10px] font-semibold text-pink-600 border border-pink-200 shadow-2xs">
                    {profile.partner2.mood.status}
                  </span>
                )}
              </div>
              <span className="mt-2 text-sm font-bold text-stone-800 group-hover:text-pink-600 transition-colors">
                {profile.partner2.name}
              </span>
            </div>
          </div>

          {/* Compteur de Jours & Jalons d'Amour */}
          <div className="mt-3 space-y-1">
            <h2 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-stone-800">
              <span className="bg-gradient-to-r from-rose-600 to-pink-600 bg-clip-text text-transparent">
                {daysTogether.toLocaleString('fr-FR')}
              </span>{' '}
              jours d’amour
            </h2>
            <div className="flex items-center justify-center gap-2 flex-wrap text-xs text-stone-500">
              <span className="font-medium text-stone-700 bg-stone-100/80 px-2 py-0.5 rounded-md">
                {durationText}
              </span>
              <span>•</span>
              <span>Depuis le {formattedAnniversary}</span>
            </div>

            {/* Compteur du prochain anniversaire */}
            <div className="pt-1">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-rose-700 bg-rose-50/80 border border-rose-100 px-3 py-1 rounded-full">
                <Calendar className="w-3 h-3 text-rose-500" />
                {daysUntilNextAnniv === 0 ? (
                  <strong className="text-rose-600">Joyeux anniversaire de couple aujourd'hui ! 🥂</strong>
                ) : (
                  <span>
                    Prochain jalon dans <strong className="font-bold">{daysUntilNextAnniv} jours</strong> ({nextMilestoneYears} ans)
                  </span>
                )}
              </span>
            </div>
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

          {/* 4 Boutons d'attentions rapides */}
          <div className="mt-4 w-full max-w-sm grid grid-cols-4 gap-2">
            {QUICK_PULSES.map((pulse) => (
              <motion.button
                key={pulse.vibe}
                whileTap={{ scale: 0.94 }}
                onClick={() => handleSendPulse(pulse.vibe, pulse.message, pulse.label)}
                className="flex flex-col items-center justify-center py-2 px-1 rounded-2xl bg-white hover:bg-rose-50/70 border border-stone-200/80 hover:border-rose-200 shadow-2xs transition-all cursor-pointer"
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
          2. SALON PRIVÉ & DERNIÈRE CONVERSATION (ACCÈS CHAT SPOTLIGHT)
         ======================================================== */}
      <motion.section
        whileTap={{ scale: 0.99 }}
        onClick={() => onNavigateToTab('chat')}
        className="group relative overflow-hidden rounded-3xl bg-white border border-stone-200/90 hover:border-rose-300 p-4 sm:p-5 shadow-xs hover:shadow-md transition-all cursor-pointer"
        aria-label="Accès direct au salon de chat privé"
        id="home-chat-spotlight"
      >
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 group-hover:bg-rose-500 group-hover:text-white transition-colors">
              <MessageCircle className="w-4.5 h-4.5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-stone-900 group-hover:text-rose-600 transition-colors">
                Notre Salon Privé
              </h3>
              <p className="text-[11px] text-stone-400">
                Chat en direct, vocaux, photos & secrets
              </p>
            </div>
          </div>

          {unreadCount > 0 ? (
            <span className="px-2.5 py-1 rounded-full bg-rose-500 text-white text-[11px] font-bold shadow-xs animate-pulse">
              {unreadCount} nouveau{unreadCount > 1 ? 'x' : ''}
            </span>
          ) : (
            <span className="text-xs text-rose-600 font-semibold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
              <span>Écrire</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </span>
          )}
        </div>

        {/* Aperçu du dernier message échangé */}
        <div className="p-3 rounded-2xl bg-stone-50/80 border border-stone-100 group-hover:bg-rose-50/30 group-hover:border-rose-100/70 transition-colors">
          <p className="text-xs text-stone-600 truncate">
            {latestMessage ? (
              <span>
                <strong className="text-stone-800">
                  {latestMessage.senderId === activePartnerId ? 'Vous : ' : `${otherPartner.name} : `}
                </strong>
                {latestMessage.type === 'audio'
                  ? '🎤 Message vocal'
                  : latestMessage.type === 'image'
                  ? '📷 Photo partagée'
                  : latestMessage.text}
              </span>
            ) : (
              <span className="italic text-stone-400">
                Aucun message pour l'instant. Envoyez une première pensée d'amour...
              </span>
            )}
          </p>
        </div>
      </motion.section>

      {/* ========================================================
          3. DUO D'ESPACES : SOUVENIRS & JEUX COMPLICES
         ======================================================== */}
      <section aria-label="Espaces du couple" className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        {/* Espace 1 : Album & Souvenirs */}
        <motion.div
          whileTap={{ scale: 0.99 }}
          onClick={() => onNavigateToTab('gallery')}
          className="group p-4 sm:p-5 rounded-3xl bg-white border border-stone-200/80 shadow-xs hover:border-pink-300 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
          id="card-nav-gallery"
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 rounded-xl bg-pink-50 border border-pink-100 flex items-center justify-center text-pink-600 group-hover:bg-pink-500 group-hover:text-white transition-colors">
                <Images className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-semibold text-pink-700 bg-pink-50 px-2 py-0.5 rounded-full">
                {memories.length > 0 ? `${memories.length} souvenir${memories.length > 1 ? 's' : ''}` : 'Album'}
              </span>
            </div>

            <h4 className="text-sm font-bold text-stone-800 group-hover:text-pink-600 transition-colors">
              Galerie & Souvenirs
            </h4>

            <p className="text-xs text-stone-500 mt-1 line-clamp-2">
              {latestMemory?.title
                ? `Dernier souvenir : « ${latestMemory.title} »`
                : 'Revivez nos plus beaux moments, capsules et lieux précieux.'}
            </p>
          </div>

          <div className="mt-3 pt-2.5 border-t border-stone-100 flex items-center justify-between text-xs font-semibold text-pink-600">
            <span>Explorer la galerie</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </motion.div>

        {/* Espace 2 : Salon de Jeux & Flirt */}
        <motion.div
          whileTap={{ scale: 0.99 }}
          onClick={() => onNavigateToTab('games')}
          className="group p-4 sm:p-5 rounded-3xl bg-white border border-stone-200/80 shadow-xs hover:border-violet-300 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
          id="card-nav-games"
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 rounded-xl bg-violet-50 border border-violet-100 flex items-center justify-center text-violet-600 group-hover:bg-violet-500 group-hover:text-white transition-colors">
                <Gamepad2 className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-semibold text-violet-700 bg-violet-50 px-2 py-0.5 rounded-full">
                Flirt & Rires
              </span>
            </div>

            <h4 className="text-sm font-bold text-stone-800 group-hover:text-violet-600 transition-colors">
              Salon de Jeux en Duo
            </h4>

            <p className="text-xs text-stone-500 mt-1 line-clamp-2">
              Roue des gages, blind test, quiz de couple, cartes intimes et anglais complice.
            </p>
          </div>

          <div className="mt-3 pt-2.5 border-t border-stone-100 flex items-center justify-between text-xs font-semibold text-violet-600">
            <span>Lancer une partie</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </motion.div>
      </section>

      {/* ========================================================
          4. INSPIRATION ROMANTIQUE DU JOUR (IDÉE COMPLICE)
         ======================================================== */}
      <section
        aria-label="Inspiration romantique du jour"
        className="rounded-3xl bg-gradient-to-br from-amber-50/50 via-white to-orange-50/40 border border-amber-200/70 p-4 sm:p-5 shadow-xs"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-100/80 flex items-center justify-center text-amber-800">
              <Flame className="w-4 h-4 text-amber-600" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-stone-800">Idée Romantique</h3>
              <p className="text-[10px] text-amber-800/70">Inspiration complice du jour</p>
            </div>
          </div>

          <button
            onClick={handleNextIdea}
            className="flex items-center gap-1 text-[11px] font-semibold text-amber-800 hover:text-amber-950 bg-amber-100/60 hover:bg-amber-200/60 px-2.5 py-1 rounded-full transition-colors cursor-pointer"
            title="Découvrir une autre idée romantique"
          >
            <Shuffle className="w-3 h-3" />
            <span>Autre idée</span>
          </button>
        </div>

        <div className="p-3.5 rounded-2xl bg-white/90 border border-amber-200/50 shadow-2xs flex items-start gap-3">
          <span className="text-2xl leading-none mt-0.5 select-none">{currentIdea.icon}</span>
          <div className="flex-1">
            <div className="flex items-center justify-between gap-2">
              <h4 className="text-xs sm:text-sm font-bold text-stone-800">{currentIdea.title}</h4>
              <span className="text-[10px] font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200/40">
                {currentIdea.tag}
              </span>
            </div>
            <p className="text-xs text-stone-600 mt-1 leading-relaxed">
              {currentIdea.desc}
            </p>
          </div>
        </div>
      </section>

      {/* ========================================================
          5. PENSÉE POÉTIQUE & LITTÉRAIRE DU COUPLE
         ======================================================== */}
      <section
        aria-label="Citation poétique d'amour"
        className="rounded-3xl bg-stone-50/70 border border-stone-200/70 p-4 sm:p-5 shadow-2xs text-center relative overflow-hidden"
      >
        <Quote className="w-6 h-6 text-stone-300 absolute top-3 left-4 opacity-40 pointer-events-none" />
        <Quote className="w-6 h-6 text-stone-300 absolute bottom-3 right-4 opacity-40 pointer-events-none rotate-180" />

        <div className="relative z-10 px-4 py-1">
          <p className="font-serif italic text-sm sm:text-base text-stone-700 leading-relaxed">
            « {currentQuote.quote} »
          </p>
          <div className="flex items-center justify-center gap-2 mt-2">
            <span className="text-xs font-semibold text-rose-600 font-serif">
              — {currentQuote.author}
            </span>
            <button
              onClick={handleNextQuote}
              className="p-1 rounded-full text-stone-400 hover:text-stone-600 transition-colors cursor-pointer"
              title="Nouvelle citation poétique"
            >
              <Shuffle className="w-3 h-3" />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
