import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  Heart,
  Flame,
  Smile,
  Gift,
  CheckCircle2,
  Plus,
  RefreshCw,
  Trophy,
  Volume2,
} from 'lucide-react';
import { CoupleProfile, PartnerId } from '../../types';
import { soundEffects } from '../../lib/audio';
import { triggerCelebrationConfetti, triggerHeartConfetti } from '../../lib/confetti';

export interface RouletteDare {
  id: string;
  title: string;
  category: 'Douceur' | 'Compliments' | 'Piquant' | 'Rires' | 'Petits Soins';
  description: string;
  points: number;
}

const DEFAULT_DARES: RouletteDare[] = [
  {
    id: 'd1',
    title: 'Massage des épaules express',
    category: 'Douceur',
    description: 'Offre un massage relaxant des trapèzes et des épaules pendant 3 minutes avec douceur.',
    points: 15,
  },
  {
    id: 'd2',
    title: 'Les 3 pépites secrètes',
    category: 'Compliments',
    description: 'Dis 3 choses précises que tu adores chez ton partenaire que tu ne lui as pas dites récemment.',
    points: 10,
  },
  {
    id: 'd3',
    title: 'Bisou passionné au ralenti',
    category: 'Piquant',
    description: 'Regarde ton partenaire dans les yeux pendant 10 secondes sans rire, puis embrasse-le tendrement.',
    points: 20,
  },
  {
    id: 'd4',
    title: 'Imitation amoureuse',
    category: 'Rires',
    description: 'Imite une petite manie adorable ou une mimique de ton partenaire jusqu’à le faire éclater de rire !',
    points: 10,
  },
  {
    id: 'd5',
    title: 'La boisson royale',
    category: 'Petits Soins',
    description: 'Prépare immédiatement la boisson préférée de ton partenaire (thé, café, chocolat ou verre d’eau fraîche).',
    points: 15,
  },
  {
    id: 'd6',
    title: 'Câlin longue durée',
    category: 'Douceur',
    description: 'Un câlin serré de 60 secondes en écoutant les battements de cœur, sans un seul mot.',
    points: 15,
  },
  {
    id: 'd7',
    title: 'Murmure à l’oreille',
    category: 'Piquant',
    description: 'Chuchote à l’oreille de ton partenaire un fantasme ou la chose la plus attirante chez lui/elle aujourd’hui.',
    points: 25,
  },
  {
    id: 'd8',
    title: 'Le poème express',
    category: 'Compliments',
    description: 'Invente un poème romantique de 4 vers avec le prénom de ton partenaire.',
    points: 20,
  },
  {
    id: 'd9',
    title: 'Danse lente sans musique',
    category: 'Douceur',
    description: 'Prends ton partenaire par la taille et esquissez quelques pas de danse douce au milieu de la pièce.',
    points: 20,
  },
  {
    id: 'd10',
    title: 'Passe-droit pour ce soir',
    category: 'Petits Soins',
    description: 'Ton partenaire a le choix total du programme ou du repas ce soir sans aucune objection !',
    points: 30,
  },
];

