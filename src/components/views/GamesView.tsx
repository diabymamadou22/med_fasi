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
  ArrowLeft,
  ChevronRight,
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
  GlobalGamesScoreboard,
  CoupleSettings,
  GameAnimationSpeed,
} from '../../types';
import { soundEffects } from '../../lib/audio';
import { triggerHeartConfetti } from '../../lib/confetti';
import { subscribeGlobalGameScores, INITIAL_GAMES_SCOREBOARD } from '../../lib/firestoreService';
import { LexiconSection } from './LexiconSection';
import { FlirtCardsGame } from './games/FlirtCardsGame';
import { LoveRoleplayGame } from './games/LoveRoleplayGame';
import { LoveBlindTestGame } from './games/LoveBlindTestGame';
import { LoveWordleGame } from './games/LoveWordleGame';
import { LoveSpeedMatchGame } from './games/LoveSpeedMatchGame';
import { LoveVoiceChallengeGame } from './games/LoveVoiceChallengeGame';
import { RomanticMadLibsGame } from './games/RomanticMadLibsGame';
import { LoveTicTacToeGame } from '../games/LoveTicTacToeGame';
import { LoveRouletteGame } from '../games/LoveRouletteGame';
import { WhoMostLikelyGame } from '../games/WhoMostLikelyGame';
import { SixtySecondsLoveGame } from '../games/SixtySecondsLoveGame';
import { LovePuzzleGame } from '../games/LovePuzzleGame';
import { LoveLudoGame } from '../games/LoveLudoGame';
import { GlobalScoreboardPanel } from '../games/GlobalScoreboardPanel';
import { INITIAL_LEXICON_WORDS } from '../../data/initialLexiconData';
import { useBackHandler } from '../../lib/backNavigation';

export type EnglishGameTab =
  | 'ludo'
  | 'english_hub'
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

export type GameCategory = 'all' | 'duo' | 'flirt' | 'bilingual';

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
  settings?: CoupleSettings;
  onSaveSettings?: (settings: CoupleSettings) => void;
  onOpenProfileModal?: (partnerId?: PartnerId) => void;
}

