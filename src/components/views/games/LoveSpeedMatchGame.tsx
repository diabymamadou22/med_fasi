import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Zap,
  Timer,
  Trophy,
  RotateCcw,
  Sparkles,
  Send,
  Flame,
  Award,
  Volume2,
  Heart,
  CheckCircle2,
  Play,
} from 'lucide-react';
import { CoupleProfile, PartnerId } from '../../../types';
import { soundEffects } from '../../../lib/audio';
import { triggerCelebrationConfetti, triggerHeartConfetti } from '../../../lib/confetti';
import { speakEnglish } from '../../../lib/englishSpeech';

interface LoveSpeedMatchGameProps {
  profile: CoupleProfile;
  activePartnerId: PartnerId;
  speechRate: number;
  onSendChatMessage?: (msgData: { senderId: PartnerId; content: string }) => void;
  onAddXp: (amount: number) => void;
}

interface MatchPair {
  id: string;
  english: string;
  french: string;
  emoji: string;
}

const SPEED_VOCAB_POOL: MatchPair[] = [
  { id: 'p1', english: 'Soulmate', french: 'Âme sœur', emoji: '✨' },
  { id: 'p2', english: 'Sunbeam', french: 'Rayon de soleil', emoji: '☀️' },
  { id: 'p3', english: 'Whisper', french: 'Chuchotement', emoji: '🤫' },
  { id: 'p4', english: 'Cuddle', french: 'Câlin tendresse', emoji: '🧸' },
  { id: 'p5', english: 'Heartbeat', french: 'Battement de cœur', emoji: '💓' },
  { id: 'p6', english: 'Crush', french: 'Coup de foudre', emoji: '⚡' },
  { id: 'p7', english: 'Darling', french: 'Chéri(e) adoré(e)', emoji: '🍯' },
  { id: 'p8', english: 'Moonlight', french: 'Clair de lune', emoji: '🌙' },
  { id: 'p9', english: 'Forever', french: 'Pour toujours', emoji: '♾️' },
  { id: 'p10', english: 'Sweetheart', french: 'Mon petit cœur', emoji: '🍬' },
  { id: 'p11', english: 'Giggle', french: 'Rire complice', emoji: '🤭' },
  { id: 'p12', english: 'Warmth', french: 'Douce chaleur', emoji: '🔥' },
  { id: 'p13', english: 'Hold me', french: 'Serre-moi fort', emoji: '🤗' },
  { id: 'p14', english: 'Kiss me', french: 'Embrasse-moi', emoji: '💋' },
  { id: 'p15', english: 'I miss you', french: 'Tu me manques', emoji: '💌' },
  { id: 'p16', english: 'Date night', french: 'Soirée romantique', emoji: '🍷' },
  { id: 'p17', english: 'Candlelight', french: 'Aux chandelles', emoji: '🕯️' },
  { id: 'p18', english: 'Stargazing', french: 'Regarder les étoiles', emoji: '✨' },
  { id: 'p19', english: 'Soft lips', french: 'Lèvres douces', emoji: '💋' },
  { id: 'p20', english: 'True love', french: 'Amour véritable', emoji: '💖' },
  { id: 'p21', english: 'Blush', french: 'Rougir de plaisir', emoji: '😊' },
  { id: 'p22', english: 'Cherish', french: 'Chérir tendrement', emoji: '🌸' },
  { id: 'p23', english: 'Butterfly', french: 'Papillons au ventre', emoji: '🦋' },
  { id: 'p24', english: 'Holding hands', french: 'Se tenir la main', emoji: '🤝' },
  { id: 'p25', english: 'Beloved', french: 'Bien-aimé(e)', emoji: '👑' },
  { id: 'p26', english: 'Fascinating', french: 'Fascinant(e)', emoji: '🤩' },
  { id: 'p27', english: 'Dreamland', french: 'Pays des rêves', emoji: '🌌' },
  { id: 'p28', english: 'Breakfast', french: 'Petit-déjeuner', emoji: '🥐' },
  { id: 'p29', english: 'Roadtrip', french: 'Virée en amoureux', emoji: '🚗' },
  { id: 'p30', english: 'Kindness', french: 'Bienveillance', emoji: '🕊️' },
];