const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string; sliceColor: string }> = {
  Douceur: { bg: 'bg-rose-100', text: 'text-rose-800', border: 'border-rose-300', sliceColor: '#F43F5E' },
  Compliments: { bg: 'bg-amber-100', text: 'text-amber-800', border: 'border-amber-300', sliceColor: '#F59E0B' },
  Piquant: { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-300', sliceColor: '#E11D48' },
  Rires: { bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-300', sliceColor: '#9333EA' },
  'Petits Soins': { bg: 'bg-teal-100', text: 'text-teal-800', border: 'border-teal-300', sliceColor: '#0D9488' },
};

interface LoveRouletteGameProps {
  profile: CoupleProfile;
  activePartnerId: PartnerId;
}

export const LoveRouletteGame: React.FC<LoveRouletteGameProps> = ({
  profile,
  activePartnerId,
}) => {
  const [dares, setDares] = useState<RouletteDare[]>(() => {
    try {
      const saved = localStorage.getItem('nid_amour_love_dares');
      return saved ? JSON.parse(saved) : DEFAULT_DARES;
    } catch {
      return DEFAULT_DARES;
    }
  });

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isSpinning, setIsSpinning] = useState(false);
  const [wheelRotation, setWheelRotation] = useState(0);
  const [activeDare, setActiveDare] = useState<RouletteDare | null>(null);
  const [completedCount, setCompletedCount] = useState(() => {
    return parseInt(localStorage.getItem('nid_amour_roulette_completed') || '0', 10);
  });
  const [earnedPoints, setEarnedPoints] = useState(() => {
    return parseInt(localStorage.getItem('nid_amour_roulette_points') || '0', 10);
  });

  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newCategory, setNewCategory] = useState<RouletteDare['category']>('Douceur');

  const filteredDares = dares.filter((d) =>
    selectedCategory === 'all' ? true : d.category === selectedCategory
  );

  const activePartner = activePartnerId === 'p1' ? profile.partner1 : profile.partner2;

  // Spin the Roulette
  const handleSpin = () => {
    if (isSpinning || filteredDares.length === 0) return;
    setIsSpinning(true);
    setActiveDare(null);
    soundEffects.playHeartPulse();

    // Sound effect ticks during spin
    let tickCount = 0;
    const tickInterval = setInterval(() => {
      soundEffects.playWheelTick();
      tickCount++;
      if (tickCount > 15) clearInterval(tickInterval);
    }, 120);

    const randomIndex = Math.floor(Math.random() * filteredDares.length);
    const chosen = filteredDares[randomIndex];

    // Compute rotation: at least 4 full turns + slice angle
    const extraSpins = 360 * 5;
    const sliceAngle = 360 / Math.max(1, filteredDares.length);
    const targetAngle = wheelRotation + extraSpins + (360 - (randomIndex * sliceAngle) % 360);
    
    setWheelRotation(targetAngle);

    setTimeout(() => {
      clearInterval(tickInterval);
      setActiveDare(chosen);
      setIsSpinning(false);
      soundEffects.playVictoryChime();
      triggerCelebrationConfetti();
    }, 2800);
  };

  const handleCompleteDare = () => {
    if (!activeDare) return;
    soundEffects.playSuccessSparkle();
    triggerHeartConfetti();
    const newCount = completedCount + 1;
    const newPoints = earnedPoints + activeDare.points;
    setCompletedCount(newCount);
    setEarnedPoints(newPoints);
    localStorage.setItem('nid_amour_roulette_completed', newCount.toString());
    localStorage.setItem('nid_amour_roulette_points', newPoints.toString());
  };

  const handleAddDare = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    const dare: RouletteDare = {
      id: `custom-dare-${Date.now()}`,
      title: newTitle.trim(),
      description: newDesc.trim() || newTitle.trim(),
      category: newCategory,
      points: 20,
    };
    const updated = [dare, ...dares];
    setDares(updated);
    localStorage.setItem('nid_amour_love_dares', JSON.stringify(updated));
    setShowAddModal(false);
    setNewTitle('');
    setNewDesc('');
    soundEffects.playSuccessSparkle();
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-red-500 via-rose-500 to-pink-500 rounded-3xl p-6 text-white shadow-md relative overflow-hidden">
        <div className="relative z-1 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold mb-2">
              <Flame className="w-3.5 h-3.5" />
              <span>Jeu de Hasard Romantique</span>
            </div>
            <h2 className="font-serif-romantic text-2xl sm:text-3xl font-bold tracking-tight">
              🎡 La Roue des Défis & Câlins
            </h2>
            <p className="text-white/90 text-xs sm:text-sm mt-1 max-w-xl">
              Faites tourner la roue à deux et laissez le destin décider de votre prochain instant de tendresse ou de complicité !
            </p>
          </div>

          <div className="bg-white/15 backdrop-blur-md border border-white/25 rounded-2xl p-3.5 flex items-center gap-3.5 shrink-0 self-stretch sm:self-auto">
            <div className="w-12 h-12 rounded-xl bg-white text-rose-600 flex items-center justify-center font-bold text-lg shadow-sm">
              <Trophy className="w-6 h-6 text-amber-500" />
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wider text-white/80 font-semibold">Score du Couple</p>
              <p className="text-xs font-bold text-white">
                {completedCount} défis relevés • {earnedPoints} pts d'Amour
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Categories & Actions */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
          {['all', 'Douceur', 'Compliments', 'Piquant', 'Rires', 'Petits Soins'].map((cat) => (
            <button
              key={cat}
              onClick={() => {
                setSelectedCategory(cat);
                soundEffects.playSoftTap();
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                selectedCategory === cat
                  ? 'bg-rose-500 text-white shadow-xs'
                  : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-50'
              }`}
            >
              {cat === 'all' ? 'Tous les défis' : cat}
            </button>
          ))}
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-3 py-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Créer un gage</span>
        </button>
      </div>

      {/* Wheel & Target Card Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Roulette Wheel Column */}
        <div className="lg:col-span-6 flex flex-col items-center justify-center bg-white rounded-3xl p-6 sm:p-8 border border-rose-100 shadow-sm relative overflow-hidden">
          {/* Wheel Pointer */}
          <div className="z-20 -mb-4 flex flex-col items-center">
            <div className="w-6 h-6 bg-rose-600 rotate-45 rounded-sm shadow-md border-2 border-white" />
          </div>

          {/* Visual Rotating Wheel */}
          <div className="relative w-64 h-64 sm:w-72 sm:h-72 rounded-full border-8 border-rose-200 shadow-inner flex items-center justify-center overflow-hidden">
            <div
              className="absolute inset-0 rounded-full transition-transform duration-[2800ms] ease-out flex items-center justify-center"
              style={{
                transform: `rotate(${wheelRotation}deg)`,
                background: `conic-gradient(
                  #F43F5E 0deg 72deg,
                  #F59E0B 72deg 144deg,
                  #E11D48 144deg 216deg,
                  #9333EA 216deg 288deg,
                  #0D9488 288deg 360deg
                )`,
              }}
            >
              {/* Inner Decorative Disc */}
              <div className="w-24 h-24 rounded-full bg-white shadow-lg border-4 border-rose-100 flex items-center justify-center">
                <Heart className="w-10 h-10 text-rose-500 fill-rose-500 animate-pulse" />
              </div>
            </div>
          </div>

          {/* Spin Trigger Button */}
          <button
            onClick={handleSpin}
            disabled={isSpinning}
            className={`mt-6 px-8 py-3.5 rounded-2xl font-bold text-base shadow-md transition-all flex items-center gap-2 cursor-pointer ${
              isSpinning
                ? 'bg-stone-300 text-stone-500 cursor-not-allowed scale-95'
                : 'bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white hover:scale-105 active:scale-95'
            }`}
          >
            <RefreshCw className={`w-5 h-5 ${isSpinning ? 'animate-spin' : ''}`} />
            <span>{isSpinning ? 'La roue tourne...' : 'Tourner la roue !'}</span>
          </button>
        </div>

        {/* Dare Result Column */}
        <div className="lg:col-span-6">
          <AnimatePresence mode="wait">
            {activeDare ? (
              <motion.div
                key={activeDare.id}
                initial={{ opacity: 0, scale: 0.9, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-rose-300 shadow-md relative overflow-hidden"
              >
                <div className="flex items-center justify-between mb-4">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                      CATEGORY_COLORS[activeDare.category]?.bg || 'bg-rose-100'
                    } ${CATEGORY_COLORS[activeDare.category]?.text || 'text-rose-800'}`}
                  >
                    {activeDare.category}
                  </span>
                  <span className="text-xs font-bold text-amber-700 bg-amber-100 px-3 py-1 rounded-full">
                    +{activeDare.points} pts d'Amour
                  </span>
                </div>

                <h3 className="font-serif-romantic text-2xl font-bold text-stone-900 mb-2">
                  {activeDare.title}
                </h3>
                <p className="text-stone-700 text-sm sm:text-base leading-relaxed mb-6">
                  {activeDare.description}
                </p>

                <div className="p-4 bg-rose-50/70 rounded-2xl border border-rose-100 flex items-center justify-between gap-3">
                  <span className="text-xs text-stone-600">
                    Tour de <strong className="text-rose-600">{activePartner.name}</strong> d'accomplir ce gage !
                  </span>
                  <button
                    onClick={handleCompleteDare}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Défi Relevé !</span>
                  </button>
                </div>
              </motion.div>
            ) : (
              <div className="bg-white/70 rounded-3xl p-8 border border-dashed border-rose-200 text-center flex flex-col items-center justify-center min-h-[260px]">
                <Sparkles className="w-10 h-10 text-rose-300 mb-3" />
                <h4 className="font-serif-romantic text-lg font-bold text-stone-700">
                  Prêts pour un défi à deux ?
                </h4>
                <p className="text-xs text-stone-500 max-w-sm mt-1">
                  Appuyez sur « Tourner la roue » pour tirer au sort un gage doux, piquant ou amusant !
                </p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Modal Add Custom Dare */}
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
                Ajouter un gage à la Roulette
              </h3>
              <p className="text-xs text-stone-600 mb-4">
                Imaginez un défi tendre, coquin ou drôle qui sera tiré au sort par la roue.
              </p>

              <form onSubmit={handleAddDare} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Titre du gage</label>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="Ex: Petit-déjeuner au lit sans condition"
                    className="w-full p-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Description / Règles</label>
                  <textarea
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    placeholder="Ex: Avec jus pressé maison et bisou du matin !"
                    className="w-full p-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Catégorie</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400"
                  >
                    <option value="Douceur">Douceur</option>
                    <option value="Compliments">Compliments</option>
                    <option value="Piquant">Piquant</option>
                    <option value="Rires">Rires</option>
                    <option value="Petits Soins">Petits Soins</option>
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
                    Ajouter le gage
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
