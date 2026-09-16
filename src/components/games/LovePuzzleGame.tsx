import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  Heart,
  RotateCcw,
  Eye,
  EyeOff,
  Upload,
  Trophy,
  CheckCircle2,
  Mail,
  Lock,
} from 'lucide-react';
import { CoupleProfile, PartnerId } from '../../types';
import { soundEffects } from '../../lib/audio';
import { triggerCelebrationConfetti, triggerHeartConfetti } from '../../lib/confetti';

const DEFAULT_PUZZLE_IMAGES = [
  {
    id: 'sunset',
    name: 'Coucher de soleil romantique',
    url: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?auto=format&fit=crop&w=800&q=80',
    defaultNote: 'Chaque coucher de soleil avec toi est un rappel de la chance infinie que j’ai de t’avoir dans ma vie. Je t’aime ❤️',
  },
  {
    id: 'hands',
    name: 'Mains enlacées',
    url: 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&w=800&q=80',
    defaultNote: 'Tant que ma main est dans la tienne, je sais que nous pouvons tout traverser. Tu es mon repère.',
  },
  {
    id: 'roses',
    name: 'Bouquet de tendresse',
    url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80',
    defaultNote: 'Un bouquet de pensées douces pour la personne qui illumine chacune de mes journées !',
  },
];

interface LovePuzzleGameProps {
  profile: CoupleProfile;
  activePartnerId: PartnerId;
}

