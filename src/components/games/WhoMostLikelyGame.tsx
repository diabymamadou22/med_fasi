import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  Heart,
  Shuffle,
  Plus,
  Trophy,
  CheckCircle2,
  HelpCircle,
  RotateCcw,
  MessageCircle,
  Share2,
  Flame,
} from 'lucide-react';
import { CoupleProfile, PartnerId, ChatMessage } from '../../types';
import { soundEffects } from '../../lib/audio';
import { triggerCelebrationConfetti, triggerHeartConfetti } from '../../lib/confetti';

export interface WhoQuestion {
  id: string;
  text: string;
  category: 'Quotidien' | 'Romance' | 'Fous rires' | 'Avenir';
  votes?: {
    p1?: PartnerId; // what p1 chose
    p2?: PartnerId; // what p2 chose
  };
}

const DEFAULT_QUESTIONS: WhoQuestion[] = [
  { id: 'w1', text: 'Qui est le plus susceptible de s’endormir en premier devant un film ?', category: 'Quotidien' },
  { id: 'w2', text: 'Qui a dit « Je t’aime » en premier (ou le dira avec le plus d’émotion) ?', category: 'Romance' },
  { id: 'w3', text: 'Qui est le plus dépensier lors d’une séance shopping ?', category: 'Quotidien' },
  { id: 'w4', text: 'Qui passerait 20 minutes à chercher ses clés alors qu’elles sont dans sa poche ?', category: 'Fous rires' },
  { id: 'w5', text: 'Qui prépare le meilleur petit-déjeuner au lit le dimanche ?', category: 'Romance' },
  { id: 'w6', text: 'Qui est le plus susceptible de pleurer devant une comédie romantique ?', category: 'Romance' },
  { id: 'w7', text: 'Qui râle le plus dans les bouchons ou quand il y a du monde ?', category: 'Quotidien' },
  { id: 'w8', text: 'Qui ferait une surprise extravagante juste pour voir le sourire de l’autre ?', category: 'Romance' },
  { id: 'w9', text: 'Qui est le plus mauvais perdant aux jeux de société ou jeux vidéo ?', category: 'Fous rires' },
  { id: 'w10', text: 'Qui organise toujours les valises 3 heures avant le départ ?', category: 'Avenir' },
  { id: 'w11', text: 'Qui a le plus besoin de câlins au réveil ?', category: 'Romance' },
  { id: 'w12', text: 'Qui est le plus susceptible d’adopter un chien ou un chat sur un coup de tête ?', category: 'Avenir' },
  { id: 'w13', text: 'Qui chante le plus fort (et le plus faux) sous la douche ?', category: 'Fous rires' },
  { id: 'w14', text: 'Qui est le plus gourmand face à une boîte de chocolats ou des gâteaux ?', category: 'Quotidien' },
  { id: 'w15', text: 'Qui planifie les vacances idéales jusqu’au moindre restaurant ?', category: 'Avenir' },
  { id: 'w16', text: 'Qui fait le premier pas pour se réconcilier après une petite bouderie ?', category: 'Romance' },
  { id: 'w17', text: 'Qui met le plus de temps à se préparer avant de sortir ?', category: 'Quotidien' },
  { id: 'w18', text: 'Qui est le plus susceptible d’oublier où est garée la voiture ?', category: 'Fous rires' },
  { id: 'w19', text: 'Qui envoie le plus de messages mignons ou de reels dans la journée ?', category: 'Romance' },
  { id: 'w20', text: 'Qui ferait le meilleur discours pour un anniversaire ou un mariage ?', category: 'Avenir' },
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
  const [questions, setQuestions] = useState<WhoQuestion[]>(() => {
    try {
      const saved = localStorage.getItem('nid_amour_who_most_likely');
      return saved ? JSON.parse(saved) : DEFAULT_QUESTIONS;
    } catch {
      return DEFAULT_QUESTIONS;
    }
  });

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newQuestionText, setNewQuestionText] = useState('');
  const [newQuestionCat, setNewQuestionCat] = useState<'Quotidien' | 'Romance' | 'Fous rires' | 'Avenir'>('Romance');
  const [copiedNotification, setCopiedNotification] = useState<string | null>(null);

  // Save changes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('nid_amour_who_most_likely', JSON.stringify(questions));
    } catch (e) {
      console.error(e);
    }
  }, [questions]);

  const filteredQuestions = questions.filter((q) =>
    selectedCategory === 'all' ? true : q.category === selectedCategory
  );

  const safeIndex = Math.min(currentIndex, Math.max(0, filteredQuestions.length - 1));
  const currentQuestion = filteredQuestions[safeIndex] || filteredQuestions[0];

  const currentVotes = currentQuestion?.votes || {};
  const bothVoted = currentVotes.p1 !== undefined && currentVotes.p2 !== undefined;
  const isMatch = bothVoted && currentVotes.p1 === currentVotes.p2;

  // Handle vote for active partner
  const handleVote = (candidateId: PartnerId) => {
    if (!currentQuestion) return;
    soundEffects.playSoftTap();

    const updatedVotes = {
      ...currentVotes,
      [activePartnerId]: candidateId,
    };

    const updatedQuestions = questions.map((q) =>
      q.id === currentQuestion.id ? { ...q, votes: updatedVotes } : q
    );
    setQuestions(updatedQuestions);

    // If this vote completes the pair
    const partnerKey = activePartnerId === 'p1' ? 'p2' : 'p1';
    if (updatedVotes[partnerKey] !== undefined) {
      if (updatedVotes[partnerKey] === candidateId) {
        soundEffects.playSuccessSparkle();
        triggerCelebrationConfetti();
      } else {
        soundEffects.playHeartPulse();
      }
    }
  };

  // Simulating the other partner vote for fun/quick test or pass-and-play
  const handleVoteForOther = (candidateId: PartnerId) => {
    if (!currentQuestion) return;
    soundEffects.playSoftTap();
    const otherId = activePartnerId === 'p1' ? 'p2' : 'p1';

    const updatedVotes = {
      ...currentVotes,
      [otherId]: candidateId,
    };

    const updatedQuestions = questions.map((q) =>
      q.id === currentQuestion.id ? { ...q, votes: updatedVotes } : q
    );
    setQuestions(updatedQuestions);

    if (updatedVotes[activePartnerId] !== undefined) {
      if (updatedVotes[activePartnerId] === candidateId) {
        soundEffects.playSuccessSparkle();
        triggerCelebrationConfetti();
      } else {
        soundEffects.playHeartPulse();
      }
    }
  };

  const handleNext = () => {
    soundEffects.playSoftTap();
    if (safeIndex < filteredQuestions.length - 1) {
      setCurrentIndex(safeIndex + 1);
    } else {
      setCurrentIndex(0);
    }
  };

  const handlePrev = () => {
    soundEffects.playSoftTap();
    if (safeIndex > 0) {
      setCurrentIndex(safeIndex - 1);
    } else {
      setCurrentIndex(filteredQuestions.length - 1);
    }
  };

  const handleRandomQuestion = () => {
    soundEffects.playSoftTap();
    if (filteredQuestions.length <= 1) return;
    let nextIdx = Math.floor(Math.random() * filteredQuestions.length);
    if (nextIdx === safeIndex) nextIdx = (nextIdx + 1) % filteredQuestions.length;
    setCurrentIndex(nextIdx);
  };

  const handleResetCurrentVotes = () => {
    if (!currentQuestion) return;
    soundEffects.playSoftTap();
    const updated = questions.map((q) =>
      q.id === currentQuestion.id ? { ...q, votes: undefined } : q
    );
    setQuestions(updated);
  };

  const handleAddQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestionText.trim()) return;
    const newQ: WhoQuestion = {
      id: `custom-who-${Date.now()}`,
      text: newQuestionText.trim(),
      category: newQuestionCat,
    };
    setQuestions([newQ, ...questions]);
    setNewQuestionText('');
    setShowAddModal(false);
    setCurrentIndex(0);
    soundEffects.playSuccessSparkle();
    triggerHeartConfetti();
  };

  // Stats calculation
  const totalAnswered = questions.filter((q) => q.votes?.p1 && q.votes?.p2).length;
  const totalMatches = questions.filter((q) => q.votes?.p1 && q.votes?.p2 && q.votes.p1 === q.votes.p2).length;
  const matchPercentage = totalAnswered > 0 ? Math.round((totalMatches / totalAnswered) * 100) : 0;

  const handleShareToChat = () => {
    if (!currentQuestion) return;
    const p1Choice = currentVotes.p1 ? (currentVotes.p1 === 'p1' ? profile.partner1.name : profile.partner2.name) : 'Non voté';
    const p2Choice = currentVotes.p2 ? (currentVotes.p2 === 'p1' ? profile.partner1.name : profile.partner2.name) : 'Non voté';
    
    const summary = `🔮 *Qui de nous deux ?*\n« ${currentQuestion.text} »\n• ${profile.partner1.name} a voté : ${p1Choice}\n• ${profile.partner2.name} a voté : ${p2Choice}\n${isMatch ? '💖 Accord parfait !' : '✨ Les avis divergent, débattons-en !'}`;
    
    if (onSendChatMessage) {
      onSendChatMessage({
        senderId: activePartnerId,
        text: summary,
        type: 'text',
      });
      setCopiedNotification('Envoyé directement dans votre chat d’amoureux ! 💌');
    } else {
      navigator.clipboard.writeText(summary);
      setCopiedNotification('Texte copié ! Vous pouvez le coller dans votre chat.');
    }
    soundEffects.playSuccessSparkle();
    triggerHeartConfetti();
    setTimeout(() => setCopiedNotification(null), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Game Header with Stats Badge */}
      <div className="bg-gradient-to-r from-rose-500 via-pink-500 to-amber-500 rounded-3xl p-6 text-white shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        
        <div className="relative z-1 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Jeu de Complicité Instantané</span>
            </div>
            <h2 className="font-serif-romantic text-2xl sm:text-3xl font-bold tracking-tight">
              🔮 Qui de nous deux ?
            </h2>
            <p className="text-white/90 text-xs sm:text-sm mt-1 max-w-xl">
              Votez chacun pour la personne la plus susceptible de correspondre à la situation.
              Découvrez si vous avez la même vision ou ouvrez le débat !
            </p>
          </div>

          {/* Compatibility Score Card */}
          <div className="bg-white/15 backdrop-blur-md border border-white/25 rounded-2xl p-3.5 flex items-center gap-3.5 shrink-0 self-stretch sm:self-auto">
            <div className="w-12 h-12 rounded-xl bg-white text-rose-600 flex items-center justify-center font-bold text-lg shadow-sm">
              {matchPercentage}%
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wider text-white/80 font-semibold">Taux d'accord</p>
              <p className="text-xs font-bold text-white">
                {totalMatches} accords sur {totalAnswered} questions
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Category filters & Action buttons */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
          {['all', 'Romance', 'Quotidien', 'Fous rires', 'Avenir'].map((cat) => (
            <button
              key={cat}
              onClick={() => {
                setSelectedCategory(cat);
                setCurrentIndex(0);
                soundEffects.playSoftTap();
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                selectedCategory === cat
                  ? 'bg-rose-500 text-white shadow-xs'
                  : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-50'
              }`}
            >
              {cat === 'all' ? 'Toutes les cartes' : cat}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRandomQuestion}
            className="p-2 rounded-xl bg-white border border-stone-200 text-stone-600 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer text-xs font-semibold flex items-center gap-1.5"
            title="Question aléatoire"
          >
            <Shuffle className="w-4 h-4" />
            <span className="hidden sm:inline">Aléatoire</span>
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-3 py-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 transition-colors cursor-pointer text-xs font-bold flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Ajouter une question</span>
          </button>
        </div>
      </div>

      {/* Main Interactive Card */}
      {currentQuestion && (
        <motion.div
          key={currentQuestion.id}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl border border-rose-100/80 p-6 sm:p-8 shadow-sm relative overflow-hidden"
        >
          {/* Top category label & progress */}
          <div className="flex items-center justify-between text-xs font-bold text-stone-500 mb-4">
            <span className="px-3 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-100">
              {currentQuestion.category}
            </span>
            <span>
              Question {safeIndex + 1} / {filteredQuestions.length}
            </span>
          </div>

          {/* Question Text */}
          <div className="text-center py-4 sm:py-6">
            <h3 className="font-serif-romantic text-2xl sm:text-3xl font-bold text-stone-900 leading-snug max-w-2xl mx-auto">
              « {currentQuestion.text} »
            </h3>
          </div>

          {/* Voting Interactive Zone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-6">
            {/* Candidate 1: Partner 1 */}
            <div
              className={`p-5 rounded-2xl border-2 transition-all cursor-pointer relative flex flex-col items-center text-center ${
                currentVotes[activePartnerId] === 'p1'
                  ? 'border-rose-500 bg-rose-50/70 shadow-sm'
                  : 'border-stone-200 hover:border-rose-300 bg-stone-50/50 hover:bg-white'
              }`}
              onClick={() => handleVote('p1')}
            >
              <div className="w-16 h-16 rounded-full overflow-hidden mb-3 border-2 border-white shadow-xs">
                {profile.partner1.avatar ? (
                  <img src={profile.partner1.avatar} alt={profile.partner1.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-rose-200 flex items-center justify-center text-rose-700 font-bold text-xl">
                    {profile.partner1.name.charAt(0)}
                  </div>
                )}
              </div>
              <h4 className="font-bold text-stone-900 text-lg">{profile.partner1.name}</h4>
              <p className="text-xs text-stone-500 mt-0.5">
                {currentVotes[activePartnerId] === 'p1' ? 'Votre vote actuel 💖' : 'Cliquer pour voter'}
              </p>

              {/* Reveal Badges if both voted */}
              {bothVoted && (
                <div className="mt-3 flex items-center gap-1.5 flex-wrap justify-center">
                  {currentVotes.p1 === 'p1' && (
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-500 text-white shadow-2xs">
                      {profile.partner1.name} pense que c'est {profile.partner1.name}
                    </span>
                  )}
                  {currentVotes.p2 === 'p1' && (
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-pink-500 text-white shadow-2xs">
                      {profile.partner2.name} pense que c'est {profile.partner1.name}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Candidate 2: Partner 2 */}
            <div
              className={`p-5 rounded-2xl border-2 transition-all cursor-pointer relative flex flex-col items-center text-center ${
                currentVotes[activePartnerId] === 'p2'
                  ? 'border-rose-500 bg-rose-50/70 shadow-sm'
                  : 'border-stone-200 hover:border-rose-300 bg-stone-50/50 hover:bg-white'
              }`}
              onClick={() => handleVote('p2')}
            >
              <div className="w-16 h-16 rounded-full overflow-hidden mb-3 border-2 border-white shadow-xs">
                {profile.partner2.avatar ? (
                  <img src={profile.partner2.avatar} alt={profile.partner2.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-pink-200 flex items-center justify-center text-pink-700 font-bold text-xl">
                    {profile.partner2.name.charAt(0)}
                  </div>
                )}
              </div>
              <h4 className="font-bold text-stone-900 text-lg">{profile.partner2.name}</h4>
              <p className="text-xs text-stone-500 mt-0.5">
                {currentVotes[activePartnerId] === 'p2' ? 'Votre vote actuel 💖' : 'Cliquer pour voter'}
              </p>

              {/* Reveal Badges if both voted */}
              {bothVoted && (
                <div className="mt-3 flex items-center gap-1.5 flex-wrap justify-center">
                  {currentVotes.p1 === 'p2' && (
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-500 text-white shadow-2xs">
                      {profile.partner1.name} pense que c'est {profile.partner2.name}
                    </span>
                  )}
                  {currentVotes.p2 === 'p2' && (
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-pink-500 text-white shadow-2xs">
                      {profile.partner2.name} pense que c'est {profile.partner2.name}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Pass-and-play quick switcher or result banner */}
          <div className="mt-4 pt-4 border-t border-stone-100 flex flex-col sm:flex-row items-center justify-between gap-3">
            {bothVoted ? (
              <div className={`p-3 rounded-2xl w-full text-center flex items-center justify-center gap-2 font-bold text-sm ${
                isMatch ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-amber-50 text-amber-800 border border-amber-200'
              }`}>
                {isMatch ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    <span>Match Parfait ! Vous êtes tous les deux d'accord ! 🎉</span>
                  </>
                ) : (
                  <>
                    <Flame className="w-5 h-5 text-amber-600 shrink-0" />
                    <span>Divergence amusante ! Chacun voit les choses à sa façon 😉</span>
                  </>
                )}
              </div>
            ) : (
              <div className="text-xs text-stone-500 flex items-center justify-center sm:justify-start gap-2 w-full">
                <span>Pass & Play :</span>
                <button
                  type="button"
                  onClick={() => handleVoteForOther('p1')}
                  className="px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 font-medium cursor-pointer"
                >
                  Faire voter {activePartnerId === 'p1' ? profile.partner2.name : profile.partner1.name} pour {profile.partner1.name}
                </button>
                <button
                  type="button"
                  onClick={() => handleVoteForOther('p2')}
                  className="px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 font-medium cursor-pointer"
                >
                  pour {profile.partner2.name}
                </button>
              </div>
            )}
          </div>

          {/* Card Navigation Controls */}
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-stone-100">
            <button
              onClick={handlePrev}
              className="px-4 py-2 rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-50 font-bold text-xs transition-colors cursor-pointer"
            >
              ← Précédente
            </button>

            <div className="flex items-center gap-2">
              {bothVoted && (
                <button
                  onClick={handleShareToChat}
                  className="px-3.5 py-2 rounded-xl bg-pink-50 border border-pink-200 text-pink-700 hover:bg-pink-100 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Partager le résultat"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Partager</span>
                </button>
              )}
              <button
                onClick={handleResetCurrentVotes}
                className="p-2 rounded-xl text-stone-400 hover:text-stone-600 hover:bg-stone-100 transition-colors cursor-pointer"
                title="Réinitialiser les votes de cette carte"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={handleNext}
              className="px-5 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
            >
              Suivante →
            </button>
          </div>
        </motion.div>
      )}

      {copiedNotification && (
        <div className="p-3 bg-stone-900 text-white text-xs font-semibold rounded-xl text-center shadow-lg">
          {copiedNotification}
        </div>
      )}

      {/* Modal Add Custom Question */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border border-rose-100"
            >
              <h3 className="font-serif-romantic text-xl font-bold text-stone-900 mb-2">
                Créer une question personnalisée
              </h3>
              <p className="text-xs text-stone-600 mb-4">
                Ajoutez un dilemme complice ou une blague propre à votre histoire d'amour !
              </p>

              <form onSubmit={handleAddQuestion} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    La question « Qui de nous deux... »
                  </label>
                  <textarea
                    value={newQuestionText}
                    onChange={(e) => setNewQuestionText(e.target.value)}
                    placeholder="Ex: Qui cuisine le meilleur plat quand on reçoit des amis ?"
                    className="w-full p-3 rounded-xl border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400"
                    rows={3}
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Catégorie
                  </label>
                  <select
                    value={newQuestionCat}
                    onChange={(e) => setNewQuestionCat(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400"
                  >
                    <option value="Romance">Romance</option>
                    <option value="Quotidien">Quotidien</option>
                    <option value="Fous rires">Fous rires</option>
                    <option value="Avenir">Avenir</option>
                  </select>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 rounded-xl text-stone-600 hover:bg-stone-100 font-bold text-xs"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs shadow-xs"
                  >
                    Enregistrer la question
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
