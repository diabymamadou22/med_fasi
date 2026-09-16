import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  HelpCircle,
  Trophy,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Heart,
  Award,
  ArrowRight,
  MessageCircle,
} from 'lucide-react';
import { CoupleProfile, PartnerId } from '../../types';
import { soundEffects } from '../../lib/audio';
import { triggerCelebrationConfetti, triggerHeartConfetti } from '../../lib/confetti';

export interface AffinityQuestion {
  id: string;
  targetPartnerId: PartnerId; // Whom this question is about
  question: string;
  category: 'Préférences' | 'Notre Histoire' | 'Rêves & Désirs' | 'Personnalité';
  options: string[];
  realAnswerIndex?: number; // target partner's choice
  guessAnswerIndex?: number; // guesser's choice
}

const INITIAL_AFFINITY_QUESTIONS: AffinityQuestion[] = [
  {
    id: 'aq1',
    targetPartnerId: 'p1',
    question: 'Quel est mon plat réconfort ultime quand j’ai passé une longue journée ?',
    category: 'Préférences',
    options: ['Des sushis frais ou cuisine asiatique', 'Une pizza bien croustillante / pâtes crémeuses', 'Un burger gourmand et des frites', 'Un bon plat mijoté réconfortant fait maison'],
  },
  {
    id: 'aq2',
    targetPartnerId: 'p1',
    question: 'Quelle a été ma toute première impression lors de notre première rencontre ?',
    category: 'Notre Histoire',
    options: ['Un coup de foudre immédiat et intense', 'J’ai tout de suite adoré ton regard et ton sourire', 'J’étais un peu timide mais très curieux(se)', 'Une complicité naturelle et évidente dès la 1ère minute'],
  },
  {
    id: 'aq3',
    targetPartnerId: 'p1',
    question: 'Si on pouvait partir demain sans contrainte, quelle serait ma destination de rêve avec toi ?',
    category: 'Rêves & Désirs',
    options: ['Une cabane isolée en pleine forêt sous les aurores boréales', 'Une villa les pieds dans l’eau turquoise aux Maldives', 'Un road trip d’aventure avec sac à dos et couchers de soleil', 'Une ville historique et romantique (Rome, Tokyo, Kyoto...)'],
  },
  {
    id: 'aq4',
    targetPartnerId: 'p1',
    question: 'Comment est-ce que je préfère qu’on me remonte le moral ?',
    category: 'Personnalité',
    options: ['Un gros câlin silencieux sans me forcer à parler', 'Me faire rire avec des bêtises ou une vidéo marrante', 'M’écouter vider mon sac avec une boisson chaude', 'Me préparer un bon repas et me laisser tranquille un moment'],
  },
  {
    id: 'aq5',
    targetPartnerId: 'p1',
    question: 'Quel est mon langage de l’amour dominant selon moi ?',
    category: 'Préférences',
    options: ['Les contacts physiques (câlins, baisers, caresses)', 'Les mots doux et compliments sincères', 'Les moments de qualité partagés à deux', 'Les petites attentions et services rendus au quotidien'],
  },
];

interface CompatibilityQuizGameProps {
  profile: CoupleProfile;
  activePartnerId: PartnerId;
}

