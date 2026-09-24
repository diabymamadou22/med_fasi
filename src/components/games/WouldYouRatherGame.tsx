import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  Shuffle,
  Plus,
  Heart,
  CheckCircle2,
  Share2,
  Compass,
  Flame,
  RotateCcw,
  MessageCircle,
} from 'lucide-react';
import { CoupleProfile, PartnerId, ChatMessage } from '../../types';
import { soundEffects } from '../../lib/audio';
import { triggerCelebrationConfetti, triggerHeartConfetti } from '../../lib/confetti';

export interface WouldYouRatherItem {
  id: string;
  category: 'Aventure' | 'Romance' | 'Quotidien' | 'Insolite';
  optionA: string;
  optionB: string;
  votes?: {
    p1?: 'A' | 'B';
    p2?: 'A' | 'B';
  };
}

const DEFAULT_ITEMS: WouldYouRatherItem[] = [
  {
    id: 'wyr1',
    category: 'Aventure',
    optionA: 'Une semaine dans une cabane isolée sous la neige avec feu de cheminée ❄️',
    optionB: 'Une semaine dans une villa les pieds dans l’eau turquoise sous le soleil ☀️',
  },
  {
    id: 'wyr2',
    category: 'Romance',
    optionA: 'Revivre en détail notre tout premier rendez-vous avec la magie du début ✨',
    optionB: 'Faire un saut dans le temps de 40 ans pour nous voir vieux et toujours amoureux 👵👴',
  },
  {
    id: 'wyr3',
    category: 'Quotidien',
    optionA: 'Avoir un cuisinier personnel qui prépare tous nos repas préférés à deux 🍳',
    optionB: 'Avoir un majordome qui fait tout le ménage et le linge pour toujours 🧹',
  },
  {
    id: 'wyr4',
    category: 'Romance',
    optionA: 'Pouvoir lire dans les pensées de l’autre pendant 1 heure sans filtre 🔮',
    optionB: 'Recevoir une lettre d’amour manuscrite surprise chaque mois pour toujours 💌',
  },
  {
    id: 'wyr5',
    category: 'Aventure',
    optionA: 'Partir demain à l’aéroport et monter dans le premier avion sans connaître la destination ✈️',
    optionB: 'Planifier minutieusement le voyage de nos rêves pendant 6 mois complets 🗺️',
  },
  {
    id: 'wyr6',
    category: 'Insolite',
    optionA: 'Ne pouvoir communiquer que par des bisous et des câlins pendant 24h 🤫',
    optionB: 'Devoir chanter tout ce qu’on veut se dire pendant toute une journée 🎤',
  },
  {
    id: 'wyr7',
    category: 'Quotidien',
    optionA: 'Une soirée film sous le plaid avec plateau de sushis et chocolat 🍣',
    optionB: 'Une soirée habillée dans un restaurant gastronomique aux chandelles 🕯️',
  },
  {
    id: 'wyr8',
    category: 'Romance',
    optionA: 'Un baiser passionné sous une pluie battante d’été 🌧️',
    optionB: 'Un lever de soleil enlacés au sommet d’une montagne 🌄',
  },
  {
    id: 'wyr9',
    category: 'Insolite',
    optionA: 'Partager le même compte bancaire sans aucun secret 💳',
    optionB: 'Partager le même mot de passe de téléphone sans aucun secret 📱',
  },
  {
    id: 'wyr10',
    category: 'Romance',
    optionA: 'Être bloqués tous les deux dans un chalet cosy pendant 3 jours de tempête 🌨️',
    optionB: 'Participer ensemble à une émission d’aventure type Koh-Lanta ou Pékin Express 🏝️',
  },
];

interface WouldYouRatherGameProps {
  profile: CoupleProfile;
  activePartnerId: PartnerId;
  onSendChatMessage?: (
    msgData: Omit<ChatMessage, 'id' | 'timestamp' | 'status' | 'readStatus'>
  ) => void;
}

