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
import { LoveWordleGame } from './games/LoveWordleGame';
import { LoveSpeedMatchGame } from './games/LoveSpeedMatchGame';
import { LoveVoiceChallengeGame } from './games/LoveVoiceChallengeGame';
import { RomanticMadLibsGame } from './games/RomanticMadLibsGame';
import { SecretDateMissionsGame } from './games/SecretDateMissionsGame';
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
  | 'wordle'
  | 'speed_match'
  | 'voice_coach'
  | 'mad_libs'
  | 'date_missions'
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
  // Main Tab State - default is Love Wordle or requested initialTab
  const [activeTab, setActiveTab] = useState<EnglishGameTab>(initialTab || 'wordle');
  const [speechRate, setSpeechRate] = useState<number>(0.85); // 0.85x gentle slow speed
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Grouping for navigation: 'english_games' (the 5 new games) vs 'couple_flirt'
  const isEnglishGame = [
    'wordle',
    'speed_match',
    'voice_coach',
    'mad_libs',
    'date_missions',
  ].includes(activeTab);

  const [activeNavGroup, setActiveNavGroup] = useState<'english_games' | 'couple_flirt'>(
    isEnglishGame ? 'english_games' : 'couple_flirt'
  );

  useEffect(() => {
    if (
      ['wordle', 'speed_match', 'voice_coach', 'mad_libs', 'date_missions'].includes(activeTab)
    ) {
      setActiveNavGroup('english_games');
    } else {
      setActiveNavGroup('couple_flirt');
    }
  }, [activeTab]);

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

      {/* 2. Playful Game Navigation Tabs */}
      <div className="bg-white p-2 rounded-2xl border border-stone-200 shadow-2xs space-y-2">
        {/* Main Category Filter (English Games vs Couple Flirt) */}
        <div className="grid grid-cols-2 gap-1.5 p-1 bg-stone-100/80 rounded-xl">
          <button
            type="button"
            onClick={() => {
              soundEffects.playSoftTap();
              setActiveNavGroup('english_games');
              if (
                !['wordle', 'speed_match', 'voice_coach', 'mad_libs', 'date_missions'].includes(
                  resolvedTab
                )
              ) {
                setActiveTab('wordle');
              }
            }}
            className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer text-center ${
              activeNavGroup === 'english_games'
                ? 'bg-white text-rose-600 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-rose-500" />
            <span>Jeux d'Anglais (5)</span>
            <span className="text-[9px] bg-rose-100 text-rose-700 px-1.5 py-0.2 rounded-full uppercase tracking-wider font-extrabold hidden sm:inline">
              Nouveau
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              soundEffects.playSoftTap();
              setActiveNavGroup('couple_flirt');
              if (
                ['wordle', 'speed_match', 'voice_coach', 'mad_libs', 'date_missions'].includes(
                  resolvedTab
                )
              ) {
                setActiveTab('roulette');
              }
            }}
            className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer text-center ${
              activeNavGroup === 'couple_flirt'
                ? 'bg-white text-rose-600 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
            <span>Flirt & Activités (7)</span>
          </button>
        </div>

        {/* Sub-Tabs: Group 1 (English Games) */}
        {activeNavGroup === 'english_games' && (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
            <button
              type="button"
              onClick={() => {
                soundEffects.playSoftTap();
                setActiveTab('wordle');
              }}
              className={`p-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer text-center min-h-[44px] ${
                resolvedTab === 'wordle'
                  ? 'bg-rose-500 text-white shadow-2xs'
                  : 'bg-rose-50/50 hover:bg-rose-100/70 text-stone-700 border border-rose-100'
              }`}
            >
              <Heart className="w-3.5 h-3.5 shrink-0" />
              <div className="text-left">
                <p className="leading-tight">Love Wordle</p>
                <p className={`text-[9px] ${resolvedTab === 'wordle' ? 'text-rose-100' : 'text-stone-400'}`}>
                  Mot secret & gages
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                soundEffects.playSoftTap();
                setActiveTab('speed_match');
              }}
              className={`p-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer text-center min-h-[44px] ${
                resolvedTab === 'speed_match'
                  ? 'bg-rose-500 text-white shadow-2xs'
                  : 'bg-rose-50/50 hover:bg-rose-100/70 text-stone-700 border border-rose-100'
              }`}
            >
              <Zap className="w-3.5 h-3.5 shrink-0" />
              <div className="text-left">
                <p className="leading-tight">Speed Match</p>
                <p className={`text-[9px] ${resolvedTab === 'speed_match' ? 'text-rose-100' : 'text-stone-400'}`}>
                  Duel chrono 60s
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                soundEffects.playSoftTap();
                setActiveTab('voice_coach');
              }}
              className={`p-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer text-center min-h-[44px] ${
                resolvedTab === 'voice_coach'
                  ? 'bg-rose-500 text-white shadow-2xs'
                  : 'bg-rose-50/50 hover:bg-rose-100/70 text-stone-700 border border-rose-100'
              }`}
            >
              <Volume2 className="w-3.5 h-3.5 shrink-0" />
              <div className="text-left">
                <p className="leading-tight">Coach Vocal</p>
                <p className={`text-[9px] ${resolvedTab === 'voice_coach' ? 'text-rose-100' : 'text-stone-400'}`}>
                  Accent & audio
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                soundEffects.playSoftTap();
                setActiveTab('mad_libs');
              }}
              className={`p-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer text-center min-h-[44px] ${
                resolvedTab === 'mad_libs'
                  ? 'bg-rose-500 text-white shadow-2xs'
                  : 'bg-rose-50/50 hover:bg-rose-100/70 text-stone-700 border border-rose-100'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 shrink-0" />
              <div className="text-left">
                <p className="leading-tight">Mad Libs</p>
                <p className={`text-[9px] ${resolvedTab === 'mad_libs' ? 'text-rose-100' : 'text-stone-400'}`}>
                  Histoire à trous
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                soundEffects.playSoftTap();
                setActiveTab('date_missions');
              }}
              className={`p-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer text-center min-h-[44px] col-span-2 sm:col-span-1 ${
                resolvedTab === 'date_missions'
                  ? 'bg-rose-500 text-white shadow-2xs'
                  : 'bg-rose-50/50 hover:bg-rose-100/70 text-stone-700 border border-rose-100'
              }`}
            >
              <Target className="w-3.5 h-3.5 shrink-0" />
              <div className="text-left">
                <p className="leading-tight">Missions Date</p>
                <p className={`text-[9px] ${resolvedTab === 'date_missions' ? 'text-rose-100' : 'text-stone-400'}`}>
                  Dans la vraie vie
                </p>
              </div>
            </button>
          </div>
        )}

        {/* Sub-Tabs: Group 2 (Couple Flirt & Activities) */}
        {activeNavGroup === 'couple_flirt' && (
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-1.5">
            <button
              type="button"
              onClick={() => {
                soundEffects.playSoftTap();
                setActiveTab('roulette');
              }}
              className={`p-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer text-center min-h-[40px] ${
                resolvedTab === 'roulette'
                  ? 'bg-rose-500 text-white shadow-2xs'
                  : 'bg-stone-50 hover:bg-stone-100 text-stone-700'
              }`}
            >
              <Shuffle className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Roue</span>
            </button>

            <button
              type="button"
              onClick={() => {
                soundEffects.playSoftTap();
                setActiveTab('cards');
              }}
              className={`p-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer text-center min-h-[40px] ${
                resolvedTab === 'cards'
                  ? 'bg-rose-500 text-white shadow-2xs'
                  : 'bg-stone-50 hover:bg-stone-100 text-stone-700'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Cartes</span>
            </button>

            <button
              type="button"
              onClick={() => {
                soundEffects.playSoftTap();
                setActiveTab('roleplay');
              }}
              className={`p-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer text-center min-h-[40px] ${
                resolvedTab === 'roleplay'
                  ? 'bg-rose-500 text-white shadow-2xs'
                  : 'bg-stone-50 hover:bg-stone-100 text-stone-700'
              }`}
            >
              <MessageCircle className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Rôles</span>
            </button>

            <button
              type="button"
              onClick={() => {
                soundEffects.playSoftTap();
                setActiveTab('trivia');
              }}
              className={`p-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer text-center min-h-[40px] ${
                resolvedTab === 'trivia'
                  ? 'bg-rose-500 text-white shadow-2xs'
                  : 'bg-stone-50 hover:bg-stone-100 text-stone-700'
              }`}
            >
              <Zap className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Blind Test</span>
            </button>

            <button
              type="button"
              onClick={() => {
                soundEffects.playSoftTap();
                setActiveTab('weekly_challenges');
              }}
              className={`p-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer text-center min-h-[40px] ${
                resolvedTab === 'weekly_challenges'
                  ? 'bg-rose-500 text-white shadow-2xs'
                  : 'bg-stone-50 hover:bg-stone-100 text-stone-700'
              }`}
            >
              <Target className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span className="truncate">Missions Chat</span>
            </button>

            <button
              type="button"
              onClick={() => {
                soundEffects.playSoftTap();
                setActiveTab('vouchers');
              }}
              className={`p-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer text-center min-h-[40px] ${
                resolvedTab === 'vouchers'
                  ? 'bg-rose-500 text-white shadow-2xs'
                  : 'bg-stone-50 hover:bg-stone-100 text-stone-700'
              }`}
            >
              <Gift className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Bons</span>
            </button>

            <button
              type="button"
              onClick={() => {
                soundEffects.playSoftTap();
                setActiveTab('vault');
              }}
              className={`p-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer text-center min-h-[40px] col-span-2 sm:col-span-1 ${
                resolvedTab === 'vault'
                  ? 'bg-rose-500 text-white shadow-2xs'
                  : 'bg-stone-50 hover:bg-stone-100 text-stone-700'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Mots ({effectiveLexicon.length})</span>
            </button>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 3. ACTIVE GAME TAB VIEWS */}
      {/* ========================================================================= */}

      {/* English Game 1: Love Wordle */}
      {resolvedTab === 'wordle' && (
        <LoveWordleGame
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

      {/* English Game 2: Speed Match 60s */}
      {resolvedTab === 'speed_match' && (
        <LoveSpeedMatchGame
          profile={profile}
          activePartnerId={activePartnerId}
          speechRate={speechRate}
          onSendChatMessage={onSendChatMessage}
          onAddXp={handleAddXp}
        />
      )}

      {/* English Game 3: Voice Coach & Pronunciation */}
      {resolvedTab === 'voice_coach' && (
        <LoveVoiceChallengeGame
          profile={profile}
          activePartnerId={activePartnerId}
          speechRate={speechRate}
          onSendChatMessage={onSendChatMessage}
          onAddXp={handleAddXp}
        />
      )}

      {/* English Game 4: Romantic Mad Libs */}
      {resolvedTab === 'mad_libs' && (
        <RomanticMadLibsGame
          profile={profile}
          activePartnerId={activePartnerId}
          speechRate={speechRate}
          onSendChatMessage={onSendChatMessage}
          onAddXp={handleAddXp}
        />
      )}

      {/* English Game 5: Secret Date Missions in Real Life */}
      {resolvedTab === 'date_missions' && (
        <SecretDateMissionsGame
          profile={profile}
          activePartnerId={activePartnerId}
          onSendChatMessage={onSendChatMessage}
          onAddXp={handleAddXp}
        />
      )}

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
