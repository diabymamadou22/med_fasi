import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  Plus,
  MessageCircle,
  ChevronRight,
  ChevronLeft,
  Edit2,
  Trash2,
  X,
  Lightbulb,
  Radio,
  Smartphone,
  Check,
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
  { text: 'Qui est le plus jaloux quand quelqu’un d’autre me regarde ?', cat: 'Romance' },
  { text: 'Qui embrasse le plus tendrement au réveil ?', cat: 'Intime' },
  { text: 'Qui s’endormirait pendant un massage relaxant ?', cat: 'Quotidien' },
  { text: 'Qui dit « tu me manques » le plus souvent ?', cat: 'Romance' },
  { text: 'Qui craquerait en premier sans bisous pendant 24h ?', cat: 'Intime' },
  { text: 'Qui a la meilleure mémoire de nos dates importantes ?', cat: 'Romance' },
  { text: 'Qui est le plus tactile et câlin quand on se promène ?', cat: 'Romance' },
  { text: 'Qui fait les meilleurs câlins après une dure journée ?', cat: 'Romance' },
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
  const [gameMode, setGameMode] = useState<'live' | 'local'>('live');

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
  const [filterMode, setFilterMode] = useState<string>('all'); // 'all' | 'mine' | 'partner' | category

  // Quick Modal & Creation
  const [showManageModal, setShowManageModal] = useState(false);
  const [manageTab, setManageTab] = useState<'add' | 'list'>('add');
  const [newQuestionText, setNewQuestionText] = useState('');
  const [newQuestionCat, setNewQuestionCat] = useState<WhoQuestion['category']>('Romance');
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [editCat, setEditCat] = useState<WhoQuestion['category']>('Romance');
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

    // Sync custom questions if available from cloud
    if (Array.isArray(session.customQuestions)) {
      setCustomQuestions(session.customQuestions);
      try {
        localStorage.setItem('nid_amour_custom_who_questions', JSON.stringify(session.customQuestions));
      } catch {}
    }

    // Audio / celebration feedback
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

  // Filtered list based on active tab
  const filteredQuestions = useMemo(() => {
    if (filterMode === 'all') return allQuestions;
    if (filterMode === 'mine') {
      return allQuestions.filter((q) => q.authorId === activePartnerId);
    }
    if (filterMode === 'partner') {
      return allQuestions.filter((q) => q.authorId === otherPartnerId);
    }
    return allQuestions.filter((q) => q.category === filterMode);
  }, [allQuestions, filterMode, activePartnerId, otherPartnerId]);

  const safeIndex = Math.min(currentIndex, Math.max(0, filteredQuestions.length - 1));
  const currentQuestion = filteredQuestions[safeIndex] || allQuestions[0];

  const activeVotes = gameMode === 'live' ? liveVotes : currentQuestion?.votes || {};
  const myVote = activeVotes[activePartnerId];
  const otherVote = activeVotes[otherPartnerId];
  const bothVoted = activeVotes.p1 !== undefined && activeVotes.p2 !== undefined;
  const isMatch = bothVoted && activeVotes.p1 === activeVotes.p2;

  // Question counts
  const myCustomCount = customQuestions.filter((q) => q.authorId === activePartnerId).length;
  const partnerCustomCount = customQuestions.filter((q) => q.authorId === otherPartnerId).length;

  // Create new question
  const handleCreateCustomQuestion = (textToAdd?: string, catToAdd?: WhoQuestion['category']) => {
    const text = (textToAdd || newQuestionText).trim();
    const cat = catToAdd || newQuestionCat;
    if (!text) return;

    const newQ: WhoQuestion = {
      id: `w_custom_${Date.now()}_${activePartnerId}`,
      text,
      category: cat,
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
    setFilterMode('mine');
    setCurrentIndex(0);

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

  // Edit question
  const handleSaveEditQuestion = () => {
    if (!editingQuestionId || !editText.trim()) return;

    const updated = customQuestions.map((q) =>
      q.id === editingQuestionId
        ? { ...q, text: editText.trim(), category: editCat }
        : q
    );
    setCustomQuestions(updated);
    try {
      localStorage.setItem('nid_amour_custom_who_questions', JSON.stringify(updated));
    } catch {}

    setEditingQuestionId(null);
    setShowManageModal(false);
    soundEffects.playSoftTap();

    if (gameMode === 'live') {
      saveWhoMostLikely({
        customQuestions: updated,
        lastUpdated: new Date().toISOString(),
      }).catch(console.error);
    }
  };

  // Delete question
  const handleDeleteCustomQuestion = (id: string) => {
    soundEffects.playSoftTap();
    const updated = customQuestions.filter((q) => q.id !== id);
    setCustomQuestions(updated);
    try {
      localStorage.setItem('nid_amour_custom_who_questions', JSON.stringify(updated));
    } catch {}

    if (gameMode === 'live') {
      saveWhoMostLikely({
        customQuestions: updated,
        lastUpdated: new Date().toISOString(),
      }).catch(console.error);
    }
  };

  // Vote handler
  const handleVote = (candidateId: PartnerId) => {
    if (!currentQuestion) return;
    soundEffects.playSoftTap();

    if (gameMode === 'live') {
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
    } else {
      // Local mode
      const updatedVotes = {
        ...activeVotes,
        [activePartnerId]: candidateId,
      };

      const willBothVoted = updatedVotes.p1 !== undefined && updatedVotes.p2 !== undefined;
      if (willBothVoted) {
        if (updatedVotes.p1 === updatedVotes.p2) {
          soundEffects.playSuccessSparkle();
          triggerCelebrationConfetti();
        } else {
          soundEffects.playHeartPulse();
        }
      }
    }
  };

  // Navigate question
  const handleNavigateQuestion = (step: number) => {
    soundEffects.playSoftTap();
    const nextIdx = (safeIndex + step + filteredQuestions.length) % filteredQuestions.length;
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
        text: summary,
        type: 'text',
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

  const matchPercentage = totalLiveAnswered > 0 ? Math.round((scoreMatches / totalLiveAnswered) * 100) : 0;

  return (
    <div className="space-y-4 max-w-xl mx-auto">
      {/* 1. Header Sobre & Épuré */}
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-stone-200/80 p-3.5 sm:p-4 shadow-xs flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-500 to-indigo-500 text-white flex items-center justify-center font-bold text-lg shadow-xs shrink-0">
            🔮
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-stone-900 font-serif-romantic tracking-tight truncate">
                Qui de nous deux ?
              </h2>
              {gameMode === 'live' && (
                <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold flex items-center gap-1 shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  En direct
                </span>
              )}
            </div>
            <p className="text-xs text-stone-500 truncate">
              {totalLiveAnswered > 0
                ? `${matchPercentage}% d'accords • ${scoreMatches}/${totalLiveAnswered} votés`
                : `Votez secrètement avec ${otherPartner.name}`}
            </p>
          </div>
        </div>

        {/* Bouton Créer ma question */}
        <button
          type="button"
          onClick={() => {
            soundEffects.playSoftTap();
            setEditingQuestionId(null);
            setNewQuestionText('');
            setManageTab('add');
            setShowManageModal(true);
          }}
          className="px-3 py-1.5 sm:py-2 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95 transition-all shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Créer ma question</span>
        </button>
      </div>

      {/* 2. Onglets Personnalisés : Mes questions, Celles du partenaire, Toutes */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
        <button
          type="button"
          onClick={() => {
            setFilterMode('all');
            setCurrentIndex(0);
            soundEffects.playSoftTap();
          }}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
            filterMode === 'all'
              ? 'bg-rose-500 text-white shadow-xs'
              : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200'
          }`}
        >
          🌟 Toutes ({allQuestions.length})
        </button>

        <button
          type="button"
          onClick={() => {
            setFilterMode('mine');
            setCurrentIndex(0);
            soundEffects.playSoftTap();
          }}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
            filterMode === 'mine'
              ? 'bg-rose-500 text-white shadow-xs'
              : 'bg-white text-rose-600 hover:bg-rose-50 border border-rose-200'
          }`}
        >
          <span>💖 Mes créations ({myCustomCount})</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setFilterMode('partner');
            setCurrentIndex(0);
            soundEffects.playSoftTap();
          }}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
            filterMode === 'partner'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-white text-indigo-600 hover:bg-indigo-50 border border-indigo-200'
          }`}
        >
          <span>💌 Par {otherPartner.name} ({partnerCustomCount})</span>
        </button>

        {['Romance', 'Fous rires', 'Intime', 'Quotidien'].map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => {
              setFilterMode(cat);
              setCurrentIndex(0);
              soundEffects.playSoftTap();
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer whitespace-nowrap shrink-0 ${
              filterMode === cat
                ? 'bg-stone-800 text-white shadow-xs font-bold'
                : 'bg-white text-stone-600 hover:bg-stone-50 border border-stone-200'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* 3. Carte Question Principale Épurée */}
      {currentQuestion ? (
        <motion.div
          key={currentQuestion.id}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl p-5 sm:p-6 border border-stone-200/80 shadow-xs relative space-y-4"
        >
          {/* Barre supérieure de la question : Tag, Auteur & Navigation */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-stone-100 text-stone-600 text-[11px] font-semibold border border-stone-200">
                {safeIndex + 1}/{filteredQuestions.length} • {currentQuestion.category}
              </span>

              {/* Attribution de l'auteur si personnalisée */}
              {currentQuestion.authorName && (
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold flex items-center gap-1 border ${
                    currentQuestion.authorId === activePartnerId
                      ? 'bg-rose-50 text-rose-700 border-rose-200'
                      : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                  }`}
                >
                  <span>✍️</span>
                  <span>{currentQuestion.authorId === activePartnerId ? 'Créée par vous' : `Par ${currentQuestion.authorName}`}</span>
                </span>
              )}
            </div>

            {/* Actions sur sa propre question ou boutons nav */}
            <div className="flex items-center gap-1.5">
              {currentQuestion.authorId === activePartnerId && (
                <div className="flex items-center gap-1 mr-1">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingQuestionId(currentQuestion.id);
                      setEditText(currentQuestion.text);
                      setEditCat(currentQuestion.category);
                      setManageTab('add');
                      setShowManageModal(true);
                    }}
                    className="p-1 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                    title="Modifier ma question"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteCustomQuestion(currentQuestion.id)}
                    className="p-1 rounded-lg text-stone-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                    title="Supprimer ma question"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              <button
                type="button"
                onClick={() => handleNavigateQuestion(-1)}
                className="p-1.5 rounded-xl bg-stone-50 hover:bg-stone-100 text-stone-600 border border-stone-200 cursor-pointer"
                title="Précédente"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => handleNavigateQuestion(1)}
                className="p-1.5 rounded-xl bg-stone-50 hover:bg-stone-100 text-stone-600 border border-stone-200 cursor-pointer"
                title="Suivante"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Intitulé de la question */}
          <div className="py-2 sm:py-3 text-center">
            <h3 className="font-serif-romantic text-xl sm:text-2xl font-bold text-stone-900 leading-snug">
              « {currentQuestion.text} »
            </h3>
          </div>

          {/* 2 Boutons de Vote : Partenaire 1 & Partenaire 2 */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            {/* Bouton Partenaire 1 */}
            <motion.button
              whileTap={{ scale: 0.98 }}
              type="button"
              onClick={() => handleVote('p1')}
              className={`p-3.5 sm:p-4 rounded-2xl border-2 text-center transition-all cursor-pointer relative ${
                myVote === 'p1'
                  ? 'border-rose-500 bg-rose-50/70 ring-2 ring-rose-200 shadow-xs'
                  : 'border-stone-200 hover:border-rose-300 bg-stone-50/50 hover:bg-white'
              }`}
            >
              <div className="w-14 h-14 rounded-full mx-auto overflow-hidden border-2 border-white shadow-xs mb-2">
                {profile.partner1.avatar ? (
                  <img src={profile.partner1.avatar} alt={profile.partner1.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-rose-200 text-rose-800 flex items-center justify-center font-bold">
                    {profile.partner1.name.slice(0, 2).toUpperCase()}
                  </div>
                )}
              </div>
              <p className="font-bold text-sm text-stone-900 truncate">{profile.partner1.name}</p>
              <p className="text-[11px] text-stone-500">
                {activePartnerId === 'p1' ? 'Moi' : 'Mon Partenaire'}
              </p>

              {myVote === 'p1' && (
                <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-bold">
                  Mon Choix
                </span>
              )}
            </motion.button>

            {/* Bouton Partenaire 2 */}
            <motion.button
              whileTap={{ scale: 0.98 }}
              type="button"
              onClick={() => handleVote('p2')}
              className={`p-3.5 sm:p-4 rounded-2xl border-2 text-center transition-all cursor-pointer relative ${
                myVote === 'p2'
                  ? 'border-indigo-500 bg-indigo-50/70 ring-2 ring-indigo-200 shadow-xs'
                  : 'border-stone-200 hover:border-indigo-300 bg-stone-50/50 hover:bg-white'
              }`}
            >
              <div className="w-14 h-14 rounded-full mx-auto overflow-hidden border-2 border-white shadow-xs mb-2">
                {profile.partner2.avatar ? (
                  <img src={profile.partner2.avatar} alt={profile.partner2.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-indigo-200 text-indigo-800 flex items-center justify-center font-bold">
                    {profile.partner2.name.slice(0, 2).toUpperCase()}
                  </div>
                )}
              </div>
              <p className="font-bold text-sm text-stone-900 truncate">{profile.partner2.name}</p>
              <p className="text-[11px] text-stone-500">
                {activePartnerId === 'p2' ? 'Moi' : 'Mon Partenaire'}
              </p>

              {myVote === 'p2' && (
                <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-indigo-600 text-white text-[10px] font-bold">
                  Mon Choix
                </span>
              )}
            </motion.button>
          </div>

          {/* Révélation des Votes */}
          <AnimatePresence>
            {bothVoted ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`p-4 rounded-2xl border text-center ${
                  isMatch
                    ? 'bg-emerald-50/90 border-emerald-300 text-emerald-900'
                    : 'bg-amber-50/90 border-amber-200 text-amber-900'
                }`}
              >
                <p className="font-bold text-sm flex items-center justify-center gap-1.5">
                  <span>{isMatch ? '🎉 Accord Parfait !' : '✨ Deux avis différents !'}</span>
                </p>

                <div className="flex items-center justify-center gap-3 text-xs mt-2 font-medium">
                  <span>
                    {profile.partner1.name} : <strong>{activeVotes.p1 === 'p1' ? profile.partner1.name : profile.partner2.name}</strong>
                  </span>
                  <span className="opacity-40">•</span>
                  <span>
                    {profile.partner2.name} : <strong>{activeVotes.p2 === 'p1' ? profile.partner1.name : profile.partner2.name}</strong>
                  </span>
                </div>

                <div className="mt-3.5 flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleNavigateQuestion(1)}
                    className="px-4 py-2 rounded-xl bg-stone-900 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer hover:bg-stone-800 transition-colors"
                  >
                    <span>Question suivante</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={handleShareToChat}
                    className="px-3.5 py-2 rounded-xl bg-white border border-stone-200 hover:bg-stone-50 text-stone-700 font-semibold text-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <MessageCircle className="w-3.5 h-3.5 text-rose-500" />
                    <span>Partager au chat</span>
                  </button>
                </div>
              </motion.div>
            ) : (
              myVote && (
                <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 text-center text-xs text-stone-500 flex items-center justify-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-rose-400 animate-pulse" />
                  <span>Votre vote est validé. En attente de <strong>{otherPartner.name}</strong>...</span>
                </div>
              )
            )}
          </AnimatePresence>

          {copiedNotification && (
            <p className="text-center text-xs font-semibold text-emerald-600 animate-fade-in">
              {copiedNotification}
            </p>
          )}
        </motion.div>
      ) : (
        <div className="bg-white rounded-3xl p-8 text-center border border-stone-200 space-y-3">
          <p className="text-stone-400 text-3xl">✍️</p>
          <p className="text-sm font-bold text-stone-800">Aucune question dans cet onglet</p>
          <button
            type="button"
            onClick={() => {
              setManageTab('add');
              setShowManageModal(true);
            }}
            className="px-4 py-2 rounded-xl bg-rose-500 text-white font-bold text-xs"
          >
            Créer ma première question
          </button>
        </div>
      )}

      {/* 4. Modal de Personnalisation : Rapide, Fluide & Sobre */}
      <AnimatePresence>
        {showManageModal && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-5 sm:p-6 max-w-md w-full shadow-xl space-y-4 max-h-[85vh] flex flex-col"
            >
              <div className="flex items-center justify-between pb-2 border-b border-stone-100">
                <div>
                  <h3 className="font-serif-romantic text-lg font-bold text-stone-900">
                    {editingQuestionId ? 'Modifier la question' : 'Personnaliser « Qui de nous deux »'}
                  </h3>
                  <p className="text-xs text-stone-500">
                    Chacun peut inventer ses questions, visibles en direct par les deux.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowManageModal(false);
                    setEditingQuestionId(null);
                  }}
                  className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Onglets rapides : Créer ou Voir mes questions */}
              <div className="flex gap-2 bg-stone-100 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setManageTab('add')}
                  className={`flex-1 py-1.5 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                    manageTab === 'add'
                      ? 'bg-white text-rose-600 shadow-2xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  {editingQuestionId ? 'Modifier' : '+ Nouvelle question'}
                </button>
                <button
                  type="button"
                  onClick={() => setManageTab('list')}
                  className={`flex-1 py-1.5 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                    manageTab === 'list'
                      ? 'bg-white text-rose-600 shadow-2xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  Mes questions ({myCustomCount})
                </button>
              </div>

              {manageTab === 'add' && (
                <div className="space-y-3.5 overflow-y-auto no-scrollbar flex-1 pr-0.5">
                  {/* Catégorie */}
                  <div>
                    <label className="block text-[11px] font-bold text-stone-600 mb-1">
                      Catégorie
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {(['Romance', 'Fous rires', 'Intime', 'Quotidien', 'Avenir'] as const).map((cat) => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => {
                            if (editingQuestionId) setEditCat(cat);
                            else setNewQuestionCat(cat);
                          }}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                            (editingQuestionId ? editCat : newQuestionCat) === cat
                              ? 'bg-rose-50 border-rose-500 text-rose-700 font-bold'
                              : 'border-stone-200 text-stone-600 hover:bg-stone-50'
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Saisie */}
                  <div>
                    <label className="block text-[11px] font-bold text-stone-600 mb-1">
                      Votre question
                    </label>
                    <textarea
                      rows={2}
                      value={editingQuestionId ? editText : newQuestionText}
                      onChange={(e) => {
                        if (editingQuestionId) setEditText(e.target.value);
                        else setNewQuestionText(e.target.value);
                      }}
                      placeholder="Ex: Qui embrasse le plus tendrement le matin ?"
                      className="w-full text-xs p-3 rounded-xl border border-stone-200 focus:outline-hidden focus:ring-2 focus:ring-rose-400"
                    />
                  </div>

                  {/* Suggestions en 1 clic */}
                  {!editingQuestionId && (
                    <div>
                      <p className="text-[11px] font-bold text-stone-500 flex items-center gap-1 mb-1.5">
                        <Lightbulb className="w-3 h-3 text-amber-500" />
                        <span>Idées prêtes à l'emploi :</span>
                      </p>
                      <div className="space-y-1">
                        {SUGGESTED_IDEAS.slice(0, 4).map((idea, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              setNewQuestionText(idea.text);
                              setNewQuestionCat(idea.cat as any);
                              soundEffects.playSoftTap();
                            }}
                            className="w-full text-[11px] px-2.5 py-1.5 rounded-lg bg-stone-50 hover:bg-rose-50 border border-stone-200 hover:border-rose-200 text-stone-700 text-left transition-colors cursor-pointer truncate"
                          >
                            « {idea.text} »
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end gap-2 pt-2 border-t border-stone-100">
                    <button
                      type="button"
                      onClick={() => {
                        setShowManageModal(false);
                        setEditingQuestionId(null);
                      }}
                      className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-stone-500 hover:bg-stone-100"
                    >
                      Annuler
                    </button>

                    {editingQuestionId ? (
                      <button
                        type="button"
                        onClick={handleSaveEditQuestion}
                        className="px-4 py-1.5 rounded-xl text-xs font-bold bg-rose-500 text-white hover:bg-rose-600 shadow-xs cursor-pointer"
                      >
                        Enregistrer
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleCreateCustomQuestion()}
                        disabled={!newQuestionText.trim()}
                        className="px-4 py-1.5 rounded-xl text-xs font-bold bg-rose-500 disabled:opacity-50 text-white hover:bg-rose-600 shadow-xs cursor-pointer"
                      >
                        Ajouter à notre jeu 💖
                      </button>
                    )}
                  </div>
                </div>
              )}

              {manageTab === 'list' && (
                <div className="space-y-2 overflow-y-auto no-scrollbar flex-1 pr-0.5">
                  {customQuestions.filter((q) => q.authorId === activePartnerId).length === 0 ? (
                    <div className="text-center py-6 text-stone-400 text-xs">
                      <p>Vous n'avez pas encore créé de question.</p>
                      <button
                        type="button"
                        onClick={() => setManageTab('add')}
                        className="mt-2 text-rose-600 font-bold underline"
                      >
                        Créer ma première question
                      </button>
                    </div>
                  ) : (
                    customQuestions
                      .filter((q) => q.authorId === activePartnerId)
                      .map((q) => (
                        <div
                          key={q.id}
                          className="p-2.5 rounded-xl bg-stone-50 border border-stone-200 flex items-center justify-between gap-2"
                        >
                          <div className="min-w-0">
                            <span className="text-[10px] font-bold uppercase text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                              {q.category}
                            </span>
                            <p className="text-xs font-bold text-stone-800 mt-1 truncate">
                              « {q.text} »
                            </p>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingQuestionId(q.id);
                                setEditText(q.text);
                                setEditCat(q.category);
                                setManageTab('add');
                              }}
                              className="p-1 rounded-lg text-stone-500 hover:text-rose-600 hover:bg-white"
                              title="Modifier"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteCustomQuestion(q.id)}
                              className="p-1 rounded-lg text-stone-500 hover:text-red-600 hover:bg-white"
                              title="Supprimer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))
                  )}
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
