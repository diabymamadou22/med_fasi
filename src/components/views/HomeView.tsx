import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Heart,
  MessageCircle,
  Images,
  ArrowRight,
  Gamepad2,
  Calendar,
  Shuffle,
  Quote,
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
import { EnglishGameTab } from './GamesView';

interface HomeViewProps {
  profile: CoupleProfile;
  activePartnerId: PartnerId;
  onSwitchPartner: (id: PartnerId) => void;
  onNavigateToTab: (tab: 'home' | 'chat' | 'games' | 'gallery') => void;
  onNavigateToGame?: (gameTab: EnglishGameTab) => void;
  onSendMissYou?: (vibe: MissYouPulse['vibe'], message: string) => void;
  onOpenWriteNoteModal?: () => void;
  notes?: SweetNote[];
  messages?: ChatMessage[];
  memories?: TimelineMemory[];
  onOpenProfileModal?: (partnerId?: PartnerId) => void;
}

// Citations d'amour poétiques et littéraires
const POETIC_QUOTES = [
  {
    quote: "Aimer, ce n'est pas se regarder l'un l'autre, c'est regarder ensemble dans la même direction.",
    author: "Antoine de Saint-Exupéry",
  },
  {
    quote: "Dans un baiser, tu sauras tout ce qui a été tu.",
    author: "Pablo Neruda",
  },
  {
    quote: "Il n'y a qu'un bonheur dans cette vie, c'est d'aimer et d'être aimé.",
    author: "George Sand",
  },
  {
    quote: "La vie est un sommeil, l'amour en est le rêve, et vous aurez vécu si vous avez aimé.",
    author: "Alfred de Musset",
  },
  {
    quote: "Je t'aime pour toutes les heures où je ne t'ai pas aimée.",
    author: "Paul Éluard",
  },
  {
    quote: "Tu es mon port d'attache, mon évidence et la douceur de mes jours.",
    author: "Pensée complice",
  },
];

