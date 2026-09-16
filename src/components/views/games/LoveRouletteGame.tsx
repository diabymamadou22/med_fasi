import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Shuffle,
  Volume2,
  Sparkles,
  Send,
  CheckCircle2,
  Heart,
  Flame,
  Award,
  Lightbulb,
  PartyPopper,
} from 'lucide-react';
import { CoupleProfile, PartnerId, EnglishLessonItem } from '../../../types';
import { soundEffects } from '../../../lib/audio';
import { triggerCelebrationConfetti, triggerHeartConfetti } from '../../../lib/confetti';
import { speakEnglish } from '../../../lib/englishSpeech';
import { ENGLISH_MODULES } from '../../../data/englishCourseData';

interface LoveRouletteGameProps {
  profile: CoupleProfile;
  activePartnerId: PartnerId;
  speechRate: number;
  onSendChatMessage?: (msgData: { senderId: PartnerId; content: string }) => void;
  onAddXp: (amount: number) => void;
  onSaveToLexicon?: (item: EnglishLessonItem) => void;
}

interface DareItem {
  id: string;
  category: 'chuchote' | 'accent' | 'chat' | 'devinette' | 'flirt';
  badge: string;
  badgeColor: string;
  icon: string;
  dareTitle: string;
  dareInstruction: string;
  englishPhrase: string;
  frenchPhrase: string;
  phonetic: string;
  bonusXp: number;
  tip: string;
}

// Curated playful dares combining English phrases with intimate romantic challenges
const DARE_POOL: DareItem[] = [
  {
    id: 'dare-1',
    category: 'chuchote',
    badge: 'Chuchote à l\'Oreille 💋',
    badgeColor: 'bg-rose-100 text-rose-800 border-rose-200',
    icon: '💋',
    dareTitle: 'Le Murmure Secret',
    dareInstruction: 'Approche-toi tout doucement de l\'oreille de ton amour et chuchote cette phrase en anglais :',
    englishPhrase: 'You look breathtaking tonight.',
    frenchPhrase: 'Tu es à couper le souffle ce soir.',
    phonetic: '[ Iou louk breisse-teï-king tou-naït ]',
    bonusXp: 20,
    tip: 'Mets-y toute la douceur de ta voix pour faire frissonner ton partenaire.',
  },
  {
    id: 'dare-2',
    category: 'accent',
    badge: 'Gage Accent British 🎭',
    badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
    icon: '🎭',
    dareTitle: 'La Demande Royale',
    dareInstruction: 'Prends un accent britannique aristocratique très exagéré et demande un baiser :',
    englishPhrase: 'May I have a sweet kiss, darling?',
    frenchPhrase: 'Puis-je avoir un doux baiser, très cher / très chère ?',
    phonetic: '[ Meï aïe hav euh souit kiss, dar-ling ? ]',
    bonusXp: 25,
    tip: 'Un petit regard dramatique et un baisemain avant de craquer pour de vrai !',
  },
  {
    id: 'dare-3',
    category: 'chat',
    badge: 'Mission Chat Surprise 💌',
    badgeColor: 'bg-purple-100 text-purple-800 border-purple-200',
    icon: '💌',
    dareTitle: 'Le Message Voleur de Sourire',
    dareInstruction: 'Envoie immédiatement cette phrase dans votre chat sans donner d\'explication préalable :',
    englishPhrase: 'Thinking of you and smiling like an idiot.',
    frenchPhrase: 'Je pense à toi et je souris bêtement.',
    phonetic: '[ Sinking ov iou and smaï-ling laïk an i-diote ]',
    bonusXp: 15,
    tip: 'Ton partenaire va fondre en découvrant la notification !',
  },
  {
    id: 'dare-4',
    category: 'devinette',
    badge: 'Devinette Complice ❓',
    badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    icon: '❓',
    dareTitle: 'Fais-lui deviner !',
    dareInstruction: 'Prononce cette phrase en anglais et demande à ton partenaire de deviner sa traduction en français 🇫🇷 sans regarder :',
    englishPhrase: 'You make my heart beat faster.',
    frenchPhrase: 'Tu fais battre mon cœur plus vite.',
    phonetic: '[ Iou meïk maï hart bite fass-teur ]',
    bonusXp: 30,
    tip: 'S\'il ou elle devine, offre un bisou sur la joue. Sinon, un câlin obligatoire !',
  },
  {
    id: 'dare-5',
    category: 'flirt',
    badge: 'Regard Charmeur ✨',
    badgeColor: 'bg-pink-100 text-pink-800 border-pink-200',
    icon: '✨',
    dareTitle: 'Les Yeux dans les Yeux',
    dareInstruction: 'Fixe ton partenaire dans les yeux pendant 5 secondes sans rire, puis dis :',
    englishPhrase: 'I am totally crazy about you.',
    frenchPhrase: 'Je suis totalement fou / folle de toi.',
    phonetic: '[ Aïe am to-teu-li creï-zi euh-ba-out iou ]',
    bonusXp: 25,
    tip: 'Celui qui rit en premier offre un massage des épaules ce soir !',
  },
  {
    id: 'dare-6',
    category: 'chuchote',
    badge: 'Câlin Imprévu 🤗',
    badgeColor: 'bg-rose-100 text-rose-800 border-rose-200',
    icon: '🤗',
    dareTitle: 'Le Câlin Magique',
    dareInstruction: 'Enlace tendrement ton amour et glisse cette phrase au creux de son cou :',
    englishPhrase: 'You feel like home to me.',
    frenchPhrase: 'Avec toi, je me sens à la maison.',
    phonetic: '[ Iou fil laïk home tou mi ]',
    bonusXp: 20,
    tip: 'Reste blotti(e) contre lui/elle pendant au moins 10 secondes.',
  },
  {
    id: 'dare-7',
    category: 'accent',
    badge: 'Serveur Chic de New York 🍷',
    badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
    icon: '🍷',
    dareTitle: 'Le Service aux Petits Soins',
    dareInstruction: 'Joue le rôle d\'un sommelier ou serveur de palace et propose à ton amour :',
    englishPhrase: 'Can I bring you something delicious, my love?',
    frenchPhrase: 'Puis-je vous apporter quelque chose de délicieux, mon amour ?',
    phonetic: '[ Canne aïe bring iou seum-sing di-li-cheuss, maï lov ? ]',
    bonusXp: 20,
    tip: 'Et va lui chercher un verre d\'eau, un thé ou une gourmandise !',
  },
  {
    id: 'dare-8',
    category: 'chat',
    badge: 'Petit Déjeuner Romantique ☕',
    badgeColor: 'bg-purple-100 text-purple-800 border-purple-200',
    icon: '☕',
    dareTitle: 'La Promesse du Matin',
    dareInstruction: 'Envoie ce gage dans votre chat intime :',
    englishPhrase: 'Breakfast in bed for you tomorrow morning, deal?',
    frenchPhrase: 'Petit-déjeuner au lit pour toi demain matin, marché conclu ?',
    phonetic: '[ Brèk-feust in bède for iou tou-mo-ro mor-ning, dil ? ]',
    bonusXp: 30,
    tip: 'Promesse d\'amour sacrée à honorer au réveil !',
  },
];

