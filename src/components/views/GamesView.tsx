import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  BookOpen,
  Volume2,
  CheckCircle2,
  Sparkles,
  HelpCircle,
  Trophy,
  Flame,
  Send,
  Plus,
  Shuffle,
  Heart,
  MessageCircle,
  Search,
  RotateCcw,
  Headphones,
  Calendar,
  Languages,
  ArrowRight,
  Lightbulb,
  Check,
  Zap,
  Trash2,
  Target,
} from 'lucide-react';
import {
  CoupleProfile,
  PartnerId,
  QuizQuestion,
  DateIdea,
  CoupleChallenge,
  ChatMessage,
  EnglishLessonModule,
  EnglishLessonItem,
  EnglishCustomWord,
  EnglishLexiconItem,
  WeeklyLearningChallenge,
} from '../../types';
import { soundEffects } from '../../lib/audio';
import { triggerCelebrationConfetti, triggerHeartConfetti } from '../../lib/confetti';
import { speakEnglish, stopSpeech } from '../../lib/englishSpeech';
import { LexiconSection } from './LexiconSection';
import { WeeklyChallengesSection } from './WeeklyChallengesSection';
import { INITIAL_LEXICON_WORDS } from '../../data/initialLexiconData';
import { INITIAL_WEEKLY_LEARNING_CHALLENGES } from '../../data/initialWeeklyChallenges';
import {
  ENGLISH_MODULES,
  ENGLISH_DIALOGUES,
  ENGLISH_QUIZ_QUESTIONS,
  ENGLISH_COUPLE_CHALLENGES,
} from '../../data/englishCourseData';

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
}

