import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  Heart,
  Zap,
  CheckCircle2,
  BookOpen,
  Volume2,
  Shuffle,
  Gift,
  Trophy,
  Gamepad2,
  MessageCircle,
  Target,
  Flame,
  Languages,
} from 'lucide-react';
import {
  CoupleProfile,
  PartnerId,
  QuizQuestion,
  DateIdea,
  CoupleChallenge,
  ChatMessage,
  EnglishLessonItem,
  EnglishLexiconItem,
  WeeklyLearningChallenge,
} from '../../types';
import { soundEffects } from '../../lib/audio';
import { triggerHeartConfetti } from '../../lib/confetti';
import { LexiconSection } from './LexiconSection';
import { WeeklyChallengesSection } from './WeeklyChallengesSection';
import { LoveRouletteGame } from './games/LoveRouletteGame';
import { FlirtCardsGame } from './games/FlirtCardsGame';
import { LoveRoleplayGame } from './games/LoveRoleplayGame';
import { LoveBlindTestGame } from './games/LoveBlindTestGame';
import { LoveVouchersSection } from './games/LoveVouchersSection';
import { INITIAL_LEXICON_WORDS } from '../../data/initialLexiconData';
import { INITIAL_WEEKLY_LEARNING_CHALLENGES } from '../../data/initialWeeklyChallenges';
import { ENGLISH_MODULES } from '../../data/englishCourseData';

interface GamesViewProps {
  profile: CoupleProfile;
  activePartnerId: PartnerId;
  quizzes: QuizQuestion[];
  dateIdeas: DateIdea[];
  challenges: CoupleChallenge[];
  onAnswerQuiz: (quizId: string, partnerId: PartnerId, answerIndex: number) => void;
  onSaveDateIdea: (idea: DateIdea) => void;
  onToggleChallenge: (challengeId: string) => void;
  onAddNewQuiz: (quiz: QuizQuestion) => void;
  onAddNewDateIdea: (idea: DateIdea) => void;
  onDeleteChallenge?: (challengeId: string) => void;
  onRemoveChallengePhoto?: (challengeId: string) => void;
  lexicon?: EnglishLexiconItem[];
  onSaveLexiconWord?: (word: EnglishLexiconItem) => void;
  onDeleteLexiconWord?: (wordId: string) => void;
  onToggleLexiconFavorite?: (wordId: string, isFavorite: boolean) => void;
  onToggleLexiconMastered?: (wordId: string, isMastered: boolean) => void;
  onSendChatMessage?: (
    msgData: Omit<ChatMessage, 'id' | 'timestamp' | 'status' | 'readStatus'>
  ) => void;
  weeklyChallenges?: WeeklyLearningChallenge[];
  onSelectActiveWeeklyChallenge?: (challengeId: string) => void;
  onSaveWeeklyChallenge?: (challenge: WeeklyLearningChallenge) => void;
  onOpenChatWithDraft?: (prefilledText: string) => void;
  initialTab?: EnglishGameTab;
}

export type EnglishGameTab =
  | 'roulette'
  | 'cards'
  | 'roleplay'
  | 'trivia'
  | 'weekly_challenges'
  | 'vouchers'
  | 'vault'
  | 'lessons'
  | 'quizzes'
  | 'dialogues'
  | 'challenges'
  | 'couple_extras';

