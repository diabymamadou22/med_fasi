import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Gamepad2,
  Heart,
  Shuffle,
  Zap,
  Sparkles,
  MessageCircle,
  Volume2,
  BookOpen,
  Target,
  Gift,
  ArrowLeft,
  ChevronRight,
  Flame,
  Grid3X3,
  HelpCircle,
  Users,
  Timer,
  Puzzle,
  Search,
  Dices,
  Trophy,
  X,
  Filter,
  RotateCw,
} from 'lucide-react';
import {
  CoupleProfile,
  PartnerId,
  QuizQuestion,
  DateIdea,
  CoupleChallenge,
  ChatMessage,
  EnglishLexiconItem,
  WeeklyLearningChallenge,
  TimelineMemory,
} from '../../types';
import { soundEffects } from '../../lib/audio';
import { triggerHeartConfetti } from '../../lib/confetti';
import { LexiconSection } from './LexiconSection';
import { WeeklyChallengesSection } from './WeeklyChallengesSection';
import { FlirtCardsGame } from './games/FlirtCardsGame';
import { LoveRoleplayGame } from './games/LoveRoleplayGame';
import { LoveBlindTestGame } from './games/LoveBlindTestGame';
import { LoveVouchersSection } from './games/LoveVouchersSection';
import { LoveWordleGame } from './games/LoveWordleGame';
import { LoveSpeedMatchGame } from './games/LoveSpeedMatchGame';
import { LoveVoiceChallengeGame } from './games/LoveVoiceChallengeGame';
import { RomanticMadLibsGame } from './games/RomanticMadLibsGame';
import { SecretDateMissionsGame } from './games/SecretDateMissionsGame';
import { LoveTicTacToeGame } from '../games/LoveTicTacToeGame';
import { LoveRouletteGame } from '../games/LoveRouletteGame';
import { CompatibilityQuizGame } from '../games/CompatibilityQuizGame';
import { WhoMostLikelyGame } from '../games/WhoMostLikelyGame';
import { WouldYouRatherGame } from '../games/WouldYouRatherGame';
import { SixtySecondsLoveGame } from '../games/SixtySecondsLoveGame';
import { LovePuzzleGame } from '../games/LovePuzzleGame';
import { INITIAL_LEXICON_WORDS } from '../../data/initialLexiconData';
import { INITIAL_WEEKLY_LEARNING_CHALLENGES } from '../../data/initialWeeklyChallenges';
import { useBackHandler } from '../../lib/backNavigation';

export type EnglishGameTab =
  | 'roulette'
  | 'wordle'
  | 'speed_match'
  | 'voice_coach'
  | 'mad_libs'
  | 'date_missions'
  | 'cards'
  | 'roleplay'
  | 'trivia'
  | 'tic_tac_toe'
  | 'affinity_quiz'
  | 'who_most_likely'
  | 'would_you_rather'
  | 'sixty_seconds'
  | 'puzzle'
  | 'weekly_challenges'
  | 'vouchers'
  | 'vault'
  | 'lessons'
  | 'quizzes'
  | 'dialogues'
  | 'challenges'
  | 'couple_extras';

export type GameCategory = 'all' | 'duo' | 'flirt' | 'bilingual' | 'rewards';

interface GamesViewProps {
  profile: CoupleProfile;
  activePartnerId: PartnerId;
  memories?: TimelineMemory[];
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
  initialTab?: EnglishGameTab | null;
}

interface GameCardDef {
  id: EnglishGameTab;
  title: string;
  desc: string;
  category: 'duo' | 'flirt' | 'bilingual' | 'rewards';
  categoryLabel: string;
  tag: string;
  icon: React.ReactNode;
  color: string;
  badge?: string;
}