type EnglishTab = 'lessons' | 'quizzes' | 'dialogues' | 'challenges' | 'vault' | 'weekly_challenges' | 'couple_extras';

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
}) => {
  // Main Tab State
  const [activeTab, setActiveTab] = useState<EnglishTab>('lessons');

  const effectiveWeeklyChallenges =
    weeklyChallenges && weeklyChallenges.length > 0
      ? weeklyChallenges
      : INITIAL_WEEKLY_LEARNING_CHALLENGES;

  const handleSelectActiveWeeklyChallenge = (challengeId: string) => {
    if (onSelectActiveWeeklyChallenge) {
      onSelectActiveWeeklyChallenge(challengeId);
    }
  };

  const handleSaveWeeklyChallenge = (challenge: WeeklyLearningChallenge) => {
    if (onSaveWeeklyChallenge) {
      onSaveWeeklyChallenge(challenge);
    }
  };

  // Lessons State
  const [selectedModuleId, setSelectedModuleId] = useState<string>(ENGLISH_MODULES[0].id);
  const [isFlashcardMode, setIsFlashcardMode] = useState<boolean>(false);
  const [activeCardIndex, setActiveCardIndex] = useState<number>(0);
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const [speechRate, setSpeechRate] = useState<number>(0.85); // 0.85x is optimal for beginner French speakers
  const [currentlySpeakingText, setCurrentlySpeakingText] = useState<string | null>(null);

  // Quizzes State
  const [activeQuizIndex, setActiveQuizIndex] = useState<number>(0);
  const [quizSelectedOption, setQuizSelectedOption] = useState<number | null>(null);
  const [quizWordOrderList, setQuizWordOrderList] = useState<string[]>([]);
  const [quizHasAnswered, setQuizHasAnswered] = useState<boolean>(false);
  const [isQuizCorrect, setIsQuizCorrect] = useState<boolean>(false);

  // Dialogues State
  const [activeDialogueId, setActiveDialogueId] = useState<string>(ENGLISH_DIALOGUES[0].id);

  // Notre Lexique State & Prefill Trigger
  const [internalLexicon, setInternalLexicon] = useState<EnglishLexiconItem[]>(() => {
    try {
      const saved = localStorage.getItem('nid_damour_lexicon');
      return saved ? JSON.parse(saved) : INITIAL_LEXICON_WORDS;
    } catch {
      return INITIAL_LEXICON_WORDS;
    }
  });
  const [prefillLexiconWord, setPrefillLexiconWord] = useState<Partial<EnglishLexiconItem> | null>(null);

  const effectiveLexicon = lexicon && lexicon.length > 0 ? lexicon : internalLexicon;

  useEffect(() => {
    try {
      localStorage.setItem('nid_damour_lexicon', JSON.stringify(effectiveLexicon));
    } catch {}
  }, [effectiveLexicon]);

  // Toast Feedback State
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Local Storage Progress State
  const [masteredIds, setMasteredIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('english_mastered_items');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [xpPoints, setXpPoints] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('english_xp_points');
      return saved ? parseInt(saved, 10) : 50; // starting bonus XP
    } catch {
      return 50;
    }
  });

  const [completedQuizIds, setCompletedQuizIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('english_completed_quizzes');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [completedChallengeIds, setCompletedChallengeIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('english_completed_challenges');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Extras state (Date Picker & Legacy Quiz)
  const [extrasSubTab, setExtrasSubTab] = useState<'date_picker' | 'couple_quiz' | 'couple_challenges'>('date_picker');
  const [selectedBudget, setSelectedBudget] = useState<string>('all');
  const [selectedWeather, setSelectedWeather] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [pickedDate, setPickedDate] = useState<DateIdea | null>(dateIdeas[0] || null);
  const [isSpinningWheel, setIsSpinningWheel] = useState(false);
  const [wheelRotation, setWheelRotation] = useState(0);
  const [legacyQuizIndex, setLegacyQuizIndex] = useState(0);

  const currentPartner = activePartnerId === 'p1' ? profile.partner1 : profile.partner2;
  const otherPartner = activePartnerId === 'p1' ? profile.partner2 : profile.partner1;

  // Persist XP and progress
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

  useEffect(() => {
    try {
      localStorage.setItem('english_completed_challenges', JSON.stringify(completedChallengeIds));
    } catch {}
  }, [completedChallengeIds]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3500);
  };

  // Pronunciation handler
  const handlePlayAudio = (text: string) => {
    setCurrentlySpeakingText(text);
    speakEnglish(text, {
      rate: speechRate,
      onEnd: () => setCurrentlySpeakingText(null),
    });
  };

  // Toggle mastered status
  const handleToggleMastered = (itemId: string) => {
    soundEffects.playSoftTap();
    if (masteredIds.includes(itemId)) {
      setMasteredIds((prev) => prev.filter((id) => id !== itemId));
    } else {
      setMasteredIds((prev) => [...prev, itemId]);
      setXpPoints((prev) => prev + 10);
      triggerHeartConfetti();
      showToast('✨ Mot maîtrisé ! +10 XP pour notre duo !');
    }
  };

  // Send phrase directly into the couple's chat
  const handleSendToChat = (englishText: string, frenchText: string) => {
    if (onSendChatMessage) {
      onSendChatMessage({
        senderId: activePartnerId,
        content: `🇬🇧 "${englishText}"\n🇫🇷 ${frenchText}\n\n(Appris ensemble dans notre cours d'anglais ! ❤️)`,
      });
      soundEffects.playMessageSent();
      triggerHeartConfetti();
      showToast('💌 Envoyé dans votre Chat avec succès !');
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard?.writeText(`${englishText} - ${frenchText}`);
      showToast('📋 Phrase copiée dans le presse-papier !');
    }
  };

  // Quiz Handling
  const currentQuiz = ENGLISH_QUIZ_QUESTIONS[activeQuizIndex] || ENGLISH_QUIZ_QUESTIONS[0];

  const handleSelectQuizOption = (optIndex: number) => {
    if (quizHasAnswered) return;
    setQuizSelectedOption(optIndex);
    setQuizHasAnswered(true);

    const isRight = optIndex === currentQuiz.correctAnswer;
    setIsQuizCorrect(isRight);

    if (isRight) {
      soundEffects.playSuccessSparkle();
      triggerCelebrationConfetti();
      if (!completedQuizIds.includes(currentQuiz.id)) {
        setCompletedQuizIds((prev) => [...prev, currentQuiz.id]);
        setXpPoints((prev) => prev + currentQuiz.xpReward);
      }
    } else {
      soundEffects.playErrorTone();
    }
  };

  const handleWordOrderClick = (word: string) => {
    if (quizHasAnswered) return;
    setQuizWordOrderList((prev) => [...prev, word]);
  };

  const handleUndoWordOrder = () => {
    if (quizHasAnswered) return;
    setQuizWordOrderList((prev) => prev.slice(0, -1));
  };

  const handleValidateWordOrder = () => {
    if (quizHasAnswered) return;
    const userAnswer = quizWordOrderList.join(' ').trim();
    const isRight = userAnswer.toLowerCase() === (currentQuiz.correctAnswer as string).toLowerCase();
    setQuizHasAnswered(true);
    setIsQuizCorrect(isRight);

    if (isRight) {
      soundEffects.playSuccessSparkle();
      triggerCelebrationConfetti();
      if (!completedQuizIds.includes(currentQuiz.id)) {
        setCompletedQuizIds((prev) => [...prev, currentQuiz.id]);
        setXpPoints((prev) => prev + currentQuiz.xpReward);
      }
    } else {
      soundEffects.playErrorTone();
    }
  };

  const handleNextQuiz = () => {
    setQuizSelectedOption(null);
    setQuizWordOrderList([]);
    setQuizHasAnswered(false);
    setIsQuizCorrect(false);
    setActiveQuizIndex((prev) => (prev + 1) % ENGLISH_QUIZ_QUESTIONS.length);
  };

  // Lexicon Handlers
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

  // Completed items count & couple level
  const totalCourseWords = ENGLISH_MODULES.reduce((sum, m) => sum + m.items.length, 0);
  const coupleLevel =
    xpPoints < 150
      ? { level: 1, title: 'Débutants Amoureux 🌱', badge: 'Niveau 1' }
      : xpPoints < 350
      ? { level: 2, title: 'Duo Complice 💬', badge: 'Niveau 2' }
      : xpPoints < 600
      ? { level: 3, title: 'Amants Polyglottes ✨', badge: 'Niveau 3' }
      : { level: 4, title: 'Bilingues en Amour 🏆🇬🇧', badge: 'Niveau 4' };

  // Current selected module
  const currentModule =
    ENGLISH_MODULES.find((m) => m.id === selectedModuleId) || ENGLISH_MODULES[0];

  // Spin Roulette Wheel (Legacy date picker)
  const filteredDateIdeas = dateIdeas.filter((d) => {
    if (selectedBudget !== 'all' && d.budget !== selectedBudget) return false;
    if (selectedWeather !== 'all' && d.weather !== selectedWeather) return false;
    if (selectedCategory !== 'all' && d.category !== selectedCategory) return false;
    return true;
  });

  const handleSpinWheel = () => {
    if (isSpinningWheel) return;
    const pool = filteredDateIdeas.length > 0 ? filteredDateIdeas : dateIdeas;
    if (pool.length === 0) return;

    setIsSpinningWheel(true);
    soundEffects.playHeartPulse();

    const randomAngle = wheelRotation + 1440 + Math.floor(Math.random() * 360);
    setWheelRotation(randomAngle);

    setTimeout(() => {
      const randomIndex = Math.floor(Math.random() * pool.length);
      const chosen = pool[randomIndex];
      setPickedDate(chosen);
      setIsSpinningWheel(false);
      soundEffects.playSuccessSparkle();
      triggerCelebrationConfetti();
    }, 2000);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 space-y-6">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-stone-900/95 text-white px-5 py-2.5 rounded-full text-xs font-semibold shadow-xl flex items-center gap-2 border border-stone-700/80 backdrop-blur-md"
          >
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 1. Header Banner : Couple English Hub & Duo XP Stats */}
      <div className="bg-gradient-to-br from-white via-rose-50/40 to-amber-50/40 rounded-3xl p-5 sm:p-6 border border-rose-100 shadow-xs">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-0.5 rounded-full text-xs font-bold bg-rose-500 text-white shadow-2xs flex items-center gap-1.5">
                <Languages className="w-3.5 h-3.5" />
                <span>Anglais en Duo pour Débutants</span>
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white border border-stone-200 text-stone-700 flex items-center gap-1">
                <span>{coupleLevel.badge} :</span>
                <span className="font-bold text-rose-600">{coupleLevel.title}</span>
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-bold text-stone-900 tracking-tight font-serif-romantic">
              Apprenons l'anglais ensemble, main dans la main
            </h1>
            <p className="text-xs sm:text-sm text-stone-600 max-w-2xl leading-relaxed">
              Conçu spécialement pour vous deux : cours simples pour débutants complets, prononciation audio ralentie, dialogues de couple et jeux complices !
            </p>
          </div>

          {/* XP & Progress Counters */}
          <div className="flex items-center gap-3 bg-white/90 p-3 rounded-2xl border border-rose-100 shadow-2xs shrink-0 self-stretch sm:self-auto justify-around">
            <div className="text-center px-2">
              <div className="flex items-center justify-center gap-1 text-amber-600 font-bold text-sm sm:text-base">
                <Zap className="w-4 h-4 fill-amber-500 text-amber-500" />
                <span>{xpPoints}</span>
              </div>
              <p className="text-[10px] text-stone-500 font-medium">Points Duo</p>
            </div>

            <div className="h-7 w-px bg-stone-200" />

            <div className="text-center px-2">
              <div className="flex items-center justify-center gap-1 text-emerald-600 font-bold text-sm sm:text-base">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>
                  {masteredIds.length}/{totalCourseWords}
                </span>
              </div>
              <p className="text-[10px] text-stone-500 font-medium">Mots Maîtrisés</p>
            </div>

            <div className="h-7 w-px bg-stone-200" />

            <div
              onClick={() => {
                soundEffects.playSoftTap();
                setActiveTab('vault');
              }}
              className="text-center px-2 cursor-pointer hover:opacity-80 transition-opacity"
              title="Ouvrir Notre Lexique d'anglais"
            >
              <div className="flex items-center justify-center gap-1 text-rose-600 font-bold text-sm sm:text-base">
                <BookOpen className="w-4 h-4 text-rose-500" />
                <span>{effectiveLexicon.length}</span>
              </div>
              <p className="text-[10px] text-stone-500 font-medium">Notre Lexique</p>
            </div>

            <div className="h-7 w-px bg-stone-200" />

            <div
              onClick={() => {
                soundEffects.playSoftTap();
                setActiveTab('weekly_challenges');
              }}
              className="text-center px-2 cursor-pointer hover:opacity-80 transition-opacity"
              title="Ouvrir les Défis d'apprentissage hebdomadaires"
            >
              <div className="flex items-center justify-center gap-1 text-amber-600 font-bold text-sm sm:text-base">
                <Target className="w-4 h-4 text-amber-500" />
                <span>Hebdo</span>
              </div>
              <p className="text-[10px] text-stone-500 font-medium">Défi Chat</p>
            </div>

            <div className="h-7 w-px bg-stone-200" />

            {/* Audio Speed Selector */}
            <div className="text-center px-1">
              <button
                type="button"
                onClick={() => {
                  setSpeechRate((r) => (r === 0.85 ? 1.0 : 0.85));
                  showToast(speechRate === 0.85 ? 'Vitesse audio : Normale (1.0x)' : 'Vitesse audio : Lente débutant (0.85x)');
                }}
                className="px-2 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                title="Ajuster la vitesse de prononciation audio"
              >
                <Volume2 className="w-3.5 h-3.5 text-rose-500" />
                <span>{speechRate === 0.85 ? '0.85x (Lent)' : '1.0x (Normal)'}</span>
              </button>
              <p className="text-[10px] text-stone-500 font-medium mt-0.5">Vitesse Audio</p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Primary Sub-Navigation Tabs */}
      <div className="flex items-center gap-1.5 bg-white p-1.5 rounded-2xl border border-stone-200 shadow-2xs overflow-x-auto no-scrollbar">
        <button
          type="button"
          onClick={() => {
            soundEffects.playSoftTap();
            setActiveTab('lessons');
          }}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            activeTab === 'lessons'
              ? 'bg-rose-500 text-white shadow-2xs'
              : 'text-stone-600 hover:bg-stone-100'
          }`}
          id="tab-english-lessons"
        >
          <BookOpen className="w-4 h-4" />
          <span>1. Cours & Fiches Mémo</span>
        </button>

        <button
          type="button"
          onClick={() => {
            soundEffects.playSoftTap();
            setActiveTab('weekly_challenges');
          }}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            activeTab === 'weekly_challenges'
              ? 'bg-rose-500 text-white shadow-2xs'
              : 'text-stone-600 hover:bg-stone-100'
          }`}
          id="tab-english-weekly-challenges"
        >
          <Target className="w-4 h-4 text-amber-500" />
          <span>🎯 Défis Hebdo Chat</span>
        </button>

        <button
          type="button"
          onClick={() => {
            soundEffects.playSoftTap();
            setActiveTab('quizzes');
          }}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            activeTab === 'quizzes'
              ? 'bg-rose-500 text-white shadow-2xs'
              : 'text-stone-600 hover:bg-stone-100'
          }`}
          id="tab-english-quizzes"
        >
          <HelpCircle className="w-4 h-4" />
          <span>2. Quiz & Jeux Débutants</span>
        </button>

        <button
          type="button"
          onClick={() => {
            soundEffects.playSoftTap();
            setActiveTab('dialogues');
          }}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            activeTab === 'dialogues'
              ? 'bg-rose-500 text-white shadow-2xs'
              : 'text-stone-600 hover:bg-stone-100'
          }`}
          id="tab-english-dialogues"
        >
          <MessageCircle className="w-4 h-4" />
          <span>3. Dialogues de Couple</span>
        </button>

        <button
          type="button"
          onClick={() => {
            soundEffects.playSoftTap();
            setActiveTab('challenges');
          }}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            activeTab === 'challenges'
              ? 'bg-rose-500 text-white shadow-2xs'
              : 'text-stone-600 hover:bg-stone-100'
          }`}
          id="tab-english-challenges"
        >
          <Trophy className="w-4 h-4" />
          <span>4. Défis Romantiques</span>
        </button>

        <button
          type="button"
          onClick={() => {
            soundEffects.playSoftTap();
            setActiveTab('vault');
          }}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            activeTab === 'vault'
              ? 'bg-rose-500 text-white shadow-2xs'
              : 'text-stone-600 hover:bg-stone-100'
          }`}
          id="tab-english-vault"
        >
          <BookOpen className="w-4 h-4 text-rose-500" />
          <span>5. Notre Lexique ({effectiveLexicon.length})</span>
        </button>

        <button
          type="button"
          onClick={() => {
            soundEffects.playSoftTap();
            setActiveTab('couple_extras');
          }}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            activeTab === 'couple_extras'
              ? 'bg-rose-500 text-white shadow-2xs'
              : 'text-stone-500 hover:bg-stone-100'
          }`}
          id="tab-english-extras"
        >
          <Shuffle className="w-4 h-4" />
          <span>Roue & Rencards</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 0. DÉFIS D'APPRENTISSAGE HEBDOMADAIRES (CHAT & COUPLE POINTS) */}
      {/* ========================================================================= */}
      {activeTab === 'weekly_challenges' && (
        <WeeklyChallengesSection
          profile={profile}
          activePartnerId={activePartnerId}
          challenges={effectiveWeeklyChallenges}
          onSelectActiveChallenge={handleSelectActiveWeeklyChallenge}
          onSaveChallenge={handleSaveWeeklyChallenge}
          onSaveLexiconWord={onSaveLexiconWord}
          onSendChatMessage={onSendChatMessage}
          onOpenChatWithDraft={onOpenChatWithDraft}
          onAddXp={(amount) => setXpPoints((prev) => prev + amount)}
        />
      )}

      {/* ========================================================================= */}
      {/* 1. COURS & FICHES MÉMO */}
      {/* ========================================================================= */}
      {activeTab === 'lessons' && (
        <div className="space-y-6">
          {/* Modules Selector Carousel */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
            {ENGLISH_MODULES.map((mod) => {
              const isSelected = selectedModuleId === mod.id;
              const moduleMasteredCount = mod.items.filter((item) =>
                masteredIds.includes(item.id)
              ).length;
              return (
                <button
                  key={mod.id}
                  type="button"
                  onClick={() => {
                    setSelectedModuleId(mod.id);
                    setActiveCardIndex(0);
                    setIsFlipped(false);
                    soundEffects.playSoftTap();
                  }}
                  className={`p-3 rounded-2xl border text-left transition-all relative flex flex-col justify-between cursor-pointer ${
                    isSelected
                      ? 'bg-white border-rose-500 ring-2 ring-rose-400/30 shadow-sm'
                      : 'bg-white/80 border-stone-200/90 hover:bg-white hover:border-stone-300'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xl">{mod.icon}</span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-stone-100 text-stone-600">
                        {mod.level.replace('Débutant ', '')}
                      </span>
                    </div>
                    <p className="font-bold text-xs text-stone-900 line-clamp-1">{mod.title}</p>
                    <p className="text-[10px] text-stone-500 line-clamp-1">{mod.englishTitle}</p>
                  </div>

                  <div className="mt-2 pt-2 border-t border-stone-100 flex items-center justify-between text-[10px] text-stone-500">
                    <span>{mod.items.length} phrases</span>
                    <span className="font-bold text-emerald-600">
                      {moduleMasteredCount}/{mod.items.length} ✓
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Module Banner & View Mode Toggle */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-stone-200/90 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-stone-100">
              <div className="flex items-center gap-3">
                <span className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-2xl shadow-2xs shrink-0">
                  {currentModule.icon}
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg sm:text-xl font-bold text-stone-900 font-serif-romantic">
                      {currentModule.title}
                    </h2>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${currentModule.badgeColor}`}>
                      {currentModule.level}
                    </span>
                  </div>
                  <p className="text-xs text-stone-600 mt-0.5">{currentModule.description}</p>
                </div>
              </div>

              {/* View Mode: List vs Flashcards */}
              <div className="flex items-center gap-1.5 bg-stone-100 p-1 rounded-xl shrink-0">
                <button
                  type="button"
                  onClick={() => setIsFlashcardMode(false)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    !isFlashcardMode
                      ? 'bg-white text-rose-600 shadow-2xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  Vue Liste Détaillée
                </button>
                <button
                  type="button"
                  onClick={() => setIsFlashcardMode(true)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    isFlashcardMode
                      ? 'bg-white text-rose-600 shadow-2xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  Mode Cartes Mémo (Flashcards)
                </button>
              </div>
            </div>

            {/* Sub-view A: Detailed List View */}
            {!isFlashcardMode && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {currentModule.items.map((item, idx) => {
                  const isMastered = masteredIds.includes(item.id);
                  const isSpeaking = currentlySpeakingText === item.english;

                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.04 }}
                      className={`p-4 sm:p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                        isMastered
                          ? 'bg-emerald-50/40 border-emerald-200/80 shadow-2xs'
                          : 'bg-stone-50/50 border-stone-200/80 hover:bg-white hover:shadow-xs'
                      }`}
                    >
                      <div className="space-y-2.5">
                        {/* Category & Status */}
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-stone-100 text-stone-600">
                            {item.category}
                          </span>

                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleToggleMastered(item.id)}
                              className={`text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 transition-all cursor-pointer ${
                                isMastered
                                  ? 'bg-emerald-600 text-white shadow-2xs'
                                  : 'bg-white border border-stone-200 text-stone-600 hover:border-emerald-300'
                              }`}
                              title="Marquer comme maîtrisé par notre duo"
                            >
                              <Check className="w-3 h-3" />
                              <span>{isMastered ? 'Maîtrisé !' : 'À apprendre'}</span>
                            </button>
                          </div>
                        </div>

                        {/* English Phrase with Audio Button */}
                        <div className="flex items-start justify-between gap-2 pt-1">
                          <div className="space-y-0.5">
                            <h3 className="text-base sm:text-lg font-bold text-stone-900 tracking-tight flex items-center gap-2">
                              <span>{item.english}</span>
                            </h3>

                            {/* Phonetic Pronunciation helper */}
                            <p className="text-xs font-mono font-medium text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md inline-block">
                              Prononciation : <span className="font-bold">{item.phonetic}</span>
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() => handlePlayAudio(item.english)}
                            className={`p-2.5 rounded-xl transition-all shrink-0 cursor-pointer shadow-2xs ${
                              isSpeaking
                                ? 'bg-rose-600 text-white scale-105 animate-pulse'
                                : 'bg-rose-100 hover:bg-rose-200 text-rose-700'
                            }`}
                            title="Écouter la prononciation anglaise"
                          >
                            <Volume2 className="w-4 h-4" />
                          </button>
                        </div>

                        {/* French Translation */}
                        <div className="pt-1.5 border-t border-stone-200/60">
                          <p className="text-xs sm:text-sm font-semibold text-stone-800">
                            🇫🇷 {item.french}
                          </p>
                        </div>

                        {/* Romantic or Practical Tip */}
                        {item.contextOrTip && (
                          <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-100/90 flex items-start gap-1.5 text-xs text-amber-900">
                            <Lightbulb className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                            <p className="text-[11px] leading-relaxed font-medium">
                              {item.contextOrTip}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Actions: Send to Chat / Practice / Save to Lexicon */}
                      <div className="mt-3.5 pt-2.5 border-t border-stone-200/60 flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handlePlayAudio(item.english)}
                            className="text-xs font-semibold text-stone-600 hover:text-rose-600 flex items-center gap-1 cursor-pointer"
                          >
                            <Headphones className="w-3.5 h-3.5" />
                            <span>Répéter</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              soundEffects.playSoftTap();
                              setPrefillLexiconWord({
                                english: item.english,
                                french: item.french,
                                phonetic: item.phonetic,
                                definition: item.contextOrTip || `Mot appris dans le module « ${currentModule.title} »`,
                                contextSentence: item.english,
                                contextSentenceFrench: item.french,
                                category: 'romantique',
                              });
                              setActiveTab('vault');
                            }}
                            className="text-xs font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1 cursor-pointer bg-rose-50/70 hover:bg-rose-100/70 px-2 py-0.5 rounded-lg transition-colors"
                            title="Ajouter et personnaliser dans Notre Lexique"
                          >
                            <Plus className="w-3 h-3" />
                            <span>+ Notre Lexique</span>
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleSendToChat(item.english, item.french)}
                          className="px-2.5 py-1 rounded-xl bg-white hover:bg-rose-50 border border-stone-200 text-rose-600 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                          title="Envoyer ce mot doux à mon partenaire dans le Chat"
                        >
                          <Send className="w-3 h-3" />
                          <span>Envoyer dans le Chat</span>
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}

            {/* Sub-view B: Interactive Flashcards Mode */}
            {isFlashcardMode && (
              <div className="max-w-xl mx-auto py-6 space-y-6">
                <div className="flex items-center justify-between text-xs text-stone-500 font-semibold px-2">
                  <span>
                    Carte {activeCardIndex + 1} sur {currentModule.items.length}
                  </span>
                  <span>Cliquez sur la carte pour la retourner</span>
                </div>

                {/* Flip Card */}
                {(() => {
                  const card = currentModule.items[activeCardIndex] || currentModule.items[0];
                  return (
                    <motion.div
                      key={`card-${card.id}-${isFlipped}`}
                      initial={{ scale: 0.95, opacity: 0.8 }}
                      animate={{ scale: 1, opacity: 1 }}
                      onClick={() => setIsFlipped(!isFlipped)}
                      className="min-h-64 p-8 rounded-3xl bg-gradient-to-tr from-white via-rose-50/50 to-amber-50/40 border-2 border-rose-200 shadow-md flex flex-col justify-between items-center text-center cursor-pointer hover:border-rose-400 transition-colors relative"
                    >
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white border border-stone-200 text-stone-600">
                        {isFlipped ? '🇫🇷 Traduction Française' : '🇬🇧 En Anglais'}
                      </span>

                      <div className="my-auto space-y-3">
                        {!isFlipped ? (
                          <>
                            <h3 className="text-2xl sm:text-3xl font-bold text-stone-900 font-serif-romantic">
                              {card.english}
                            </h3>
                            <p className="text-sm font-mono text-rose-600 bg-white/80 px-3 py-1 rounded-full inline-block border border-rose-100">
                              {card.phonetic}
                            </p>
                          </>
                        ) : (
                          <>
                            <h3 className="text-2xl sm:text-3xl font-bold text-rose-700 font-serif-romantic">
                              {card.french}
                            </h3>
                            {card.contextOrTip && (
                              <p className="text-xs text-stone-600 max-w-sm mx-auto mt-2">
                                💡 {card.contextOrTip}
                              </p>
                            )}
                          </>
                        )}
                      </div>

                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePlayAudio(card.english);
                          }}
                          className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-transform hover:scale-105 cursor-pointer"
                        >
                          <Volume2 className="w-4 h-4" />
                          <span>Écouter</span>
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleMastered(card.id);
                          }}
                          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                            masteredIds.includes(card.id)
                              ? 'bg-emerald-600 text-white'
                              : 'bg-white border border-stone-200 text-stone-700 hover:bg-stone-50'
                          }`}
                        >
                          <Check className="w-4 h-4" />
                          <span>{masteredIds.includes(card.id) ? 'Acquis ✓' : 'À revoir'}</span>
                        </button>
                      </div>
                    </motion.div>
                  );
                })()}

                {/* Card Controls Navigation */}
                <div className="flex items-center justify-between gap-4">
                  <button
                    type="button"
                    disabled={activeCardIndex === 0}
                    onClick={() => {
                      setIsFlipped(false);
                      setActiveCardIndex((i) => Math.max(0, i - 1));
                    }}
                    className="px-4 py-2 rounded-xl border border-stone-200 text-xs font-bold text-stone-700 hover:bg-stone-100 disabled:opacity-30 cursor-pointer"
                  >
                    Précédent
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsFlipped(!isFlipped)}
                    className="text-xs font-semibold text-rose-600 hover:underline cursor-pointer"
                  >
                    Retourner la carte 🔄
                  </button>

                  <button
                    type="button"
                    disabled={activeCardIndex === currentModule.items.length - 1}
                    onClick={() => {
                      setIsFlipped(false);
                      setActiveCardIndex((i) => Math.min(currentModule.items.length - 1, i + 1));
                    }}
                    className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold disabled:opacity-30 cursor-pointer"
                  >
                    Suivant
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. QUIZ & JEUX DÉBUTANTS EN DUO */}
      {/* ========================================================================= */}
      {activeTab === 'quizzes' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-5 sm:p-7 border border-stone-200/90 shadow-xs space-y-6">
            {/* Quiz Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-stone-100">
              <div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 mb-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  <span>
                    Question {activeQuizIndex + 1} sur {ENGLISH_QUIZ_QUESTIONS.length}
                  </span>
                </span>
                <h2 className="text-xl sm:text-2xl font-bold text-stone-900 font-serif-romantic">
                  Le Grand Jeu d'Anglais à Deux
                </h2>
                <p className="text-xs sm:text-sm text-stone-600">
                  Répondez ensemble ou défiez-vous avec bienveillance pour tester vos progrès !
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-3 py-1.5 rounded-xl bg-stone-100 text-stone-700 text-xs font-bold">
                  +{currentQuiz.xpReward} XP en jeu
                </span>
              </div>
            </div>

            {/* Question Card */}
            <div className="p-6 rounded-2xl bg-gradient-to-tr from-rose-50/80 via-white to-amber-50/50 border border-rose-100 text-center space-y-3">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-white text-stone-600 border border-stone-200">
                {currentQuiz.type === 'multiple_choice'
                  ? 'Choix Multiple'
                  : currentQuiz.type === 'listen_guess'
                  ? 'Écoute & Trouve'
                  : 'Reconstituer la phrase'}
              </span>

              <h3 className="text-lg sm:text-xl font-bold text-stone-900 font-serif-romantic max-w-xl mx-auto">
                {currentQuiz.question}
              </h3>

              {/* Special: Audio Button for Listening test */}
              {currentQuiz.type === 'listen_guess' && currentQuiz.audioText && (
                <div className="py-2">
                  <button
                    type="button"
                    onClick={() => handlePlayAudio(currentQuiz.audioText!)}
                    className="px-5 py-2.5 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs sm:text-sm shadow-md flex items-center gap-2 mx-auto hover:scale-105 transition-transform cursor-pointer"
                  >
                    <Volume2 className="w-5 h-5" />
                    <span>Écouter le mot en anglais (0.85x)</span>
                  </button>
                </div>
              )}
            </div>

            {/* Type 1 & 2: Multiple Choice Options */}
            {(currentQuiz.type === 'multiple_choice' || currentQuiz.type === 'listen_guess') &&
              currentQuiz.options && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {currentQuiz.options.map((opt, idx) => {
                    const isSelected = quizSelectedOption === idx;
                    const isCorrect = idx === currentQuiz.correctAnswer;

                    let btnStyle = 'bg-stone-50 hover:bg-stone-100 text-stone-800 border-stone-200';
                    if (quizHasAnswered) {
                      if (isCorrect) {
                        btnStyle = 'bg-emerald-600 text-white border-emerald-700 shadow-sm';
                      } else if (isSelected && !isCorrect) {
                        btnStyle = 'bg-rose-500 text-white border-rose-600 shadow-sm';
                      } else {
                        btnStyle = 'bg-stone-50 opacity-40 text-stone-600 border-stone-200';
                      }
                    }

                    return (
                      <button
                        key={`${currentQuiz.id}-opt-${idx}`}
                        type="button"
                        disabled={quizHasAnswered}
                        onClick={() => handleSelectQuizOption(idx)}
                        className={`p-4 rounded-2xl border text-left font-semibold text-xs sm:text-sm transition-all flex items-center justify-between cursor-pointer ${btnStyle}`}
                      >
                        <span>{opt}</span>
                        {quizHasAnswered && isCorrect && (
                          <CheckCircle2 className="w-5 h-5 fill-white text-emerald-600 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}

            {/* Type 3: Word Scramble Interactive Puzzle */}
            {currentQuiz.type === 'word_order' && currentQuiz.scrambledWords && (
              <div className="space-y-4 max-w-xl mx-auto">
                {/* Result Sentence Box */}
                <div className="min-h-16 p-4 rounded-2xl bg-stone-50 border-2 border-dashed border-stone-300 flex items-center justify-center gap-2 flex-wrap">
                  {quizWordOrderList.length === 0 ? (
                    <span className="text-xs text-stone-400">
                      Touchez les mots ci-dessous dans le bon ordre...
                    </span>
                  ) : (
                    quizWordOrderList.map((w, wIdx) => (
                      <span
                        key={`word-slot-${wIdx}`}
                        className="px-3 py-1.5 rounded-xl bg-white border border-stone-300 shadow-2xs font-bold text-xs sm:text-sm text-stone-900"
                      >
                        {w}
                      </span>
                    ))
                  )}
                </div>

                {/* Available Scrambled Words */}
                <div className="flex items-center justify-center gap-2 flex-wrap">
                  {currentQuiz.scrambledWords.map((word, wIdx) => {
                    // Count how many times word is used vs total occurrences
                    const usedCount = quizWordOrderList.filter((x) => x === word).length;
                    const totalCount = currentQuiz.scrambledWords!.filter((x) => x === word).length;
                    const isAllUsed = usedCount >= totalCount;

                    return (
                      <button
                        key={`scramble-${word}-${wIdx}`}
                        type="button"
                        disabled={isAllUsed || quizHasAnswered}
                        onClick={() => handleWordOrderClick(word)}
                        className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                          isAllUsed
                            ? 'opacity-25 bg-stone-200 text-stone-400'
                            : 'bg-white border border-stone-300 hover:border-rose-400 text-stone-800 shadow-2xs'
                        }`}
                      >
                        {word}
                      </button>
                    );
                  })}
                </div>

                {/* Actions: Undo / Validate */}
                <div className="flex items-center justify-center gap-3 pt-2">
                  <button
                    type="button"
                    disabled={quizWordOrderList.length === 0 || quizHasAnswered}
                    onClick={handleUndoWordOrder}
                    className="px-3 py-1.5 rounded-xl border border-stone-200 text-xs font-semibold text-stone-600 hover:bg-stone-100 disabled:opacity-30 flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Effacer le dernier mot</span>
                  </button>

                  <button
                    type="button"
                    disabled={
                      quizWordOrderList.length < currentQuiz.scrambledWords.length ||
                      quizHasAnswered
                    }
                    onClick={handleValidateWordOrder}
                    className="px-5 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold shadow-xs disabled:opacity-40 cursor-pointer"
                  >
                    Valider la phrase
                  </button>
                </div>
              </div>
            )}

            {/* Answer Explanation & Next Button */}
            {quizHasAnswered && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-4 sm:p-5 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                  isQuizCorrect
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : 'bg-amber-50 border-amber-200 text-amber-900'
                }`}
              >
                <div className="space-y-1">
                  <p className="font-bold text-sm">
                    {isQuizCorrect ? '🎉 Bravo à vous deux ! Bonne réponse !' : '💡 Pas tout à fait, voici la bonne réponse :'}
                  </p>
                  <p className="text-xs leading-relaxed">{currentQuiz.explanation}</p>
                </div>

                <button
                  type="button"
                  onClick={handleNextQuiz}
                  className="px-5 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold shrink-0 flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <span>Question Suivante</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. DIALOGUES ROMANTIQUES EN DUO */}
      {/* ========================================================================= */}
      {activeTab === 'dialogues' && (
        <div className="space-y-6">
          {/* Dialogues Selector Tabs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {ENGLISH_DIALOGUES.map((diag) => {
              const isSelected = activeDialogueId === diag.id;
              return (
                <button
                  key={diag.id}
                  type="button"
                  onClick={() => {
                    setActiveDialogueId(diag.id);
                    soundEffects.playSoftTap();
                  }}
                  className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-white border-rose-500 shadow-sm ring-2 ring-rose-400/20'
                      : 'bg-white/80 border-stone-200 hover:bg-white'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xl">{diag.icon}</span>
                    <h3 className="font-bold text-xs sm:text-sm text-stone-900 line-clamp-1">
                      {diag.frenchTitle}
                    </h3>
                  </div>
                  <p className="text-[11px] text-stone-500 line-clamp-1">{diag.situation}</p>
                </button>
              );
            })}
          </div>

          {/* Active Dialogue Script View */}
          {(() => {
            const diag =
              ENGLISH_DIALOGUES.find((d) => d.id === activeDialogueId) || ENGLISH_DIALOGUES[0];

            return (
              <div className="bg-white rounded-3xl p-5 sm:p-7 border border-stone-200/90 shadow-xs space-y-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-stone-100">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-rose-100 text-rose-800">
                      Jeu de Rôle à Deux
                    </span>
                    <h2 className="text-xl font-bold text-stone-900 font-serif-romantic mt-1">
                      {diag.frenchTitle} ({diag.title})
                    </h2>
                    <p className="text-xs text-stone-600">{diag.situation}</p>
                  </div>

                  <div className="flex items-center gap-2 text-xs bg-stone-100 px-3 py-1.5 rounded-xl font-semibold text-stone-700">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Répétez chacun votre tour à voix haute !</span>
                  </div>
                </div>

                {/* Chat Bubble Roleplay Script */}
                <div className="space-y-4 max-w-2xl mx-auto py-2">
                  {diag.lines.map((line, lIdx) => {
                    const isP1 = line.speaker === 'partner1';
                    const speakerPartner = isP1 ? profile.partner1 : profile.partner2;

                    return (
                      <motion.div
                        key={`diag-line-${lIdx}`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: lIdx * 0.08 }}
                        className={`flex gap-3 items-start ${
                          isP1 ? 'justify-start' : 'justify-end flex-row-reverse'
                        }`}
                      >
                        {/* Avatar */}
                        <div className="relative shrink-0">
                          {speakerPartner.avatar ? (
                            <img
                              src={speakerPartner.avatar}
                              alt={speakerPartner.name}
                              className="w-10 h-10 rounded-full object-cover border-2 border-rose-300 shadow-2xs"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-rose-100 border-2 border-rose-300 flex items-center justify-center font-bold text-rose-700 text-xs shadow-2xs">
                              {speakerPartner.name[0]}
                            </div>
                          )}
                          <span className="absolute -bottom-1 -right-1 text-[10px] font-bold bg-white px-1 rounded-full border border-stone-200">
                            {isP1 ? 'Rôle 1' : 'Rôle 2'}
                          </span>
                        </div>

                        {/* Speech Bubble */}
                        <div
                          className={`max-w-[80%] p-4 rounded-3xl space-y-1.5 shadow-2xs ${
                            isP1
                              ? 'bg-rose-50 border border-rose-100 rounded-tl-xs'
                              : 'bg-amber-50 border border-amber-100 rounded-tr-xs'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[11px] font-bold text-stone-700">
                              {speakerPartner.name}
                            </span>
                            <button
                              type="button"
                              onClick={() => handlePlayAudio(line.english)}
                              className="p-1 rounded-lg hover:bg-white/80 text-rose-600 transition-colors cursor-pointer"
                              title="Écouter la réplique"
                            >
                              <Volume2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <p className="text-sm sm:text-base font-bold text-stone-900 leading-snug">
                            "{line.english}"
                          </p>

                          <p className="text-xs font-mono text-rose-600">
                            {line.phonetic}
                          </p>

                          <p className="text-xs text-stone-600 pt-1 border-t border-black/5 font-medium">
                            🇫🇷 {line.french}
                          </p>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. DÉFIS D'AMOUR EN ANGLAIS */}
      {/* ========================================================================= */}
      {activeTab === 'challenges' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-5 sm:p-7 border border-stone-200/90 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-stone-100">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">
                  Mission Complice
                </span>
                <h2 className="text-xl font-bold text-stone-900 font-serif-romantic mt-1">
                  Défis & Missions Romantiques en Anglais
                </h2>
                <p className="text-xs text-stone-600">
                  Glissez l'anglais dans votre quotidien amoureux pour progresser sans effort !
                </p>
              </div>

              <span className="px-3 py-1 rounded-xl bg-purple-100 text-purple-800 font-bold text-xs">
                {completedChallengeIds.length}/{ENGLISH_COUPLE_CHALLENGES.length} Défi(s) Relevé(s)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {ENGLISH_COUPLE_CHALLENGES.map((chal) => {
                const isDone = completedChallengeIds.includes(chal.id);

                return (
                  <div
                    key={chal.id}
                    className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                      isDone
                        ? 'bg-emerald-50/70 border-emerald-200'
                        : 'bg-stone-50 border-stone-200 hover:bg-white'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-bold text-sm text-stone-900">{chal.title}</h3>
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-800">
                          +{chal.xp} XP
                        </span>
                      </div>
                      <p className="text-xs text-stone-600 leading-relaxed mb-3">
                        {chal.description}
                      </p>
                    </div>

                    <div className="mt-3 pt-3 border-t border-stone-200/60 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => handleSendToChat(chal.phraseToSend, chal.title)}
                        className="px-3 py-1.5 rounded-xl bg-white hover:bg-rose-50 border border-stone-200 text-rose-600 font-bold text-xs flex items-center gap-1 cursor-pointer"
                      >
                        <Send className="w-3 h-3" />
                        <span>Envoyer dans le Chat</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          if (isDone) {
                            setCompletedChallengeIds((prev) => prev.filter((id) => id !== chal.id));
                          } else {
                            setCompletedChallengeIds((prev) => [...prev, chal.id]);
                            setXpPoints((prev) => prev + chal.xp);
                            soundEffects.playSuccessSparkle();
                            triggerCelebrationConfetti();
                            showToast('🎉 Défi accompli ensemble ! Félicitations !');
                          }
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer ${
                          isDone
                            ? 'bg-emerald-600 text-white'
                            : 'bg-stone-900 text-white hover:bg-stone-800'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>{isDone ? 'Validé !' : 'Marquer comme fait'}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. NOTRE LEXIQUE D'ANGLAIS DUO */}
      {/* ========================================================================= */}
      {activeTab === 'vault' && (
        <LexiconSection
          profile={profile}
          activePartnerId={activePartnerId}
          lexicon={effectiveLexicon}
          speechRate={speechRate}
          onSaveWord={handleSaveWord}
          onDeleteWord={handleDeleteWord}
          onToggleFavorite={handleToggleFavorite}
          onToggleMastered={handleToggleMasteredLexicon}
          onSendChatMessage={onSendChatMessage}
          onAddXp={(amount) => {
            setXpPoints((prev) => prev + amount);
          }}
          initialPrefillWord={prefillLexiconWord}
          onClearPrefill={() => setPrefillLexiconWord(null)}
        />
      )}

      {/* ========================================================================= */}
      {/* 6. EXTRA : ANCIENNES FONCTIONNALITÉS (Roue des Rencards & Quiz Secret) */}
      {/* ========================================================================= */}
      {activeTab === 'couple_extras' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-5 sm:p-7 border border-stone-200/90 shadow-xs space-y-6">
            <div className="flex items-center justify-between gap-3 pb-3 border-b border-stone-100">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-100 text-amber-900">
                  Activités Complices
                </span>
                <h2 className="text-xl font-bold text-stone-900 font-serif-romantic mt-1">
                  Idées de Rendez-Vous & Jeux de Couple
                </h2>
              </div>

              <div className="flex items-center gap-1.5 bg-stone-100 p-1 rounded-xl text-xs">
                <button
                  type="button"
                  onClick={() => setExtrasSubTab('date_picker')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                    extrasSubTab === 'date_picker'
                      ? 'bg-white text-rose-600 shadow-2xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  Roue des Rencards
                </button>
                <button
                  type="button"
                  onClick={() => setExtrasSubTab('couple_quiz')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                    extrasSubTab === 'couple_quiz'
                      ? 'bg-white text-rose-600 shadow-2xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  Quiz Complicité ({quizzes.length})
                </button>
              </div>
            </div>

            {/* Date Roulette */}
            {extrasSubTab === 'date_picker' && (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                <div className="md:col-span-5 flex flex-col items-center justify-center p-4">
                  <div className="relative w-48 h-48 sm:w-56 sm:h-56">
                    <motion.div
                      animate={{ rotate: wheelRotation }}
                      transition={{
                        duration: isSpinningWheel ? 2 : 0.3,
                        ease: 'easeInOut',
                      }}
                      className="w-full h-full rounded-full border-8 border-rose-200 bg-gradient-to-tr from-rose-400 via-pink-400 to-amber-300 shadow-xl flex items-center justify-center relative overflow-hidden"
                    >
                      <div className="absolute inset-0 grid grid-cols-2 grid-rows-2">
                        <div className="border-r border-b border-white/40 flex items-center justify-center text-xl">
                          🎬
                        </div>
                        <div className="border-b border-white/40 flex items-center justify-center text-xl">
                          🍝
                        </div>
                        <div className="border-r border-white/40 flex items-center justify-center text-xl">
                          ✨
                        </div>
                        <div className="flex items-center justify-center text-xl">
                          🕯️
                        </div>
                      </div>
                    </motion.div>

                    <button
                      type="button"
                      onClick={handleSpinWheel}
                      disabled={isSpinningWheel}
                      className="absolute inset-0 m-auto w-16 h-16 rounded-full bg-white text-rose-600 font-bold text-xs shadow-lg hover:scale-105 transition-transform flex flex-col items-center justify-center ring-4 ring-rose-300 cursor-pointer"
                    >
                      <Shuffle className="w-4 h-4 text-rose-500" />
                      <span>{isSpinningWheel ? '...' : 'Tourner'}</span>
                    </button>
                  </div>
                </div>

                <div className="md:col-span-7">
                  {pickedDate && (
                    <div className="bg-gradient-to-br from-rose-50/80 to-amber-50/60 p-6 rounded-3xl border border-rose-200/90 shadow-2xs space-y-3">
                      <div className="flex items-center gap-1.5">
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-500 text-white">
                          {pickedDate.category}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-white text-stone-700 border border-stone-200">
                          {pickedDate.budget}
                        </span>
                      </div>
                      <h3 className="text-xl font-bold text-stone-900 font-serif-romantic">
                        {pickedDate.title}
                      </h3>
                      <p className="text-xs sm:text-sm text-stone-700 leading-relaxed">
                        {pickedDate.description}
                      </p>
                      {pickedDate.prepTip && (
                        <p className="text-xs text-rose-800 bg-white/80 p-2.5 rounded-xl border border-rose-100">
                          💡 <strong>Conseil : </strong> {pickedDate.prepTip}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Couple Quiz */}
            {extrasSubTab === 'couple_quiz' && quizzes[legacyQuizIndex] && (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-rose-50/70 border border-rose-100">
                  <span className="text-xs font-bold text-rose-700">
                    Question {legacyQuizIndex + 1} sur {quizzes.length}
                  </span>
                  <h3 className="text-lg font-bold text-stone-900 font-serif-romantic mt-1">
                    {quizzes[legacyQuizIndex].question}
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {quizzes[legacyQuizIndex].options.map((opt, idx) => (
                    <button
                      key={`quiz-opt-${idx}`}
                      type="button"
                      onClick={() => onAnswerQuiz(quizzes[legacyQuizIndex].id, activePartnerId, idx)}
                      className="p-3.5 rounded-xl border border-stone-200 bg-stone-50 hover:bg-stone-100 text-left text-xs font-semibold"
                    >
                      {opt}
                    </button>
                  ))}
                </div>

                <div className="flex justify-between items-center pt-2">
                  <button
                    type="button"
                    disabled={legacyQuizIndex === 0}
                    onClick={() => setLegacyQuizIndex((i) => Math.max(0, i - 1))}
                    className="px-3 py-1.5 rounded-xl border border-stone-200 text-xs font-bold disabled:opacity-30"
                  >
                    Précédent
                  </button>
                  <button
                    type="button"
                    disabled={legacyQuizIndex === quizzes.length - 1}
                    onClick={() => setLegacyQuizIndex((i) => Math.min(quizzes.length - 1, i + 1))}
                    className="px-3 py-1.5 rounded-xl bg-rose-500 text-white text-xs font-bold disabled:opacity-30"
                  >
                    Suivant
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