export const HomeView: React.FC<HomeViewProps> = React.memo(({
  profile,
  activePartnerId,
  onSwitchPartner,
  onNavigateToTab,
  messages = [],
  memories = [],
  onOpenProfileModal,
}) => {
  const currentPartner = activePartnerId === 'p1' ? profile.partner1 : profile.partner2;
  const otherPartner = activePartnerId === 'p1' ? profile.partner2 : profile.partner1;
  const otherPartnerId: PartnerId = activePartnerId === 'p1' ? 'p2' : 'p1';

  const [quoteIndex, setQuoteIndex] = useState(0);

  // Salutation naturelle selon l'heure
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'Bonjour mon amour';
    if (hour >= 12 && hour < 18) return 'Bel après-midi';
    if (hour >= 18 && hour < 23) return 'Douce soirée';
    return 'Douce nuit';
  };

  // Calcul du temps partagé
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

  const formattedAnniversary = anniversary.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  // Dernier message du salon
  const latestMessage = messages.length > 0 ? messages[messages.length - 1] : null;
  const unreadCount = messages.filter(
    (m) => m.senderId !== activePartnerId && !m.readStatus
  ).length;

  // Dernier souvenir avec photo si disponible
  const latestMemoryWithPhoto = memories.slice().reverse().find((m) => m.photos && m.photos.length > 0);
  const latestMemory = memories.length > 0 ? memories[memories.length - 1] : null;
  const memoryPhotoUrl = latestMemoryWithPhoto?.photos?.[0] || latestMemory?.photos?.[0];

  const handleNextQuote = () => {
    setQuoteIndex((prev) => (prev + 1) % POETIC_QUOTES.length);
  };

  const currentQuote = POETIC_QUOTES[quoteIndex];

  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 sm:space-y-7">
      {/* ========================================================
          1. SANCTUAIRE DU COUPLE (ÉPURÉ, CHALEUREUX & ÉLÉGANT)
         ======================================================== */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="text-center pt-2 pb-2"
        aria-label="Sanctuaire d'amour"
      >
        {/* Salutation délicate & sélecteur de partenaire discret */}
        <div className="flex items-center justify-center gap-2 mb-5">
          <span className="font-serif italic text-stone-500 text-sm">
            {getGreeting()},
          </span>
          <button
            onClick={() => onSwitchPartner(otherPartnerId)}
            className="group inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium text-stone-700 hover:text-rose-600 transition-colors cursor-pointer"
            title={`Basculer vers ${otherPartner.name}`}
          >
            <span className="font-semibold underline underline-offset-4 decoration-rose-300 group-hover:decoration-rose-500">
              {currentPartner.name}
            </span>
            <span className="text-[10px] text-stone-400 group-hover:text-rose-500">⇄</span>
          </button>
        </div>

        {/* Les Deux Partenaires Unis avec élégance */}
        <div className="flex items-center justify-center gap-6 sm:gap-8 my-3">
          {/* Partenaire 1 */}
          <div
            onClick={() => onOpenProfileModal && onOpenProfileModal('p1')}
            className="flex flex-col items-center cursor-pointer group"
            title={`Profil de ${profile.partner1.name}`}
          >
            <div className="relative p-1 rounded-full ring-1 ring-stone-200 group-hover:ring-rose-300 transition-all">
              <PartnerAvatar
                name={profile.partner1.name}
                avatar={profile.partner1.avatar}
                partnerId="p1"
                size="lg"
                className="group-hover:scale-105 transition-transform"
              />
              {profile.partner1.mood?.emoji && (
                <span className="absolute -bottom-1 -right-1 text-xs select-none">
                  {profile.partner1.mood.emoji}
                </span>
              )}
            </div>
            <span className="mt-2 text-xs font-medium text-stone-700 group-hover:text-rose-600 transition-colors">
              {profile.partner1.name}
            </span>
          </div>

          {/* Lien d'union délicat : Cœur battant doux */}
          <div className="w-9 h-9 rounded-full bg-rose-50 flex items-center justify-center text-rose-400 select-none">
            <motion.div
              animate={{ scale: [1, 1.15, 1] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
            >
              <Heart className="w-4 h-4 fill-rose-400 text-rose-400" />
            </motion.div>
          </div>

          {/* Partenaire 2 */}
          <div
            onClick={() => onOpenProfileModal && onOpenProfileModal('p2')}
            className="flex flex-col items-center cursor-pointer group"
            title={`Profil de ${profile.partner2.name}`}
          >
            <div className="relative p-1 rounded-full ring-1 ring-stone-200 group-hover:ring-rose-300 transition-all">
              <PartnerAvatar
                name={profile.partner2.name}
                avatar={profile.partner2.avatar}
                partnerId="p2"
                size="lg"
                className="group-hover:scale-105 transition-transform"
              />
              {profile.partner2.mood?.emoji && (
                <span className="absolute -bottom-1 -right-1 text-xs select-none">
                  {profile.partner2.mood.emoji}
                </span>
              )}
            </div>
            <span className="mt-2 text-xs font-medium text-stone-700 group-hover:text-rose-600 transition-colors">
              {profile.partner2.name}
            </span>
          </div>
        </div>

        {/* Compteur poétique & intemporel */}
        <div className="mt-5 space-y-1.5">
          <h1 className="font-serif text-3xl sm:text-4xl text-stone-900 tracking-tight font-normal">
            {daysTogether.toLocaleString('fr-FR')}{' '}
            <span className="italic font-light text-rose-600">jours</span> d’amour
          </h1>
          <p className="text-xs text-stone-500 font-light">
            Depuis le {formattedAnniversary} <span className="mx-1.5 text-stone-300">·</span> {durationText} ensemble
          </p>

          {daysUntilNextAnniv <= 30 && (
            <p className="pt-1 text-[11px] text-rose-600/90 font-medium inline-flex items-center gap-1">
              <Calendar className="w-3 h-3 text-rose-500" />
              {daysUntilNextAnniv === 0 ? (
                <span>Aujourd'hui, nous fêtons notre amour ! 🥂</span>
              ) : (
                <span>Prochain anniversaire dans {daysUntilNextAnniv} jours</span>
              )}
            </p>
          )}
        </div>
      </motion.section>

      {/* ========================================================
          2. ESPACES DU COUPLE (CARTE CHAT & ACCÈS DIRECTS ÉLÉGANTS)
         ======================================================== */}
      <div className="space-y-3">
        {/* Salon Privé (Chat) */}
        <motion.div
          whileTap={{ scale: 0.99 }}
          onClick={() => onNavigateToTab('chat')}
          className="group p-4 sm:p-5 rounded-3xl bg-white border border-stone-200/80 hover:border-rose-200 hover:shadow-sm transition-all cursor-pointer"
          id="home-chat-spotlight"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center group-hover:bg-rose-500 group-hover:text-white transition-colors">
                <MessageCircle className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-stone-900 group-hover:text-rose-600 transition-colors">
                  Notre Salon Privé
                </h2>
                <p className="text-[11px] text-stone-400">
                  Échanges intimes, vocaux & photos
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {unreadCount > 0 ? (
                <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white text-[11px] font-semibold">
                  {unreadCount} nouveau{unreadCount > 1 ? 'x' : ''}
                </span>
              ) : (
                <span className="text-xs text-stone-400 group-hover:text-rose-600 group-hover:translate-x-0.5 transition-all flex items-center gap-1 font-medium">
                  <span>Ouvrir</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              )}
            </div>
          </div>

          {/* Extrait du dernier mot échangé */}
          <div className="mt-2.5 px-3 py-2 rounded-xl bg-stone-50/70 text-xs text-stone-600 truncate">
            {latestMessage ? (
              <span>
                <span className="font-medium text-stone-800">
                  {latestMessage.senderId === activePartnerId ? 'Vous : ' : `${otherPartner.name} : `}
                </span>
                {latestMessage.type === 'audio'
                  ? '🎤 Message vocal'
                  : latestMessage.type === 'image'
                  ? '📷 Photo partagée'
                  : latestMessage.text}
              </span>
            ) : (
              <span className="italic text-stone-400">
                Laissez un premier mot tendre à votre amour...
              </span>
            )}
          </div>
        </motion.div>

        {/* Duo : Galerie & Jeux */}
        <div className="grid grid-cols-2 gap-3">
          {/* Galerie */}
          <motion.div
            whileTap={{ scale: 0.99 }}
            onClick={() => onNavigateToTab('gallery')}
            className="group p-4 rounded-3xl bg-white border border-stone-200/80 hover:border-pink-200 hover:shadow-sm transition-all cursor-pointer flex flex-col justify-between"
            id="card-nav-gallery"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="w-8 h-8 rounded-full bg-pink-50 text-pink-600 flex items-center justify-center group-hover:bg-pink-500 group-hover:text-white transition-colors">
                  <Images className="w-4 h-4" />
                </div>
                {memoryPhotoUrl && (
                  <img
                    src={memoryPhotoUrl}
                    alt="Souvenir"
                    className="w-7 h-7 rounded-lg object-cover border border-stone-200/60"
                  />
                )}
              </div>
              <h3 className="text-sm font-semibold text-stone-900 group-hover:text-pink-600 transition-colors">
                Galerie
              </h3>
              <p className="text-[11px] text-stone-400 mt-0.5 line-clamp-1">
                {memories.length > 0 ? `${memories.length} moment${memories.length > 1 ? 's' : ''}` : 'Nos photos'}
              </p>
            </div>
            <div className="mt-3 flex items-center gap-1 text-[11px] font-medium text-pink-600">
              <span>Explorer</span>
              <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </motion.div>

          {/* Jeux & Complicté */}
          <motion.div
            whileTap={{ scale: 0.99 }}
            onClick={() => onNavigateToTab('games')}
            className="group p-4 rounded-3xl bg-white border border-stone-200/80 hover:border-violet-200 hover:shadow-sm transition-all cursor-pointer flex flex-col justify-between"
            id="card-nav-games"
          >
            <div>
              <div className="w-8 h-8 rounded-full bg-violet-50 text-violet-600 flex items-center justify-center group-hover:bg-violet-500 group-hover:text-white transition-colors mb-2">
                <Gamepad2 className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-semibold text-stone-900 group-hover:text-violet-600 transition-colors">
                Jeux à deux
              </h3>
              <p className="text-[11px] text-stone-400 mt-0.5 line-clamp-1">
                Quiz, gages & complicité
              </p>
            </div>
            <div className="mt-3 flex items-center gap-1 text-[11px] font-medium text-violet-600">
              <span>Jouer</span>
              <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </motion.div>
        </div>
      </div>

      {/* ========================================================
          3. PENSÉE DU JOUR (ÉLÉGANTE, LITTÉRAIRE & CALME)
         ======================================================== */}
      <section
        aria-label="Pensée du jour"
        className="pt-2 text-center"
      >
        <div className="relative inline-block max-w-md mx-auto px-4 py-2">
          <Quote className="w-4 h-4 text-rose-300 mx-auto mb-2 opacity-70" />
          <p className="font-serif italic text-stone-700 text-sm sm:text-base leading-relaxed">
            « {currentQuote.quote} »
          </p>
          <div className="flex items-center justify-center gap-2 mt-2">
            <span className="text-xs text-stone-400 font-serif">
              — {currentQuote.author}
            </span>
            <button
              onClick={handleNextQuote}
              className="p-1 text-stone-300 hover:text-stone-500 transition-colors cursor-pointer"
              title="Autre citation"
            >
              <Shuffle className="w-3 h-3" />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
});
