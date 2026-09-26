import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  Heart,
  RotateCw,
  Flame,
  MessageCircle,
  Radio,
  CheckCircle2,
  Calendar,
  Share2,
  Gift,
  RefreshCw,
} from 'lucide-react';
import { CoupleProfile, PartnerId, ChatMessage, LoveRouletteSession } from '../../types';
import { soundEffects } from '../../lib/audio';
import { triggerCelebrationConfetti, triggerHeartConfetti } from '../../lib/confetti';
import { subscribeLoveRoulette, saveLoveRoulette } from '../../lib/firestoreService';

interface LoveRouletteGameProps {
  profile: CoupleProfile;
  activePartnerId: PartnerId;
  onSendChatMessage?: (
    msgData: Omit<ChatMessage, 'id' | 'timestamp' | 'status' | 'readStatus'>
  ) => void;
}

interface RouletteCategory {
  id: 'dates' | 'pledges' | 'sweet';
  label: string;
  emoji: string;
  items: string[];
  colors: string[];
}

const ROULETTE_CATEGORIES: RouletteCategory[] = [
  {
    id: 'dates',
    label: 'Rendez-vous Imprévus',
    emoji: '🕯️',
    items: [
      'Soirée cinéma sous les plaids 🍿',
      'Dîner aux chandelles improvisé 🕯️',
      'Session massage aux huiles 💆',
      'Balade nocturne main dans la main 🌙',
      'Bain moussant chaud à deux 🛁',
      'Soirée cocktails & mocktails maison 🍹',
      'Cuisiner un dessert gourmand ensemble 🍫',
      'Pique-nique douillet dans le salon 🧺',
    ],
    colors: [
      '#f43f5e', // rose-500
      '#ec4899', // pink-500
      '#d946ef', // fuchsia-500
      '#a855f7', // purple-500
      '#8b5cf6', // violet-500
      '#6366f1', // indigo-500
      '#ec4899', // pink-500
      '#fb7185', // rose-400
    ],
  },
  {
    id: 'pledges',
    label: 'Gages & Défis Complices',
    emoji: '🔥',
    items: [
      '10 baisers doux dans le cou 💋',
      'Préparer le petit-déjeuner au lit ☕',
      'Écrire un mot doux sur le miroir 💌',
      'Laisser l’autre choisir le film ce soir 🎬',
      'Un massage de nuque de 5 minutes 💆‍♂️',
      'Faire un compliment les yeux dans les yeux 👀',
      'Chanter le refrain de notre chanson 🎶',
      'Un câlin fusionnel de 2 minutes chrono 🧸',
    ],
    colors: [
      '#f43f5e',
      '#e11d48',
      '#be123c',
      '#9f1239',
      '#fb7185',
      '#f43f5e',
      '#ec4899',
      '#fda4af',
    ],
  },
  {
    id: 'sweet',
    label: 'Confidences du Cœur',
    emoji: '💌',
    items: [
      'Raconte ton plus beau souvenir de nous ✨',
      'Le premier détail qui t’a fait craquer chez moi 💘',
      'Une chose que tu adores dans ma personnalité 🌸',
      'Ton rêve le plus secret pour notre avenir 🏡',
      'Notre fou rire le plus mémorable ensemble 😂',
      'Ce que tu as pensé la première fois qu’on s’est vus 👀',
      'Une promesse que tu veux me faire ce soir 💍',
      'Un surnom secret inventé juste pour nous 🥰',
    ],
    colors: [
      '#8b5cf6',
      '#ec4899',
      '#f43f5e',
      '#06b6d4',
      '#10b981',
      '#f59e0b',
      '#d946ef',
      '#6366f1',
    ],
  },
];