export const GamesView: React.FC<GamesViewProps> = ({
  profile,
  activePartnerId,
  memories = [],
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
  // Current game (null means menu is showing, or an active game tab)
  const [activeTab, setActiveTab] = useState<EnglishGameTab | null>(initialTab || null);
  const [speechRate, setSpeechRate] = useState<number>(0.85);
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
      return saved ? parseInt(saved, 10) : 65;
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
      showToast('✨ Mot complice acquis ! +10 pts');
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

  const [selectedCategory, setSelectedCategory] = useState<GameCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSurpriseRolling, setIsSurpriseRolling] = useState(false);

  const coupleLevel =
    xpPoints < 100
      ? { level: 1, title: 'Débutants Amoureux 🌱', nextGoal: 100, min: 0 }
      : xpPoints < 250
      ? { level: 2, title: 'Duo Complice 💬', nextGoal: 250, min: 100 }
      : xpPoints < 500
      ? { level: 3, title: 'Amants Polyglottes ✨', nextGoal: 500, min: 250 }
      : { level: 4, title: 'Bilingues en Amour 🏆', nextGoal: 1000, min: 500 };

  const levelProgress = Math.min(
    100,
    Math.round(((xpPoints - coupleLevel.min) / (coupleLevel.nextGoal - coupleLevel.min)) * 100)
  );

  // Map backwards-compatible tab keys
  const resolvedTab: EnglishGameTab | null =
    activeTab === 'lessons'
      ? 'cards'
      : activeTab === 'quizzes'
      ? 'trivia'
      : activeTab === 'dialogues'
      ? 'roleplay'
      : activeTab === 'challenges' || activeTab === 'couple_extras'
      ? 'vouchers'
      : activeTab;

  // Handle hardware / gesture back button to return to games catalog
  useBackHandler(Boolean(resolvedTab), () => setActiveTab(null), 'game-detail-view');

  // Curated catalog of romantic couple games & activities (punchy, clean, no long text)
  const gameCards: GameCardDef[] = [
    // 1. Défis & Duels
    {
      id: 'tic_tac_toe',
      title: 'Morpion & Gages',
      desc: 'Alignez 3 cœurs & donnez des gages',
      category: 'duo',
      categoryLabel: 'Défis & Duels',
      tag: 'En Direct ⚡',
      icon: <Grid3X3 className="w-5 h-5 text-rose-500" />,
      color: 'bg-rose-50/70 hover:bg-rose-100/80 border-rose-200/80',
      badge: 'En Direct ⚡',
    },
    {
      id: 'roulette',
      title: 'Roulette Romantique',
      desc: 'Tournez la roue du destin complice',
      category: 'duo',
      categoryLabel: 'Défis & Duels',
      tag: 'En Direct ⚡',
      icon: <RotateCw className="w-5 h-5 text-pink-500" />,
      color: 'bg-pink-50/70 hover:bg-pink-100/80 border-pink-200/80',
      badge: 'En Direct ⚡',
    },
    {
      id: 'puzzle',
      title: 'Puzzle Romantique',
      desc: 'Reconstituez vos photos souvenirs',
      category: 'duo',
      categoryLabel: 'Défis & Duels',
      tag: 'Photos 📷',
      icon: <Puzzle className="w-5 h-5 text-purple-500" />,
      color: 'bg-purple-50/70 hover:bg-purple-100/80 border-purple-200/80',
    },
    {
      id: 'sixty_seconds',
      title: '60s Mots Doux',
      desc: 'Compliments tendres en 1 minute',
      category: 'duo',
      categoryLabel: 'Défis & Duels',
      tag: 'Express ⏱️',
      icon: <Timer className="w-5 h-5 text-emerald-500" />,
      color: 'bg-emerald-50/70 hover:bg-emerald-100/80 border-emerald-200/80',
    },

    // 2. Flirt & Intimité
    {
      id: 'who_most_likely',
      title: 'Qui de Nous Deux ?',
      desc: 'Votez et personnalisez vos questions',
      category: 'flirt',
      categoryLabel: 'Flirt & Intimité',
      tag: 'En Direct ⚡',
      icon: <Users className="w-5 h-5 text-blue-500" />,
      color: 'bg-blue-50/70 hover:bg-blue-100/80 border-blue-200/80',
      badge: 'Personnalisable ✍️',
    },
    {
      id: 'cards',
      title: 'Cartes Intimes',
      desc: 'Questions & confessions douces',
      category: 'flirt',
      categoryLabel: 'Flirt & Intimité',
      tag: 'Flirt 💬',
      icon: <Sparkles className="w-5 h-5 text-purple-500" />,
      color: 'bg-purple-50/70 hover:bg-purple-100/80 border-purple-200/80',
    },
    {
      id: 'would_you_rather',
      title: 'Tu Préfères... ?',
      desc: 'Dilemmes complices & fous rires',
      category: 'flirt',
      categoryLabel: 'Flirt & Intimité',
      tag: 'Dilemmes 🤔',
      icon: <HelpCircle className="w-5 h-5 text-amber-500" />,
      color: 'bg-amber-50/70 hover:bg-amber-100/80 border-amber-200/80',
    },
    {
      id: 'affinity_quiz',
      title: 'Quiz de Connivence',
      desc: 'Testez votre complicité à deux',
      category: 'flirt',
      categoryLabel: 'Flirt & Intimité',
      tag: 'Score 🏆',
      icon: <Heart className="w-5 h-5 text-rose-500" />,
      color: 'bg-rose-50/70 hover:bg-rose-100/80 border-rose-200/80',
    },
    {
      id: 'roleplay',
      title: 'Jeux de Rôles',
      desc: 'Scénarios amusants à improviser',
      category: 'flirt',
      categoryLabel: 'Flirt & Intimité',
      tag: 'Impro 🎭',
      icon: <MessageCircle className="w-5 h-5 text-indigo-500" />,
      color: 'bg-indigo-50/70 hover:bg-indigo-100/80 border-indigo-200/80',
    },

    // 3. Bilingue & Mots Doux
    {
      id: 'wordle',
      title: 'Love Wordle',
      desc: 'Devinez le mot doux en 6 essais',
      category: 'bilingual',
      categoryLabel: 'Bilingue & Mots',
      tag: 'Lettres 🔤',
      icon: <Heart className="w-5 h-5 text-pink-500" />,
      color: 'bg-pink-50/70 hover:bg-pink-100/80 border-pink-200/80',
    },
    {
      id: 'speed_match',
      title: 'Speed Match',
      desc: 'Associez les paires d’amour',
      category: 'bilingual',
      categoryLabel: 'Bilingue & Mots',
      tag: 'Mémoire ⚡',
      icon: <Zap className="w-5 h-5 text-amber-500" />,
      color: 'bg-amber-50/70 hover:bg-amber-100/80 border-amber-200/80',
    },
    {
      id: 'voice_coach',
      title: 'Coach Vocal',
      desc: 'Murmurez vos mots complices',
      category: 'bilingual',
      categoryLabel: 'Bilingue & Mots',
      tag: 'Audio 🎙️',
      icon: <Volume2 className="w-5 h-5 text-teal-500" />,
      color: 'bg-teal-50/70 hover:bg-teal-100/80 border-teal-200/80',
    },
    {
      id: 'trivia',
      title: 'Blind Test Audio',
      desc: 'Écoutez et retrouvez la réplique',
      category: 'bilingual',
      categoryLabel: 'Bilingue & Mots',
      tag: 'Écoute 🎧',
      icon: <Volume2 className="w-5 h-5 text-blue-500" />,
      color: 'bg-blue-50/70 hover:bg-blue-100/80 border-blue-200/80',
    },
    {
      id: 'mad_libs',
      title: 'Mad Libs Amoureux',
      desc: 'Histoires drôles à inventer',
      category: 'bilingual',
      categoryLabel: 'Bilingue & Mots',
      tag: 'Créatif ✍️',
      icon: <BookOpen className="w-5 h-5 text-emerald-500" />,
      color: 'bg-emerald-50/70 hover:bg-emerald-100/80 border-emerald-200/80',
    },
    {
      id: 'vault',
      title: 'Lexique Complice',
      desc: `${effectiveLexicon.length} mots doux enregistrés`,
      category: 'bilingual',
      categoryLabel: 'Bilingue & Mots',
      tag: 'Coffre 💎',
      icon: <BookOpen className="w-5 h-5 text-stone-600" />,
      color: 'bg-stone-50/70 hover:bg-stone-100/80 border-stone-200/80',
    },

    // 4. Récompenses & Missions
    {
      id: 'vouchers',
      title: 'Bons Privilège',
      desc: 'Massages, câlins & jokers à offrir',
      category: 'rewards',
      categoryLabel: 'Récompenses',
      tag: 'Bons 🎁',
      icon: <Gift className="w-5 h-5 text-rose-500" />,
      color: 'bg-rose-50/70 hover:bg-rose-100/80 border-rose-200/80',
    },
    {
      id: 'date_missions',
      title: 'Missions Secrètes',
      desc: 'Petits défis pour vos sorties',
      category: 'rewards',
      categoryLabel: 'Récompenses',
      tag: 'Missions 🎯',
      icon: <Target className="w-5 h-5 text-red-500" />,
      color: 'bg-red-50/70 hover:bg-red-100/80 border-red-200/80',
    },
    {
      id: 'weekly_challenges',
      title: 'Défis Hebdo',
      desc: 'Rituels complices du quotidien',
      category: 'rewards',
      categoryLabel: 'Récompenses',
      tag: 'Hebdo 🔥',
      icon: <Flame className="w-5 h-5 text-amber-500" />,
      color: 'bg-amber-50/70 hover:bg-amber-100/80 border-amber-200/80',
    },
  ];

  const categories: { id: GameCategory; label: string; icon: string; count: number }[] = [
    { id: 'all', label: 'Tous', icon: '🌟', count: gameCards.length },
    { id: 'duo', label: 'Duels & Gages', icon: '🎲', count: gameCards.filter((g) => g.category === 'duo').length },
    { id: 'flirt', label: 'Flirt & Intimité', icon: '💖', count: gameCards.filter((g) => g.category === 'flirt').length },
    { id: 'bilingual', label: 'Mots Doux', icon: '🇬🇧', count: gameCards.filter((g) => g.category === 'bilingual').length },
    { id: 'rewards', label: 'Récompenses', icon: '🎁', count: gameCards.filter((g) => g.category === 'rewards').length },
  ];

  const handleRandomSurpriseGame = () => {
    setIsSurpriseRolling(true);
    soundEffects.playVictoryChime();
    triggerHeartConfetti();

    const pool =
      selectedCategory === 'all'
        ? gameCards
        : gameCards.filter((g) => g.category === selectedCategory);
    const candidatePool = pool.length > 0 ? pool : gameCards;
    const randomIndex = Math.floor(Math.random() * candidatePool.length);
    const chosen = candidatePool[randomIndex];

    setTimeout(() => {
      setIsSurpriseRolling(false);
      setActiveTab(chosen.id);
      showToast(`🎲 Jeu Surprise lancé : ${chosen.title} ! Amusez-vous bien ❤️`);
    }, 500);
  };

  const filteredGameCards = gameCards.filter((game) => {
    const matchesCategory =
      selectedCategory === 'all' ? true : game.category === selectedCategory;
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch =
      q === ''
        ? true
        : game.title.toLowerCase().includes(q) ||
          game.desc.toLowerCase().includes(q) ||
          game.categoryLabel.toLowerCase().includes(q) ||
          game.tag.toLowerCase().includes(q);
    return matchesCategory && matchesSearch;
  });

  const currentGameDef = gameCards.find((g) => g.id === resolvedTab);

  return (
    <div className="max-w-4xl mx-auto px-3.5 sm:px-6 py-4 sm:py-6 space-y-4">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 left-4 right-4 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 z-50 bg-stone-900/95 text-white px-4 py-2.5 rounded-full text-xs font-semibold shadow-xl flex items-center justify-center gap-2 border border-stone-700/80 backdrop-blur-md"
          >
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="text-center">{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 1. Header Minimal & Réactif */}
      {resolvedTab ? (
        <div className="bg-white rounded-2xl sm:rounded-3xl border border-stone-200/80 p-3 sm:p-4 shadow-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              type="button"
              onClick={() => {
                soundEffects.playSoftTap();
                setActiveTab(null);
              }}
              className="p-2 -ml-0.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors flex items-center justify-center cursor-pointer shrink-0"
              title="Retour aux jeux"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="min-w-0">
              <h1 className="text-base sm:text-lg font-bold text-stone-900 font-serif-romantic tracking-tight truncate flex items-center gap-1.5">
                <span>{currentGameDef?.title}</span>
                {currentGameDef?.badge && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500 text-white shrink-0">
                    {currentGameDef.badge}
                  </span>
                )}
              </h1>
              <p className="text-xs text-stone-500 truncate">
                {currentGameDef?.desc}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={handleRandomSurpriseGame}
              disabled={isSurpriseRolling}
              className="px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer border border-rose-200"
              title="Autre jeu au hasard"
            >
              <Dices className={`w-3.5 h-3.5 ${isSurpriseRolling ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Autre jeu</span>
            </button>
            <button
              type="button"
              onClick={() => {
                soundEffects.playSoftTap();
                setActiveTab(null);
              }}
              className="px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold transition-colors cursor-pointer"
            >
              Tous les jeux
            </button>
          </div>
        </div>
      ) : (
        /* Header Catalogue Jeux Unique & Épuré */
        <div className="bg-white rounded-2xl sm:rounded-3xl border border-stone-200/80 p-3.5 sm:p-4 shadow-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-500 to-pink-500 text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
              <Gamepad2 className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold text-stone-900 font-serif-romantic tracking-tight truncate">
                  Jeux & Flirt à Deux
                </h1>
                <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold shrink-0">
                  {coupleLevel.title}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[11px] font-bold text-stone-500 shrink-0">
                  {xpPoints} XP
                </span>
                <div className="w-24 sm:w-32 h-1.5 rounded-full bg-stone-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-rose-500 to-pink-500"
                    style={{ width: `${levelProgress}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleRandomSurpriseGame}
            disabled={isSurpriseRolling}
            className="px-3 py-1.5 sm:py-2 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all shrink-0"
          >
            <Dices className={`w-3.5 h-3.5 ${isSurpriseRolling ? 'animate-spin' : ''}`} />
            <span>Jeu Surprise !</span>
          </button>
        </div>
      )}

      {/* 2. Menu Enrichi : Filtres & Recherche (Quand aucun jeu n'est ouvert) */}
      {!resolvedTab ? (
        <div className="space-y-3">
          {/* Barre de Recherche & Filtres de Catégories */}
          <div className="bg-white rounded-2xl sm:rounded-3xl border border-stone-200/80 p-2.5 sm:p-3 shadow-xs space-y-2.5">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
              {/* Filter Tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      soundEffects.playSoftTap();
                      setSelectedCategory(cat.id);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
                      selectedCategory === cat.id
                        ? 'bg-rose-500 text-white shadow-xs'
                        : 'bg-stone-100 hover:bg-stone-200/70 text-stone-700'
                    }`}
                  >
                    <span>{cat.icon}</span>
                    <span>{cat.label}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                        selectedCategory === cat.id ? 'bg-white/25 text-white' : 'bg-stone-200 text-stone-600'
                      }`}
                    >
                      {cat.count}
                    </span>
                  </button>
                ))}
              </div>

              {/* Search Bar */}
              <div className="relative min-w-[180px] shrink-0">
                <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher un jeu..."
                  className="w-full pl-8 pr-7 py-1.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 placeholder-stone-400 focus:outline-hidden focus:ring-2 focus:ring-rose-400 focus:bg-white transition-all"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Grille des Cartes de Jeux Épurées */}
          {filteredGameCards.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {filteredGameCards.map((game) => (
                <button
                  key={game.id}
                  type="button"
                  onClick={() => {
                    soundEffects.playNoteClick();
                    setActiveTab(game.id);
                  }}
                  className={`p-3.5 sm:p-4 rounded-2xl border text-left transition-all active:scale-[0.99] hover:shadow-xs flex items-center justify-between gap-3 cursor-pointer ${game.color}`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-white shadow-2xs border border-white/80 flex items-center justify-center shrink-0">
                      {game.icon}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white/80 text-stone-600">
                          {game.tag}
                        </span>
                        {game.badge && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500 text-white shadow-2xs">
                            {game.badge}
                          </span>
                        )}
                      </div>
                      <h3 className="text-sm sm:text-base font-bold text-stone-900 font-serif-romantic tracking-tight mt-0.5 truncate">
                        {game.title}
                      </h3>
                      <p className="text-xs text-stone-500 mt-0.5 truncate">
                        {game.desc}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-stone-400 shrink-0" />
                </button>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-8 text-center border border-stone-200 space-y-2">
              <p className="text-2xl">🔍</p>
              <h4 className="font-bold text-stone-800 text-sm">Aucun jeu trouvé</h4>
              <p className="text-xs text-stone-500 max-w-xs mx-auto">
                Réinitialisez les filtres pour afficher l'ensemble des jeux.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                }}
                className="px-3.5 py-1.5 bg-stone-100 hover:bg-stone-200 rounded-xl text-xs font-bold text-stone-700"
              >
                Réinitialiser
              </button>
            </div>
          )}
        </div>
      ) : (
        /* 3. Jeu actif affiché directement sans fioritures */
        <div className="space-y-4">
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

          {resolvedTab === 'speed_match' && (
            <LoveSpeedMatchGame
              profile={profile}
              activePartnerId={activePartnerId}
              speechRate={speechRate}
              onSendChatMessage={onSendChatMessage}
              onAddXp={handleAddXp}
            />
          )}

          {resolvedTab === 'voice_coach' && (
            <LoveVoiceChallengeGame
              profile={profile}
              activePartnerId={activePartnerId}
              speechRate={speechRate}
              onSendChatMessage={onSendChatMessage}
              onAddXp={handleAddXp}
            />
          )}

          {resolvedTab === 'mad_libs' && (
            <RomanticMadLibsGame
              profile={profile}
              activePartnerId={activePartnerId}
              speechRate={speechRate}
              onSendChatMessage={onSendChatMessage}
              onAddXp={handleAddXp}
            />
          )}

          {resolvedTab === 'date_missions' && (
            <SecretDateMissionsGame
              profile={profile}
              activePartnerId={activePartnerId}
              onSendChatMessage={onSendChatMessage}
              onAddXp={handleAddXp}
            />
          )}

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

          {resolvedTab === 'roleplay' && (
            <LoveRoleplayGame
              profile={profile}
              activePartnerId={activePartnerId}
              speechRate={speechRate}
              onSendChatMessage={onSendChatMessage}
              onAddXp={handleAddXp}
            />
          )}

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

          {resolvedTab === 'tic_tac_toe' && (
            <LoveTicTacToeGame
              profile={profile}
              activePartnerId={activePartnerId}
              onSendChatMessage={onSendChatMessage}
            />
          )}

          {resolvedTab === 'roulette' && (
            <LoveRouletteGame
              profile={profile}
              activePartnerId={activePartnerId}
              onSendChatMessage={onSendChatMessage}
            />
          )}

          {resolvedTab === 'affinity_quiz' && (
            <CompatibilityQuizGame
              profile={profile}
              activePartnerId={activePartnerId}
              onSendChatMessage={onSendChatMessage}
            />
          )}

          {resolvedTab === 'who_most_likely' && (
            <WhoMostLikelyGame
              profile={profile}
              activePartnerId={activePartnerId}
              onSendChatMessage={onSendChatMessage}
            />
          )}

          {resolvedTab === 'would_you_rather' && (
            <WouldYouRatherGame
              profile={profile}
              activePartnerId={activePartnerId}
              onSendChatMessage={onSendChatMessage}
            />
          )}

          {resolvedTab === 'sixty_seconds' && (
            <SixtySecondsLoveGame
              profile={profile}
              activePartnerId={activePartnerId}
              onSendChatMessage={onSendChatMessage}
            />
          )}

          {resolvedTab === 'puzzle' && (
            <LovePuzzleGame
              profile={profile}
              activePartnerId={activePartnerId}
              memories={memories}
              onSendChatMessage={onSendChatMessage}
            />
          )}

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

          {resolvedTab === 'vouchers' && (
            <LoveVouchersSection
              profile={profile}
              activePartnerId={activePartnerId}
              xpPoints={xpPoints}
              dateIdeas={dateIdeas || []}
              onSendChatMessage={onSendChatMessage}
              onOpenLexicon={() => setActiveTab('vault')}
            />
          )}

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
      )}
    </div>
  );
};
