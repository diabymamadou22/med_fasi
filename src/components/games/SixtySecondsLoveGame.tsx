import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  Heart,
  Timer,
  Play,
  RotateCcw,
  CheckCircle2,
  Plus,
  Send,
  Trophy,
  Share2,
  Copy,
} from 'lucide-react';
import { CoupleProfile, PartnerId } from '../../types';
import { soundEffects } from '../../lib/audio';
import { triggerCelebrationConfetti, triggerHeartConfetti } from '../../lib/confetti';

const INSPIRATION_CHIPS = [
  'Ton sourire radieux',
  'Tes câlins réconfortants',
  'Ta bienveillance naturelle',
  'Ton rire contagieux',
  'Ton regard profond',
  'Ta cuisine délicieuse',
  'Ta voix douce au réveil',
  'Ton soutien inconditionnel',
  'Ton intelligence vive',
  'Ton sens de l’humour',
  'Ta tendresse infinie',
  'Nos discussions passionnées',
  'Ta façon de me rassurer',
  'Ton parfum envoûtant',
];

interface SixtySecondsLoveGameProps {
  profile: CoupleProfile;
  activePartnerId: PartnerId;
}

export const SixtySecondsLoveGame: React.FC<SixtySecondsLoveGameProps> = ({
  profile,
  activePartnerId,
}) => {
  const [timeLeft, setTimeLeft] = useState(60);
  const [isActive, setIsActive] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [currentInput, setCurrentInput] = useState('');
  const [words, setWords] = useState<string[]>([]);
  const [copiedNotification, setCopiedNotification] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement | null>(null);

  const activePartner = activePartnerId === 'p1' ? profile.partner1 : profile.partner2;
  const targetPartner = activePartnerId === 'p1' ? profile.partner2 : profile.partner1;

  // Countdown timer
  useEffect(() => {
    let interval: any = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 5 && prev > 1) {
            soundEffects.playCountdownTick();
          }
          if (prev <= 1) {
            clearInterval(interval);
            setIsActive(false);
            setIsFinished(true);
            soundEffects.playVictoryChime();
            triggerCelebrationConfetti();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  const handleStart = () => {
    soundEffects.playSoftTap();
    setTimeLeft(60);
    setWords([]);
    setIsFinished(false);
    setIsActive(true);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  const handleAddWord = (text: string) => {
    const clean = text.trim();
    if (!clean) return;
    soundEffects.playSuccessSparkle();
    setWords((prev) => [clean, ...prev]);
    setCurrentInput('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleAddWord(currentInput);
  };

  const handleAddChip = (chip: string) => {
    if (!isActive) return;
    handleAddWord(chip);
  };

  const handleReset = () => {
    soundEffects.playSoftTap();
    setIsActive(false);
    setIsFinished(false);
    setTimeLeft(60);
    setWords([]);
    setCurrentInput('');
  };

  const handleCopySummary = () => {
    if (words.length === 0) return;
    const summary = `⏱️ *60 Secondes pour te faire craquer !*\nDe ${activePartner.name} pour ${targetPartner.name} :\n\n${words.map((w) => `• ${w}`).join('\n')}\n\n💖 Total : ${words.length} mots doux en 60 secondes !`;
    navigator.clipboard.writeText(summary);
    setCopiedNotification('Texte copié ! Envoyez-le dans le chat ou gardez-le précieusement.');
    soundEffects.playSuccessSparkle();
    setTimeout(() => setCopiedNotification(null), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-rose-500 via-pink-500 to-amber-500 rounded-3xl p-6 text-white shadow-md relative overflow-hidden">
        <div className="relative z-1 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold mb-2">
              <Timer className="w-3.5 h-3.5" />
              <span>Chrono Express de Tendresse</span>
            </div>
            <h2 className="font-serif-romantic text-2xl sm:text-3xl font-bold tracking-tight">
              ⏱️ 60 Secondes pour Me Faire Craquer
            </h2>
            <p className="text-white/90 text-xs sm:text-sm mt-1 max-w-xl">
              Vous avez 60 secondes pour taper un maximum de compliments, de souvenirs ou de qualités que vous aimez chez votre partenaire !
            </p>
          </div>

          <div className="bg-white/15 backdrop-blur-md border border-white/25 rounded-2xl p-3.5 flex items-center gap-3.5 shrink-0 self-stretch sm:self-auto">
            <div className="w-12 h-12 rounded-xl bg-white text-rose-600 flex items-center justify-center font-bold text-xl shadow-sm">
              {words.length}
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wider text-white/80 font-semibold">Mots d'Amour</p>
              <p className="text-xs font-bold text-white">
                Pour {targetPartner.name}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Game Interface */}
      <div className="bg-white rounded-3xl border border-rose-100/80 p-6 sm:p-8 shadow-sm space-y-6">
        {/* Timer Display & Controller */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-4 border-b border-stone-100">
          <div className="flex items-center gap-3">
            <div
              className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl border-2 transition-all ${
                timeLeft <= 10 && isActive
                  ? 'bg-red-50 text-red-600 border-red-400 animate-pulse'
                  : 'bg-rose-50 text-rose-600 border-rose-200'
              }`}
            >
              {timeLeft}s
            </div>
            <div>
              <h3 className="font-bold text-stone-900 text-sm sm:text-base">
                {isActive ? 'Le chrono tourne ! Écrivez vite !' : isFinished ? 'Temps écoulé !' : 'Prêt(e) à lancer le défi ?'}
              </h3>
              <p className="text-xs text-stone-500">
                Auteur : <strong>{activePartner.name}</strong> • Destinataire : <strong>{targetPartner.name}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isActive && !isFinished && (
              <button
                onClick={handleStart}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white font-bold text-xs shadow-sm flex items-center gap-2 cursor-pointer"
              >
                <Play className="w-4 h-4" />
                <span>Démarrer le chrono (60s)</span>
              </button>
            )}

            {(isActive || isFinished) && (
              <button
                onClick={handleReset}
                className="px-4 py-2 rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-50 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Recommencer</span>
              </button>
            )}
          </div>
        </div>

        {/* Input field (only active during timer) */}
        {isActive && (
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={currentInput}
              onChange={(e) => setCurrentInput(e.target.value)}
              placeholder="Tape une qualité, un mot doux, un souvenir..."
              className="flex-1 p-3.5 rounded-2xl border-2 border-rose-300 focus:outline-none focus:ring-2 focus:ring-rose-500 text-sm"
              autoFocus
            />
            <button
              type="submit"
              className="px-6 py-3.5 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs shadow-xs flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <Send className="w-4 h-4" />
              <span>Valider</span>
            </button>
          </form>
        )}

        {/* Inspiration quick chips */}
        {isActive && (
          <div>
            <span className="text-[11px] font-bold text-stone-500 block mb-2">
              Suggestions rapides (cliquez pour ajouter instantanément) :
            </span>
            <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto no-scrollbar">
              {INSPIRATION_CHIPS.map((chip, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleAddChip(chip)}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors cursor-pointer"
                >
                  + {chip}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Live words feed */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-stone-700">
              Mots doux récoltés ({words.length}) :
            </span>
            {isFinished && words.length > 0 && (
              <button
                onClick={handleCopySummary}
                className="px-3 py-1.5 rounded-xl bg-pink-50 border border-pink-200 text-pink-700 hover:bg-pink-100 font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copier la liste pour le chat</span>
              </button>
            )}
          </div>

          {words.length > 0 ? (
            <div className="flex flex-wrap gap-2 p-4 bg-gradient-to-tr from-rose-50/40 via-white to-amber-50/40 rounded-2xl border border-rose-100 min-h-[120px]">
              {words.map((w, idx) => (
                <motion.span
                  key={idx}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white text-rose-800 shadow-2xs border border-rose-200 flex items-center gap-1.5"
                >
                  <Heart className="w-3 h-3 text-rose-500 fill-rose-500" />
                  <span>{w}</span>
                </motion.span>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-stone-400 text-xs bg-stone-50 rounded-2xl border border-dashed border-stone-200">
              Lancez le chrono et tapez des mots doux pour faire fondre {targetPartner.name} !
            </div>
          )}
        </div>

        {/* Celebration final card when finished */}
        {isFinished && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-6 rounded-3xl bg-gradient-to-r from-rose-50 to-amber-50 border border-rose-200 text-center space-y-3"
          >
            <div className="w-14 h-14 rounded-full bg-rose-500 text-white mx-auto flex items-center justify-center text-2xl shadow-md">
              🎉
            </div>
            <h4 className="font-serif-romantic text-xl font-bold text-stone-900">
              Défi Réussi avec Brio !
            </h4>
            <p className="text-stone-700 text-sm max-w-md mx-auto">
              <strong>{activePartner.name}</strong> a trouvé <strong>{words.length} mots d'amour</strong> en seulement 60 secondes pour <strong>{targetPartner.name}</strong> !
            </p>
            <div className="pt-2">
              <button
                onClick={handleCopySummary}
                className="px-5 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs shadow-xs inline-flex items-center gap-2 cursor-pointer"
              >
                <Share2 className="w-4 h-4" />
                <span>Partager ce florilège d'amour</span>
              </button>
            </div>
          </motion.div>
        )}

        {copiedNotification && (
          <div className="p-3 bg-stone-900 text-white text-xs font-semibold rounded-xl text-center shadow-lg">
            {copiedNotification}
          </div>
        )}
      </div>
    </div>
  );
};