interface GameCardDef {
  id: EnglishGameTab;
  title: string;
  desc: string;
  category: 'duo' | 'flirt' | 'bilingual';
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
  settings,
  onSaveSettings,
  onOpenProfileModal,
}) => {
  // Current game (null means menu is showing, or an active game tab)
  const [activeTab, setActiveTab] = useState<EnglishGameTab | null>(initialTab || null);
  const [speechRate, setSpeechRate] = useState<number>(0.85);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Global Game Scoreboard State & real-time sync
  const [scoreboard, setScoreboard] = useState<GlobalGamesScoreboard>(() => {
    try {
      const saved = localStorage.getItem('nid_damour_global_game_scores');
      return saved ? JSON.parse(saved) : INITIAL_GAMES_SCOREBOARD;
    } catch {
      return INITIAL_GAMES_SCOREBOARD;
    }
  });
  const [showScoreboardPanel, setShowScoreboardPanel] = useState<boolean>(false);

  useEffect(() => {
    const unsub = subscribeGlobalGameScores((board) => {
      if (board) {
        setScoreboard(board);
      }
    });
    return () => {
      unsub();
    };
  }, []);

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
      : activeTab === 'challenges' ||
        activeTab === 'couple_extras' ||
        activeTab === 'vouchers' ||
        activeTab === 'date_missions' ||
        activeTab === 'weekly_challenges'
      ? null
      : activeTab;

  const isEnglishSubGame = [
    'wordle',
    'speed_match',
    'voice_coach',
    'trivia',
    'cards',
    'roleplay',
    'mad_libs',
    'vault',
  ].includes(resolvedTab || '');

  const handleBack = () => {
    soundEffects.playSoftTap();
    if (isEnglishSubGame) {
      setActiveTab('english_hub');
    } else {
      setActiveTab(null);
    }
  };

  // Handle hardware / gesture back button to return to games catalog
  useBackHandler(Boolean(resolvedTab), handleBack, 'game-detail-view');

  // Jeux d'apprentissage d'anglais regroupés dans le hub
  const englishSubGames = [
    {
      id: 'wordle' as EnglishGameTab,
      title: 'Love Wordle',
      tag: 'Lettres 🔤',
      icon: <Heart className="w-5 h-5 text-pink-500" />,
      color: 'bg-pink-50/70 hover:bg-pink-100/80 border-pink-200/80',
    },
    {
      id: 'speed_match' as EnglishGameTab,
      title: 'Speed Match',
      tag: 'Mémoire ⚡',
      icon: <Zap className="w-5 h-5 text-amber-500" />,
      color: 'bg-amber-50/70 hover:bg-amber-100/80 border-amber-200/80',
    },
    {
      id: 'voice_coach' as EnglishGameTab,
      title: 'Coach Vocal',
      tag: 'Audio 🎙️',
      icon: <Volume2 className="w-5 h-5 text-teal-500" />,
      color: 'bg-teal-50/70 hover:bg-teal-100/80 border-teal-200/80',
    },
    {
      id: 'trivia' as EnglishGameTab,
      title: 'Blind Test Audio',
      tag: 'Écoute 🎧',
      icon: <Volume2 className="w-5 h-5 text-blue-500" />,
      color: 'bg-blue-50/70 hover:bg-blue-100/80 border-blue-200/80',
    },
    {
      id: 'cards' as EnglishGameTab,
      title: 'Cartes Vocabulaire',
      tag: 'Flirt 💬',
      icon: <Sparkles className="w-5 h-5 text-purple-500" />,
      color: 'bg-purple-50/70 hover:bg-purple-100/80 border-purple-200/80',
    },
    {
      id: 'roleplay' as EnglishGameTab,
      title: 'Jeux de Rôles',
      tag: 'Impro 🎭',
      icon: <MessageCircle className="w-5 h-5 text-indigo-500" />,
      color: 'bg-indigo-50/70 hover:bg-indigo-100/80 border-indigo-200/80',
    },
    {
      id: 'mad_libs' as EnglishGameTab,
      title: 'Mad Libs Amoureux',
      tag: 'Créatif ✍️',
      icon: <BookOpen className="w-5 h-5 text-emerald-500" />,
      color: 'bg-emerald-50/70 hover:bg-emerald-100/80 border-emerald-200/80',
    },
    {
      id: 'vault' as EnglishGameTab,
      title: 'Lexique Complice',
      tag: 'Coffre 💎',
      icon: <BookOpen className="w-5 h-5 text-stone-600" />,
      color: 'bg-stone-50/70 hover:bg-stone-100/80 border-stone-200/80',
    },
  ];

  // Catalogue principal épuré (Ludo MS ajouté, jeux épurés carrés)
  const gameCards: GameCardDef[] = [
    // 1. Défis & Duels
    {
      id: 'ludo',
      title: 'Ludo MS',
      desc: 'Le célèbre jeu de petits chevaux à deux en direct',
      category: 'duo',
      categoryLabel: 'Défis & Duels',
      tag: 'En Direct ⚡',
      icon: <Dices className="w-5 h-5 text-amber-500" />,
      color: 'bg-amber-50/70 hover:bg-amber-100/80 border-amber-200/80',
      badge: 'En Direct ⚡',
    },
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
      id: 'who_most_likely',
      title: 'Qui de Nous Deux ?',
      desc: 'Votez et découvrez vos réponses',
      category: 'flirt',
      categoryLabel: 'Flirt & Amour',
      tag: 'En Direct ⚡',
      icon: <Users className="w-5 h-5 text-blue-500" />,
      color: 'bg-blue-50/70 hover:bg-blue-100/80 border-blue-200/80',
      badge: 'En Direct ⚡',
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

    // 2. Hub Tout-en-un Apprentissage Anglais
    {
      id: 'english_hub',
      title: 'Anglais Complice',
      desc: '8 jeux pour apprendre l’anglais en duo',
      category: 'bilingual',
      categoryLabel: 'Anglais 🇬🇧',
      tag: '8 Jeux 🇬🇧',
      icon: <BookOpen className="w-5 h-5 text-indigo-500" />,
      color: 'bg-indigo-50/70 hover:bg-indigo-100/80 border-indigo-200/80',
      badge: '8 en 1 🇬🇧',
    },
  ];

  const categories: { id: GameCategory; label: string; icon: string; count: number }[] = [
    { id: 'all', label: 'Tous', icon: '🌟', count: gameCards.length },
    { id: 'duo', label: 'Duels & Gages', icon: '🎲', count: gameCards.filter((g) => g.category === 'duo').length },
    { id: 'flirt', label: 'Flirt & Amour', icon: '💖', count: gameCards.filter((g) => g.category === 'flirt').length },
    { id: 'bilingual', label: 'Anglais 🇬🇧', icon: '🇬🇧', count: gameCards.filter((g) => g.category === 'bilingual').length },
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
          game.categoryLabel.toLowerCase().includes(q) ||
          game.tag.toLowerCase().includes(q);
    return matchesCategory && matchesSearch;
  });

  const allGameDefs: GameCardDef[] = [
    ...gameCards,
    ...englishSubGames.map((g) => ({
      ...g,
      desc: '',
      category: 'bilingual' as const,
      categoryLabel: 'Anglais 🇬🇧',
    })),
  ];
  const currentGameDef = allGameDefs.find((g) => g.id === resolvedTab);

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
              onClick={handleBack}
              className="p-2 -ml-0.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors flex items-center justify-center cursor-pointer shrink-0"
              title={isEnglishSubGame ? "Retour à l'anglais" : "Retour aux jeux"}
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
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => {
                soundEffects.playSoftTap();
                setShowScoreboardPanel(true);
              }}
              className="px-2.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer border border-amber-200"
              title="Historique des scores globaux"
            >
              <Trophy className="w-3.5 h-3.5 text-amber-600" />
              <span className="hidden sm:inline">Scores</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-200/80 text-amber-900 font-black">
                {scoreboard.totalP1Wins} - {scoreboard.totalP2Wins}
              </span>
            </button>
            {onOpenProfileModal && (
              <button
                type="button"
                onClick={() => {
                  soundEffects.playSoftTap();
                  onOpenProfileModal(activePartnerId);
                }}
                className="px-2.5 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer border border-purple-200"
                title="Régler la cadence des animations de jeux (Douce, Normale, Rapide, Éclair)"
              >
                <span>
                  {settings?.gameAnimationSpeed === 'slow'
                    ? '🐢'
                    : settings?.gameAnimationSpeed === 'fast'
                    ? '⚡'
                    : settings?.gameAnimationSpeed === 'ultra'
                    ? '🚀'
                    : '⚖️'}
                </span>
                <span className="hidden sm:inline">Vitesse :</span>
                <span className="capitalize text-[11px]">
                  {settings?.gameAnimationSpeed === 'slow'
                    ? 'Douce'
                    : settings?.gameAnimationSpeed === 'fast'
                    ? 'Rapide'
                    : settings?.gameAnimationSpeed === 'ultra'
                    ? 'Éclair'
                    : 'Standard'}
                </span>
              </button>
            )}
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

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => {
                soundEffects.playSoftTap();
                setShowScoreboardPanel(true);
              }}
              className="px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 text-xs font-bold shadow-2xs flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all"
              title="Historique des scores globaux"
            >
              <Trophy className="w-3.5 h-3.5 text-amber-600" />
              <span className="hidden sm:inline">Scores Globaux</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-200/80 text-amber-900 font-black">
                {scoreboard.totalP1Wins} - {scoreboard.totalP2Wins}
              </span>
            </button>

            <button
              type="button"
              onClick={handleRandomSurpriseGame}
              disabled={isSurpriseRolling}
              className="px-3 py-1.5 sm:py-2 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all shrink-0"
            >
              <Dices className={`w-3.5 h-3.5 ${isSurpriseRolling ? 'animate-spin' : ''}`} />
              <span className="hidden xs:inline">Jeu Surprise !</span>
            </button>
          </div>
        </div>
      )}

      {/* 2. Menu Enrichi : Filtres & Recherche (Quand aucun jeu n'est ouvert) */}
      {!resolvedTab ? (
        <div className="space-y-3">
          {/* Panneau / Bannière Palmarès des Scores Globaux */}
          <div className="bg-gradient-to-r from-amber-50/90 via-rose-50/80 to-pink-50/90 rounded-2xl sm:rounded-3xl border border-amber-200/90 p-3 sm:p-4 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-400 to-amber-600 text-white flex items-center justify-center text-xl shadow-xs shrink-0">
                🏆
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-xs sm:text-sm text-stone-900 font-serif-romantic tracking-tight">
                    Palmarès des Duels du Couple
                  </h3>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-200/80 text-amber-900 shrink-0">
                    {scoreboard.totalPlayed} {scoreboard.totalPlayed > 1 ? 'parties' : 'partie'}
                  </span>
                </div>
                <p className="text-[11px] text-stone-600 mt-0.5 truncate">
                  {scoreboard.totalPlayed === 0 ? (
                    'Jouez à Ludo MS, Morpion ou aux autres jeux pour accumuler des victoires !'
                  ) : scoreboard.totalP1Wins > scoreboard.totalP2Wins ? (
                    <span>
                      👑 <strong className="text-blue-700">{profile.partner1.name}</strong> mène avec{' '}
                      <strong>{scoreboard.totalP1Wins} victoires</strong> contre {scoreboard.totalP2Wins} pour{' '}
                      {profile.partner2.name}
                    </span>
                  ) : scoreboard.totalP2Wins > scoreboard.totalP1Wins ? (
                    <span>
                      👑 <strong className="text-emerald-700">{profile.partner2.name}</strong> mène avec{' '}
                      <strong>{scoreboard.totalP2Wins} victoires</strong> contre {scoreboard.totalP1Wins} pour{' '}
                      {profile.partner1.name}
                    </span>
                  ) : (
                    <span>
                      🤝 Égalité parfaite ! <strong>{scoreboard.totalP1Wins} - {scoreboard.totalP2Wins}</strong>
                    </span>
                  )}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                soundEffects.playSoftTap();
                setShowScoreboardPanel(true);
              }}
              className="px-3 py-2 rounded-xl bg-white hover:bg-amber-100/70 border border-amber-300 text-amber-900 text-xs font-bold transition-all shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer shrink-0 active:scale-95"
            >
              <Trophy className="w-3.5 h-3.5 text-amber-600" />
              <span>Voir l'historique complet</span>
              <ChevronRight className="w-3.5 h-3.5 text-amber-500" />
            </button>
          </div>

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

          {/* Grille des Cartes de Jeux Carrées & Stylées sur Mobile */}
          {filteredGameCards.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 sm:gap-3.5">
              {filteredGameCards.map((game) => (
                <button
                  key={game.id}
                  type="button"
                  onClick={() => {
                    soundEffects.playNoteClick();
                    setActiveTab(game.id);
                  }}
                  className={`aspect-square p-3 sm:p-4 rounded-2xl sm:rounded-3xl border flex flex-col items-center justify-between text-center transition-all active:scale-95 hover:shadow-md cursor-pointer relative overflow-hidden group shadow-2xs ${game.color}`}
                >
                  {/* Badge discret en haut */}
                  <div className="w-full flex items-center justify-end h-5">
                    {game.badge ? (
                      <span className="px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold bg-rose-500 text-white shadow-2xs shrink-0">
                        {game.badge}
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.5 rounded-md text-[9px] sm:text-[10px] font-semibold text-stone-500 bg-white/80 shrink-0">
                        {game.tag}
                      </span>
                    )}
                  </div>

                  {/* Grande icône centrale élégante */}
                  <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-2xl bg-white shadow-2xs border border-white/80 flex items-center justify-center group-hover:scale-105 group-active:scale-95 transition-transform shrink-0 my-auto">
                    {React.isValidElement(game.icon)
                      ? React.cloneElement(game.icon as React.ReactElement<{ className?: string }>, {
                          className: 'w-6 h-6 sm:w-7 sm:h-7',
                        })
                      : game.icon}
                  </div>

                  {/* Nom du jeu agrandi et très visible (repérage immédiat) */}
                  <div className="w-full px-0.5 sm:px-1 min-h-[2.4rem] sm:min-h-[2.8rem] flex items-center justify-center">
                    <h3 className="text-[15px] sm:text-base md:text-lg font-extrabold text-stone-900 font-serif-romantic tracking-tight leading-tight line-clamp-2">
                      {game.title}
                    </h3>
                  </div>
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

          {resolvedTab === 'ludo' && (
            <LoveLudoGame
              profile={profile}
              activePartnerId={activePartnerId}
              onSendChatMessage={onSendChatMessage}
              animationSpeed={settings?.gameAnimationSpeed || 'normal'}
              settings={settings}
              onSaveSettings={onSaveSettings}
              onOpenSettingsModal={onOpenProfileModal ? () => onOpenProfileModal(activePartnerId) : undefined}
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

          {resolvedTab === 'who_most_likely' && (
            <WhoMostLikelyGame
              profile={profile}
              activePartnerId={activePartnerId}
              onSendChatMessage={onSendChatMessage}
            />
          )}

          {resolvedTab === 'english_hub' && (
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl sm:rounded-3xl p-4 sm:p-5 text-white shadow-xs flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-xl shrink-0">
                    🇬🇧
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-bold font-serif-romantic tracking-tight">
                      Anglais Complice
                    </h2>
                    <p className="text-xs text-indigo-100">
                      8 jeux pour apprendre et flirter en anglais à deux
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    soundEffects.playSoftTap();
                    setActiveTab(null);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-semibold backdrop-blur-xs transition-colors cursor-pointer shrink-0"
                >
                  Tous les jeux
                </button>
              </div>

              {/* Grille carrée des 8 jeux d'anglais */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 sm:gap-3.5">
                {englishSubGames.map((subGame) => (
                  <button
                    key={subGame.id}
                    type="button"
                    onClick={() => {
                      soundEffects.playNoteClick();
                      setActiveTab(subGame.id);
                    }}
                    className={`aspect-square p-3 sm:p-4 rounded-2xl sm:rounded-3xl border flex flex-col items-center justify-between text-center transition-all active:scale-95 hover:shadow-md cursor-pointer relative overflow-hidden group shadow-2xs ${subGame.color}`}
                  >
                    <div className="w-full flex items-center justify-end h-5">
                      <span className="px-1.5 py-0.5 rounded-md text-[9px] sm:text-[10px] font-semibold text-stone-500 bg-white/80 shrink-0">
                        {subGame.tag}
                      </span>
                    </div>

                    <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-2xl bg-white shadow-2xs border border-white/80 flex items-center justify-center group-hover:scale-105 group-active:scale-95 transition-transform shrink-0 my-auto">
                      {React.isValidElement(subGame.icon)
                        ? React.cloneElement(subGame.icon as React.ReactElement<{ className?: string }>, {
                            className: 'w-6 h-6 sm:w-7 sm:h-7',
                          })
                        : subGame.icon}
                    </div>

                    {/* Nom du jeu agrandi et très visible (repérage immédiat) */}
                    <div className="w-full px-0.5 sm:px-1 min-h-[2.4rem] sm:min-h-[2.8rem] flex items-center justify-center">
                      <h3 className="text-[15px] sm:text-base md:text-lg font-extrabold text-stone-900 font-serif-romantic tracking-tight leading-tight line-clamp-2">
                        {subGame.title}
                      </h3>
                    </div>
                  </button>
                ))}
              </div>
            </div>
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

      {/* Panneau Modal de l'Historique des Scores Globaux du Couple */}
      <GlobalScoreboardPanel
        isOpen={showScoreboardPanel}
        onClose={() => setShowScoreboardPanel(false)}
        profile={profile}
        activePartnerId={activePartnerId}
        scoreboard={scoreboard}
        onSelectGame={(gameId) => setActiveTab(gameId as EnglishGameTab)}
        onSendChatMessage={onSendChatMessage}
      />
    </div>
  );
};
