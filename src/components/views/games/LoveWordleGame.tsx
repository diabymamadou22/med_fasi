import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Volume2,
  Sparkles,
  RefreshCw,
  Trophy,
  Send,
  Heart,
  HelpCircle,
  Lightbulb,
  PartyPopper,
  Flame,
  Award,
  Calendar,
} from 'lucide-react';
import { CoupleProfile, PartnerId } from '../../../types';
import { soundEffects } from '../../../lib/audio';
import { triggerCelebrationConfetti, triggerHeartConfetti } from '../../../lib/confetti';
import { speakEnglish } from '../../../lib/englishSpeech';

interface LoveWordleGameProps {
  profile: CoupleProfile;
  activePartnerId: PartnerId;
  speechRate: number;
  onSendChatMessage?: (msgData: { senderId: PartnerId; content: string }) => void;
  onAddXp: (amount: number) => void;
}

interface SecretWordItem {
  word: string; // 5 letters
  french: string;
  phonetic: string;
  category: string;
  exampleEn: string;
  exampleFr: string;
  pledge: string; // Gage affectueux gagné
}

const LOVE_WORDS_POOL: SecretWordItem[] = [
  {
    word: 'HONEY',
    french: 'Chéri(e) / Miel',
    phonetic: '[ hʌn.i ]',
    category: 'Mots Doux 🍯',
    exampleEn: 'You are sweeter than honey, my love.',
    exampleFr: 'Tu es plus doux(ce) que le miel, mon amour.',
    pledge: 'Un câlin géant et serré de 45 secondes sans parler.',
  },
  {
    word: 'SWEET',
    french: 'Doux / Tendre',
    phonetic: '[ swiːt ]',
    category: 'Tendresse 🍬',
    exampleEn: 'Your sweet smile melts my heart every single day.',
    exampleFr: 'Ton doux sourire fait fondre mon cœur chaque jour.',
    pledge: 'Un bisou délicat sur le front et sur chaque joue.',
  },
  {
    word: 'HEART',
    french: 'Cœur',
    phonetic: '[ hɑːrt ]',
    category: 'Amour Pur ❤️',
    exampleEn: 'My heart beats only for you.',
    exampleFr: 'Mon cœur ne bat que pour toi.',
    pledge: 'Ton partenaire doit te chuchoter 3 qualités qu\'il adore chez toi.',
  },
  {
    word: 'DREAM',
    french: 'Rêve / Rêver',
    phonetic: '[ driːm ]',
    category: 'Romantique 🌙',
    exampleEn: 'Being with you is a dream come true.',
    exampleFr: 'Être avec toi est un rêve devenu réalité.',
    pledge: 'Raconter votre prochain voyage de rêve ensemble pendant 2 minutes.',
  },
  {
    word: 'LOVER',
    french: 'Amant(e) / Amoureux',
    phonetic: '[ lʌv.ər ]',
    category: 'Passion 🔥',
    exampleEn: 'You are my lover, my best friend, and my all.',
    exampleFr: 'Tu es mon amour, mon meilleur ami et mon tout.',
    pledge: 'Un baiser passionné de 15 secondes sans interruption !',
  },
  {
    word: 'CHARM',
    french: 'Charme / Envoûter',
    phonetic: '[ tʃɑːrm ]',
    category: 'Séduction ✨',
    exampleEn: 'I completely fell under your charming spell.',
    exampleFr: 'Je suis totalement tombé(e) sous ton charme envoûtant.',
    pledge: 'Ton partenaire doit te faire un clin d\'œil sexy et un compliment.',
  },
  {
    word: 'BLISS',
    french: 'Félicité / Bonheur absolu',
    phonetic: '[ blɪs ]',
    category: 'Émotion 🕊️',
    exampleEn: 'Every quiet moment in your arms is pure bliss.',
    exampleFr: 'Chaque moment calme dans tes bras est un bonheur absolu.',
    pledge: 'Un massage relaxant des épaules ou du cou pendant 3 minutes.',
  },
  {
    word: 'SMILE',
    french: 'Sourire',
    phonetic: '[ smaɪl ]',
    category: 'Rayonnement 😊',
    exampleEn: 'Your smile lights up my darkest days.',
    exampleFr: 'Ton sourire illumine mes journées les plus sombres.',
    pledge: 'Faire votre plus belle grimace puis votre plus beau sourire ensemble.',
  },
  {
    word: 'TOUCH',
    french: 'Toucher / Caresser',
    phonetic: '[ tʌtʃ ]',
    category: 'Sensualité 🤲',
    exampleEn: 'Just one touch from you gives me warm chills.',
    exampleFr: 'Un seul contact de ta main me donne de doux frissons.',
    pledge: 'Une caresse douce dans les cheveux ou sur les mains.',
  },
  {
    word: 'TRUST',
    french: 'Confiance',
    phonetic: '[ trʌst ]',
    category: 'Complicité 🤝',
    exampleEn: 'Trust and laughter are our greatest superpowers.',
    exampleFr: 'La confiance et le rire sont nos plus grands super-pouvoirs.',
    pledge: 'Se regarder droit dans les yeux pendant 30 secondes sans rigoler.',
  },
  {
    word: 'MAGIC',
    french: 'Magie / Magique',
    phonetic: '[ mædʒ.ɪk ]',
    category: 'Émerveillement 🪄',
    exampleEn: 'There is something truly magical between us.',
    exampleFr: 'Il y a quelque chose de véritablement magique entre nous.',
    pledge: 'Ton partenaire doit te préparer ta boisson préférée aujourd\'hui.',
  },
  {
    word: 'SHINE',
    french: 'Briller / Éclat',
    phonetic: '[ ʃaɪn ]',
    category: 'Lumière ☀️',
    exampleEn: 'You make my whole world shine brighter.',
    exampleFr: 'Tu fais briller mon monde entier avec éclat.',
    pledge: 'Un mot doux écrit en anglais sur un post-it à cacher aujourd\'hui.',
  },
  {
    word: 'FLIRT',
    french: 'Flirter / Séduire',
    phonetic: '[ flɜːrt ]',
    category: 'Jeu & Piquant 💋',
    exampleEn: 'I still love to flirt with you like the first day.',
    exampleFr: 'J\'adore encore flirter avec toi comme au premier jour.',
    pledge: 'Chuchoter une phrase aguicheuse à l\'oreille en anglais.',
  },
  {
    word: 'ANGEL',
    french: 'Ange',
    phonetic: '[ eɪn.dʒəl ]',
    category: 'Tendresse 👼',
    exampleEn: 'You are the gentle angel sent to warm my life.',
    exampleFr: 'Tu es l\'ange bienveillant venu réchauffer ma vie.',
    pledge: 'Prendre l\'autre dans ses bras en murmurant "My sweet angel".',
  },
  {
    word: 'ADORE',
    french: 'Adorer / Chérir',
    phonetic: '[ əˈdɔːr ]',
    category: 'Passion 💖',
    exampleEn: 'I truly adore every little thing about you.',
    exampleFr: 'J\'adore véritablement chaque petit détail chez toi.',
    pledge: 'Dire à voix haute 3 choses précises que tu adores chez ton partenaire.',
  },
  {
    word: 'LUCKY',
    french: 'Chanceux / Veinard',
    phonetic: '[ lʌk.i ]',
    category: 'Gratitude 🍀',
    exampleEn: 'I feel so lucky to wake up by your side.',
    exampleFr: 'Je me sens tellement chanceux(se) de me réveiller à tes côtés.',
    pledge: 'Offrir un joker "dispense de corvée" valable toute la journée.',
  },
  {
    word: 'SPARK',
    french: 'Étincelle',
    phonetic: '[ spɑːrk ]',
    category: 'Complicité ⚡',
    exampleEn: 'The spark between us grows stronger every day.',
    exampleFr: 'L\'étincelle entre nous grandit chaque jour un peu plus.',
    pledge: 'Danser un slow improvisé de 1 minute sans musique.',
  },
  {
    word: 'BLOOM',
    french: 'Fleurir / Éclore',
    phonetic: '[ bluːm ]',
    category: 'Amour 🌸',
    exampleEn: 'Our love blooms like flowers in the springtime.',
    exampleFr: 'Notre amour s\'épanouit comme les fleurs au printemps.',
    pledge: 'Donner un surnom anglais mignon et affectueux à ton amour.',
  },
];

