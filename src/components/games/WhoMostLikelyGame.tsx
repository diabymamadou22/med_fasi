import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  Plus,
  MessageCircle,
  ChevronRight,
  ChevronLeft,
  X,
  Dices,
} from 'lucide-react';
import { CoupleProfile, PartnerId, ChatMessage, WhoMostLikelySession, WhoQuestion } from '../../types';
import { soundEffects } from '../../lib/audio';
import { triggerCelebrationConfetti, triggerHeartConfetti } from '../../lib/confetti';
import { subscribeWhoMostLikely, saveWhoMostLikely } from '../../lib/firestoreService';

const DEFAULT_QUESTIONS: WhoQuestion[] = [
  { id: 'w1', text: 'Qui s’endort en premier devant un film le soir ?', category: 'Quotidien' },
  { id: 'w2', text: 'Qui a dit « Je t’aime » en premier ?', category: 'Romance' },
  { id: 'w3', text: 'Qui est le plus dépensier lors d’une sortie shopping ?', category: 'Quotidien' },
  { id: 'w4', text: 'Qui cherche ses clés partout alors qu’elles sont dans sa poche ?', category: 'Fous rires' },
  { id: 'w5', text: 'Qui prépare le meilleur petit-déjeuner au lit ?', category: 'Romance' },
  { id: 'w6', text: 'Qui pleure le plus facilement devant un film d’amour ?', category: 'Romance' },
  { id: 'w7', text: 'Qui râle le plus dans les bouchons ?', category: 'Quotidien' },
  { id: 'w8', text: 'Qui ferait la surprise la plus folle pour l’autre ?', category: 'Romance' },
  { id: 'w9', text: 'Qui est le plus mauvais perdant aux jeux ?', category: 'Fous rires' },
  { id: 'w10', text: 'Qui a le plus besoin de câlins au réveil ?', category: 'Romance' },
  { id: 'w11', text: 'Qui chante le plus fort (et le plus faux) sous la douche ?', category: 'Fous rires' },
  { id: 'w12', text: 'Qui est le plus gourmand face aux desserts ?', category: 'Quotidien' },
  { id: 'w13', text: 'Qui fait le premier pas pour se réconcilier ?', category: 'Romance' },
  { id: 'w14', text: 'Qui met le plus de temps à se préparer ?', category: 'Quotidien' },
  { id: 'w15', text: 'Qui envoie le plus de messages doux dans la journée ?', category: 'Romance' },
  { id: 'w16', text: 'Qui embrasse le mieux au petit matin ?', category: 'Intime' },
  { id: 'w17', text: 'Qui est le plus susceptible de voler la couette la nuit ?', category: 'Fous rires' },
  { id: 'w18', text: 'Qui planifie les plus beaux week-ends en amoureux ?', category: 'Avenir' },
];

const SUGGESTED_IDEAS = [
  'Qui dit « Je t’aime » le plus souvent ?',
  'Qui a eu le plus gros coup de foudre au premier regard ?',
  'Qui prépare les surprises les plus mignonnes ?',
  'Qui a la meilleure mémoire de nos dates d’anniversaire ?',
  'Qui envoie le plus de messages doux dans la journée ?',
  'Qui est le plus distrait et perd constamment ses affaires ?',
  'Qui chante le plus fort et faux sous la douche ?',
  'Qui râle le plus quand il a faim ?',
  'Qui est le plus mauvais perdant aux jeux ?',
  'Qui s’endort en 2 minutes dès le début du film ?',
  'Qui met le plus de temps à se préparer pour sortir ?',
  'Qui vole toute la couette au milieu de la nuit ?',
  'Qui embrasse le plus tendrement au réveil ?',
  'Qui craquerait en premier sans bisous pendant 24h ?',
  'Qui est le plus tactile et câlin quand on se promène ?',
  'Qui cuisine les meilleurs petits plats ?',
  'Qui fait les meilleurs câlins après une dure journée ?',
];