export const GamesView: React.FC<GamesViewProps> = ({
  profile,
  activePartnerId,
  quizzes,
  dateIdeas,
  challenges,
  onAnswerQuiz,
  onSaveDateIdea,
  onToggleChallenge,
  onAddNewQuiz,
  onAddNewDateIdea,
  onDeleteChallenge,
  onRemoveChallengePhoto,
  lexicon,
  onSaveLexiconWord,
  onDeleteLexiconWord,
  onToggleLexiconFavorite,
  onToggleLexiconMastered,
  onSendChatMessage,
  weeklyChallenges,
  onSelectActiveWeeklyChallenge,
  onSaveWeeklyChallenge,
  onOpenChatWithDraft,
  initialTab,
}) => {
  // Main Tab State - default is the exciting couple game roulette or requested initialTab
  const [activeTab, setActiveTab] = useState<EnglishGameTab>(initialTab || 'roulette');
  const [speechRate, setSpeechRate] = useState<number>(0.85); // 0.85x gentle slow speed
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Notre Lexique State & persistence
  const [internalLexicon, setInternalLexicon] = useState<EnglishLexiconItem[]>(() => {
    try {
      const saved = localStorage.getItem('nid_damour_lexicon');
      return saved ? JSON.parse(saved) : INITIAL_LEXICON_WORDS;
    } catch {
      return INITIAL_LEXICON_WORDS;
    }
  });

  const effectiveLexicon = lexicon && lexicon.length > 0 ? lexicon : internalLexicon;

  useEffect(() => {
    try {
      localStorage.setItem('nid_damour_lexicon', JSON.stringify(effectiveLexicon));
    } catch {}
  }, [effectiveLexicon]);

  // Mastered items state
  const [masteredIds, setMasteredIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('english_mastered_items');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // XP Complicity points
  const [xpPoints, setXpPoints] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('english_xp_points');
      return saved ? parseInt(saved, 10) : 65; // starting bonus XP
    } catch {
      return 65;
    }
  });

  // Completed quizzes
  const [completedQuizIds, setCompletedQuizIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('english_completed_quizzes');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Save changes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('english_mastered_items', JSON.stringify(masteredIds));
    } catch {}
  }, [masteredIds]);

  useEffect(() => {
    try {
      localStorage.setItem('english_xp_points', xpPoints.toString());
    } catch {}
  }, [xpPoints]);

  useEffect(() => {
    try {
      localStorage.setItem('english_completed_quizzes', JSON.stringify(completedQuizIds));
    } catch {}
  }, [completedQuizIds]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3500);
  };

  const handleToggleMastered = (itemId: string) => {
    soundEffects.playSoftTap();
    if (masteredIds.includes(itemId)) {
      setMasteredIds((prev) => prev.filter((id) => id !== itemId));
    } else {
      setMasteredIds((prev) => [...prev, itemId]);
      setXpPoints((prev) => prev + 10);
      triggerHeartConfetti();
      showToast('✨ Mot complice acquis ! +10 pts de complicité !');
    }
  };

  const handleAddXp = (amount: number) => {
    setXpPoints((prev) => prev + amount);
  };

  const handleSaveCompletedQuiz = (quizId: string) => {
    if (!completedQuizIds.includes(quizId)) {
      setCompletedQuizIds((prev) => [...prev, quizId]);
    }
  };

  const handleSaveWord = (word: EnglishLexiconItem) => {
    if (onSaveLexiconWord) {
      onSaveLexiconWord(word);
    } else {
      setInternalLexicon((prev) => {
        const idx = prev.findIndex((w) => w.id === word.id);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = word;
          return next;
        }
        return [word, ...prev];
      });
    }
  };

  const handleDeleteWord = (wordId: string) => {
    if (onDeleteLexiconWord) {
      onDeleteLexiconWord(wordId);
    } else {
      setInternalLexicon((prev) => prev.filter((w) => w.id !== wordId));
    }
  };

  const handleToggleFavorite = (wordId: string, isFavorite: boolean) => {
    if (onToggleLexiconFavorite) {
      onToggleLexiconFavorite(wordId, isFavorite);
    } else {
      setInternalLexicon((prev) =>
        prev.map((w) => (w.id === wordId ? { ...w, isFavorite } : w))
      );
    }
  };

  const handleToggleMasteredLexicon = (wordId: string, isMastered: boolean) => {
    if (onToggleLexiconMastered) {
      onToggleLexiconMastered(wordId, isMastered);
    } else {
      setInternalLexicon((prev) =>
        prev.map((w) => (w.id === wordId ? { ...w, isMastered } : w))
      );
    }
  };

  const totalCourseWords = ENGLISH_MODULES.reduce((sum, m) => sum + m.items.length, 0);

  const coupleLevel =
    xpPoints < 100
      ? { level: 1, title: 'Débutants Amoureux 🌱', badge: 'Niveau 1' }
      : xpPoints < 250
      ? { level: 2, title: 'Duo Complice 💬', badge: 'Niveau 2' }
      : xpPoints < 500
      ? { level: 3, title: 'Amants Polyglottes ✨', badge: 'Niveau 3' }
      : { level: 4, title: 'Bilingues en Amour 🏆🇬🇧', badge: 'Niveau 4' };

  // Map backwards-compatible tab keys to the modern game tabs
  const resolvedTab: EnglishGameTab =
    activeTab === 'lessons'
      ? 'cards'
      : activeTab === 'quizzes'
      ? 'trivia'
      : activeTab === 'dialogues'
      ? 'roleplay'
      : activeTab === 'challenges' || activeTab === 'couple_extras'
      ? 'vouchers'
      : activeTab;

  return (
    <div className="max-w-6xl mx-auto px-2 sm:px-6 py-2.5 sm:py-5 space-y-3.5 sm:space-y-6 pb-24 sm:pb-8 w-full max-w-full overflow-x-hidden">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 left-4 right-4 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 z-50 bg-stone-900/95 text-white px-4 py-2.5 rounded-2xl sm:rounded-full text-xs font-semibold shadow-xl flex items-center justify-center gap-2 border border-stone-700/80 backdrop-blur-md"
          >
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="text-center">{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 1. Header Banner : Romantic Game Center */}
      <div className="bg-gradient-to-br from-white via-rose-50/60 to-amber-50/40 rounded-2xl sm:rounded-3xl p-3.5 sm:p-6 border border-rose-100 shadow-xs">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 sm:gap-4">
          <div className="space-y-1 sm:space-y-1.5 w-full md:w-auto">
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] sm:text-xs font-bold bg-rose-500 text-white shadow-2xs flex items-center gap-1">
                <Gamepad2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                <span>Jeux & Flirt à Deux</span>
              </span>
              <span className="px-2 py-0.5 rounded-full text-[11px] sm:text-xs font-semibold bg-white border border-stone-200 text-stone-700 flex items-center gap-1">
                <span className="text-stone-500">{coupleLevel.badge}:</span>
                <span className="font-bold text-rose-600">{coupleLevel.title}</span>
              </span>
            </div>

            <h1 className="text-lg sm:text-2xl font-bold text-stone-900 tracking-tight font-serif-romantic leading-snug">
              Jouons & Flirtons en Anglais à Deux 🎲💋
            </h1>
            <p className="text-xs sm:text-sm text-stone-600 max-w-2xl leading-relaxed">
              Mots doux à chuchoter, roue des gages, devinettes, blind tests et bons d'amour à débloquer : apprenez en vous amusant !
            </p>
          </div>

          {/* Couple Complicity Stats - Responsive Grid on Mobile */}
          <div className="grid grid-cols-4 gap-1 sm:flex sm:items-center sm:gap-2.5 bg-white/95 p-1.5 sm:p-3 rounded-xl sm:rounded-2xl border border-rose-100 shadow-2xs shrink-0 w-full md:w-auto">
            <div className="text-center px-1 sm:px-2 py-1 flex flex-col items-center justify-center">
              <div className="flex items-center justify-center gap-1 text-amber-600 font-bold text-xs sm:text-base">
                <Zap className="w-3.5 h-3.5 fill-amber-500 text-amber-500 shrink-0" />
                <span>{xpPoints}</span>
              </div>
              <p className="text-[9px] sm:text-[10px] text-stone-500 font-medium">Complicité</p>
            </div>

            <div className="hidden sm:block h-7 w-px bg-stone-200" />

            <button
              type="button"
              onClick={() => {
                soundEffects.playSoftTap();
                setActiveTab('vouchers');
              }}
              className="text-center px-1 sm:px-2 py-1 rounded-xl hover:bg-rose-50/60 transition-colors flex flex-col items-center justify-center cursor-pointer min-h-[40px] touch-manipulation"
              title="Voir nos bons d'amour débloqués"
            >
              <div className="flex items-center justify-center gap-1 text-rose-600 font-bold text-xs sm:text-base">
                <Gift className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                <span>Bons</span>
              </div>
              <p className="text-[9px] sm:text-[10px] text-stone-500 font-medium">Récompenses</p>
            </button>

            <div className="hidden sm:block h-7 w-px bg-stone-200" />

            <button
              type="button"
              onClick={() => {
                soundEffects.playSoftTap();
                setActiveTab('vault');
              }}
              className="text-center px-1 sm:px-2 py-1 rounded-xl hover:bg-rose-50/60 transition-colors flex flex-col items-center justify-center cursor-pointer min-h-[40px] touch-manipulation"
              title="Ouvrir notre boîte à mots doux"
            >
              <div className="flex items-center justify-center gap-1 text-rose-600 font-bold text-xs sm:text-base">
                <BookOpen className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                <span>{effectiveLexicon.length}</span>
              </div>
              <p className="text-[9px] sm:text-[10px] text-stone-500 font-medium">Mots Doux</p>
            </button>

            <div className="hidden sm:block h-7 w-px bg-stone-200" />

            {/* Audio Speed Selector */}
            <div className="text-center px-0.5 sm:px-1 flex flex-col items-center justify-center">
              <button
                type="button"
                onClick={() => {
                  setSpeechRate((r) => (r === 0.85 ? 1.0 : 0.85));
                  showToast(
                    speechRate === 0.85
                      ? 'Vitesse audio : Normale (1.0x)'
                      : 'Vitesse audio : Chuchotement doux (0.85x)'
                  );
                }}
                className="px-1.5 sm:px-2 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 text-[10px] sm:text-[11px] font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer w-full touch-manipulation"
                title="Ajuster la vitesse de prononciation audio"
              >
                <Volume2 className="w-3 h-3 text-rose-500 shrink-0" />
                <span>{speechRate === 0.85 ? '0.85x' : '1.0x'}</span>
              </button>
              <p className="text-[9px] sm:text-[10px] text-stone-500 font-medium mt-0.5">Voix</p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Playful Game Navigation Tabs - Optimized with touch fluidity and ZERO bottom scrollbars */}
      <div className="bg-white p-1.5 rounded-2xl border border-stone-200 shadow-2xs space-y-1.5 sm:space-y-0">
        {/* Mobile-First 2-Row Grid for Phones (No horizontal scrolling or cut-off tabs) */}
        <div className="sm:hidden space-y-1.5">
          {/* Row 1: 4 Mini-Jeux Rapides */}
          <div className="grid grid-cols-4 gap-1">
            <button
              type="button"
              onClick={() => {
                soundEffects.playSoftTap();
                setActiveTab('roulette');
              }}
              className={`py-2 px-1 rounded-xl text-[11px] font-bold transition-all flex flex-col items-center justify-center gap-1 cursor-pointer min-h-[46px] touch-manipulation text-center ${
                resolvedTab === 'roulette'
                  ? 'bg-rose-500 text-white shadow-2xs'
                  : 'text-stone-700 bg-stone-50 hover:bg-stone-100'
              }`}
            >
              <Shuffle className="w-3.5 h-3.5 shrink-0" />
              <span className="leading-tight truncate w-full">Roue</span>
            </button>

            <button
              type="button"
              onClick={() => {
                soundEffects.playSoftTap();
                setActiveTab('cards');
              }}
              className={`py-2 px-1 rounded-xl text-[11px] font-bold transition-all flex flex-col items-center justify-center gap-1 cursor-pointer min-h-[46px] touch-manipulation text-center ${
                resolvedTab === 'cards'
                  ? 'bg-rose-500 text-white shadow-2xs'
                  : 'text-stone-700 bg-stone-50 hover:bg-stone-100'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 shrink-0" />
              <span className="leading-tight truncate w-full">Cartes</span>
            </button>

            <button
              type="button"
              onClick={() => {
                soundEffects.playSoftTap();
                setActiveTab('roleplay');
              }}
              className={`py-2 px-1 rounded-xl text-[11px] font-bold transition-all flex flex-col items-center justify-center gap-1 cursor-pointer min-h-[46px] touch-manipulation text-center ${
                resolvedTab === 'roleplay'
                  ? 'bg-rose-500 text-white shadow-2xs'
                  : 'text-stone-700 bg-stone-50 hover:bg-stone-100'
              }`}
            >
              <MessageCircle className="w-3.5 h-3.5 shrink-0" />
              <span className="leading-tight truncate w-full">Rôles</span>
            </button>

            <button
              type="button"
              onClick={() => {
                soundEffects.playSoftTap();
                setActiveTab('trivia');
              }}
              className={`py-2 px-1 rounded-xl text-[11px] font-bold transition-all flex flex-col items-center justify-center gap-1 cursor-pointer min-h-[46px] touch-manipulation text-center ${
                resolvedTab === 'trivia'
                  ? 'bg-rose-500 text-white shadow-2xs'
                  : 'text-stone-700 bg-stone-50 hover:bg-stone-100'
              }`}
            >
              <Zap className="w-3.5 h-3.5 shrink-0" />
              <span className="leading-tight truncate w-full">Blind Test</span>
            </button>
          </div>

          {/* Row 2: Missions, Bons & Vocabulaire complice */}
          <div className="grid grid-cols-3 gap-1">
            <button
              type="button"
              onClick={() => {
                soundEffects.playSoftTap();
                setActiveTab('weekly_challenges');
              }}
              className={`py-2 px-1 rounded-xl text-[11px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer min-h-[40px] touch-manipulation text-center ${
                resolvedTab === 'weekly_challenges'
                  ? 'bg-rose-500 text-white shadow-2xs'
                  : 'text-stone-700 bg-stone-50 hover:bg-stone-100'
              }`}
            >
              <Target className="w-3.5 h-3.5 shrink-0 text-amber-500" />
              <span className="truncate">💌 Missions</span>
            </button>

            <button
              type="button"
              onClick={() => {
                soundEffects.playSoftTap();
                setActiveTab('vouchers');
              }}
              className={`py-2 px-1 rounded-xl text-[11px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer min-h-[40px] touch-manipulation text-center ${
                resolvedTab === 'vouchers'
                  ? 'bg-rose-500 text-white shadow-2xs'
                  : 'text-stone-700 bg-stone-50 hover:bg-stone-100'
              }`}
            >
              <Gift className="w-3.5 h-3.5 shrink-0 text-rose-500" />
              <span className="truncate">🎁 Bons</span>
            </button>

            <button
              type="button"
              onClick={() => {
                soundEffects.playSoftTap();
                setActiveTab('vault');
              }}
              className={`py-2 px-1 rounded-xl text-[11px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer min-h-[40px] touch-manipulation text-center ${
                resolvedTab === 'vault'
                  ? 'bg-rose-500 text-white shadow-2xs'
                  : 'text-stone-700 bg-stone-50 hover:bg-stone-100'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 shrink-0 text-rose-500" />
              <span className="truncate">📖 Mots ({effectiveLexicon.length})</span>
            </button>
          </div>
        </div>

        {/* Tablet & Desktop Horizontal Flex Row */}
        <div className="hidden sm:flex items-center gap-1.5 overflow-x-auto no-scrollbar scrollbar-none touch-pan-x">
          <button
            type="button"
            onClick={() => {
              soundEffects.playSoftTap();
              setActiveTab('roulette');
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer min-h-[38px] ${
              resolvedTab === 'roulette'
                ? 'bg-rose-500 text-white shadow-2xs'
                : 'text-stone-600 hover:bg-stone-100'
            }`}
            id="tab-game-roulette"
          >
            <Shuffle className="w-3.5 h-3.5 shrink-0" />
            <span>🎡 Roue des Gages</span>
          </button>

          <button
            type="button"
            onClick={() => {
              soundEffects.playSoftTap();
              setActiveTab('cards');
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer min-h-[38px] ${
              resolvedTab === 'cards'
                ? 'bg-rose-500 text-white shadow-2xs'
                : 'text-stone-600 hover:bg-stone-100'
            }`}
            id="tab-game-cards"
          >
            <Sparkles className="w-3.5 h-3.5 shrink-0" />
            <span>🃏 Cartes Flirt</span>
          </button>

          <button
            type="button"
            onClick={() => {
              soundEffects.playSoftTap();
              setActiveTab('roleplay');
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer min-h-[38px] ${
              resolvedTab === 'roleplay'
                ? 'bg-rose-500 text-white shadow-2xs'
                : 'text-stone-600 hover:bg-stone-100'
            }`}
            id="tab-game-roleplay"
          >
            <MessageCircle className="w-3.5 h-3.5 shrink-0" />
            <span>🎭 Rôles Complices</span>
          </button>

          <button
            type="button"
            onClick={() => {
              soundEffects.playSoftTap();
              setActiveTab('trivia');
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer min-h-[38px] ${
              resolvedTab === 'trivia'
                ? 'bg-rose-500 text-white shadow-2xs'
                : 'text-stone-600 hover:bg-stone-100'
            }`}
            id="tab-game-trivia"
          >
            <Zap className="w-3.5 h-3.5 shrink-0" />
            <span>⚡ Blind Test</span>
          </button>

          <button
            type="button"
            onClick={() => {
              soundEffects.playSoftTap();
              setActiveTab('weekly_challenges');
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer min-h-[38px] ${
              resolvedTab === 'weekly_challenges'
                ? 'bg-rose-500 text-white shadow-2xs'
                : 'text-stone-600 hover:bg-stone-100'
            }`}
            id="tab-game-weekly"
          >
            <Target className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span>💌 Missions Chat</span>
          </button>

          <button
            type="button"
            onClick={() => {
              soundEffects.playSoftTap();
              setActiveTab('vouchers');
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer min-h-[38px] ${
              resolvedTab === 'vouchers'
                ? 'bg-rose-500 text-white shadow-2xs'
                : 'text-stone-600 hover:bg-stone-100'
            }`}
            id="tab-game-vouchers"
          >
            <Gift className="w-3.5 h-3.5 shrink-0" />
            <span>🎁 Bons d'Amour</span>
          </button>

          <button
            type="button"
            onClick={() => {
              soundEffects.playSoftTap();
              setActiveTab('vault');
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer min-h-[38px] ${
              resolvedTab === 'vault'
                ? 'bg-rose-500 text-white shadow-2xs'
                : 'text-stone-600 hover:bg-stone-100'
            }`}
            id="tab-game-vault"
          >
            <BookOpen className="w-3.5 h-3.5 text-rose-500 shrink-0" />
            <span>📖 Mots Doux <span className="text-[11px] opacity-80 font-mono">({effectiveLexicon.length})</span></span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. ACTIVE GAME TAB VIEWS */}
      {/* ========================================================================= */}

      {/* Tab 1: Interactive Love Roulette Game */}
      {resolvedTab === 'roulette' && (
        <LoveRouletteGame
          profile={profile}
          activePartnerId={activePartnerId}
          speechRate={speechRate}
          onSendChatMessage={onSendChatMessage}
          onAddXp={handleAddXp}
          onSaveToLexicon={(item) =>
            handleSaveWord({
              id: `lex-${Date.now()}`,
              english: item.english,
              french: item.french,
              phonetic: item.phonetic,
              category: 'romantique',
              addedBy: activePartnerId,
              isFavorite: true,
              isMastered: false,
              createdAt: new Date().toISOString(),
            })
          }
        />
      )}

      {/* Tab 2: Flirt Cards & Guessing Deck */}
      {resolvedTab === 'cards' && (
        <FlirtCardsGame
          profile={profile}
          activePartnerId={activePartnerId}
          speechRate={speechRate}
          masteredIds={masteredIds}
          onToggleMastered={handleToggleMastered}
          onSendChatMessage={onSendChatMessage}
          onAddXp={handleAddXp}
          onSaveToLexicon={(item) =>
            handleSaveWord({
              id: `lex-${Date.now()}`,
              english: item.english,
              french: item.french,
              phonetic: item.phonetic,
              category: 'romantique',
              addedBy: activePartnerId,
              isFavorite: true,
              isMastered: false,
              createdAt: new Date().toISOString(),
            })
          }
        />
      )}

      {/* Tab 3: Theatrical Roleplay Scenarios for Two */}
      {resolvedTab === 'roleplay' && (
        <LoveRoleplayGame
          profile={profile}
          activePartnerId={activePartnerId}
          speechRate={speechRate}
          onSendChatMessage={onSendChatMessage}
          onAddXp={handleAddXp}
        />
      )}

      {/* Tab 4: Audio Blind Test & Sentence Scramble Puzzles */}
      {resolvedTab === 'trivia' && (
        <LoveBlindTestGame
          profile={profile}
          activePartnerId={activePartnerId}
          speechRate={speechRate}
          completedQuizIds={completedQuizIds}
          onAddXp={handleAddXp}
          onSaveCompletedQuiz={handleSaveCompletedQuiz}
        />
      )}

      {/* Tab 5: Secret Weekly Missions for the Couple Chat */}
      {resolvedTab === 'weekly_challenges' && (
        <WeeklyChallengesSection
          profile={profile}
          activePartnerId={activePartnerId}
          challenges={
            weeklyChallenges && weeklyChallenges.length > 0
              ? weeklyChallenges
              : INITIAL_WEEKLY_LEARNING_CHALLENGES
          }
          onSelectActiveChallenge={onSelectActiveWeeklyChallenge || (() => {})}
          onSaveChallenge={onSaveWeeklyChallenge || (() => {})}
          onSaveLexiconWord={onSaveLexiconWord}
          onSendChatMessage={onSendChatMessage}
          onOpenChatWithDraft={onOpenChatWithDraft}
          onAddXp={handleAddXp}
        />
      )}

      {/* Tab 6: Unlockable Love Vouchers & Date Roulette */}
      {resolvedTab === 'vouchers' && (
        <LoveVouchersSection
          profile={profile}
          activePartnerId={activePartnerId}
          xpPoints={xpPoints}
          dateIdeas={dateIdeas}
          onSendChatMessage={onSendChatMessage}
          onOpenLexicon={() => setActiveTab('vault')}
        />
      )}

      {/* Tab 7: Couple's Sweet Words Vault (Lexicon) */}
      {resolvedTab === 'vault' && (
        <LexiconSection
          profile={profile}
          activePartnerId={activePartnerId}
          words={effectiveLexicon}
          speechRate={speechRate}
          onSaveWord={handleSaveWord}
          onDeleteWord={handleDeleteWord}
          onToggleFavorite={handleToggleFavorite}
          onToggleMastered={handleToggleMasteredLexicon}
          onSendChatMessage={onSendChatMessage}
        />
      )}
    </div>
  );
};
