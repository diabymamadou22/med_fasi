import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Volume2,
  Sparkles,
  Send,
  Check,
  Plus,
  Shuffle,
  Heart,
  RotateCw,
  Lightbulb,
  Headphones,
  Eye,
  EyeOff,
} from 'lucide-react';
import { EnglishLessonModule, EnglishLessonItem, CoupleProfile, PartnerId, EnglishLexiconItem } from '../../../types';
import { soundEffects } from '../../../lib/audio';
import { triggerCelebrationConfetti, triggerHeartConfetti } from '../../../lib/confetti';
import { speakEnglish } from '../../../lib/englishSpeech';
import { ENGLISH_MODULES } from '../../../data/englishCourseData';

interface FlirtCardsGameProps {
  profile: CoupleProfile;
  activePartnerId: PartnerId;
  speechRate: number;
  masteredIds: string[];
  onToggleMastered: (itemId: string) => void;
  onSendChatMessage?: (msgData: { senderId: PartnerId; content: string }) => void;
  onSaveToLexicon?: (item: EnglishLessonItem) => void;
  onAddXp: (amount: number) => void;
}

export const FlirtCardsGame: React.FC<FlirtCardsGameProps> = ({
  profile,
  activePartnerId,
  speechRate,
  masteredIds,
  onToggleMastered,
  onSendChatMessage,
  onSaveToLexicon,
  onAddXp,
}) => {
  const [selectedModuleId, setSelectedModuleId] = useState<string>(ENGLISH_MODULES[1]?.id || ENGLISH_MODULES[0].id);
  const [activeCardIndex, setActiveCardIndex] = useState(0);
  const [isRevealed, setIsRevealed] = useState(false);
  const [gameMode, setGameMode] = useState<'deck' | 'grid'>('deck');

  const currentModule = ENGLISH_MODULES.find((m) => m.id === selectedModuleId) || ENGLISH_MODULES[0];
  const currentCard = currentModule.items[activeCardIndex] || currentModule.items[0];

  const handlePlayAudio = (text: string) => {
    soundEffects.playSoftTap();
    speakEnglish(text, { rate: speechRate });
  };

  const handleNextCard = () => {
    setIsRevealed(false);
    setActiveCardIndex((i) => (i + 1) % currentModule.items.length);
    soundEffects.playSoftTap();
  };

  const handlePrevCard = () => {
    setIsRevealed(false);
    setActiveCardIndex((i) => (i - 1 + currentModule.items.length) % currentModule.items.length);
    soundEffects.playSoftTap();
  };

  const handleRandomDraw = () => {
    setIsRevealed(false);
    const randIdx = Math.floor(Math.random() * currentModule.items.length);
    setActiveCardIndex(randIdx);
    soundEffects.playHeartPulse();
  };

  const handleSendToChat = (item: EnglishLessonItem) => {
    if (onSendChatMessage) {
      onSendChatMessage({
        senderId: activePartnerId,
        content: `💌 *Mot doux en anglais* :\n\n🇬🇧 "${item.english}"\n🇫🇷 ${item.french}\n\n💋 Prononciation : ${item.phonetic}\n(Pioché dans nos cartes complices ! ❤️)`,
      });
      soundEffects.playMessageSent();
      triggerHeartConfetti();
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Category / Mood Selector (Romantic Vibes) - Responsive Horizontal Scrolling with NO scrollbars */}
      <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 no-scrollbar scrollbar-none touch-pan-x">
        {ENGLISH_MODULES.map((mod) => {
          const isSelected = selectedModuleId === mod.id;
          const masteredCount = mod.items.filter((it) => masteredIds.includes(it.id)).length;
          return (
            <button
              key={mod.id}
              type="button"
              onClick={() => {
                setSelectedModuleId(mod.id);
                setActiveCardIndex(0);
                setIsRevealed(false);
                soundEffects.playSoftTap();
              }}
              className={`px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl border text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 sm:gap-2 cursor-pointer shrink-0 min-h-[42px] touch-manipulation ${
                isSelected
                  ? 'bg-rose-500 text-white border-rose-600 shadow-sm scale-102'
                  : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
              }`}
            >
              <span className="text-sm sm:text-base">{mod.icon}</span>
              <span>{mod.title}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                  isSelected ? 'bg-white/30 text-white' : 'bg-stone-100 text-stone-500'
                }`}
              >
                {masteredCount}/{mod.items.length}
              </span>
            </button>
          );
        })}
      </div>

      {/* Mode Switcher: Deck vs Grid - Responsive Layout */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 sm:gap-3 bg-white p-3 sm:p-4 rounded-2xl border border-stone-200 shadow-2xs">
        <div className="space-y-0.5">
          <h3 className="text-xs sm:text-sm font-bold text-stone-900 font-serif-romantic flex items-center gap-1.5">
            <span>{currentModule.icon}</span>
            <span>{currentModule.title}</span>
          </h3>
          <p className="text-[11px] sm:text-xs text-stone-500">{currentModule.description}</p>
        </div>

        <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl shrink-0 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setGameMode('deck')}
            className={`flex-1 sm:flex-initial px-3 py-1.5 sm:py-2 rounded-lg text-xs font-bold transition-all cursor-pointer text-center min-h-[38px] touch-manipulation ${
              gameMode === 'deck' ? 'bg-white text-rose-600 shadow-2xs' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            🃏 Jeu de Pioche
          </button>
          <button
            type="button"
            onClick={() => setGameMode('grid')}
            className={`flex-1 sm:flex-initial px-3 py-1.5 sm:py-2 rounded-lg text-xs font-bold transition-all cursor-pointer text-center min-h-[38px] touch-manipulation ${
              gameMode === 'grid' ? 'bg-white text-rose-600 shadow-2xs' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            📋 Grille Complète
          </button>
        </div>
      </div>

      {/* Sub-view 1: Interactive Mystery Card Deck Mode */}
      {gameMode === 'deck' && currentCard && (
        <div className="max-w-xl mx-auto space-y-3 sm:space-y-4">
          <div className="flex items-center justify-between text-[11px] sm:text-xs text-stone-500 font-medium px-1 sm:px-2">
            <span>
              Carte {activeCardIndex + 1} sur {currentModule.items.length}
            </span>
            <span className="flex items-center gap-1 text-rose-600 font-semibold">
              <Sparkles className="w-3.5 h-3.5 shrink-0" />
              <span>{isRevealed ? '🇫🇷 Traduction visible' : '🇫🇷 Toucher pour révéler'}</span>
            </span>
          </div>

          {/* Interactive 3D/Flip-style Card */}
          <motion.div
            key={`deck-card-${currentCard.id}-${isRevealed}`}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
            onClick={() => {
              setIsRevealed(!isRevealed);
              soundEffects.playSoftTap();
            }}
            className="min-h-60 sm:min-h-72 p-4 sm:p-7 rounded-2xl sm:rounded-3xl bg-gradient-to-tr from-white via-rose-50/60 to-amber-50/50 border-2 border-rose-200 shadow-md flex flex-col justify-between items-center text-center cursor-pointer hover:border-rose-400 active:scale-[0.99] transition-all relative overflow-hidden touch-manipulation"
          >
            {/* Top Badge */}
            <div className="flex items-center justify-between w-full">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white border border-rose-200 text-rose-700">
                {currentCard.category}
              </span>

              <span className="text-[11px] sm:text-xs font-semibold text-stone-500 flex items-center gap-1">
                {isRevealed ? (
                  <span className="text-emerald-700 flex items-center gap-1 font-bold">
                    <Eye className="w-3.5 h-3.5 shrink-0" /> 🇫🇷 Traduction révélée
                  </span>
                ) : (
                  <span className="text-stone-400 flex items-center gap-1 font-medium">
                    <EyeOff className="w-3.5 h-3.5 shrink-0" /> 🇫🇷 Toucher pour révéler
                  </span>
                )}
              </span>
            </div>

            {/* Core Card Content */}
            <div className="my-auto space-y-2.5 sm:space-y-4 py-2 sm:py-4 max-w-md w-full">
              <h3 className="text-xl sm:text-3xl font-bold text-stone-900 font-serif-romantic tracking-tight break-words px-1 leading-snug">
                "{currentCard.english}"
              </h3>

              <p className="text-[11px] sm:text-xs font-mono font-bold text-rose-600 bg-white/95 px-2.5 py-1 rounded-full inline-block border border-rose-100 shadow-2xs break-words max-w-full">
                Prononciation : {currentCard.phonetic}
              </p>

              {/* Revealed French Translation & Secret Romance Tip */}
              <AnimatePresence>
                {isRevealed && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    className="pt-2.5 sm:pt-4 border-t border-rose-200/60 space-y-2"
                  >
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-base sm:text-xl">🇫🇷</span>
                      <p className="text-base sm:text-xl font-extrabold text-rose-700 font-serif-romantic break-words">
                        {currentCard.french}
                      </p>
                    </div>
                    {currentCard.contextOrTip && (
                      <p className="text-[11px] sm:text-xs text-stone-600 bg-white/90 p-2 sm:p-2.5 rounded-xl border border-rose-100 leading-relaxed text-left">
                        💡 <strong>Idée complice :</strong> {currentCard.contextOrTip}
                      </p>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Bottom Controls inside the card - Responsive button wrap */}
            <div className="flex flex-wrap items-center gap-2 w-full justify-center pt-2">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handlePlayAudio(currentCard.english);
                }}
                className="flex-1 sm:flex-initial px-3 sm:px-4 py-2 rounded-xl sm:rounded-2xl bg-rose-500 hover:bg-rose-600 active:bg-rose-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-transform cursor-pointer min-h-[42px] touch-manipulation"
                title="Écouter la prononciation audio"
              >
                <Volume2 className="w-4 h-4 shrink-0" />
                <span>Écouter (0.85x)</span>
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSendToChat(currentCard);
                }}
                className="flex-1 sm:flex-initial px-3 sm:px-4 py-2 rounded-xl sm:rounded-2xl bg-white hover:bg-rose-50 border border-stone-200 text-rose-600 font-bold text-xs flex items-center justify-center gap-1.5 shadow-2xs transition-colors cursor-pointer min-h-[42px] touch-manipulation"
                title="Envoyer ce mot doux dans votre chat"
              >
                <Send className="w-3.5 h-3.5 shrink-0" />
                <span>Envoyer au Chat</span>
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleMastered(currentCard.id);
                }}
                className={`p-2 rounded-xl sm:rounded-2xl text-xs font-bold transition-all cursor-pointer min-h-[42px] min-w-[42px] flex items-center justify-center touch-manipulation ${
                  masteredIds.includes(currentCard.id)
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'bg-white border border-stone-200 text-stone-600 hover:border-emerald-300'
                }`}
                title="Marquer comme mot maîtrisé par notre duo"
              >
                <Check className="w-4 h-4 shrink-0" />
              </button>
            </div>
          </motion.div>

          {/* Deck Navigation Buttons - 3 responsive touch buttons */}
          <div className="grid grid-cols-3 gap-1.5 sm:gap-3 pt-1">
            <button
              type="button"
              onClick={handlePrevCard}
              className="px-2 sm:px-4 py-2.5 rounded-xl border border-stone-200 text-xs font-bold text-stone-700 bg-white hover:bg-stone-50 active:bg-stone-100 cursor-pointer min-h-[44px] flex items-center justify-center text-center touch-manipulation"
            >
              ← Précédente
            </button>

            <button
              type="button"
              onClick={handleRandomDraw}
              className="px-2 sm:px-4 py-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 active:bg-amber-200 border border-amber-200 text-amber-900 text-xs font-bold flex items-center justify-center gap-1 sm:gap-1.5 cursor-pointer min-h-[44px] text-center touch-manipulation"
            >
              <Shuffle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span className="truncate">Hasard</span>
            </button>

            <button
              type="button"
              onClick={handleNextCard}
              className="px-2 sm:px-4 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 active:bg-rose-700 text-white text-xs font-bold cursor-pointer min-h-[44px] flex items-center justify-center text-center touch-manipulation"
            >
              Suivante →
            </button>
          </div>
        </div>
      )}

      {/* Sub-view 2: Interactive Grid Mode */}
      {gameMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
          {currentModule.items.map((item, idx) => {
            const isMastered = masteredIds.includes(item.id);
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.03 }}
                className={`p-4 sm:p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                  isMastered
                    ? 'bg-emerald-50/40 border-emerald-200/90 shadow-2xs'
                    : 'bg-white border-stone-200 hover:border-rose-300 hover:shadow-xs'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-stone-100 text-stone-600">
                      {item.category}
                    </span>

                    <button
                      type="button"
                      onClick={() => onToggleMastered(item.id)}
                      className={`text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 transition-all cursor-pointer min-h-[28px] touch-manipulation ${
                        isMastered
                          ? 'bg-emerald-600 text-white shadow-2xs'
                          : 'bg-stone-50 border border-stone-200 text-stone-600 hover:border-emerald-300'
                      }`}
                    >
                      <Check className="w-3 h-3" />
                      <span>{isMastered ? 'Acquis ✓' : 'À découvrir'}</span>
                    </button>
                  </div>

                  <div className="flex items-start justify-between gap-2 pt-0.5">
                    <div className="space-y-0.5">
                      <p className="text-base sm:text-lg font-bold text-stone-900 leading-snug break-words">
                        "{item.english}"
                      </p>
                      <p className="text-xs font-mono font-medium text-rose-600 break-words">
                        {item.phonetic}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handlePlayAudio(item.english)}
                      className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 transition-colors shrink-0 cursor-pointer shadow-2xs min-w-[36px] min-h-[36px] flex items-center justify-center touch-manipulation"
                      title="Écouter la prononciation"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-start gap-1.5 pt-1 border-t border-stone-100">
                    <span className="text-xs shrink-0">🇫🇷</span>
                    <p className="text-xs sm:text-sm font-semibold text-stone-800 break-words">
                      {item.french}
                    </p>
                  </div>

                  {item.contextOrTip && (
                    <div className="p-2 rounded-xl bg-amber-50/70 border border-amber-100 flex items-start gap-1.5 text-xs text-amber-900">
                      <Lightbulb className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                      <p className="text-[11px] leading-relaxed font-medium">{item.contextOrTip}</p>
                    </div>
                  )}
                </div>

                <div className="mt-3.5 pt-2.5 border-t border-stone-100 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => handlePlayAudio(item.english)}
                    className="text-xs font-semibold text-stone-600 hover:text-rose-600 flex items-center gap-1 cursor-pointer min-h-[36px] touch-manipulation"
                  >
                    <Headphones className="w-3.5 h-3.5" />
                    <span>Répéter</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSendToChat(item)}
                    className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer min-h-[36px] touch-manipulation"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Dans le Chat</span>
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};