interface CardItem {
  uid: string;
  pairId: string;
  type: 'en' | 'fr';
  text: string;
  emoji: string;
}

export const LoveSpeedMatchGame: React.FC<LoveSpeedMatchGameProps> = ({
  profile,
  activePartnerId,
  speechRate,
  onSendChatMessage,
  onAddXp,
}) => {
  const partnerMe = activePartnerId === 'p1' ? profile.partner1 : profile.partner2;
  const partnerOther = activePartnerId === 'p1' ? profile.partner2 : profile.partner1;

  // Game state
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [timeLeft, setTimeLeft] = useState<number>(60);
  const [score, setScore] = useState<number>(0);
  const [combo, setCombo] = useState<number>(1);
  const [matchedPairsCount, setMatchedPairsCount] = useState<number>(0);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);

  // Cards on board
  const [cards, setCards] = useState<CardItem[]>([]);
  const [selectedCard, setSelectedCard] = useState<CardItem | null>(null);
  const [matchedUids, setMatchedUids] = useState<string[]>([]);
  const [wrongUids, setWrongUids] = useState<string[]>([]);

  // High score tracking
  const [highScore, setHighScore] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(`speed_match_high_${activePartnerId}`);
      return saved ? parseInt(saved, 10) : 180;
    } catch {
      return 180;
    }
  });

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Shuffle a fresh round of 6 pairs (12 cards)
  const generateNewRound = useCallback(() => {
    const shuffledPool = [...SPEED_VOCAB_POOL].sort(() => 0.5 - Math.random());
    const roundPairs = shuffledPool.slice(0, 6);

    const roundCards: CardItem[] = [];
    roundPairs.forEach((pair) => {
      roundCards.push({
        uid: `en-${pair.id}-${Math.random()}`,
        pairId: pair.id,
        type: 'en',
        text: pair.english,
        emoji: pair.emoji,
      });
      roundCards.push({
        uid: `fr-${pair.id}-${Math.random()}`,
        pairId: pair.id,
        type: 'fr',
        text: pair.french,
        emoji: pair.emoji,
      });
    });

    // Shuffle the 12 cards
    setCards(roundCards.sort(() => 0.5 - Math.random()));
    setMatchedUids([]);
    setSelectedCard(null);
    setWrongUids([]);
  }, []);

  // Start game
  const startGame = () => {
    soundEffects.playVictoryChime();
    setIsPlaying(true);
    setIsGameOver(false);
    setTimeLeft(60);
    setScore(0);
    setCombo(1);
    setMatchedPairsCount(0);
    generateNewRound();
  };

  // Timer loop
  useEffect(() => {
    if (isPlaying && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            return 0;
          }
          if (prev <= 5) {
            soundEffects.playCountdownTick();
          }
          return prev - 1;
        });
      }, 1000);
    } else if (isPlaying && timeLeft === 0) {
      // Game over
      setIsPlaying(false);
      setIsGameOver(true);
      soundEffects.playVictoryChime();
      triggerCelebrationConfetti();

      // Check high score
      if (score > highScore) {
        setHighScore(score);
        try {
          localStorage.setItem(`speed_match_high_${activePartnerId}`, score.toString());
        } catch {}
      }

      // Add complicity XP
      const xpEarned = Math.max(10, Math.floor(score / 15));
      onAddXp(xpEarned);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, timeLeft, score, highScore, activePartnerId, onAddXp]);

  // Card click handler
  const handleCardClick = (card: CardItem) => {
    if (!isPlaying || matchedUids.includes(card.uid) || wrongUids.includes(card.uid)) return;

    soundEffects.playSoftTap();

    if (card.type === 'en') {
      speakEnglish(card.text, { rate: speechRate });
    }

    if (!selectedCard) {
      // First card chosen
      setSelectedCard(card);
      return;
    }

    if (selectedCard.uid === card.uid) {
      // Deselect
      setSelectedCard(null);
      return;
    }

    // Checking if matching
    if (selectedCard.pairId === card.pairId && selectedCard.type !== card.type) {
      // MATCH!
      soundEffects.playSuccessSparkle();
      const newMatched = [...matchedUids, selectedCard.uid, card.uid];
      setMatchedUids(newMatched);

      // Points formula: 10 * combo
      const gained = 10 * combo;
      setScore((s) => s + gained);
      setCombo((c) => Math.min(c + 1, 5));
      setMatchedPairsCount((cnt) => cnt + 1);
      setSelectedCard(null);

      // If all 6 pairs on board are matched -> reload round with bonus
      if (newMatched.length === cards.length && cards.length > 0) {
        soundEffects.playVictoryChime();
        triggerHeartConfetti();
        setScore((s) => s + 50); // bonus +50
        setTimeout(() => {
          generateNewRound();
        }, 300);
      }
    } else {
      // WRONG!
      soundEffects.playHeartPulse();
      setWrongUids([selectedCard.uid, card.uid]);
      setCombo(1); // reset combo
      setTimeout(() => {
        setWrongUids([]);
        setSelectedCard(null);
      }, 500);
    }
  };

  const handleShareChallenge = () => {
    if (!onSendChatMessage) return;
    soundEffects.playSuccessSparkle();

    const text = `⚡ **Speed Match Duel Anglais terminé !**\n\n🎯 Score réalisé : **${score} pts** (${matchedPairsCount} paires trouvées en 60s) !\n🔥 Meilleur combo : x${combo}\n\n🏆 Mon record actuel : **${Math.max(score, highScore)} pts**.\n\n👉 **${partnerOther.name}**, relèves-tu le défi de faire un meilleur score que moi ?`;

    onSendChatMessage({
      senderId: activePartnerId,
      content: text,
    });
  };

  return (
    <div className="space-y-4 max-w-lg mx-auto">
      {/* Top Header Card */}
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-rose-100 shadow-xs flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-rose-500 text-white flex items-center justify-center shadow-2xs">
            <Zap className="w-5 h-5 fill-white" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-stone-900 flex items-center gap-1.5 font-serif-romantic">
              <span>Speed Match 60s</span>
              {combo > 1 && (
                <span className="text-[10px] font-sans px-2 py-0.5 rounded-full bg-amber-500 text-white font-black animate-pulse">
                  x{combo} COMBO !
                </span>
              )}
            </h2>
            <p className="text-[11px] text-stone-500">Relie les cartes le plus vite possible</p>
          </div>
        </div>

        {/* Live HUD Stats */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Timer */}
          <div
            className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold border transition-colors ${
              timeLeft <= 10 && isPlaying
                ? 'bg-rose-500 text-white border-rose-600 animate-bounce'
                : 'bg-stone-50 text-stone-700 border-stone-200'
            }`}
          >
            <Timer className="w-3.5 h-3.5 shrink-0" />
            <span>{timeLeft}s</span>
          </div>

          {/* Score */}
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold">
            <Trophy className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shrink-0" />
            <span>{score} pts</span>
          </div>
        </div>
      </div>

      {/* Main Game Screen */}
      {!isPlaying && !isGameOver && (
        <div className="bg-gradient-to-br from-white via-rose-50/50 to-amber-50/30 p-6 sm:p-8 rounded-3xl border border-rose-100 shadow-sm text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-3xl bg-gradient-to-tr from-rose-500 to-amber-500 text-white flex items-center justify-center shadow-md">
            <Zap className="w-8 h-8 fill-white" />
          </div>

          <div className="space-y-1">
            <h3 className="text-xl font-bold text-stone-900 font-serif-romantic">
              Duel Chrono Anglais ⚡
            </h3>
            <p className="text-xs sm:text-sm text-stone-600 max-w-sm mx-auto leading-relaxed">
              Associe les mots anglais et français en moins de 60 secondes. Fais grimper ton combo
              pour exploser le score de {partnerOther.name} !
            </p>
          </div>

          {/* High Score Banner */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-amber-100/70 border border-amber-200 rounded-full text-xs font-bold text-amber-900">
            <Trophy className="w-3.5 h-3.5 text-amber-600 fill-amber-500" />
            <span>Record personnel : {highScore} pts</span>
          </div>

          <div>
            <button
              type="button"
              onClick={startGame}
              className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-rose-500 via-pink-600 to-amber-500 hover:opacity-95 text-white font-bold rounded-2xl shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 mx-auto cursor-pointer text-sm"
              id="btn-start-speed-match"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Lancer le Chrono (60s)</span>
            </button>
          </div>
        </div>
      )}

      {/* Playing Cards Grid */}
      {isPlaying && (
        <div className="bg-white p-3.5 sm:p-4 rounded-3xl border border-stone-200 shadow-xs">
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 sm:gap-2.5">
            {cards.map((card) => {
              const isSelected = selectedCard?.uid === card.uid;
              const isMatched = matchedUids.includes(card.uid);
              const isWrong = wrongUids.includes(card.uid);

              if (isMatched) {
                return (
                  <div
                    key={card.uid}
                    className="h-20 sm:h-24 rounded-2xl border-2 border-dashed border-emerald-200/60 bg-emerald-50/20 flex items-center justify-center opacity-30 select-none"
                  >
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  </div>
                );
              }

              return (
                <motion.button
                  key={card.uid}
                  type="button"
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleCardClick(card)}
                  className={`h-20 sm:h-24 p-2 rounded-2xl border-2 flex flex-col items-center justify-center text-center transition-all cursor-pointer shadow-2xs select-none relative ${
                    isWrong
                      ? 'bg-rose-100 border-rose-500 text-rose-800 animate-shake'
                      : isSelected
                      ? 'bg-rose-500 border-rose-600 text-white shadow-md scale-[1.03]'
                      : card.type === 'en'
                      ? 'bg-stone-50 hover:bg-stone-100 border-stone-300 text-stone-800'
                      : 'bg-amber-50/50 hover:bg-amber-100/60 border-amber-200 text-stone-800'
                  }`}
                >
                  <span className="text-sm sm:text-base mb-1">{card.emoji}</span>
                  <span className="text-[11px] sm:text-xs font-bold leading-tight line-clamp-2">
                    {card.text}
                  </span>
                  <span
                    className={`text-[9px] mt-1 uppercase tracking-wider font-mono font-semibold opacity-70 ${
                      isSelected ? 'text-rose-100' : 'text-stone-400'
                    }`}
                  >
                    {card.type === 'en' ? 'Anglais' : 'Français'}
                  </span>
                </motion.button>
              );
            })}
          </div>
        </div>
      )}

      {/* Game Over Screen */}
      {isGameOver && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-br from-white via-rose-50/70 to-amber-50/50 p-6 sm:p-7 rounded-3xl border border-rose-200 shadow-md text-center space-y-4"
        >
          <div className="w-16 h-16 mx-auto rounded-3xl bg-gradient-to-tr from-amber-400 to-rose-500 text-white flex items-center justify-center shadow-lg">
            <Trophy className="w-8 h-8 fill-white" />
          </div>

          <div className="space-y-1">
            <h3 className="text-2xl font-bold text-stone-900 font-serif-romantic">
              Temps Écoulé ! 🏁
            </h3>
            <p className="text-xs text-stone-600">Superbe session de révision sous pression !</p>
          </div>

          <div className="grid grid-cols-2 gap-3 max-w-xs mx-auto">
            <div className="p-3 bg-white rounded-2xl border border-rose-100 shadow-2xs">
              <span className="text-2xl font-black text-rose-600">{score}</span>
              <p className="text-[11px] text-stone-500 font-medium">Points Marqués</p>
            </div>
            <div className="p-3 bg-white rounded-2xl border border-amber-100 shadow-2xs">
              <span className="text-2xl font-black text-amber-600">{matchedPairsCount}</span>
              <p className="text-[11px] text-stone-500 font-medium">Paires Réussies</p>
            </div>
          </div>

          {score >= highScore && score > 0 && (
            <div className="p-2.5 bg-amber-500 text-white rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs">
              <Sparkles className="w-4 h-4 fill-white" />
              <span>Nouveau Record Personnel Décroché ! 🏆</span>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-2 pt-2">
            <button
              type="button"
              onClick={startGame}
              className="flex-1 py-3 px-4 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-2xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer text-xs sm:text-sm"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Rejouer une Partie</span>
            </button>

            {onSendChatMessage && (
              <button
                type="button"
                onClick={handleShareChallenge}
                className="flex-1 py-3 px-4 bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 font-bold rounded-2xl shadow-2xs transition-colors flex items-center justify-center gap-2 cursor-pointer text-xs sm:text-sm"
              >
                <Send className="w-4 h-4" />
                <span>Défier {partnerOther.name}</span>
              </button>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
};