export const WouldYouRatherGame: React.FC<WouldYouRatherGameProps> = ({
  profile,
  activePartnerId,
  onSendChatMessage,
}) => {
  const [items, setItems] = useState<WouldYouRatherItem[]>(() => {
    try {
      const saved = localStorage.getItem('nid_amour_would_you_rather');
      return saved ? JSON.parse(saved) : DEFAULT_ITEMS;
    } catch {
      return DEFAULT_ITEMS;
    }
  });

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newOptA, setNewOptA] = useState('');
  const [newOptB, setNewOptB] = useState('');
  const [newCat, setNewCat] = useState<WouldYouRatherItem['category']>('Romance');

  useEffect(() => {
    try {
      localStorage.setItem('nid_amour_would_you_rather', JSON.stringify(items));
    } catch (e) {
      console.error(e);
    }
  }, [items]);

  const filtered = items.filter((item) =>
    selectedCategory === 'all' ? true : item.category === selectedCategory
  );
  const safeIndex = Math.min(currentIndex, Math.max(0, filtered.length - 1));
  const current = filtered[safeIndex] || filtered[0];

  const currentVotes = current?.votes || {};
  const bothVoted = currentVotes.p1 !== undefined && currentVotes.p2 !== undefined;
  const isMatch = bothVoted && currentVotes.p1 === currentVotes.p2;

  const handleVote = (choice: 'A' | 'B') => {
    if (!current) return;
    soundEffects.playSoftTap();
    const updatedVotes = {
      ...currentVotes,
      [activePartnerId]: choice,
    };
    const updatedItems = items.map((it) =>
      it.id === current.id ? { ...it, votes: updatedVotes } : it
    );
    setItems(updatedItems);

    const otherId = activePartnerId === 'p1' ? 'p2' : 'p1';
    if (updatedVotes[otherId] !== undefined) {
      if (updatedVotes[otherId] === choice) {
        soundEffects.playSuccessSparkle();
        triggerCelebrationConfetti();
      } else {
        soundEffects.playHeartPulse();
      }
    }
  };

  const handleVoteForOther = (choice: 'A' | 'B') => {
    if (!current) return;
    soundEffects.playSoftTap();
    const otherId = activePartnerId === 'p1' ? 'p2' : 'p1';
    const updatedVotes = {
      ...currentVotes,
      [otherId]: choice,
    };
    const updatedItems = items.map((it) =>
      it.id === current.id ? { ...it, votes: updatedVotes } : it
    );
    setItems(updatedItems);

    if (updatedVotes[activePartnerId] !== undefined) {
      if (updatedVotes[activePartnerId] === choice) {
        soundEffects.playSuccessSparkle();
        triggerCelebrationConfetti();
      } else {
        soundEffects.playHeartPulse();
      }
    }
  };

  const handleNext = () => {
    soundEffects.playSoftTap();
    if (safeIndex < filtered.length - 1) {
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
      setCurrentIndex(filtered.length - 1);
    }
  };

  const handleRandom = () => {
    soundEffects.playSoftTap();
    if (filtered.length <= 1) return;
    let nextIdx = Math.floor(Math.random() * filtered.length);
    if (nextIdx === safeIndex) nextIdx = (nextIdx + 1) % filtered.length;
    setCurrentIndex(nextIdx);
  };

  const handleAddCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOptA.trim() || !newOptB.trim()) return;
    const newItem: WouldYouRatherItem = {
      id: `custom-wyr-${Date.now()}`,
      category: newCat,
      optionA: newOptA.trim(),
      optionB: newOptB.trim(),
    };
    const updated = [newItem, ...items];
    setItems(updated);
    setShowAddModal(false);
    setNewOptA('');
    setNewOptB('');
    setCurrentIndex(0);
    soundEffects.playSuccessSparkle();
  };

  const [sentToChatToast, setSentToChatToast] = useState(false);

  const handleShareDilemma = () => {
    if (!current) return;
    const p1Choice = currentVotes.p1
      ? currentVotes.p1 === 'A'
        ? `Option A (${current.optionA})`
        : `Option B (${current.optionB})`
      : 'Pas encore voté';
    const p2Choice = currentVotes.p2
      ? currentVotes.p2 === 'A'
        ? `Option A (${current.optionA})`
        : `Option B (${current.optionB})`
      : 'Pas encore voté';

    const matchText = isMatch
      ? '💖 Même choix ! Nos désirs sont parfaitement connectés !'
      : bothVoted
      ? '✨ Choix différents ! Échangeons nos arguments avec amour !'
      : '💌 À toi de voter mon amour !';

    const text = `🤔 *Tu préfères... ?*\n🅰️ ${current.optionA}\n🅱️ ${current.optionB}\n\n• ${profile.partner1.name} : ${p1Choice}\n• ${profile.partner2.name} : ${p2Choice}\n${matchText}`;

    if (onSendChatMessage) {
      onSendChatMessage({
        senderId: activePartnerId,
        text,
        type: 'text',
      });
      soundEffects.playSuccessSparkle();
      triggerHeartConfetti();
      setSentToChatToast(true);
      setTimeout(() => setSentToChatToast(false), 3000);
    } else {
      navigator.clipboard.writeText(text);
      soundEffects.playSoftTap();
      setSentToChatToast(true);
      setTimeout(() => setSentToChatToast(false), 3000);
    }
  };

  const totalAnswered = items.filter((i) => i.votes?.p1 && i.votes?.p2).length;
  const totalMatches = items.filter((i) => i.votes?.p1 && i.votes?.p2 && i.votes.p1 === i.votes.p2).length;
  const percentMatch = totalAnswered > 0 ? Math.round((totalMatches / totalAnswered) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-amber-500 via-rose-500 to-pink-600 rounded-3xl p-6 text-white shadow-md relative overflow-hidden">
        <div className="relative z-1 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Dilemmes de Couple & Rires</span>
            </div>
            <h2 className="font-serif-romantic text-2xl sm:text-3xl font-bold tracking-tight">
              💌 Tu préfères... ? (Édition Amour)
            </h2>
            <p className="text-white/90 text-xs sm:text-sm mt-1 max-w-xl">
              Choisissez entre deux options surprenantes ou romantiques et comparez vos visions !
            </p>
          </div>

          <div className="bg-white/15 backdrop-blur-md border border-white/25 rounded-2xl p-3.5 flex items-center gap-3.5 shrink-0 self-stretch sm:self-auto">
            <div className="w-12 h-12 rounded-xl bg-white text-rose-600 flex items-center justify-center font-bold text-lg shadow-sm">
              {percentMatch}%
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wider text-white/80 font-semibold">Alignement</p>
              <p className="text-xs font-bold text-white">
                {totalMatches} choix identiques sur {totalAnswered}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Category filters */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
          {['all', 'Romance', 'Aventure', 'Quotidien', 'Insolite'].map((cat) => (
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
              {cat === 'all' ? 'Tous les dilemmes' : cat}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRandom}
            className="p-2 rounded-xl bg-white border border-stone-200 text-stone-600 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer text-xs font-semibold flex items-center gap-1.5"
            title="Dilemme aléatoire"
          >
            <Shuffle className="w-4 h-4" />
            <span className="hidden sm:inline">Aléatoire</span>
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-3 py-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Ajouter un dilemme</span>
          </button>
        </div>
      </div>

      {/* Dilemma Cards Interactive Split */}
      {current && (
        <motion.div
          key={current.id}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl border border-rose-100/80 p-6 sm:p-8 shadow-sm space-y-6"
        >
          <div className="flex items-center justify-between text-xs font-bold text-stone-500">
            <span className="px-3 py-1 rounded-full bg-rose-50 text-rose-700">
              {current.category}
            </span>
            <span>
              Dilemme {safeIndex + 1} / {filtered.length}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative">
            {/* Center "OU" Badge */}
            <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-rose-500 text-white font-black text-xs items-center justify-center shadow-lg border-2 border-white z-10">
              OU
            </div>

            {/* Option A */}
            <div
              onClick={() => handleVote('A')}
              className={`p-6 sm:p-8 rounded-3xl border-2 transition-all cursor-pointer flex flex-col justify-between min-h-[190px] relative ${
                currentVotes[activePartnerId] === 'A'
                  ? 'border-rose-500 bg-rose-50/80 shadow-md ring-2 ring-rose-300'
                  : 'border-stone-200 hover:border-rose-300 bg-stone-50/40 hover:bg-white'
              }`}
            >
              <div>
                <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-100 text-rose-700 mb-3">
                  Option A
                </span>
                <p className="font-serif-romantic text-lg sm:text-xl font-bold text-stone-900 leading-snug">
                  {current.optionA}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-stone-200/50 flex items-center justify-between">
                <span className="text-xs font-semibold text-stone-500">
                  {currentVotes[activePartnerId] === 'A' ? 'Votre choix ✨' : 'Choisir cette option'}
                </span>
                {bothVoted && (
                  <div className="flex items-center gap-1 text-[10px] font-bold">
                    {currentVotes.p1 === 'A' && (
                      <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white">
                        {profile.partner1.name}
                      </span>
                    )}
                    {currentVotes.p2 === 'A' && (
                      <span className="px-2 py-0.5 rounded-full bg-pink-500 text-white">
                        {profile.partner2.name}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Option B */}
            <div
              onClick={() => handleVote('B')}
              className={`p-6 sm:p-8 rounded-3xl border-2 transition-all cursor-pointer flex flex-col justify-between min-h-[190px] relative ${
                currentVotes[activePartnerId] === 'B'
                  ? 'border-rose-500 bg-rose-50/80 shadow-md ring-2 ring-rose-300'
                  : 'border-stone-200 hover:border-rose-300 bg-stone-50/40 hover:bg-white'
              }`}
            >
              <div>
                <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 mb-3">
                  Option B
                </span>
                <p className="font-serif-romantic text-lg sm:text-xl font-bold text-stone-900 leading-snug">
                  {current.optionB}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-stone-200/50 flex items-center justify-between">
                <span className="text-xs font-semibold text-stone-500">
                  {currentVotes[activePartnerId] === 'B' ? 'Votre choix ✨' : 'Choisir cette option'}
                </span>
                {bothVoted && (
                  <div className="flex items-center gap-1 text-[10px] font-bold">
                    {currentVotes.p1 === 'B' && (
                      <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white">
                        {profile.partner1.name}
                      </span>
                    )}
                    {currentVotes.p2 === 'B' && (
                      <span className="px-2 py-0.5 rounded-full bg-pink-500 text-white">
                        {profile.partner2.name}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Pass-and-play or verdict */}
          <div className="pt-2">
            {bothVoted ? (
              <div
                className={`p-4 rounded-2xl text-center font-bold text-sm flex items-center justify-center gap-2 ${
                  isMatch
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-amber-50 text-amber-800 border border-amber-200'
                }`}
              >
                {isMatch ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <span>Même choix ! Vos désirs s'alignent parfaitement ! 💖</span>
                  </>
                ) : (
                  <>
                    <Heart className="w-5 h-5 text-amber-600" />
                    <span>Choix différents ! Les opposés créent les plus belles aventures !</span>
                  </>
                )}
              </div>
            ) : (
              <div className="text-xs text-stone-500 flex items-center justify-center sm:justify-start gap-2">
                <span>Pass & Play :</span>
                <button
                  type="button"
                  onClick={() => handleVoteForOther('A')}
                  className="px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 font-medium cursor-pointer"
                >
                  Faire voter {activePartnerId === 'p1' ? profile.partner2.name : profile.partner1.name} pour l'Option A
                </button>
                <button
                  type="button"
                  onClick={() => handleVoteForOther('B')}
                  className="px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 font-medium cursor-pointer"
                >
                  pour l'Option B
                </button>
              </div>
            )}
          </div>

          {/* Card Navigation */}
          <div className="flex items-center justify-between pt-4 border-t border-stone-100">
            <button
              onClick={handlePrev}
              className="px-4 py-2 rounded-xl border border-stone-200 text-stone-600 font-bold text-xs hover:bg-stone-50 cursor-pointer"
            >
              ← Précédent
            </button>

            <button
              type="button"
              onClick={handleShareDilemma}
              className="px-3.5 py-2 rounded-xl bg-pink-50 hover:bg-pink-100 text-pink-700 border border-pink-200 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-all"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>{sentToChatToast ? 'Envoyé au chat ! 💌' : 'Partager au chat'}</span>
            </button>

            <button
              onClick={handleNext}
              className="px-5 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs shadow-xs cursor-pointer"
            >
              Suivant →
            </button>
          </div>
        </motion.div>
      )}

      {/* Modal Add Custom */}
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
                Créer un dilemme « Tu préfères... »
              </h3>

              <form onSubmit={handleAddCustom} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Option A</label>
                  <textarea
                    value={newOptA}
                    onChange={(e) => setNewOptA(e.target.value)}
                    placeholder="Ex: Un baiser sous la pluie à minuit"
                    className="w-full p-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400"
                    rows={2}
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Option B</label>
                  <textarea
                    value={newOptB}
                    onChange={(e) => setNewOptB(e.target.value)}
                    placeholder="Ex: Un petit-déjeuner au lit avec tes viennoiseries préférées"
                    className="w-full p-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400"
                    rows={2}
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Catégorie</label>
                  <select
                    value={newCat}
                    onChange={(e) => setNewCat(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400"
                  >
                    <option value="Romance">Romance</option>
                    <option value="Aventure">Aventure</option>
                    <option value="Quotidien">Quotidien</option>
                    <option value="Insolite">Insolite</option>
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
                    Enregistrer le dilemme
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