export const LoveRouletteGame: React.FC<LoveRouletteGameProps> = ({
  profile,
  activePartnerId,
  onSendChatMessage,
}) => {
  const [selectedCatId, setSelectedCatId] = useState<'dates' | 'pledges' | 'sweet'>('dates');
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [selectedResult, setSelectedResult] = useState<string | null>(null);
  const [lastSpunBy, setLastSpunBy] = useState<PartnerId | null>(null);
  const [sentToChatToast, setSentToChatToast] = useState(false);
  const [gameMode, setGameMode] = useState<'live' | 'local'>('live');

  const otherPartner = activePartnerId === 'p1' ? profile.partner2 : profile.partner1;
  const currentCategory = ROULETTE_CATEGORIES.find((c) => c.id === selectedCatId) || ROULETTE_CATEGORIES[0];
  const items = currentCategory.items;
  const numSlices = items.length;
  const sliceAngle = 360 / numSlices;

  const channelRef = useRef<BroadcastChannel | null>(null);

  // Broadcast channel for multi-tab testing
  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        channelRef.current = new BroadcastChannel('nid_amour_roulette_live');
        channelRef.current.onmessage = (event) => {
          if (event.data && typeof event.data === 'object' && gameMode === 'live') {
            handleLiveSessionUpdate(event.data as LoveRouletteSession, false);
          }
        };
      }
    } catch {}

    return () => {
      channelRef.current?.close();
    };
  }, [gameMode]);

  const handleLiveSessionUpdate = (session: LoveRouletteSession, fromCloud = true) => {
    if (!session) return;
    if (session.category && session.category !== selectedCatId) {
      setSelectedCatId(session.category);
    }
    setLastSpunBy(session.spunBy);

    // If another partner initiated the spin
    if (session.isSpinning) {
      setIsSpinning(true);
      setSelectedResult(null);
      soundEffects.playSoftTap();

      // Animate rotation to targetIndex
      const extraSpins = 5;
      const targetDeg = 360 * extraSpins + (360 - session.targetIndex * sliceAngle - sliceAngle / 2);
      setRotation(targetDeg);

      setTimeout(() => {
        setIsSpinning(false);
        setSelectedResult(session.targetItem);
        soundEffects.playSuccessSparkle();
        triggerCelebrationConfetti();
      }, 4200);
    } else if (session.targetItem && !isSpinning) {
      setSelectedResult(session.targetItem);
    }
  };

  // Real-time Firestore subscription
  useEffect(() => {
    if (gameMode !== 'live') return;

    let mounted = true;
    const unsub = subscribeLoveRoulette((session) => {
      if (!mounted) return;
      if (session) {
        handleLiveSessionUpdate(session, true);
      }
    });

    return () => {
      mounted = false;
      unsub();
    };
  }, [gameMode, selectedCatId]);

  // Spin the wheel
  const handleSpinWheel = () => {
    if (isSpinning) return;

    setIsSpinning(true);
    setSelectedResult(null);
    setLastSpunBy(activePartnerId);
    soundEffects.playSoftTap();

    const targetIndex = Math.floor(Math.random() * numSlices);
    const targetItem = items[targetIndex];

    // Compute rotation angle (5 full spins + landing on slice center)
    const extraSpins = 5;
    const finalAngle = rotation + 360 * extraSpins + (360 - targetIndex * sliceAngle - sliceAngle / 2);
    setRotation(finalAngle);

    // Broadcast in live mode
    if (gameMode === 'live') {
      const sessionUpdate: LoveRouletteSession = {
        id: 'love_roulette_live',
        isSpinning: true,
        targetIndex,
        targetItem,
        category: selectedCatId,
        spunBy: activePartnerId,
        spinTimestamp: Date.now(),
        lastUpdated: new Date().toISOString(),
      };

      try {
        channelRef.current?.postMessage(sessionUpdate);
      } catch {}

      saveLoveRoulette(sessionUpdate).catch(console.error);
    }

    // Complete spin after 4.2 seconds
    setTimeout(() => {
      setIsSpinning(false);
      setSelectedResult(targetItem);
      soundEffects.playSuccessSparkle();
      triggerCelebrationConfetti();

      if (gameMode === 'live') {
        saveLoveRoulette({
          id: 'love_roulette_live',
          isSpinning: false,
          targetItem,
        }).catch(() => {});
      }
    }, 4200);
  };

  const handleShareToChat = () => {
    if (!selectedResult || !onSendChatMessage) return;

    const spunName = lastSpunBy === 'p1' ? profile.partner1.name : profile.partner2.name;
    const msg = `🎡 *La Roulette Magique d'Amour a parlé !*\nLancée par ${spunName} • [${currentCategory.label}]\n👉 « ${selectedResult} » 💕`;

    onSendChatMessage({
      senderId: activePartnerId,
      text: msg,
      type: 'text',
    });

    soundEffects.playSuccessSparkle();
    triggerHeartConfetti();
    setSentToChatToast(true);
    setTimeout(() => setSentToChatToast(false), 3000);
  };

  return (
    <div className="space-y-5 max-w-2xl mx-auto">
      {/* 1. Header Banner */}
      <div className="bg-gradient-to-r from-pink-500 via-rose-500 to-purple-600 rounded-3xl p-5 sm:p-6 text-white shadow-md relative overflow-hidden">
        <div className="relative z-1 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold mb-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Roue du Destin Amoureux</span>
              {gameMode === 'live' && (
                <span className="flex items-center gap-1 ml-1 px-1.5 py-0.5 rounded-full bg-emerald-400 text-stone-900 text-[10px] font-extrabold uppercase">
                  <span className="w-1.5 h-1.5 rounded-full bg-stone-900 animate-pulse" />
                  En Direct
                </span>
              )}
            </div>
            <h2 className="font-serif-romantic text-2xl sm:text-3xl font-bold tracking-tight">
              🎡 La Roulette des Rencards & Gages
            </h2>
            <p className="text-white/90 text-xs sm:text-sm mt-1 max-w-xl">
              Tournez la roue en direct ! Elle s'arrête exactement sur le même résultat sur vos deux téléphones.
            </p>
          </div>

          {/* Mode Switcher */}
          <div className="flex items-center gap-1.5 bg-black/20 p-1.5 rounded-2xl backdrop-blur-md">
            <button
              onClick={() => setGameMode('live')}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                gameMode === 'live'
                  ? 'bg-white text-rose-600 shadow-xs'
                  : 'text-white/80 hover:text-white'
              }`}
            >
              <Radio className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
              <span>En Direct Duo</span>
            </button>
            <button
              onClick={() => setGameMode('local')}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                gameMode === 'local'
                  ? 'bg-white text-rose-600 shadow-xs'
                  : 'text-white/80 hover:text-white'
              }`}
            >
              <span>Même Écran</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Category Selector Tabs */}
      <div className="flex items-center justify-center gap-2 flex-wrap">
        {ROULETTE_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => {
              if (isSpinning) return;
              setSelectedCatId(cat.id);
              setSelectedResult(null);
              soundEffects.playSoftTap();
            }}
            disabled={isSpinning}
            className={`px-3.5 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              selectedCatId === cat.id
                ? 'bg-rose-500 text-white shadow-xs scale-102 ring-2 ring-rose-200'
                : 'bg-white border border-stone-200 text-stone-600 hover:bg-rose-50'
            }`}
          >
            <span>{cat.emoji}</span>
            <span>{cat.label}</span>
          </button>
        ))}
      </div>

      {/* 3. Interactive Roulette Canvas / SVG Wheel */}
      <div className="flex flex-col items-center justify-center py-4 relative">
        {/* Pointer Triangle Marker at 12 o'clock */}
        <div className="z-20 -mb-3 flex flex-col items-center drop-shadow-md">
          <div className="w-0 h-0 border-l-[14px] border-l-transparent border-r-[14px] border-r-transparent border-t-[22px] border-t-rose-600" />
        </div>

        {/* Wheel Container */}
        <div className="relative w-72 h-72 sm:w-80 sm:h-80 rounded-full p-2 bg-gradient-to-tr from-amber-400 via-rose-500 to-pink-500 shadow-2xl border-4 border-white">
          <div
            className="w-full h-full rounded-full overflow-hidden relative shadow-inner"
            style={{
              transform: `rotate(${rotation}deg)`,
              transition: isSpinning ? 'transform 4.2s cubic-bezier(0.15, 0.9, 0.25, 1)' : 'none',
            }}
          >
            <svg viewBox="0 0 100 100" className="w-full h-full">
              {items.map((item, idx) => {
                const startAngle = (idx * 360) / numSlices;
                const endAngle = ((idx + 1) * 360) / numSlices;

                const x1 = 50 + 50 * Math.cos((Math.PI * startAngle) / 180);
                const y1 = 50 + 50 * Math.sin((Math.PI * startAngle) / 180);
                const x2 = 50 + 50 * Math.cos((Math.PI * endAngle) / 180);
                const y2 = 50 + 50 * Math.sin((Math.PI * endAngle) / 180);

                const pathData = `M 50 50 L ${x1} ${y1} A 50 50 0 0 1 ${x2} ${y2} Z`;
                const textAngle = startAngle + sliceAngle / 2;

                return (
                  <g key={idx}>
                    <path
                      d={pathData}
                      fill={currentCategory.colors[idx % currentCategory.colors.length]}
                      stroke="#ffffff"
                      strokeWidth="0.75"
                    />
                    <text
                      x="50"
                      y="50"
                      fill="#ffffff"
                      fontSize="3.6"
                      fontWeight="bold"
                      textAnchor="end"
                      alignmentBaseline="middle"
                      transform={`rotate(${textAngle} 50 50) translate(46, 0)`}
                    >
                      {item.slice(0, 15)}...
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Central Spin Button */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <button
              type="button"
              onClick={handleSpinWheel}
              disabled={isSpinning}
              className={`w-16 h-16 rounded-full bg-white border-4 border-rose-500 shadow-xl flex flex-col items-center justify-center pointer-events-auto transition-transform cursor-pointer ${
                isSpinning ? 'scale-90 opacity-90' : 'hover:scale-105 active:scale-95'
              }`}
            >
              <RotateCw className={`w-5 h-5 text-rose-600 ${isSpinning ? 'animate-spin' : ''}`} />
              <span className="text-[10px] font-black uppercase text-rose-700 tracking-tight mt-0.5">
                {isSpinning ? '...' : 'Tourner'}
              </span>
            </button>
          </div>
        </div>

        {/* Live status notice */}
        {gameMode === 'live' && (
          <p className="text-xs text-stone-500 mt-4 flex items-center gap-1.5 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Chacun peut lancer la roulette à tour de rôle !</span>
          </p>
        )}
      </div>

      {/* 4. Result Showcase Card */}
      <AnimatePresence>
        {selectedResult && !isSpinning && (
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="bg-white rounded-3xl p-6 border-2 border-rose-300 shadow-lg text-center space-y-4"
          >
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 mx-auto flex items-center justify-center text-xl shadow-xs">
              ✨
            </div>

            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 bg-rose-50 px-3 py-1 rounded-full border border-rose-200">
                Le Destin a Choisi
              </span>
              <h3 className="font-serif-romantic text-2xl font-bold text-stone-900 mt-2 max-w-md mx-auto">
                « {selectedResult} »
              </h3>
              {lastSpunBy && (
                <p className="text-xs text-stone-500 mt-1">
                  Lancé par <strong>{lastSpunBy === 'p1' ? profile.partner1.name : profile.partner2.name}</strong>
                </p>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
              <button
                onClick={handleSpinWheel}
                className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer transition-all"
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span>Relancer la roulette</span>
              </button>

              {onSendChatMessage && (
                <button
                  onClick={handleShareToChat}
                  className="px-3.5 py-2 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-700 font-semibold text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <MessageCircle className="w-3.5 h-3.5 text-rose-500" />
                  <span>{sentToChatToast ? 'Envoyé dans le chat ! 💌' : 'Envoyer dans le chat'}</span>
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