export const LovePuzzleGame: React.FC<LovePuzzleGameProps> = ({
  profile,
  activePartnerId,
}) => {
  const [selectedImage, setSelectedImage] = useState(DEFAULT_PUZZLE_IMAGES[0].url);
  const [secretNote, setSecretNote] = useState(DEFAULT_PUZZLE_IMAGES[0].defaultNote);
  const [gridSize, setGridSize] = useState<3 | 4>(3);
  const [tiles, setTiles] = useState<number[]>([]);
  const [emptyIndex, setEmptyIndex] = useState<number>(8);
  const [moves, setMoves] = useState(0);
  const [isSolved, setIsSolved] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showLoveLetter, setShowLoveLetter] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [customNoteInput, setCustomNoteInput] = useState('');
  const [showCustomModal, setShowCustomModal] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Initialize and shuffle puzzle
  const initPuzzle = (size: 3 | 4 = gridSize) => {
    const total = size * size;
    const solved = Array.from({ length: total }, (_, i) => i);
    
    // Shuffle ensuring solvable
    let shuffled = [...solved];
    let empty = total - 1;

    // Simulate random legal moves to guarantee solvability
    for (let step = 0; step < 80; step++) {
      const neighbors: number[] = [];
      const row = Math.floor(empty / size);
      const col = empty % size;

      if (row > 0) neighbors.push(empty - size);
      if (row < size - 1) neighbors.push(empty + size);
      if (col > 0) neighbors.push(empty - 1);
      if (col < size - 1) neighbors.push(empty + 1);

      const randomNeighbor = neighbors[Math.floor(Math.random() * neighbors.length)];
      shuffled[empty] = shuffled[randomNeighbor];
      shuffled[randomNeighbor] = total - 1;
      empty = randomNeighbor;
    }

    setTiles(shuffled);
    setEmptyIndex(empty);
    setMoves(0);
    setIsSolved(false);
    setShowLoveLetter(false);
    setTimerSeconds(0);
    setIsTimerRunning(true);
  };

  useEffect(() => {
    initPuzzle(gridSize);
  }, [selectedImage, gridSize]);

  // Timer interval
  useEffect(() => {
    let interval: any = null;
    if (isTimerRunning && !isSolved) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, isSolved]);

  // Tile click handler
  const handleTileClick = (index: number) => {
    if (isSolved) return;

    const row = Math.floor(index / gridSize);
    const col = index % gridSize;
    const emptyRow = Math.floor(emptyIndex / gridSize);
    const emptyCol = emptyIndex % gridSize;

    const isAdjacent =
      (Math.abs(row - emptyRow) === 1 && col === emptyCol) ||
      (Math.abs(col - emptyCol) === 1 && row === emptyRow);

    if (isAdjacent) {
      soundEffects.playSoftTap();
      const newTiles = [...tiles];
      newTiles[emptyIndex] = newTiles[index];
      newTiles[index] = gridSize * gridSize - 1;

      setTiles(newTiles);
      setEmptyIndex(index);
      setMoves((prev) => prev + 1);

      // Check win condition
      const won = newTiles.every((val, idx) => val === idx);
      if (won) {
        setIsSolved(true);
        setIsTimerRunning(false);
        soundEffects.playVictoryChime();
        triggerCelebrationConfetti();
        setTimeout(() => {
          setShowLoveLetter(true);
        }, 800);
      }
    }
  };

  const handleCustomUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setSelectedImage(reader.result);
          soundEffects.playSuccessSparkle();
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-pink-500 via-rose-500 to-amber-500 rounded-3xl p-6 text-white shadow-md relative overflow-hidden">
        <div className="relative z-1 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Casse-tête & Billet Doux Secret</span>
            </div>
            <h2 className="font-serif-romantic text-2xl sm:text-3xl font-bold tracking-tight">
              🧩 Le Puzzle Photo Surprise
            </h2>
            <p className="text-white/90 text-xs sm:text-sm mt-1 max-w-xl">
              Reconstituez la photo souvenir pour déverrouiller le message secret d'amour caché dessous !
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-3.5 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold text-xs backdrop-blur-md flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <Upload className="w-4 h-4" />
              <span>Utiliser notre photo</span>
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleCustomUpload}
              accept="image/*"
              className="hidden"
            />
            <button
              onClick={() => setShowCustomModal(true)}
              className="px-3.5 py-2 rounded-xl bg-white text-rose-700 hover:bg-rose-50 font-bold text-xs shadow-xs flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <Mail className="w-4 h-4" />
              <span>Changer le mot doux</span>
            </button>
          </div>
        </div>
      </div>

      {/* Preset photo selector & Difficulty */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          {DEFAULT_PUZZLE_IMAGES.map((img) => (
            <button
              key={img.id}
              onClick={() => {
                setSelectedImage(img.url);
                setSecretNote(img.defaultNote);
                soundEffects.playSoftTap();
              }}
              className={`flex items-center gap-2 p-1.5 pr-3 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                selectedImage === img.url
                  ? 'border-rose-500 bg-rose-50 text-rose-800 ring-1 ring-rose-500'
                  : 'border-stone-200 hover:bg-stone-50 text-stone-600 bg-white'
              }`}
            >
              <img src={img.url} alt={img.name} className="w-7 h-7 rounded-lg object-cover" />
              <span className="truncate max-w-[120px]">{img.name}</span>
            </button>
          ))}
        </div>

        {/* Stats & Controls */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-white border border-stone-200 rounded-xl p-1 text-xs font-bold">
            <button
              onClick={() => {
                setGridSize(3);
                soundEffects.playSoftTap();
              }}
              className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                gridSize === 3 ? 'bg-rose-500 text-white' : 'text-stone-600 hover:bg-stone-100'
              }`}
            >
              3x3 (Facile)
            </button>
            <button
              onClick={() => {
                setGridSize(4);
                soundEffects.playSoftTap();
              }}
              className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                gridSize === 4 ? 'bg-rose-500 text-white' : 'text-stone-600 hover:bg-stone-100'
              }`}
            >
              4x4 (Expert)
            </button>
          </div>

          <button
            onClick={() => setShowPreview(!showPreview)}
            className="p-2 rounded-xl bg-white border border-stone-200 text-stone-600 hover:text-rose-600 cursor-pointer text-xs font-semibold flex items-center gap-1"
            title="Aperçu du modèle"
          >
            {showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            <span className="hidden sm:inline">Modèle</span>
          </button>

          <button
            onClick={() => initPuzzle(gridSize)}
            className="p-2 rounded-xl bg-white border border-stone-200 text-stone-600 hover:text-rose-600 cursor-pointer text-xs font-semibold flex items-center gap-1"
            title="Mélanger à nouveau"
          >
            <RotateCcw className="w-4 h-4" />
            <span className="hidden sm:inline">Recommencer</span>
          </button>
        </div>
      </div>

      {/* Main Puzzle Board & Status */}
      <div className="flex flex-col items-center justify-center bg-white rounded-3xl p-6 sm:p-8 border border-rose-100 shadow-sm relative">
        {/* Top Info Bar */}
        <div className="flex items-center justify-between w-full max-w-md mb-4 text-xs font-bold text-stone-600">
          <span>Coups : <strong className="text-rose-600">{moves}</strong></span>
          <span>Temps : <strong className="text-stone-900">{formatTime(timerSeconds)}</strong></span>
          <span className="flex items-center gap-1 text-rose-500">
            <Lock className="w-3.5 h-3.5" />
            <span>{isSolved ? 'Message Déverrouillé !' : 'Secret verrouillé'}</span>
          </span>
        </div>

        {/* Puzzle Board Container */}
        <div
          className="relative rounded-2xl overflow-hidden shadow-md border-4 border-rose-200 bg-stone-900 select-none touch-none"
          style={{
            width: 'min(85vw, 360px)',
            height: 'min(85vw, 360px)',
          }}
        >
          {/* Tile Grid */}
          <div
            className="grid w-full h-full"
            style={{
              gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
              gridTemplateRows: `repeat(${gridSize}, 1fr)`,
            }}
          >
            {tiles.map((tileIndex, slotIndex) => {
              const isEmpty = !isSolved && tileIndex === gridSize * gridSize - 1;
              const originalRow = Math.floor(tileIndex / gridSize);
              const originalCol = tileIndex % gridSize;

              if (isEmpty) {
                return (
                  <div
                    key={`empty-${slotIndex}`}
                    className="bg-stone-800/80 flex items-center justify-center border border-stone-700/50"
                  >
                    <Heart className="w-5 h-5 text-stone-600/40" />
                  </div>
                );
              }

              return (
                <div
                  key={slotIndex}
                  onClick={() => handleTileClick(slotIndex)}
                  className={`relative cursor-pointer overflow-hidden border border-white/40 transition-transform active:scale-98 ${
                    isSolved ? 'cursor-default' : 'hover:brightness-105'
                  }`}
                  style={{
                    backgroundImage: `url(${selectedImage})`,
                    backgroundSize: `${gridSize * 100}% ${gridSize * 100}%`,
                    backgroundPosition: `${(originalCol / (gridSize - 1)) * 100}% ${(originalRow / (gridSize - 1)) * 100}%`,
                  }}
                >
                  {!isSolved && (
                    <span className="absolute bottom-1 right-1 text-[9px] font-bold text-white/70 bg-black/40 px-1 rounded-sm backdrop-blur-xs pointer-events-none">
                      {tileIndex + 1}
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Optional Model Preview Overlay */}
          <AnimatePresence>
            {showPreview && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center p-4 z-20"
                onClick={() => setShowPreview(false)}
              >
                <img
                  src={selectedImage}
                  alt="Modèle"
                  className="w-full h-full object-cover rounded-xl shadow-lg border-2 border-white/50"
                />
                <p className="text-white text-[11px] font-bold mt-2 bg-black/60 px-3 py-1 rounded-full">
                  Cliquer pour masquer l'aide
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Won Banner & Open Letter trigger */}
        {isSolved && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 text-center space-y-3"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Puzzle résolu en {moves} coups et {formatTime(timerSeconds)} ! 🎉</span>
            </div>
            <div>
              <button
                onClick={() => setShowLoveLetter(true)}
                className="px-6 py-3 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white font-bold text-sm shadow-md flex items-center gap-2 mx-auto cursor-pointer"
              >
                <Mail className="w-4 h-4" />
                <span>Lire le mot doux secret ❤️</span>
              </button>
            </div>
          </motion.div>
        )}
      </div>

      {/* Secret Love Letter Modal */}
      <AnimatePresence>
        {showLoveLetter && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.85, opacity: 0, rotate: -2 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              exit={{ scale: 0.85, opacity: 0 }}
              className="bg-[#FFFDF9] rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border-2 border-amber-200/80 relative overflow-hidden"
            >
              {/* Decorative Wax Seal Header */}
              <div className="flex justify-center -mt-2 mb-4">
                <div className="w-12 h-12 rounded-full bg-rose-600 text-white flex items-center justify-center shadow-md font-serif text-lg font-bold border-2 border-amber-100">
                  💌
                </div>
              </div>

              <div className="text-center space-y-3">
                <span className="text-[11px] font-bold uppercase tracking-widest text-amber-700">
                  Message Secret Dévoilé
                </span>
                <h3 className="font-serif-romantic text-2xl font-bold text-stone-900">
                  Pour toi, mon amour
                </h3>
                <p className="font-serif-romantic text-base sm:text-lg text-stone-800 leading-relaxed italic bg-amber-50/50 p-4 rounded-2xl border border-amber-100/80">
                  « {secretNote} »
                </p>
                <p className="text-xs text-rose-500 font-bold pt-2">
                  De tout mon cœur, pour toujours ❤️
                </p>
              </div>

              <div className="mt-6 flex justify-center">
                <button
                  onClick={() => setShowLoveLetter(false)}
                  className="px-6 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs shadow-xs cursor-pointer"
                >
                  Garder ce doux souvenir
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Custom Note Modal */}
      <AnimatePresence>
        {showCustomModal && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border border-rose-100"
            >
              <h3 className="font-serif-romantic text-xl font-bold text-stone-900 mb-2">
                Écrire un mot doux secret
              </h3>
              <p className="text-xs text-stone-600 mb-4">
                Ce mot sera caché sous le puzzle et ne sera révélé qu'une fois le puzzle assemblé par votre partenaire !
              </p>

              <textarea
                value={customNoteInput || secretNote}
                onChange={(e) => setCustomNoteInput(e.target.value)}
                placeholder="Écris ton mot d'amour ici..."
                className="w-full p-3 rounded-xl border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400"
                rows={4}
              />

              <div className="flex items-center justify-end gap-2 mt-4">
                <button
                  type="button"
                  onClick={() => setShowCustomModal(false)}
                  className="px-4 py-2 rounded-xl text-stone-600 hover:bg-stone-100 font-bold text-xs"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (customNoteInput.trim()) {
                      setSecretNote(customNoteInput.trim());
                    }
                    setShowCustomModal(false);
                    soundEffects.playSuccessSparkle();
                  }}
                  className="px-5 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs shadow-xs"
                >
                  Verrouiller le secret
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