interface WhoMostLikelyGameProps {
  profile: CoupleProfile;
  activePartnerId: PartnerId;
  onSendChatMessage?: (
    msgData: Omit<ChatMessage, 'id' | 'timestamp' | 'status' | 'readStatus'>
  ) => void;
}

export const WhoMostLikelyGame: React.FC<WhoMostLikelyGameProps> = ({
  profile,
  activePartnerId,
  onSendChatMessage,
}) => {
  const [gameMode] = useState<'live' | 'local'>('live');

  // Custom questions created by partners
  const [customQuestions, setCustomQuestions] = useState<WhoQuestion[]>(() => {
    try {
      const saved = localStorage.getItem('nid_amour_custom_who_questions');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [currentIndex, setCurrentIndex] = useState(0);
  const [showManageModal, setShowManageModal] = useState(false);
  const [newQuestionText, setNewQuestionText] = useState('');
  const [copiedNotification, setCopiedNotification] = useState<string | null>(null);

  // Live session state
  const [liveVotes, setLiveVotes] = useState<{ p1?: PartnerId; p2?: PartnerId }>({});
  const [isRevealed, setIsRevealed] = useState(false);
  const [scoreMatches, setScoreMatches] = useState(0);
  const [totalLiveAnswered, setTotalLiveAnswered] = useState(0);

  const otherPartnerId: PartnerId = activePartnerId === 'p1' ? 'p2' : 'p1';
  const otherPartner = activePartnerId === 'p1' ? profile.partner2 : profile.partner1;
  const currentPartner = activePartnerId === 'p1' ? profile.partner1 : profile.partner2;

  // BroadcastChannel for instant same-browser multi-tab sync
  const channelRef = useRef<BroadcastChannel | null>(null);

  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        channelRef.current = new BroadcastChannel('nid_amour_who_live');
        channelRef.current.onmessage = (event) => {
          if (event.data && typeof event.data === 'object' && gameMode === 'live') {
            handleLiveSessionUpdate(event.data as WhoMostLikelySession, false);
          }
        };
      }
    } catch {}

    return () => {
      channelRef.current?.close();
    };
  }, [gameMode]);

  const handleLiveSessionUpdate = (session: WhoMostLikelySession, playAudio = true) => {
    if (!session) return;
    if (typeof session.currentQuestionIndex === 'number') {
      setCurrentIndex(session.currentQuestionIndex);
    }
    const votes = session.votes || {};
    setLiveVotes(votes);
    setIsRevealed(Boolean(session.revealed));
    if (typeof session.scoreMatches === 'number') setScoreMatches(session.scoreMatches);
    if (typeof session.totalAnswered === 'number') setTotalLiveAnswered(session.totalAnswered);

    if (Array.isArray(session.customQuestions)) {
      setCustomQuestions(session.customQuestions);
      try {
        localStorage.setItem('nid_amour_custom_who_questions', JSON.stringify(session.customQuestions));
      } catch {}
    }

    if (playAudio && session.revealed && votes.p1 && votes.p2) {
      if (votes.p1 === votes.p2) {
        soundEffects.playSuccessSparkle();
        triggerCelebrationConfetti();
      } else {
        soundEffects.playHeartPulse();
      }
    }
  };

  // Real-time Firestore subscription
  useEffect(() => {
    if (gameMode !== 'live') return;

    let mounted = true;
    const unsub = subscribeWhoMostLikely((session) => {
      if (!mounted) return;
      if (session) {
        handleLiveSessionUpdate(session, true);
      } else {
        const initial: WhoMostLikelySession = {
          id: 'who_most_likely_live',
          currentQuestionIndex: 0,
          votes: {},
          revealed: false,
          scoreMatches: 0,
          totalAnswered: 0,
          customQuestions: customQuestions,
          lastUpdated: new Date().toISOString(),
        };
        saveWhoMostLikely(initial).catch(() => {});
      }
    });

    return () => {
      mounted = false;
      unsub();
    };
  }, [gameMode]);

  // Combine custom (first) with default questions
  const allQuestions = useMemo(() => {
    return [...customQuestions, ...DEFAULT_QUESTIONS];
  }, [customQuestions]);

  const safeIndex = Math.min(currentIndex, Math.max(0, allQuestions.length - 1));
  const currentQuestion = allQuestions[safeIndex] || allQuestions[0];

  const activeVotes = gameMode === 'live' ? liveVotes : currentQuestion?.votes || {};
  const myVote = activeVotes[activePartnerId];
  const bothVoted = activeVotes.p1 !== undefined && activeVotes.p2 !== undefined;
  const isMatch = bothVoted && activeVotes.p1 === activeVotes.p2;

  // Pick a random inspirational question in 1 tap
  const handlePickRandomIdea = () => {
    soundEffects.playSoftTap();
    const randomIndex = Math.floor(Math.random() * SUGGESTED_IDEAS.length);
    setNewQuestionText(SUGGESTED_IDEAS[randomIndex]);
  };

  // Create new question - super simple
  const handleCreateCustomQuestion = (textToAdd?: string) => {
    let text = (textToAdd || newQuestionText).trim();
    if (!text) return;

    if (!text.endsWith('?')) {
      text = `${text} ?`;
    }

    const newQ: WhoQuestion = {
      id: `w_custom_${Date.now()}_${activePartnerId}`,
      text,
      category: 'Romance',
      authorId: activePartnerId,
      authorName: currentPartner.name,
      createdAt: new Date().toISOString(),
      isCustom: true,
    };

    const updated = [newQ, ...customQuestions];
    setCustomQuestions(updated);
    try {
      localStorage.setItem('nid_amour_custom_who_questions', JSON.stringify(updated));
    } catch {}

    setNewQuestionText('');
    setShowManageModal(false);
    setCurrentIndex(0);

    setCopiedNotification(`🎉 Question ajoutée !`);
    setTimeout(() => setCopiedNotification(null), 3000);

    soundEffects.playSuccessSparkle();
    triggerHeartConfetti();

    // Sync to Firestore & BroadcastChannel
    if (gameMode === 'live') {
      const updateData: Partial<WhoMostLikelySession> = {
        customQuestions: updated,
        currentQuestionIndex: 0,
        votes: {},
        revealed: false,
        lastUpdated: new Date().toISOString(),
      };
      try {
        channelRef.current?.postMessage(updateData);
      } catch {}
      saveWhoMostLikely(updateData).catch(console.error);
    }
  };

  // Vote handler
  const handleVote = (candidateId: PartnerId) => {
    if (!currentQuestion) return;
    soundEffects.playSoftTap();

    const updatedVotes = {
      ...liveVotes,
      [activePartnerId]: candidateId,
    };

    const willBothHaveVoted = updatedVotes.p1 !== undefined && updatedVotes.p2 !== undefined;
    const willMatch = willBothHaveVoted && updatedVotes.p1 === updatedVotes.p2;

    const nextMatches = willMatch ? scoreMatches + 1 : scoreMatches;
    const nextTotal = willBothHaveVoted ? totalLiveAnswered + 1 : totalLiveAnswered;

    setLiveVotes(updatedVotes);
    if (willBothHaveVoted) {
      setIsRevealed(true);
      setScoreMatches(nextMatches);
      setTotalLiveAnswered(nextTotal);

      if (willMatch) {
        soundEffects.playSuccessSparkle();
        triggerCelebrationConfetti();
      } else {
        soundEffects.playHeartPulse();
      }
    }

    const sessionUpdate: WhoMostLikelySession = {
      id: 'who_most_likely_live',
      currentQuestionIndex: safeIndex,
      votes: updatedVotes,
      revealed: willBothHaveVoted,
      scoreMatches: nextMatches,
      totalAnswered: nextTotal,
      customQuestions,
      lastUpdated: new Date().toISOString(),
    };

    try {
      channelRef.current?.postMessage(sessionUpdate);
    } catch {}

    saveWhoMostLikely(sessionUpdate).catch(console.error);
  };

  // Navigate question
  const handleNavigateQuestion = (step: number) => {
    soundEffects.playSoftTap();
    const nextIdx = (safeIndex + step + allQuestions.length) % allQuestions.length;
    setCurrentIndex(nextIdx);

    if (gameMode === 'live') {
      setLiveVotes({});
      setIsRevealed(false);

      const sessionUpdate: WhoMostLikelySession = {
        id: 'who_most_likely_live',
        currentQuestionIndex: nextIdx,
        votes: {},
        revealed: false,
        scoreMatches,
        totalAnswered: totalLiveAnswered,
        customQuestions,
        lastUpdated: new Date().toISOString(),
      };

      try {
        channelRef.current?.postMessage(sessionUpdate);
      } catch {}

      saveWhoMostLikely(sessionUpdate).catch(console.error);
    }
  };

  const handleShareToChat = () => {
    if (!currentQuestion) return;
    const p1Choice = activeVotes.p1 ? (activeVotes.p1 === 'p1' ? profile.partner1.name : profile.partner2.name) : 'Non voté';
    const p2Choice = activeVotes.p2 ? (activeVotes.p2 === 'p1' ? profile.partner1.name : profile.partner2.name) : 'Non voté';
    const authorTag = currentQuestion.authorName ? ` [Créée par ${currentQuestion.authorName}]` : '';

    const summary = `🔮 *Qui de nous deux ?*${authorTag}\n« ${currentQuestion.text} »\n• ${profile.partner1.name} : ${p1Choice}\n• ${profile.partner2.name} : ${p2Choice}\n${isMatch ? '💖 Accord parfait !' : '✨ Deux avis différents !'}`;

    if (onSendChatMessage) {
      onSendChatMessage({
        senderId: activePartnerId,
        content: summary,
        mediaType: 'text',
      });
      setCopiedNotification('Partagé dans le chat ! 💌');
    } else {
      navigator.clipboard.writeText(summary);
      setCopiedNotification('Copié dans le presse-papier !');
    }
    soundEffects.playSuccessSparkle();
    triggerHeartConfetti();
    setTimeout(() => setCopiedNotification(null), 3000);
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-3.5 px-1 sm:px-0 box-border overflow-x-hidden">
      {/* 1. Header Minimal & Épuré - Adapté Mobile */}
      <div className="flex items-center justify-between gap-2 px-1">
        <div className="min-w-0">
          <h2 className="text-base sm:text-lg font-bold text-stone-900 font-serif-romantic tracking-tight truncate">
            Qui de nous deux ?
          </h2>
          <p className="text-[11px] text-stone-500 font-medium">
            Question {safeIndex + 1} sur {allQuestions.length}
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            soundEffects.playSoftTap();
            setNewQuestionText('');
            setShowManageModal(true);
          }}
          className="px-3 py-1.5 rounded-full bg-rose-500 hover:bg-rose-600 active:scale-95 text-white font-semibold text-xs flex items-center gap-1.5 shadow-xs shrink-0 cursor-pointer transition-all"
        >
          <Plus className="w-3.5 h-3.5 shrink-0" />
          <span className="whitespace-nowrap">Poser une question</span>
        </button>
      </div>

      {/* 2. Carte Principale Épurée - 100% Mobile Ready */}
      {currentQuestion && (
        <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-stone-200/80 shadow-xs space-y-4 sm:space-y-5 w-full box-border overflow-hidden">
          {/* Intitulé de la question */}
          <div className="text-center py-1 sm:py-2 space-y-1">
            <h3 className="font-serif-romantic text-base sm:text-xl font-bold text-stone-900 leading-snug sm:leading-relaxed break-words hyphens-auto px-1">
              « {currentQuestion.text} »
            </h3>
            {currentQuestion.isCustom && (
              <p className="text-[11px] font-medium text-rose-500 truncate">
                ✍️ Posée par {currentQuestion.authorId === activePartnerId ? 'vous' : currentQuestion.authorName || otherPartner.name}
              </p>
            )}
          </div>

          {/* Les 2 Boutons de Vote : Med & Safi */}
          <div className="grid grid-cols-2 gap-2.5 sm:gap-4 w-full">
            {/* Partenaire 1 */}
            <button
              type="button"
              onClick={() => handleVote('p1')}
              className={`p-3 sm:p-4 rounded-xl sm:rounded-2xl border-2 text-center transition-all cursor-pointer relative flex flex-col items-center justify-center min-h-[135px] sm:min-h-[160px] active:scale-98 ${
                myVote === 'p1'
                  ? 'border-rose-500 bg-rose-50/70 shadow-xs'
                  : 'border-stone-200 hover:border-rose-300 bg-stone-50/40'
              }`}
            >
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full overflow-hidden border-2 border-white shadow-xs shrink-0 mb-1.5">
                {profile.partner1.avatar ? (
                  <img src={profile.partner1.avatar} alt={profile.partner1.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-rose-200 text-rose-800 flex items-center justify-center font-bold text-base sm:text-lg">
                    {profile.partner1.name.slice(0, 2).toUpperCase()}
                  </div>
                )}
              </div>
              <p className="w-full font-bold text-xs sm:text-sm text-stone-900 truncate px-1">
                {profile.partner1.name}
              </p>
              {myVote === 'p1' ? (
                <span className="mt-1 px-2 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-bold shrink-0">
                  Mon choix
                </span>
              ) : (
                <span className="mt-1 px-2 py-0.5 text-[10px] text-transparent select-none shrink-0">
                  -
                </span>
              )}
            </button>

            {/* Partenaire 2 */}
            <button
              type="button"
              onClick={() => handleVote('p2')}
              className={`p-3 sm:p-4 rounded-xl sm:rounded-2xl border-2 text-center transition-all cursor-pointer relative flex flex-col items-center justify-center min-h-[135px] sm:min-h-[160px] active:scale-98 ${
                myVote === 'p2'
                  ? 'border-indigo-500 bg-indigo-50/70 shadow-xs'
                  : 'border-stone-200 hover:border-indigo-300 bg-stone-50/40'
              }`}
            >
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full overflow-hidden border-2 border-white shadow-xs shrink-0 mb-1.5">
                {profile.partner2.avatar ? (
                  <img src={profile.partner2.avatar} alt={profile.partner2.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-indigo-200 text-indigo-800 flex items-center justify-center font-bold text-base sm:text-lg">
                    {profile.partner2.name.slice(0, 2).toUpperCase()}
                  </div>
                )}
              </div>
              <p className="w-full font-bold text-xs sm:text-sm text-stone-900 truncate px-1">
                {profile.partner2.name}
              </p>
              {myVote === 'p2' ? (
                <span className="mt-1 px-2 py-0.5 rounded-full bg-indigo-600 text-white text-[10px] font-bold shrink-0">
                  Mon choix
                </span>
              ) : (
                <span className="mt-1 px-2 py-0.5 text-[10px] text-transparent select-none shrink-0">
                  -
                </span>
              )}
            </button>
          </div>

          {/* Révélation ou statut */}
          {bothVoted ? (
            <div className={`p-3 sm:p-4 rounded-xl sm:rounded-2xl border text-center space-y-2 ${
              isMatch ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-amber-50 border-amber-200 text-amber-900'
            }`}>
              <p className="font-bold text-sm sm:text-base">
                {isMatch ? '🎉 Accord parfait !' : '✨ Deux avis différents !'}
              </p>

              <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-xs text-stone-600">
                <span className="inline-flex items-center gap-1">
                  <span className="font-medium text-stone-700">{profile.partner1.name} :</span>
                  <strong className="text-stone-900">{activeVotes.p1 === 'p1' ? profile.partner1.name : profile.partner2.name}</strong>
                </span>
                <span className="text-stone-300">•</span>
                <span className="inline-flex items-center gap-1">
                  <span className="font-medium text-stone-700">{profile.partner2.name} :</span>
                  <strong className="text-stone-900">{activeVotes.p2 === 'p1' ? profile.partner1.name : profile.partner2.name}</strong>
                </span>
              </div>

              <div className="pt-1.5 flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => handleNavigateQuestion(1)}
                  className="flex-1 max-w-[170px] py-2 px-3 rounded-xl bg-stone-900 hover:bg-stone-800 active:scale-95 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs cursor-pointer transition-all"
                >
                  <span>Question suivante</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={handleShareToChat}
                  className="py-2 px-3 rounded-xl bg-white border border-stone-200 hover:bg-stone-50 active:scale-95 text-stone-700 text-xs font-semibold flex items-center gap-1 cursor-pointer transition-all shrink-0"
                >
                  <MessageCircle className="w-3.5 h-3.5 text-rose-500" />
                  <span>Partager</span>
                </button>
              </div>
            </div>
          ) : myVote ? (
            <div className="p-3 rounded-xl bg-stone-50 text-center text-xs text-stone-600 flex items-center justify-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse shrink-0" />
              <span>Vote validé ! En attente de <strong>{otherPartner.name}</strong>...</span>
            </div>
          ) : (
            <div className="flex items-center justify-between text-xs text-stone-500 pt-1 border-t border-stone-100">
              <button
                type="button"
                onClick={() => handleNavigateQuestion(-1)}
                className="py-1.5 px-2.5 hover:text-stone-900 rounded-lg hover:bg-stone-100 active:scale-95 flex items-center gap-1 cursor-pointer font-medium transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Précédente</span>
              </button>
              <button
                type="button"
                onClick={() => handleNavigateQuestion(1)}
                className="py-1.5 px-2.5 hover:text-stone-900 rounded-lg hover:bg-stone-100 active:scale-95 flex items-center gap-1 cursor-pointer font-medium transition-colors"
              >
                <span>Suivante</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {copiedNotification && (
            <p className="text-center text-xs font-semibold text-emerald-600 animate-fade-in">
              {copiedNotification}
            </p>
          )}
        </div>
      )}

      {/* 3. Modal de création Ultra Simple & Responsive */}
      <AnimatePresence>
        {showManageModal && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-5 max-w-sm w-full shadow-xl space-y-3.5 box-border"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-serif-romantic text-base font-bold text-stone-900">
                  Poser une question
                </h3>
                <button
                  type="button"
                  onClick={() => setShowManageModal(false)}
                  className="p-1 text-stone-400 hover:text-stone-700 rounded-lg cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Saisie simple */}
              <div className="space-y-2">
                <input
                  type="text"
                  value={newQuestionText}
                  onChange={(e) => setNewQuestionText(e.target.value)}
                  placeholder="Ex: Qui cuisine le mieux ?"
                  className="w-full text-base sm:text-sm p-3 rounded-xl border border-stone-200 focus:outline-hidden focus:ring-2 focus:ring-rose-400 bg-stone-50/60"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newQuestionText.trim()) {
                      e.preventDefault();
                      handleCreateCustomQuestion();
                    }
                  }}
                />

                <div className="flex items-center justify-between pt-0.5">
                  <button
                    type="button"
                    onClick={handlePickRandomIdea}
                    className="text-xs font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1 cursor-pointer py-1"
                  >
                    <Dices className="w-3.5 h-3.5" />
                    <span>🎲 Idée au hasard</span>
                  </button>
                </div>
              </div>

              {/* Boutons d'action */}
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowManageModal(false)}
                  className="flex-1 py-2.5 rounded-xl text-xs font-semibold text-stone-500 hover:bg-stone-100 cursor-pointer min-h-[42px]"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={() => handleCreateCustomQuestion()}
                  disabled={!newQuestionText.trim()}
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-rose-500 hover:bg-rose-600 disabled:opacity-50 text-white shadow-xs cursor-pointer transition-colors min-h-[42px]"
                >
                  Valider 💖
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
