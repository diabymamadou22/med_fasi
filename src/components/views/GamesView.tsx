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

interface GameCardDef {
  id: EnglishGameTab;
  title: string;
  desc: string;
  icon: React.ReactNode;
  color: string;
  badge?: string;
}

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

  const coupleLevel =
    xpPoints < 100
      ? { level: 1, title: 'Débutants Amoureux 🌱' }
      : xpPoints < 250
      ? { level: 2, title: 'Duo Complice 💬' }
      : xpPoints < 500
      ? { level: 3, title: 'Amants Polyglottes ✨' }
      : { level: 4, title: 'Bilingues en Amour 🏆' };

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

  // Simple list of games to choose from
  const gameCards: GameCardDef[] = [
    {
      id: 'roulette',
      title: 'Roue des Gages',
      desc: 'Tournez la roue et réalisez le gage romantique',
      icon: <Shuffle className="w-5 h-5 text-rose-500" />,
      color: 'bg-rose-50 hover:bg-rose-100/80 border-rose-200/80',
      badge: 'Populaire',
    },
    {
      id: 'wordle',
      title: 'Love Wordle',
      desc: 'Devinez le mot doux secret en anglais',
      icon: <Heart className="w-5 h-5 text-pink-500" />,
      color: 'bg-pink-50 hover:bg-pink-100/80 border-pink-200/80',
    },
    {
      id: 'speed_match',
      title: 'Speed Match',
      desc: 'Reliez un maximum de mots d’amour en 60 secondes',
      icon: <Zap className="w-5 h-5 text-amber-500" />,
      color: 'bg-amber-50 hover:bg-amber-100/80 border-amber-200/80',
    },
    {
      id: 'cards',
      title: 'Cartes Intimes',
      desc: 'Questions et confessions pour mieux se connaître',
      icon: <Sparkles className="w-5 h-5 text-purple-500" />,
      color: 'bg-purple-50 hover:bg-purple-100/80 border-purple-200/80',
    },
    {
      id: 'roleplay',
      title: 'Jeux de Rôles',
      desc: 'Scénarios amusants et flirts improvisés à deux',
      icon: <MessageCircle className="w-5 h-5 text-indigo-500" />,
      color: 'bg-indigo-50 hover:bg-indigo-100/80 border-indigo-200/80',
    },
    {
      id: 'trivia',
      title: 'Blind Test Audio',
      desc: 'Écoutez et devinez les phrases d’amour',
      icon: <Volume2 className="w-5 h-5 text-blue-500" />,
      color: 'bg-blue-50 hover:bg-blue-100/80 border-blue-200/80',
    },
    {
      id: 'voice_coach',
      title: 'Coach Vocal',
      desc: 'Entraînez-vous à murmurer en anglais',
      icon: <Volume2 className="w-5 h-5 text-teal-500" />,
      color: 'bg-teal-50 hover:bg-teal-100/80 border-teal-200/80',
    },
    {
      id: 'mad_libs',
      title: 'Mad Libs',
      desc: 'Remplissez les trous pour créer une histoire drôle',
      icon: <BookOpen className="w-5 h-5 text-emerald-500" />,
      color: 'bg-emerald-50 hover:bg-emerald-100/80 border-emerald-200/80',
    },
    {
      id: 'date_missions',
      title: 'Missions Date',
      desc: 'Petits défis coquins à réaliser dans la vraie vie',
      icon: <Target className="w-5 h-5 text-red-500" />,
      color: 'bg-red-50 hover:bg-red-100/80 border-red-200/80',
    },
    {
      id: 'vouchers',
      title: "Bons d'Amour",
      desc: 'Bons massage, petit-déjeuner au lit à utiliser',
      icon: <Gift className="w-5 h-5 text-rose-500" />,
      color: 'bg-rose-50 hover:bg-rose-100/80 border-rose-200/80',
      badge: 'Récompenses',
    },
    {
      id: 'weekly_challenges',
      title: 'Défis de la Semaine',
      desc: 'Missions complices à glisser dans vos messages',
      icon: <Flame className="w-5 h-5 text-amber-500" />,
      color: 'bg-amber-50 hover:bg-amber-100/80 border-amber-200/80',
    },
    {
      id: 'vault',
      title: 'Mots Doux (Lexique)',
      desc: `${effectiveLexicon.length} mots et expressions sauvegardés`,
      icon: <BookOpen className="w-5 h-5 text-stone-600" />,
      color: 'bg-stone-50 hover:bg-stone-100/80 border-stone-200/80',
    },
  ];

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

      {/* 1. Header Simple : Un seul bandeau épuré */}
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-stone-200/80 p-4 sm:p-5 shadow-xs flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          {resolvedTab ? (
            <button
              type="button"
              onClick={() => {
                soundEffects.playSoftTap();
                setActiveTab(null);
              }}
              className="p-2 -ml-1 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors flex items-center justify-center cursor-pointer"
              title="Retour aux jeux"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          ) : (
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <Gamepad2 className="w-4 h-4" />
            </div>
          )}

          <div>
            <h1 className="text-lg sm:text-xl font-bold text-stone-900 font-serif-romantic tracking-tight">
              {resolvedTab && currentGameDef ? currentGameDef.title : 'Jeux & Flirt à Deux'}
            </h1>
            <p className="text-xs text-stone-500">
              {resolvedTab && currentGameDef ? currentGameDef.desc : `${coupleLevel.title} • ${xpPoints} XP`}
            </p>
          </div>
        </div>

        {/* Action à droite : Choisir un autre jeu ou changer vitesse audio */}
        <div className="flex items-center gap-2">
          {resolvedTab ? (
            <button
              type="button"
              onClick={() => {
                soundEffects.playSoftTap();
                setActiveTab(null);
              }}
              className="px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold transition-colors cursor-pointer"
            >
              Changer de jeu
            </button>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200/70 text-amber-800 text-xs font-bold">
              <Zap className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
              <span>{xpPoints} XP</span>
            </div>
          )}
        </div>
      </div>

      {/* 2. Menu Simple de Sélection (Quand aucun jeu n'est ouvert) */}
      {!resolvedTab ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
          {gameCards.map((game) => (
            <button
              key={game.id}
              type="button"
              onClick={() => {
                soundEffects.playNoteClick();
                setActiveTab(game.id);
              }}
              className={`p-4 rounded-2xl border text-left transition-all active:scale-[0.99] flex items-center justify-between gap-3 cursor-pointer shadow-2xs ${game.color}`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white shadow-2xs flex items-center justify-center shrink-0">
                  {game.icon}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm sm:text-base font-bold text-stone-900 font-serif-romantic">
                      {game.title}
                    </h3>
                    {game.badge && (
                      <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-rose-500 text-white">
                        {game.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-stone-600 mt-0.5 leading-snug">
                    {game.desc}
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-stone-400 shrink-0" />
            </button>
          ))}
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
              dateIdeas={dateIdeas}
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
