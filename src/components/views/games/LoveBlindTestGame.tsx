import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Volume2,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  RotateCcw,
  Headphones,
  Award,
  Flame,
  HelpCircle,
} from 'lucide-react';
import { CoupleProfile, PartnerId, EnglishQuizQuestion } from '../../../types';
import { soundEffects } from '../../../lib/audio';
import { triggerCelebrationConfetti, triggerHeartConfetti } from '../../../lib/confetti';
import { speakEnglish } from '../../../lib/englishSpeech';
import { ENGLISH_QUIZ_QUESTIONS } from '../../../data/englishCourseData';

interface LoveBlindTestGameProps {
  profile: CoupleProfile;
  activePartnerId: PartnerId;
  speechRate: number;
  completedQuizIds: string[];
  onAddXp: (amount: number) => void;
  onSaveCompletedQuiz: (quizId: string) => void;
}

export const LoveBlindTestGame: React.FC<LoveBlindTestGameProps> = ({
  profile,
  activePartnerId,
  speechRate,
  completedQuizIds,
  onAddXp,
  onSaveCompletedQuiz,
}) => {
  const [activeQuizIndex, setActiveQuizIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [wordOrderList, setWordOrderList] = useState<string[]>([]);
  const [streakCount, setStreakCount] = useState(0);

  const currentQuiz = ENGLISH_QUIZ_QUESTIONS[activeQuizIndex] || ENGLISH_QUIZ_QUESTIONS[0];

  const handlePlayAudio = (phrase: string) => {
    soundEffects.playSoftTap();
    speakEnglish(phrase, { rate: speechRate });
  };

  const handleSelectOption = (idx: number) => {
    if (hasAnswered) return;
    setSelectedOption(idx);
    setHasAnswered(true);

    const right = idx === currentQuiz.correctAnswer;
    setIsCorrect(right);

    if (right) {
      soundEffects.playSuccessSparkle();
      triggerHeartConfetti();
      onAddXp(currentQuiz.xpReward);
      onSaveCompletedQuiz(currentQuiz.id);
      setStreakCount((s) => s + 1);
    } else {
      soundEffects.playSoftTap();
      setStreakCount(0);
    }
  };

  const handleWordOrderClick = (word: string) => {
    if (hasAnswered) return;
    soundEffects.playSoftTap();
    setWordOrderList((prev) => [...prev, word]);
  };

  const handleUndoWordOrder = () => {
    if (hasAnswered || wordOrderList.length === 0) return;
    soundEffects.playSoftTap();
    setWordOrderList((prev) => prev.slice(0, -1));
  };

  const handleValidateWordOrder = () => {
    if (hasAnswered) return;
    const constructed = wordOrderList.join(' ');
    const targetStr =
      typeof currentQuiz.correctAnswer === 'string'
        ? currentQuiz.correctAnswer
        : '';
    const right =
      constructed.trim().toLowerCase() === targetStr.trim().toLowerCase();

    setHasAnswered(true);
    setIsCorrect(right);

    if (right) {
      soundEffects.playSuccessSparkle();
      triggerCelebrationConfetti();
      onAddXp(currentQuiz.xpReward);
      onSaveCompletedQuiz(currentQuiz.id);
      setStreakCount((s) => s + 1);
    } else {
      soundEffects.playSoftTap();
      setStreakCount(0);
    }
  };

  const handleNextQuestion = () => {
    setSelectedOption(null);
    setHasAnswered(false);
    setIsCorrect(false);
    setWordOrderList([]);
    soundEffects.playSoftTap();
    setActiveQuizIndex((i) => (i + 1) % ENGLISH_QUIZ_QUESTIONS.length);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Game Show Banner */}
      <div className="bg-gradient-to-br from-amber-500 via-rose-500 to-pink-600 rounded-2xl sm:rounded-3xl p-4 sm:p-7 text-white shadow-md relative overflow-hidden">
        <div className="absolute -right-4 -bottom-4 text-7xl sm:text-8xl opacity-15 select-none pointer-events-none">
          ⚡
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-3 sm:gap-4">
          <div className="space-y-1.5 sm:space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-sm text-[11px] sm:text-xs font-bold tracking-wide">
              <Sparkles className="w-3.5 h-3.5 text-amber-200" />
              <span>JEU COMPLICE & BLIND TEST</span>
            </div>
            <h2 className="text-xl sm:text-3xl font-extrabold font-serif-romantic tracking-tight">
              Le Grand Blind Test d'Amour
            </h2>
            <p className="text-xs sm:text-sm text-rose-100 leading-relaxed">
              Écoutez la voix anglaise, devinez ce que votre moitié veut vous dire, et reconstituez des messages d'amour à toute vitesse !
            </p>
          </div>

          {streakCount > 1 && (
            <div className="bg-white/20 backdrop-blur-md p-2.5 sm:p-3 rounded-xl sm:rounded-2xl border border-white/20 flex items-center gap-2.5 self-start md:self-auto shrink-0">
              <Flame className="w-5 h-5 sm:w-6 sm:h-6 text-amber-300 fill-amber-300 shrink-0" />
              <div>
                <p className="text-[10px] text-rose-100 uppercase tracking-wider font-bold">Série en cours</p>
                <p className="text-xs sm:text-base font-extrabold text-white">{streakCount} bonnes réponses d'affilée !</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Game Stage */}
      <div className="bg-white rounded-2xl sm:rounded-3xl p-3.5 sm:p-7 border border-stone-200 shadow-xs space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 sm:gap-3 pb-3 sm:pb-4 border-b border-stone-100">
          <div>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] sm:text-xs font-bold bg-amber-100 text-amber-900 mb-1">
              <Award className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>
                Défi {activeQuizIndex + 1} sur {ENGLISH_QUIZ_QUESTIONS.length}
              </span>
            </span>
            <h3 className="text-base sm:text-xl font-bold text-stone-900 font-serif-romantic leading-snug">
              {currentQuiz.type === 'listen_guess'
                ? '🎧 Blind Test Audio : Écoute et Devine !'
                : currentQuiz.type === 'word_order'
                ? '🧩 Puzzle : Reconstitue le Mot Doux'
                : '💖 Devinette Complice'}
            </h3>
          </div>

          <span className="px-2.5 py-1 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px] sm:text-xs font-extrabold self-start sm:self-auto">
            +{currentQuiz.xpReward} Points Duo en jeu
          </span>
        </div>

        {/* Question Prompt Card */}
        <div className="p-4 sm:p-6 rounded-2xl bg-gradient-to-tr from-rose-50/80 via-white to-amber-50/60 border border-rose-200/80 text-center space-y-3 sm:space-y-4">
          <p className="text-base sm:text-xl font-bold text-stone-900 font-serif-romantic max-w-xl mx-auto break-words">
            {currentQuiz.question}
          </p>

          {/* Audio trigger for listening blind tests */}
          {currentQuiz.type === 'listen_guess' && currentQuiz.audioText && (
            <div className="py-1">
              <button
                type="button"
                onClick={() => handlePlayAudio(currentQuiz.audioText!)}
                className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white font-extrabold text-xs sm:text-sm shadow-md flex items-center justify-center gap-2.5 mx-auto active:scale-95 transition-transform cursor-pointer min-h-[46px]"
              >
                <Volume2 className="w-4 h-4 sm:w-5 sm:h-5 animate-pulse shrink-0" />
                <span>Écouter le mot secret (Voix douce)</span>
              </button>
            </div>
          )}
        </div>

        {/* Choice Buttons for multiple choice / blind test */}
        {(currentQuiz.type === 'multiple_choice' || currentQuiz.type === 'listen_guess') &&
          currentQuiz.options && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
              {currentQuiz.options.map((opt, idx) => {
                const isOptSelected = selectedOption === idx;
                const isCorrectOpt = idx === currentQuiz.correctAnswer;

                let btnStyle = 'bg-stone-50 hover:bg-rose-50/50 text-stone-800 border-stone-200';
                if (hasAnswered) {
                  if (isCorrectOpt) {
                    btnStyle = 'bg-emerald-600 text-white border-emerald-700 shadow-sm';
                  } else if (isOptSelected && !isCorrectOpt) {
                    btnStyle = 'bg-rose-500 text-white border-rose-600 shadow-sm';
                  } else {
                    btnStyle = 'bg-stone-50 opacity-40 text-stone-600 border-stone-200';
                  }
                }

                return (
                  <button
                    key={`${currentQuiz.id}-opt-${idx}`}
                    type="button"
                    disabled={hasAnswered}
                    onClick={() => handleSelectOption(idx)}
                    className={`p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border text-left font-bold text-xs sm:text-sm transition-all flex items-center justify-between cursor-pointer min-h-[48px] touch-manipulation ${btnStyle}`}
                  >
                    <span className="break-words pr-2">{opt}</span>
                    {hasAnswered && isCorrectOpt && (
                      <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 fill-white text-emerald-600 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          )}

        {/* Word Scramble Puzzle Interface */}
        {currentQuiz.type === 'word_order' && currentQuiz.scrambledWords && (
          <div className="space-y-3.5 sm:space-y-4 max-w-xl mx-auto">
            {/* Result Constructed Sentence Box */}
            <div className="min-h-14 sm:min-h-16 p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-stone-50 border-2 border-dashed border-stone-300 flex items-center justify-center gap-1.5 sm:gap-2 flex-wrap">
              {wordOrderList.length === 0 ? (
                <span className="text-[11px] sm:text-xs text-stone-400 font-medium text-center">
                  Touchez les mots ci-dessous dans le bon ordre...
                </span>
              ) : (
                wordOrderList.map((w, wIdx) => (
                  <span
                    key={`slot-${wIdx}`}
                    className="px-3 py-1.5 rounded-lg sm:rounded-xl bg-white border border-stone-300 shadow-2xs font-bold text-xs sm:text-sm text-stone-900"
                  >
                    {w}
                  </span>
                ))
              )}
            </div>

            {/* Word Tiles */}
            <div className="flex items-center justify-center gap-1.5 sm:gap-2 flex-wrap">
              {currentQuiz.scrambledWords.map((word, wIdx) => {
                const usedCount = wordOrderList.filter((x) => x === word).length;
                const totalCount = currentQuiz.scrambledWords!.filter((x) => x === word).length;
                const isAllUsed = usedCount >= totalCount;

                return (
                  <button
                    key={`scramble-${word}-${wIdx}`}
                    type="button"
                    disabled={isAllUsed || hasAnswered}
                    onClick={() => handleWordOrderClick(word)}
                    className={`px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer min-h-[42px] touch-manipulation ${
                      isAllUsed
                        ? 'opacity-25 bg-stone-200 text-stone-400'
                        : 'bg-white border border-stone-300 hover:border-rose-400 text-stone-800 shadow-2xs active:scale-95'
                    }`}
                  >
                    {word}
                  </button>
                );
              })}
            </div>

            {/* Validate / Clear Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3 pt-2 w-full">
              <button
                type="button"
                disabled={wordOrderList.length === 0 || hasAnswered}
                onClick={handleUndoWordOrder}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-stone-200 text-xs font-semibold text-stone-600 hover:bg-stone-100 disabled:opacity-30 flex items-center justify-center gap-1.5 cursor-pointer min-h-[42px] touch-manipulation"
              >
                <RotateCcw className="w-3.5 h-3.5 shrink-0" />
                <span>Effacer dernier mot</span>
              </button>

              <button
                type="button"
                disabled={wordOrderList.length < currentQuiz.scrambledWords.length || hasAnswered}
                onClick={handleValidateWordOrder}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 active:bg-rose-700 text-white text-xs font-bold shadow-xs disabled:opacity-40 cursor-pointer min-h-[42px] touch-manipulation flex items-center justify-center text-center"
              >
                Valider notre Phrase d'Amour
              </button>
            </div>
          </div>
        )}

        {/* Feedback / Explanation on Answer */}
        {hasAnswered && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-4 sm:p-5 rounded-xl sm:rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 ${
              isCorrect
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-amber-50 border-amber-200 text-amber-900'
            }`}
          >
            <div className="space-y-1">
              <p className="font-extrabold text-xs sm:text-sm">
                {isCorrect ? '🎉 Bravo à vous deux ! Bonne réponse !' : '💡 Presque ! Voici la petite astuce :'}
              </p>
              <p className="text-[11px] sm:text-xs leading-relaxed font-medium">{currentQuiz.explanation}</p>
            </div>

            <button
              type="button"
              onClick={handleNextQuestion}
              className="w-full sm:w-auto px-4 sm:px-5 py-2.5 rounded-xl sm:rounded-2xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold shrink-0 flex items-center justify-center gap-1.5 shadow-xs active:scale-95 transition-transform cursor-pointer min-h-[44px]"
            >
              <span>Défi Suivant</span>
              <ArrowRight className="w-3.5 h-3.5 shrink-0" />
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
};