const KEYBOARD_ROWS = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'BACK'],
];

const MAX_ATTEMPTS = 6;
const WORD_LENGTH = 5;

export const LoveWordleGame: React.FC<LoveWordleGameProps> = ({
  profile,
  activePartnerId,
  speechRate,
  onSendChatMessage,
  onAddXp,
}) => {
  const partnerMe = activePartnerId === 'p1' ? profile.partner1 : profile.partner2;
  const partnerOther = activePartnerId === 'p1' ? profile.partner2 : profile.partner1;

  // Selected word
  const [wordIndex, setWordIndex] = useState<number>(() => {
    // Generate daily word based on date or random
    const dayOfYear = Math.floor(
      (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
    );
    return dayOfYear % LOVE_WORDS_POOL.length;
  });

  const secretItem = LOVE_WORDS_POOL[wordIndex];
  const secretWord = secretItem.word;

  const [guesses, setGuesses] = useState<string[]>([]);
  const [currentInput, setCurrentInput] = useState<string>('');
  const [gameStatus, setGameStatus] = useState<'playing' | 'won' | 'lost'>('playing');
  const [shakeRow, setShakeRow] = useState<boolean>(false);
  const [showHint, setShowHint] = useState<boolean>(false);
  const [toast, setToast] = useState<string | null>(null);

  // Daily streak
  const [streak, setStreak] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('love_wordle_streak');
      return saved ? parseInt(saved, 10) : 3;
    } catch {
      return 3;
    }
  });

  const triggerToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast((prev) => (prev === msg ? null : prev)), 3000);
  };

  const handleNextWord = () => {
    soundEffects.playSoftTap();
    const nextIdx = (wordIndex + 1) % LOVE_WORDS_POOL.length;
    setWordIndex(nextIdx);
    setGuesses([]);
    setCurrentInput('');
    setGameStatus('playing');
    setShowHint(false);
  };

  // Check letter status in guesses
  const getLetterStatus = (letter: string, guess: string, position: number) => {
    if (secretWord[position] === letter) {
      return 'correct'; // green
    }
    if (secretWord.includes(letter)) {
      return 'present'; // yellow
    }
    return 'absent'; // gray
  };

  // Keyboard letter colors
  const keyStatuses = useMemo(() => {
    const map: Record<string, 'correct' | 'present' | 'absent'> = {};
    guesses.forEach((guess) => {
      guess.split('').forEach((letter, idx) => {
        const current = map[letter];
        if (secretWord[idx] === letter) {
          map[letter] = 'correct';
        } else if (secretWord.includes(letter) && current !== 'correct') {
          map[letter] = 'present';
        } else if (!current) {
          map[letter] = 'absent';
        }
      });
    });
    return map;
  }, [guesses, secretWord]);

  // Submit current guess
  const handleSubmitGuess = useCallback(() => {
    if (gameStatus !== 'playing') return;

    if (currentInput.length !== WORD_LENGTH) {
      setShakeRow(true);
      soundEffects.playHeartPulse();
      triggerToast(`Le mot doit comporter exactement ${WORD_LENGTH} lettres !`);
      setTimeout(() => setShakeRow(false), 500);
      return;
    }

    const nextGuesses = [...guesses, currentInput];
    setGuesses(nextGuesses);
    setCurrentInput('');

    if (currentInput === secretWord) {
      // WON !
      setGameStatus('won');
      soundEffects.playVictoryChime();
      triggerCelebrationConfetti();
      triggerHeartConfetti();
      const newStreak = streak + 1;
      setStreak(newStreak);
      try {
        localStorage.setItem('love_wordle_streak', newStreak.toString());
      } catch {}
      onAddXp(25);
      triggerToast('🎉 Bravo ! Mot trouvé avec succès ! +25 XP');
    } else if (nextGuesses.length >= MAX_ATTEMPTS) {
      // LOST
      setGameStatus('lost');
      soundEffects.playHeartPulse();
      triggerToast(`Oh non ! Le mot secret était : ${secretWord}`);
    } else {
      soundEffects.playSoftTap();
    }
  }, [currentInput, gameStatus, guesses, onAddXp, secretWord, streak]);

  // Handle typing from on-screen or physical keyboard
  const handleKeyPress = useCallback(
    (key: string) => {
      if (gameStatus !== 'playing') return;

      if (key === 'ENTER') {
        handleSubmitGuess();
      } else if (key === 'BACK' || key === 'BACKSPACE') {
        setCurrentInput((prev) => prev.slice(0, -1));
        soundEffects.playSoftTap();
      } else if (/^[A-Z]$/i.test(key) && currentInput.length < WORD_LENGTH) {
        setCurrentInput((prev) => (prev + key.toUpperCase()).slice(0, WORD_LENGTH));
        soundEffects.playSoftTap();
      }
    },
    [currentInput, gameStatus, handleSubmitGuess]
  );

  // Physical keyboard listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        handleKeyPress('ENTER');
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        handleKeyPress('BACK');
      } else if (/^[a-zA-Z]$/.test(e.key)) {
        e.preventDefault();
        handleKeyPress(e.key.toUpperCase());
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyPress]);

  const handleShareToChat = () => {
    if (!onSendChatMessage) return;
    soundEffects.playSuccessSparkle();

    const squares = guesses
      .map((g) => {
        return g
          .split('')
          .map((letter, i) => {
            if (secretWord[i] === letter) return '🟩';
            if (secretWord.includes(letter)) return '🟨';
            return '⬛';
          })
          .join('');
      })
      .join('\n');

    const messageContent = `💌 **Love Wordle Réussi !** (${guesses.length}/${MAX_ATTEMPTS} essais)\n\n${squares}\n\n✨ Mot : **${secretWord}** (${secretItem.french})\n🗣️ "${secretItem.exampleEn}"\n\n🎁 **Mon gage gagné à réclamer :**\n*${secretItem.pledge}*`;

    onSendChatMessage({
      senderId: activePartnerId,
      content: messageContent,
    });
    triggerToast('💌 Défi et gage partagés sur le chat avec succès !');
  };

  return (
    <div className="space-y-4 max-w-lg mx-auto">
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-2.5 bg-stone-900 text-white text-xs font-semibold rounded-xl text-center shadow-lg border border-stone-700"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Bar */}
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-rose-100 shadow-xs flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-rose-500 to-pink-500 text-white flex items-center justify-center shadow-2xs">
            <Heart className="w-5 h-5 fill-white" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-stone-900 flex items-center gap-1.5 font-serif-romantic">
              <span>Love Wordle</span>
              <span className="text-[10px] font-sans px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 font-bold">
                5 Lettres
              </span>
            </h2>
            <p className="text-[11px] text-stone-500">Devine le mot d'amour en 6 essais</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold">
            <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
            <span>Série : {streak} 🔥</span>
          </div>
          <button
            type="button"
            onClick={() => setShowHint(!showHint)}
            className={`p-2 rounded-xl border transition-colors cursor-pointer ${
              showHint
                ? 'bg-amber-100 border-amber-300 text-amber-800'
                : 'bg-stone-50 hover:bg-stone-100 border-stone-200 text-stone-600'
            }`}
            title="Indice sur le mot"
          >
            <Lightbulb className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Clue / Hint Box */}
      <AnimatePresence>
        {showHint && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="p-3 bg-amber-50/90 border border-amber-200 rounded-2xl text-xs text-amber-900 space-y-1">
              <div className="flex items-center gap-1 font-bold">
                <Lightbulb className="w-3.5 h-3.5 text-amber-600" />
                <span>Indice complice :</span>
              </div>
              <p>
                Thème : <strong>{secretItem.category}</strong>. Première lettre :{' '}
                <strong className="text-amber-700 font-mono text-sm">{secretWord[0]}</strong>.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Wordle Grid (6 rows of 5 boxes) */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-stone-200 shadow-xs flex flex-col items-center">
        <div className="grid grid-rows-6 gap-2 w-full max-w-[280px]">
          {Array.from({ length: MAX_ATTEMPTS }).map((_, rowIndex) => {
            const isCurrentRow = rowIndex === guesses.length;
            const guess = guesses[rowIndex] || (isCurrentRow ? currentInput : '');
            const isSubmitted = rowIndex < guesses.length;
            const isShaking = isCurrentRow && shakeRow;

            return (
              <motion.div
                key={`row-${rowIndex}`}
                animate={isShaking ? { x: [-8, 8, -6, 6, -3, 3, 0] } : {}}
                transition={{ duration: 0.4 }}
                className="grid grid-cols-5 gap-2"
              >
                {Array.from({ length: WORD_LENGTH }).map((__, colIndex) => {
                  const letter = guess[colIndex] || '';
                  let bgClass = 'bg-stone-50 border-stone-300 text-stone-800';

                  if (isSubmitted) {
                    const status = getLetterStatus(letter, guess, colIndex);
                    if (status === 'correct') {
                      bgClass = 'bg-emerald-500 border-emerald-600 text-white shadow-xs font-black';
                    } else if (status === 'present') {
                      bgClass = 'bg-amber-500 border-amber-600 text-white shadow-xs font-black';
                    } else {
                      bgClass = 'bg-stone-400/80 border-stone-500 text-white';
                    }
                  } else if (letter) {
                    bgClass = 'bg-white border-rose-400 text-stone-900 scale-105 shadow-2xs font-bold';
                  }

                  return (
                    <div
                      key={`cell-${rowIndex}-${colIndex}`}
                      className={`h-11 sm:h-12 w-full rounded-xl border-2 flex items-center justify-center font-mono text-lg sm:text-xl font-bold transition-all select-none ${bgClass}`}
                    >
                      {letter}
                    </div>
                  );
                })}
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Victory / Defeat Modal Summary */}
      <AnimatePresence>
        {gameStatus !== 'playing' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`p-4 sm:p-5 rounded-3xl border shadow-md space-y-3.5 ${
              gameStatus === 'won'
                ? 'bg-gradient-to-br from-rose-50 via-pink-50 to-amber-50 border-rose-200'
                : 'bg-stone-50 border-stone-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {gameStatus === 'won' ? (
                  <div className="w-10 h-10 rounded-2xl bg-rose-500 text-white flex items-center justify-center shadow-xs">
                    <PartyPopper className="w-5 h-5" />
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-2xl bg-stone-500 text-white flex items-center justify-center shadow-xs">
                    <HelpCircle className="w-5 h-5" />
                  </div>
                )}
                <div>
                  <h3 className="text-base font-bold text-stone-900">
                    {gameStatus === 'won' ? 'Victoire Complice ! 🏆' : 'Proche du but !'}
                  </h3>
                  <p className="text-xs text-stone-600">
                    {gameStatus === 'won'
                      ? `Trouvé en ${guesses.length} essai${guesses.length > 1 ? 's' : ''} !`
                      : `Le mot secret était ${secretWord}`}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => speakEnglish(secretWord, { rate: speechRate })}
                className="p-2.5 rounded-xl bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 shadow-2xs flex items-center gap-1.5 text-xs font-bold cursor-pointer"
                title="Écouter la prononciation"
              >
                <Volume2 className="w-4 h-4" />
                <span>Prononcer</span>
              </button>
            </div>

            {/* Secret Word Info */}
            <div className="bg-white/90 p-3.5 rounded-2xl border border-rose-100 shadow-2xs space-y-1.5">
              <div className="flex items-baseline justify-between">
                <span className="text-xl font-bold font-mono tracking-wider text-rose-600">
                  {secretWord}
                </span>
                <span className="text-xs font-mono text-stone-400">{secretItem.phonetic}</span>
              </div>
              <p className="text-xs font-semibold text-stone-800">
                Traduction : <span className="text-rose-600 font-bold">{secretItem.french}</span>
              </p>
              <p className="text-xs text-stone-600 italic bg-rose-50/60 p-2 rounded-xl">
                « {secretItem.exampleEn} »<br />
                <span className="text-stone-500 not-italic text-[11px]">— {secretItem.exampleFr}</span>
              </p>
            </div>

            {/* Romantic Pledge Forfeit */}
            {gameStatus === 'won' && (
              <div className="bg-gradient-to-r from-rose-500 to-pink-600 text-white p-3.5 rounded-2xl shadow-xs space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-rose-100">
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Gage amoureux débloqué pour {partnerOther.name} :</span>
                </div>
                <p className="text-xs sm:text-sm font-semibold">{secretItem.pledge}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-2 pt-1">
              {gameStatus === 'won' && onSendChatMessage && (
                <button
                  type="button"
                  onClick={handleShareToChat}
                  className="flex-1 py-2.5 px-3 bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 rounded-xl text-xs font-bold shadow-2xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Envoyer sur le Chat</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleNextWord}
                className="flex-1 py-2.5 px-3 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-bold shadow-2xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Nouveau Mot</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* On-screen Touch Keyboard */}
      <div className="bg-stone-100/90 p-2 sm:p-2.5 rounded-2xl border border-stone-200 space-y-1.5 shadow-2xs">
        {KEYBOARD_ROWS.map((row, rIdx) => (
          <div key={`kb-row-${rIdx}`} className="flex justify-center gap-1 sm:gap-1.5">
            {row.map((key) => {
              const isAction = key === 'ENTER' || key === 'BACK';
              const status = keyStatuses[key];

              let keyClass = 'bg-white text-stone-800 border-stone-300 hover:bg-stone-50';
              if (status === 'correct') {
                keyClass = 'bg-emerald-500 text-white border-emerald-600 font-black';
              } else if (status === 'present') {
                keyClass = 'bg-amber-500 text-white border-amber-600 font-black';
              } else if (status === 'absent') {
                keyClass = 'bg-stone-300 text-stone-500 border-stone-400 opacity-60';
              }

              return (
                <button
                  key={`key-${key}`}
                  type="button"
                  onClick={() => handleKeyPress(key)}
                  className={`h-11 sm:h-12 rounded-lg font-bold text-xs sm:text-sm border shadow-2xs flex items-center justify-center transition-all select-none cursor-pointer active:scale-95 ${
                    isAction ? 'px-2.5 sm:px-3.5 bg-rose-100 text-rose-800 border-rose-300 text-[11px]' : 'flex-1 max-w-[34px] sm:max-w-[40px]'
                  } ${keyClass}`}
                >
                  {key === 'BACK' ? '⌫' : key}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};