export const LoveRouletteGame: React.FC<LoveRouletteGameProps> = ({
  profile,
  activePartnerId,
  speechRate,
  onSendChatMessage,
  onAddXp,
  onSaveToLexicon,
}) => {
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotationAngle, setRotationAngle] = useState(0);
  const [currentDare, setCurrentDare] = useState<DareItem>(DARE_POOL[0]);
  const [isDareCompleted, setIsDareCompleted] = useState(false);
  const [hasPlayedAudio, setHasPlayedAudio] = useState(false);
  const [spinCount, setSpinCount] = useState(0);

  const activePartner = activePartnerId === 'p1' ? profile.partner1 : profile.partner2;
  const otherPartner = activePartnerId === 'p1' ? profile.partner2 : profile.partner1;

  const handleSpin = () => {
    if (isSpinning) return;
    setIsSpinning(true);
    setIsDareCompleted(false);
    setHasPlayedAudio(false);
    soundEffects.playHeartPulse();

    // Calculate exciting multi-turn spin
    const spinTurns = 4 + Math.floor(Math.random() * 3);
    const randomOffset = Math.floor(Math.random() * 360);
    const targetAngle = rotationAngle + spinTurns * 360 + randomOffset;
    setRotationAngle(targetAngle);

    setTimeout(() => {
      // Pick a random dare different from the current one
      const available = DARE_POOL.filter((d) => d.id !== currentDare.id);
      const chosen = available[Math.floor(Math.random() * available.length)] || DARE_POOL[0];
      setCurrentDare(chosen);
      setIsSpinning(false);
      setSpinCount((c) => c + 1);
      soundEffects.playSuccessSparkle();
      triggerCelebrationConfetti();
    }, 2200);
  };

  const handlePlayAudio = (phrase: string) => {
    setHasPlayedAudio(true);
    soundEffects.playSoftTap();
    speakEnglish(phrase, { rate: speechRate });
  };

  const handleCompleteDare = () => {
    if (isDareCompleted) return;
    setIsDareCompleted(true);
    onAddXp(currentDare.bonusXp);
    soundEffects.playSuccessSparkle();
    triggerHeartConfetti();
  };

  const handleSendDareToChat = () => {
    if (onSendChatMessage) {
      onSendChatMessage({
        senderId: activePartnerId,
        content: `🎡 *Gage de la Roue d'Amour* pour ${otherPartner.name} !\n\n🇬🇧 "${currentDare.englishPhrase}"\n🇫🇷 ${currentDare.frenchPhrase}\n\n💋 Prononciation : ${currentDare.phonetic}\n💡 *Mission :* ${currentDare.dareInstruction}`,
      });
      soundEffects.playMessageSent();
      triggerHeartConfetti();
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Intro Banner */}
      <div className="bg-gradient-to-br from-rose-500 via-pink-500 to-amber-500 rounded-2xl sm:rounded-3xl p-4 sm:p-7 text-white shadow-md relative overflow-hidden">
        <div className="absolute -right-4 -bottom-4 text-7xl sm:text-8xl opacity-15 select-none pointer-events-none">
          🎡
        </div>
        <div className="relative z-10 max-w-2xl space-y-1.5 sm:space-y-2">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-sm text-[11px] sm:text-xs font-bold tracking-wide">
            <Sparkles className="w-3.5 h-3.5 text-amber-200" />
            <span>JEU EN DIRECT POUR DEUX</span>
          </div>
          <h2 className="text-xl sm:text-3xl font-extrabold font-serif-romantic tracking-tight">
            La Roue des Mots Doux & Gages d'Amour
          </h2>
          <p className="text-xs sm:text-sm text-rose-100 leading-relaxed">
            Tournez la roue ensemble ! À chaque tour, un mot tendre à murmurer, un gage complice à relever pour gagner des cœurs !
          </p>
        </div>
      </div>

      {/* Main Wheel & Dare Card Container */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 items-center">
        {/* Left Col: Interactive Roulette Wheel */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center p-3 sm:p-6 bg-white rounded-2xl sm:rounded-3xl border border-stone-200 shadow-xs w-full overflow-hidden">
          <div className="relative w-48 h-48 xs:w-56 xs:h-56 sm:w-68 sm:h-68 max-w-full aspect-square flex items-center justify-center">
            {/* Pointer Pin at Top */}
            <div className="absolute -top-2.5 sm:-top-3 z-30 flex flex-col items-center">
              <div className="w-5 h-5 sm:w-6 sm:h-6 bg-rose-600 rotate-45 rounded-sm shadow-md border-2 border-white" />
            </div>

            {/* Rotating Disc */}
            <motion.div
              animate={{ rotate: rotationAngle }}
              transition={{
                duration: isSpinning ? 2.2 : 0.4,
                ease: [0.15, 0.9, 0.2, 1],
              }}
              className="w-full h-full rounded-full border-6 sm:border-8 border-rose-100 bg-gradient-to-tr from-rose-400 via-pink-500 to-amber-400 shadow-xl relative overflow-hidden flex items-center justify-center select-none"
            >
              {/* Decorative radial slices */}
              <div className="absolute inset-0 grid grid-cols-2 grid-rows-2">
                <div className="border-r-2 border-b-2 border-white/30 flex flex-col items-center justify-center text-white/90 p-1 sm:p-2">
                  <span className="text-xl sm:text-2xl">💋</span>
                  <span className="text-[9px] sm:text-[10px] font-bold mt-0.5">Chuchote</span>
                </div>
                <div className="border-b-2 border-white/30 flex flex-col items-center justify-center text-white/90 p-1 sm:p-2">
                  <span className="text-xl sm:text-2xl">🎭</span>
                  <span className="text-[9px] sm:text-[10px] font-bold mt-0.5">Gage British</span>
                </div>
                <div className="border-r-2 border-white/30 flex flex-col items-center justify-center text-white/90 p-1 sm:p-2">
                  <span className="text-xl sm:text-2xl">💌</span>
                  <span className="text-[9px] sm:text-[10px] font-bold mt-0.5">Mission Chat</span>
                </div>
                <div className="flex flex-col items-center justify-center text-white/90 p-1 sm:p-2">
                  <span className="text-xl sm:text-2xl">✨</span>
                  <span className="text-[9px] sm:text-[10px] font-bold mt-0.5">Flirt & Yeux</span>
                </div>
              </div>
            </motion.div>

            {/* Center Spin Trigger Button */}
            <button
              type="button"
              onClick={handleSpin}
              disabled={isSpinning}
              className={`absolute z-20 w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white text-rose-600 font-extrabold text-[11px] sm:text-xs shadow-xl flex flex-col items-center justify-center ring-3 sm:ring-4 ring-rose-300 hover:scale-105 active:scale-95 transition-transform cursor-pointer touch-manipulation ${
                isSpinning ? 'opacity-80 scale-95' : 'animate-pulse'
              }`}
            >
              <Shuffle className={`w-4 h-4 sm:w-5 sm:h-5 text-rose-500 mb-0.5 ${isSpinning ? 'animate-spin' : ''}`} />
              <span>{isSpinning ? '...' : 'TOURNER'}</span>
            </button>
          </div>

          <p className="text-[11px] sm:text-xs text-stone-500 font-medium mt-3 sm:mt-4 text-center">
            {spinCount === 0
              ? 'Appuyez sur "TOURNER" pour tirer un gage à deux !'
              : `Roue tournée ${spinCount} fois • Prêts pour un nouveau tour ?`}
          </p>
        </div>

        {/* Right Col: Active Romantic Dare Card */}
        <div className="lg:col-span-7">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentDare.id}
              initial={{ opacity: 0, scale: 0.96, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: -10 }}
              className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-7 border-2 border-rose-200 shadow-md space-y-4 sm:space-y-5 relative overflow-hidden"
            >
              {/* Category & Points Reward */}
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className={`px-2.5 py-1 rounded-full text-[11px] sm:text-xs font-bold border ${currentDare.badgeColor} flex items-center gap-1.5`}>
                  <span>{currentDare.icon}</span>
                  <span>{currentDare.badge}</span>
                </span>

                <span className="px-2.5 py-1 rounded-full text-[11px] sm:text-xs font-extrabold bg-amber-50 text-amber-900 border border-amber-200 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span>+{currentDare.bonusXp} Points Duo</span>
                </span>
              </div>

              {/* Dare Prompt Header */}
              <div className="space-y-1">
                <h3 className="text-lg sm:text-2xl font-bold text-stone-900 font-serif-romantic leading-snug">
                  {currentDare.dareTitle}
                </h3>
                <p className="text-xs sm:text-sm text-stone-600 leading-relaxed font-medium">
                  {currentDare.dareInstruction}
                </p>
              </div>

              {/* English Phrase Box */}
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-tr from-rose-50 via-pink-50/60 to-amber-50/40 border border-rose-200/80 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1 flex-1 min-w-0">
                    <p className="text-base sm:text-2xl font-extrabold text-stone-900 tracking-tight break-words">
                      "{currentDare.englishPhrase}"
                    </p>
                    <p className="text-[11px] sm:text-xs font-mono font-bold text-rose-600 bg-white/90 px-2.5 py-0.5 rounded-lg inline-block border border-rose-100 break-words">
                      Prononciation : {currentDare.phonetic}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handlePlayAudio(currentDare.englishPhrase)}
                    className="p-3 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white shadow-sm hover:scale-105 active:scale-95 transition-all shrink-0 cursor-pointer flex items-center justify-center min-w-[44px] min-h-[44px]"
                    title="Écouter la prononciation douce en anglais"
                  >
                    <Volume2 className="w-5 h-5" />
                  </button>
                </div>

                <div className="pt-2 border-t border-rose-200/50">
                  <p className="text-xs sm:text-sm font-semibold text-stone-800">
                    🇫🇷 {currentDare.frenchPhrase}
                  </p>
                </div>
              </div>

              {/* Romantic Secret Tip */}
              <div className="p-3 rounded-xl sm:rounded-2xl bg-amber-50/80 border border-amber-200 flex items-start gap-2 text-xs text-amber-900">
                <Lightbulb className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-xs leading-relaxed font-medium">
                  <strong>Idée complice : </strong> {currentDare.tip}
                </p>
              </div>

              {/* Action Buttons - Stacked on Mobile with 44px min-height for touch */}
              <div className="pt-1 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-3">
                <button
                  type="button"
                  onClick={handleSendDareToChat}
                  className="px-4 py-2.5 rounded-xl sm:rounded-2xl bg-white hover:bg-rose-50 border border-rose-200 text-rose-600 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-2xs hover:border-rose-300 transition-colors cursor-pointer min-h-[44px] w-full sm:w-auto"
                  title="Envoyer ce défi dans votre Chat"
                >
                  <Send className="w-4 h-4 shrink-0" />
                  <span>Envoyer dans notre Chat 💌</span>
                </button>

                <button
                  type="button"
                  onClick={handleCompleteDare}
                  className={`px-5 py-2.5 rounded-xl sm:rounded-2xl font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm min-h-[44px] w-full sm:w-auto ${
                    isDareCompleted
                      ? 'bg-emerald-600 text-white shadow-emerald-200'
                      : 'bg-stone-900 hover:bg-stone-800 text-white active:scale-95'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4 text-white shrink-0" />
                  <span>{isDareCompleted ? 'Gage Réussi ! +25 Cœurs 💕' : 'J\'ai relevé le gage ! 🎉'}</span>
                </button>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
