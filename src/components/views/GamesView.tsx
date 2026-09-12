import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Gamepad2,
  Sparkles,
  HelpCircle,
  CheckCircle2,
  Lock,
  RefreshCw,
  Trophy,
  Flame,
  Zap,
  Calendar,
  Heart,
  Plus,
  Compass,
  DollarSign,
  CloudSun,
  Bot,
  Shuffle,
  Smile,
  MessageCircle,
  Trash2,
} from 'lucide-react';
import {
  CoupleProfile,
  PartnerId,
  QuizQuestion,
  DateIdea,
  CoupleChallenge,
} from '../../types';
import { soundEffects } from '../../lib/audio';
import { triggerCelebrationConfetti, triggerHeartConfetti } from '../../lib/confetti';

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
}) => {
  const [subTab, setSubTab] = useState<'quiz' | 'date_picker' | 'challenges'>('quiz');
  
  // Date Picker States
  const [selectedBudget, setSelectedBudget] = useState<string>('all');
  const [selectedWeather, setSelectedWeather] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [pickedDate, setPickedDate] = useState<DateIdea | null>(dateIdeas[0] || null);
  const [isSpinningWheel, setIsSpinningWheel] = useState(false);
  const [wheelRotation, setWheelRotation] = useState(0);
  const [isGeneratingAIDates, setIsGeneratingAIDates] = useState(false);

  // Quiz States
  const [activeQuizIndex, setActiveQuizIndex] = useState(0);
  const [isGeneratingAIQuiz, setIsGeneratingAIQuiz] = useState(false);

  const currentPartner = activePartnerId === 'p1' ? profile.partner1 : profile.partner2;
  const otherPartner = activePartnerId === 'p1' ? profile.partner2 : profile.partner1;

  // Filtered date ideas for picker
  const filteredDateIdeas = dateIdeas.filter((d) => {
    if (selectedBudget !== 'all' && d.budget !== selectedBudget) return false;
    if (selectedWeather !== 'all' && d.weather !== selectedWeather) return false;
    if (selectedCategory !== 'all' && d.category !== selectedCategory) return false;
    return true;
  });

  // Spin Roulette Wheel
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

  // Generate Date with Gemini AI
  const handleGenerateAIDates = async () => {
    setIsGeneratingAIDates(true);
    try {
      const res = await fetch('/api/gemini/generate-date', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          budget: selectedBudget === 'all' ? 'Indifférent' : selectedBudget,
          weather: selectedWeather === 'all' ? 'Indifférent' : selectedWeather,
          location: selectedCategory === 'all' ? 'Maison ou Sortie' : selectedCategory,
          coupleNames: `${profile.partner1.name} & ${profile.partner2.name}`,
        }),
      });

      const data = await res.json();
      if (data.data?.ideas && data.data.ideas.length > 0) {
        const newIdea = data.data.ideas[0];
        const formatted: DateIdea = {
          id: `ai-date-${Date.now()}`,
          title: newIdea.title,
          description: newIdea.description,
          budget: (newIdea.budget as any) || '€',
          weather: 'Indifférent',
          category: (newIdea.location as any) || 'Romantique',
          prepTip: newIdea.prepTip,
          isSaved: true,
        };
        onAddNewDateIdea(formatted);
        setPickedDate(formatted);
        triggerCelebrationConfetti();
      } else {
        // Fallback random pick
        const pool = dateIdeas;
        const random = pool[Math.floor(Math.random() * pool.length)];
        setPickedDate(random);
      }
    } catch (e) {
      console.warn(e);
      const random = dateIdeas[Math.floor(Math.random() * dateIdeas.length)];
      setPickedDate(random);
    } finally {
      setIsGeneratingAIDates(false);
    }
  };

  // Generate Quiz Question with Gemini AI
  const handleGenerateAIQuiz = async () => {
    setIsGeneratingAIQuiz(true);
    try {
      const res = await fetch('/api/gemini/generate-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          theme: 'Complicité, fous rires et intimité du couple',
        }),
      });
      const data = await res.json();
      if (data.data?.questions && data.data.questions.length > 0) {
        const q = data.data.questions[0];
        const newQ: QuizQuestion = {
          id: `ai-quiz-${Date.now()}`,
          question: q.question,
          category: (q.category as any) || 'Complicité',
          options: q.options || ['Option A', 'Option B', 'Option C', 'Option D'],
          discussionPrompt: q.funFactPrompt || 'Discutez de vos réponses en amoureux !',
        };
        onAddNewQuiz(newQ);
        setActiveQuizIndex(quizzes.length);
        triggerHeartConfetti();
      }
    } catch (e) {
      console.warn(e);
    } finally {
      setIsGeneratingAIQuiz(false);
    }
  };

  const currentQuiz = quizzes[activeQuizIndex] || quizzes[0];
  const myAnswer =
    activePartnerId === 'p1'
      ? currentQuiz?.partner1Answer
      : currentQuiz?.partner2Answer;
  const partnerAnswer =
    activePartnerId === 'p1'
      ? currentQuiz?.partner2Answer
      : currentQuiz?.partner1Answer;

  const bothAnswered =
    currentQuiz?.partner1Answer !== undefined &&
    currentQuiz?.partner2Answer !== undefined;
  const isMatch =
    bothAnswered && currentQuiz.partner1Answer === currentQuiz.partner2Answer;

  // Completed challenges count
  const completedChallenges = challenges.filter((c) => c.isCompleted).length;
  const totalPoints = challenges
    .filter((c) => c.isCompleted)
    .reduce((sum, c) => sum + c.points, 0);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 space-y-6">
      {/* Sub Navigation */}
      <div className="flex items-center justify-between sm:justify-start gap-2 bg-white p-2 rounded-2xl border border-stone-200 shadow-2xs overflow-x-auto">
        <button
          onClick={() => setSubTab('quiz')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
            subTab === 'quiz'
              ? 'bg-rose-500 text-white shadow-xs'
              : 'text-stone-600 hover:bg-stone-100'
          }`}
          id="subtab-quiz"
        >
          <HelpCircle className="w-4 h-4" />
          <span>Quiz du Couple</span>
        </button>

        <button
          onClick={() => setSubTab('date_picker')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
            subTab === 'date_picker'
              ? 'bg-rose-500 text-white shadow-xs'
              : 'text-stone-600 hover:bg-stone-100'
          }`}
          id="subtab-date-picker"
        >
          <Shuffle className="w-4 h-4" />
          <span>Générateur de Rendez-vous</span>
        </button>

        <button
          onClick={() => setSubTab('challenges')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
            subTab === 'challenges'
              ? 'bg-rose-500 text-white shadow-xs'
              : 'text-stone-600 hover:bg-stone-100'
          }`}
          id="subtab-challenges"
        >
          <Trophy className="w-4 h-4" />
          <span>Carnet de Défis ({completedChallenges}/{challenges.length})</span>
        </button>
      </div>

      {/* 1. QUIZ DU COUPLE */}
      {subTab === 'quiz' && currentQuiz && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-stone-200/80 p-5 sm:p-7 shadow-xs">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
              <div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 mb-1">
                  <Gamepad2 className="w-3.5 h-3.5" />
                  <span>Questionnaire de Complicité #{activeQuizIndex + 1}</span>
                </span>
                <h2 className="font-serif-romantic text-2xl font-bold text-stone-900">
                  Le Quiz Secret à Deux
                </h2>
                <p className="text-xs sm:text-sm text-stone-600">
                  Chacun répond secrètement sans regarder, puis découvrez vos réponses et lancez la discussion !
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleGenerateAIQuiz}
                  disabled={isGeneratingAIQuiz}
                  className="px-3.5 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-800 text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs"
                >
                  <Bot className="w-3.5 h-3.5 text-purple-600" />
                  <span>{isGeneratingAIQuiz ? 'Création IA...' : 'Nouvelle question IA'}</span>
                </button>
              </div>
            </div>

            {/* Quiz Question Box */}
            <div className="p-5 sm:p-6 bg-gradient-to-tr from-rose-50/70 via-white to-amber-50/50 rounded-2xl border border-rose-100/90 mb-6">
              <div className="flex items-center justify-between text-xs font-bold text-rose-800 mb-2">
                <span>Catégorie : {currentQuiz.category}</span>
                <span>
                  Question {activeQuizIndex + 1} sur {quizzes.length}
                </span>
              </div>
              <h3 className="font-serif-romantic text-xl sm:text-2xl font-bold text-stone-900 leading-snug">
                {currentQuiz.question}
              </h3>
            </div>

            {/* Options List */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
              {currentQuiz.options.map((option, optIdx) => {
                const isSelectedByMe = myAnswer === optIdx;
                const isSelectedByPartner = partnerAnswer === optIdx;

                return (
                  <button
                    key={optIdx}
                    onClick={() => {
                      onAnswerQuiz(currentQuiz.id, activePartnerId, optIdx);
                      soundEffects.playHeartPulse();
                    }}
                    className={`p-4 rounded-2xl border text-left transition-all relative ${
                      isSelectedByMe
                        ? 'bg-rose-500 text-white border-rose-600 shadow-sm'
                        : 'bg-stone-50 hover:bg-stone-100 text-stone-800 border-stone-200/80'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-xs sm:text-sm font-medium">{option}</span>
                      {isSelectedByMe && (
                        <CheckCircle2 className="w-4 h-4 fill-white text-rose-500 shrink-0" />
                      )}
                    </div>

                    {/* Reveal badge if both answered */}
                    {bothAnswered && isSelectedByPartner && (
                      <div className="mt-2 pt-2 border-t border-rose-200/50 text-[11px] font-bold flex items-center gap-1 text-sky-800 bg-sky-100/90 px-2 py-0.5 rounded-lg w-fit">
                        <span>Choix de {otherPartner.name}</span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Verdict / Status Banner */}
            <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3 text-xs sm:text-sm">
                <div className="flex items-center -space-x-2">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                      myAnswer !== undefined ? 'bg-emerald-500' : 'bg-stone-300'
                    }`}
                    title={currentPartner.name}
                  >
                    {myAnswer !== undefined ? '✓' : currentPartner.name[0]}
                  </div>
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                      partnerAnswer !== undefined ? 'bg-emerald-500' : 'bg-stone-300'
                    }`}
                    title={otherPartner.name}
                  >
                    {partnerAnswer !== undefined ? '✓' : otherPartner.name[0]}
                  </div>
                </div>

                <div>
                  {bothAnswered ? (
                    <p className="font-bold text-stone-800">
                      {isMatch ? (
                        <span className="text-rose-600">
                          🎉 Connexion 100% complice ! Même réponse !
                        </span>
                      ) : (
                        <span className="text-amber-700">
                          ✨ Réponses différentes : parfait pour en discuter !
                        </span>
                      )}
                    </p>
                  ) : (
                    <p className="text-stone-500">
                      {myAnswer === undefined
                        ? `À toi de voter, ${currentPartner.name} !`
                        : `En attente de la réponse de ${otherPartner.name}...`}
                    </p>
                  )}
                </div>
              </div>

              {/* Navigation between quiz questions */}
              <div className="flex items-center gap-2">
                <button
                  disabled={activeQuizIndex === 0}
                  onClick={() => setActiveQuizIndex((i) => Math.max(0, i - 1))}
                  className="px-3 py-1.5 rounded-xl border border-stone-200 text-xs font-semibold text-stone-700 disabled:opacity-30 hover:bg-stone-100"
                >
                  Précédent
                </button>
                <button
                  disabled={activeQuizIndex === quizzes.length - 1}
                  onClick={() =>
                    setActiveQuizIndex((i) => Math.min(quizzes.length - 1, i + 1))
                  }
                  className="px-3 py-1.5 rounded-xl bg-rose-500 text-white text-xs font-bold disabled:opacity-30 hover:bg-rose-600"
                >
                  Suivant
                </button>
              </div>
            </div>

            {/* Discussion starter */}
            {bothAnswered && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 p-4 bg-purple-50 rounded-2xl border border-purple-100 flex items-center gap-3 text-xs sm:text-sm text-purple-900"
              >
                <MessageCircle className="w-5 h-5 text-purple-600 shrink-0" />
                <div>
                  <p className="font-bold">Sujet de discussion complice :</p>
                  <p>{currentQuiz.discussionPrompt}</p>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      )}

      {/* 2. DATE NIGHT PICKER & ROULETTE */}
      {subTab === 'date_picker' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-stone-200/80 p-5 sm:p-7 shadow-xs">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
              <div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 mb-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  <span>La Roue du Rendez-Vous</span>
                </span>
                <h2 className="font-serif-romantic text-2xl font-bold text-stone-900">
                  Générateur d'Idées de Rencards
                </h2>
                <p className="text-xs sm:text-sm text-stone-600">
                  Fini le classique « On fait quoi ce soir ? ». Tournez la roue ou filtrez selon vos envies !
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleGenerateAIDates}
                  disabled={isGeneratingAIDates}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
                >
                  <Bot className="w-4 h-4" />
                  <span>
                    {isGeneratingAIDates ? 'Génération IA...' : 'Idée Sur-Mesure Gemini'}
                  </span>
                </button>
              </div>
            </div>

            {/* Filter controls */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6 p-4 bg-stone-50 rounded-2xl border border-stone-200/70 text-xs">
              <div>
                <label className="font-bold text-stone-700 block mb-1">
                  Budget :
                </label>
                <select
                  value={selectedBudget}
                  onChange={(e) => setSelectedBudget(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-stone-200 rounded-xl font-medium"
                >
                  <option value="all">Tous les budgets</option>
                  <option value="Gratuit">Gratuit / 0€</option>
                  <option value="€">Petit budget (€)</option>
                  <option value="€€">Moyen (€€)</option>
                  <option value="€€€">Dîner Chic (€€€)</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1">
                  Météo / Ambiance :
                </label>
                <select
                  value={selectedWeather}
                  onChange={(e) => setSelectedWeather(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-stone-200 rounded-xl font-medium"
                >
                  <option value="all">Indifférent</option>
                  <option value="Pluie/Cosy">Pluie / Cocooning à la maison</option>
                  <option value="Plein air">Beau temps / Plein air</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1">
                  Catégorie :
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-stone-200 rounded-xl font-medium"
                >
                  <option value="all">Toutes les ambiances</option>
                  <option value="Maison">À la Maison</option>
                  <option value="Sortie">En Ville / Sortie</option>
                  <option value="Romantique">Romantique & Doux</option>
                  <option value="Gourmand">Gourmand / Cuisine</option>
                </select>
              </div>
            </div>

            {/* Interactive Spinning Wheel & Spotlight Card */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              {/* Wheel Section */}
              <div className="md:col-span-5 flex flex-col items-center justify-center p-4">
                <div className="relative w-48 h-48 sm:w-56 sm:h-56">
                  {/* Wheel Outer Frame */}
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

                  {/* Wheel Center Button */}
                  <button
                    onClick={handleSpinWheel}
                    disabled={isSpinningWheel}
                    className="absolute inset-0 m-auto w-16 h-16 rounded-full bg-white text-rose-600 font-bold text-xs shadow-lg hover:scale-105 transition-transform flex flex-col items-center justify-center ring-4 ring-rose-300"
                  >
                    <Shuffle className="w-4 h-4 text-rose-500" />
                    <span>{isSpinningWheel ? '...' : 'Lancer'}</span>
                  </button>
                </div>

                <p className="text-[11px] text-stone-400 mt-3 font-medium">
                  {filteredDateIdeas.length} idées disponibles avec ces filtres
                </p>
              </div>

              {/* Spotlight Picked Date Card */}
              <div className="md:col-span-7">
                {pickedDate && (
                  <motion.div
                    key={pickedDate.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-gradient-to-br from-rose-50/80 to-amber-50/60 p-6 rounded-3xl border border-rose-200/90 shadow-sm space-y-4"
                  >
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-1.5">
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-500 text-white">
                          {pickedDate.category}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-white text-stone-700 border border-stone-200">
                          {pickedDate.budget}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-white text-stone-700 border border-stone-200">
                          {pickedDate.weather}
                        </span>
                      </div>

                      <button
                        onClick={() => {
                          onSaveDateIdea(pickedDate);
                          soundEffects.playSuccessSparkle();
                          triggerHeartConfetti();
                        }}
                        className="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1 hover:underline"
                      >
                        <Heart className="w-3.5 h-3.5 fill-rose-500" />
                        <span>Enregistrer dans nos favoris</span>
                      </button>
                    </div>

                    <div>
                      <h3 className="font-serif-romantic text-xl sm:text-2xl font-bold text-stone-900">
                        {pickedDate.title}
                      </h3>
                      <p className="text-xs sm:text-sm text-stone-700 mt-2 leading-relaxed">
                        {pickedDate.description}
                      </p>
                    </div>

                    {pickedDate.prepTip && (
                      <div className="p-3 bg-white/90 rounded-xl border border-rose-100 text-xs text-rose-900 flex items-start gap-2">
                        <Sparkles className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold">Conseil secret : </span>
                          <span>{pickedDate.prepTip}</span>
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. CARNET DE DÉFIS DE COUPLE */}
      {subTab === 'challenges' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-stone-200/80 p-5 sm:p-7 shadow-xs">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
              <div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-900 mb-1">
                  <Trophy className="w-3.5 h-3.5 text-purple-600" />
                  <span>Défis & Missions Romantiques</span>
                </span>
                <h2 className="font-serif-romantic text-2xl font-bold text-stone-900">
                  Carnet de Défis pour Briser la Routine
                </h2>
                <p className="text-xs sm:text-sm text-stone-600">
                  Petits défis complices à réaliser chaque semaine pour nourrir la flamme.
                </p>
              </div>

              <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-2xl font-bold text-xs shadow-xs">
                <Zap className="w-4 h-4 text-amber-300" />
                <span>{totalPoints} Points de Complicité</span>
              </div>
            </div>

            {/* Challenges Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {challenges.map((chal) => (
                <div
                  key={chal.id}
                  className={`p-5 rounded-3xl border transition-all flex flex-col justify-between ${
                    chal.isCompleted
                      ? 'bg-emerald-50/70 border-emerald-200'
                      : 'bg-stone-50/70 border-stone-200 hover:bg-white hover:shadow-xs'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white text-stone-700 shadow-2xs border border-stone-200">
                        {chal.category}
                      </span>
                      <span className="text-xs font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                        +{chal.points} pts
                      </span>
                    </div>

                    <h3 className="font-serif-romantic text-base sm:text-lg font-bold text-stone-900 mb-1">
                      {chal.title}
                    </h3>
                    <p className="text-xs text-stone-600 leading-relaxed">
                      {chal.description}
                    </p>

                    {chal.photoProof && chal.photoProof.trim() !== '' && (
                      <div className="relative group/chalphoto mt-3 rounded-2xl overflow-hidden max-h-48 w-full bg-stone-100 border border-stone-200">
                        <img
                          src={chal.photoProof}
                          alt={`Preuve: ${chal.title}`}
                          className="w-full h-full object-cover"
                        />
                        {onRemoveChallengePhoto && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onRemoveChallengePhoto(chal.id);
                            }}
                            className="absolute top-2 right-2 px-2 py-1 rounded-lg bg-black/60 hover:bg-rose-600 text-white text-xs font-semibold backdrop-blur-xs flex items-center gap-1 transition-colors cursor-pointer"
                            title="Retirer la photo de ce défi"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Retirer photo</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-stone-200/60 flex items-center justify-between gap-2 flex-wrap">
                    <span className="text-[11px] text-stone-500">
                      {chal.isCompleted
                        ? `Accompli ${chal.completedDate || 'récemment'} 🎉`
                        : 'Défi en attente'}
                    </span>

                    <div className="flex items-center gap-1.5">
                      {onDeleteChallenge && (
                        <button
                          type="button"
                          onClick={() => onDeleteChallenge(chal.id)}
                          className="p-1.5 rounded-xl border border-stone-200 hover:border-rose-300 text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Supprimer ce défi"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}

                      <button
                        onClick={() => {
                          onToggleChallenge(chal.id);
                          if (!chal.isCompleted) {
                            soundEffects.playSuccessSparkle();
                            triggerCelebrationConfetti();
                          }
                        }}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                          chal.isCompleted
                            ? 'bg-emerald-600 text-white'
                            : 'bg-stone-900 hover:bg-stone-800 text-white'
                        }`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{chal.isCompleted ? 'Validé !' : 'Marquer comme fait'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