export const CompatibilityQuizGame: React.FC<CompatibilityQuizGameProps> = ({
  profile,
  activePartnerId,
}) => {
  const [questions, setQuestions] = useState<AffinityQuestion[]>(() => {
    try {
      const saved = localStorage.getItem('nid_amour_affinity_quiz');
      return saved ? JSON.parse(saved) : INITIAL_AFFINITY_QUESTIONS;
    } catch {
      return INITIAL_AFFINITY_QUESTIONS;
    }
  });

  const [currentIndex, setCurrentIndex] = useState(0);
  const [targetPartnerId, setTargetPartnerId] = useState<PartnerId>('p1');
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem('nid_amour_affinity_quiz', JSON.stringify(questions));
    } catch (e) {
      console.error(e);
    }
  }, [questions]);

  const targetPartner = targetPartnerId === 'p1' ? profile.partner1 : profile.partner2;
  const guesserPartner = targetPartnerId === 'p1' ? profile.partner2 : profile.partner1;

  const currentQ = questions[currentIndex] || questions[0];

  // Target sets their true answer
  const handleSetRealAnswer = (index: number) => {
    soundEffects.playSoftTap();
    const updated = questions.map((q) =>
      q.id === currentQ.id ? { ...q, realAnswerIndex: index } : q
    );
    setQuestions(updated);
  };

  // Guesser sets their guess
  const handleSetGuessAnswer = (index: number) => {
    soundEffects.playSoftTap();
    const updated = questions.map((q) =>
      q.id === currentQ.id ? { ...q, guessAnswerIndex: index } : q
    );
    setQuestions(updated);

    if (currentQ.realAnswerIndex !== undefined) {
      if (currentQ.realAnswerIndex === index) {
        soundEffects.playVictoryChime();
        triggerCelebrationConfetti();
      } else {
        soundEffects.playHeartPulse();
      }
    }
  };

  const handleNext = () => {
    soundEffects.playSoftTap();
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setShowResults(true);
      triggerCelebrationConfetti();
    }
  };

  const handleRestart = () => {
    soundEffects.playSoftTap();
    const reset = questions.map((q) => ({
      ...q,
      realAnswerIndex: undefined,
      guessAnswerIndex: undefined,
    }));
    setQuestions(reset);
    setCurrentIndex(0);
    setShowResults(false);
  };

  // Stats
  const answeredBoth = questions.filter(
    (q) => q.realAnswerIndex !== undefined && q.guessAnswerIndex !== undefined
  );
  const correctCount = answeredBoth.filter(
    (q) => q.realAnswerIndex === q.guessAnswerIndex
  ).length;
  const scorePercent = answeredBoth.length > 0 ? Math.round((correctCount / answeredBoth.length) * 100) : 0;

  const getBadge = (pct: number) => {
    if (pct >= 90) return { title: '👑 Télépathie Amoureuse', desc: 'Vous vous connaissez sur le bout des doigts, une connexion fusionnelle rare !' };
    if (pct >= 70) return { title: '💖 Âmes Sœurs Reconnues', desc: 'Une complicité remarquable, vous lisez presque dans les pensées de l’autre !' };
    if (pct >= 50) return { title: '✨ Complices en Éclosion', desc: 'Une belle complicité et encore tant de petites pépites secrètes à découvrir !' };
    return { title: '🌱 Découverte Pleine d’Amour', desc: 'La preuve qu’il y a encore plein de mystères passionnants à percer ensemble !' };
  };

  const badge = getBadge(scorePercent);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-pink-600 via-rose-500 to-amber-500 rounded-3xl p-6 text-white shadow-md relative overflow-hidden">
        <div className="relative z-1 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold mb-2">
              <Award className="w-3.5 h-3.5" />
              <span>Quiz de Connaissance Réciproque</span>
            </div>
            <h2 className="font-serif-romantic text-2xl sm:text-3xl font-bold tracking-tight">
              🎯 Est-ce que tu me connais vraiment ?
            </h2>
            <p className="text-white/90 text-xs sm:text-sm mt-1 max-w-xl">
              L'un des partenaires choisit secrètement sa réponse, et l'autre doit deviner la vérité !
            </p>
          </div>

          {/* Switch target partner */}
          <div className="bg-white/15 backdrop-blur-md border border-white/25 rounded-2xl p-3 flex items-center gap-2">
            <span className="text-xs font-semibold text-white/90">Sujet du Quiz :</span>
            <button
              onClick={() => {
                setTargetPartnerId(targetPartnerId === 'p1' ? 'p2' : 'p1');
                soundEffects.playSoftTap();
              }}
              className="px-3 py-1.5 rounded-xl bg-white text-rose-700 font-bold text-xs shadow-xs hover:bg-rose-50 cursor-pointer transition-colors"
            >
              Sur {targetPartner.name} (Changer ⇄)
            </button>
          </div>
        </div>
      </div>

      {!showResults ? (
        currentQ && (
          <motion.div
            key={currentQ.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl border border-rose-100/80 p-6 sm:p-8 shadow-sm space-y-6"
          >
            {/* Progress header */}
            <div className="flex items-center justify-between text-xs font-bold text-stone-500">
              <span className="px-3 py-1 rounded-full bg-rose-50 text-rose-700">
                {currentQ.category}
              </span>
              <span>
                Question {currentIndex + 1} sur {questions.length}
              </span>
            </div>

            {/* Question Text */}
            <div className="text-center py-2">
              <h3 className="font-serif-romantic text-2xl sm:text-3xl font-bold text-stone-900 leading-snug">
                « {currentQ.question} »
              </h3>
              <p className="text-xs text-stone-500 mt-2">
                Concerne : <strong className="text-rose-600">{targetPartner.name}</strong> • Devin : <strong className="text-pink-600">{guesserPartner.name}</strong>
              </p>
            </div>

            {/* Step 1: Real Answer of target partner */}
            <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-stone-700 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-rose-500 text-white flex items-center justify-center text-[10px]">1</span>
                  <span>Réponse Secrète de {targetPartner.name} :</span>
                </span>
                <span className="text-[11px] text-stone-400">
                  {currentQ.realAnswerIndex !== undefined ? 'Choix enregistré 🔒' : 'En attente du choix'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {currentQ.options.map((opt, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSetRealAnswer(idx)}
                    className={`p-3 rounded-xl text-left text-xs font-semibold transition-all cursor-pointer border ${
                      currentQ.realAnswerIndex === idx
                        ? 'bg-rose-500 text-white border-rose-600 shadow-xs'
                        : 'bg-white hover:bg-stone-100 text-stone-700 border-stone-200'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            {/* Step 2: Guess Answer of guesser partner */}
            <div className="p-4 rounded-2xl bg-rose-50/50 border border-rose-100">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-rose-900 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-pink-500 text-white flex items-center justify-center text-[10px]">2</span>
                  <span>Devinette de {guesserPartner.name} :</span>
                </span>
                <span className="text-[11px] text-rose-500 font-medium">
                  {currentQ.guessAnswerIndex !== undefined ? 'Devinette posée' : 'Que pensez-vous qu’il/elle a répondu ?'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {currentQ.options.map((opt, idx) => {
                  const isGuessed = currentQ.guessAnswerIndex === idx;
                  const isReal = currentQ.realAnswerIndex === idx;
                  const bothAnswered = currentQ.realAnswerIndex !== undefined && currentQ.guessAnswerIndex !== undefined;

                  let style = 'bg-white hover:bg-rose-50 text-stone-700 border-stone-200';
                  if (bothAnswered) {
                    if (isReal && isGuessed) {
                      style = 'bg-emerald-500 text-white border-emerald-600 shadow-xs font-bold';
                    } else if (isGuessed && !isReal) {
                      style = 'bg-red-500 text-white border-red-600 shadow-xs font-bold';
                    } else if (isReal) {
                      style = 'bg-emerald-100 text-emerald-900 border-emerald-300 font-bold';
                    }
                  } else if (isGuessed) {
                    style = 'bg-pink-500 text-white border-pink-600 shadow-xs';
                  }

                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSetGuessAnswer(idx)}
                      className={`p-3 rounded-xl text-left text-xs font-semibold transition-all cursor-pointer border flex items-center justify-between ${style}`}
                    >
                      <span>{opt}</span>
                      {bothAnswered && isGuessed && isReal && <CheckCircle2 className="w-4 h-4 text-white" />}
                      {bothAnswered && isGuessed && !isReal && <XCircle className="w-4 h-4 text-white" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Reveal Verdict Banner */}
            {currentQ.realAnswerIndex !== undefined && currentQ.guessAnswerIndex !== undefined && (
              <div
                className={`p-4 rounded-2xl text-center font-bold text-sm flex items-center justify-center gap-2 ${
                  currentQ.realAnswerIndex === currentQ.guessAnswerIndex
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-amber-50 text-amber-800 border border-amber-200'
                }`}
              >
                {currentQ.realAnswerIndex === currentQ.guessAnswerIndex ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <span>Bravo ! Vous avez trouvé la bonne réponse ! 🎉</span>
                  </>
                ) : (
                  <>
                    <Heart className="w-5 h-5 text-amber-600" />
                    <span>Raté pour cette fois ! La bonne réponse était en vert. Discutez-en !</span>
                  </>
                )}
              </div>
            )}

            {/* Navigation */}
            <div className="flex items-center justify-between pt-4 border-t border-stone-100">
              <button
                onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
                disabled={currentIndex === 0}
                className="px-4 py-2 rounded-xl border border-stone-200 text-stone-600 font-bold text-xs disabled:opacity-40 cursor-pointer"
              >
                ← Précédente
              </button>

              <button
                onClick={handleNext}
                className="px-6 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <span>{currentIndex === questions.length - 1 ? 'Voir le Score Final' : 'Question Suivante'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )
      ) : (
        /* Results View */
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-3xl p-8 border border-rose-100 shadow-md text-center max-w-xl mx-auto space-y-6"
        >
          <div className="w-20 h-20 rounded-full bg-rose-100 mx-auto flex items-center justify-center text-3xl shadow-inner">
            🏆
          </div>

          <div>
            <h3 className="font-serif-romantic text-2xl sm:text-3xl font-bold text-stone-900">
              {badge.title}
            </h3>
            <p className="text-stone-600 text-sm mt-1 max-w-md mx-auto">
              {badge.desc}
            </p>
          </div>

          <div className="p-6 bg-rose-50/70 rounded-3xl border border-rose-100 flex items-center justify-around">
            <div>
              <p className="text-3xl font-bold text-rose-600">{scorePercent}%</p>
              <p className="text-xs text-stone-500 font-semibold">Affinité Réussie</p>
            </div>
            <div className="h-10 w-px bg-rose-200" />
            <div>
              <p className="text-3xl font-bold text-stone-800">
                {correctCount} / {questions.length}
              </p>
              <p className="text-xs text-stone-500 font-semibold">Bonnes Réponses</p>
            </div>
          </div>

          <div className="flex items-center justify-center gap-3">
            <button
              onClick={handleRestart}
              className="px-6 py-3 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-sm shadow-md flex items-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Recommencer avec un autre sujet</span>
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
};
