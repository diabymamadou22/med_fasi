import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, Sparkles, Smile, X, Check } from 'lucide-react';
import { ROMANTIC_STICKERS, RomanticSticker } from '../../lib/romanticStickers';
import { soundEffects } from '../../lib/audio';

interface RomanticStickerPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSticker: (sticker: RomanticSticker) => void;
  onSelectEmoji?: (emoji: string) => void;
  chatTheme?: string;
  initialMode?: 'stickers' | 'emojis';
}

type MainTab = 'stickers' | 'emojis';
type StickerTab = 'all' | 'coeur' | 'bisou' | 'calin' | 'mignon';

const STICKER_CATEGORIES: { id: StickerTab; label: string; icon: string }[] = [
  { id: 'all', label: 'Tous', icon: '✨' },
  { id: 'coeur', label: 'Cœur', icon: '❤️' },
  { id: 'bisou', label: 'Bisou', icon: '💋' },
  { id: 'calin', label: 'Câlin', icon: '🫂' },
  { id: 'mignon', label: 'Tendresse', icon: '🧸' },
];

const ROMANTIC_EMOJIS = [
  '❤️', '💖', '💕', '💞', '💓', '💗', '💘', '💝', '💟', '💌',
  '🥰', '😍', '😘', '😚', '😙', '😋', '🤗', '🤭', '🤫', '🥺',
  '🌹', '🌸', '💐', '🌺', '🌷', '💍', '✨', '⭐', '🌟', '💫',
  '🔥', '🕊️', '🧸', '🍫', '🍷', '🥂', '🎉', '👑', '💑', '👩‍❤️‍👨'
];

export const RomanticStickerPicker: React.FC<RomanticStickerPickerProps> = ({
  isOpen,
  onClose,
  onSelectSticker,
  onSelectEmoji,
  chatTheme = 'soft-rose',
  initialMode = 'stickers',
}) => {
  const [mainTab, setMainTab] = useState<MainTab>(initialMode);
  const [activeCategory, setActiveCategory] = useState<StickerTab>('all');
  const [previewSticker, setPreviewSticker] = useState<RomanticSticker | null>(null);

  const filteredStickers = ROMANTIC_STICKERS.filter((s) =>
    activeCategory === 'all' ? true : s.category === activeCategory
  );

  const isDark = chatTheme === 'velvet-night';

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
      className={`border-t select-none shadow-xl z-30 transition-colors ${
        isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-rose-100 text-stone-800'
      }`}
      id="romantic-sticker-picker-container"
    >
      {/* Top Header: Switch between Stickers and Emojis + Category filters */}
      <div className="px-3 pt-2.5 pb-2 border-b border-rose-100/60 dark:border-slate-800/80 flex items-center justify-between gap-2">
        {/* Main Tab Pill Toggle */}
        <div className="flex items-center gap-1 bg-stone-100 dark:bg-slate-800 p-0.5 rounded-full shrink-0">
          <button
            type="button"
            onClick={() => {
              soundEffects.playSoftTap();
              setMainTab('stickers');
            }}
            className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
              mainTab === 'stickers'
                ? 'bg-rose-500 text-white shadow-xs'
                : 'text-stone-600 dark:text-slate-400 hover:text-stone-900 dark:hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Stickers</span>
          </button>
          <button
            type="button"
            onClick={() => {
              soundEffects.playSoftTap();
              setMainTab('emojis');
            }}
            className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
              mainTab === 'emojis'
                ? 'bg-rose-500 text-white shadow-xs'
                : 'text-stone-600 dark:text-slate-400 hover:text-stone-900 dark:hover:text-white'
            }`}
          >
            <Smile className="w-3.5 h-3.5" />
            <span>Emojis</span>
          </button>
        </div>

        {/* Sticker Categories when stickers tab is active */}
        {mainTab === 'stickers' && (
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 flex-1 min-w-0">
            {STICKER_CATEGORIES.map((cat) => {
              const isCurrent = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    soundEffects.playSoftTap();
                    setActiveCategory(cat.id);
                  }}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                    isCurrent
                      ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 ring-1 ring-rose-400/50'
                      : isDark
                      ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      : 'bg-stone-50 text-stone-600 hover:bg-stone-100'
                  }`}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>
        )}

        <button
          type="button"
          onClick={() => {
            soundEffects.playSoftTap();
            onClose();
          }}
          className="p-1.5 rounded-full text-stone-400 hover:text-stone-700 dark:hover:text-slate-200 hover:bg-stone-100 dark:hover:bg-slate-800 cursor-pointer shrink-0 transition-colors ml-auto"
          title="Fermer"
          aria-label="Fermer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Main Content Area */}
      {mainTab === 'stickers' ? (
        /* Grid of illustrated stickers */
        <div className="p-3 max-h-56 sm:max-h-64 overflow-y-auto no-scrollbar grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-3">
          {filteredStickers.map((sticker) => (
            <motion.button
              key={sticker.id}
              type="button"
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.94 }}
              onClick={() => {
                soundEffects.playSoftTap();
                onSelectSticker(sticker);
              }}
              onMouseEnter={() => setPreviewSticker(sticker)}
              onMouseLeave={() => setPreviewSticker(null)}
              className={`group flex flex-col items-center justify-center p-2 rounded-2xl transition-all cursor-pointer border ${
                isDark
                  ? 'bg-slate-800/80 hover:bg-slate-700/90 border-slate-700/60 hover:border-rose-400/50 hover:shadow-rose-950/40'
                  : 'bg-stone-50/80 hover:bg-rose-50/90 border-stone-200/60 hover:border-rose-300/80 hover:shadow-sm'
              }`}
              title={sticker.label}
            >
              <div className="w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center drop-shadow-xs group-hover:drop-shadow-md transition-all">
                <img
                  src={sticker.svgDataUri}
                  alt={sticker.name}
                  className="w-full h-full object-contain pointer-events-none"
                  loading="lazy"
                />
              </div>
              <span className="text-[10.5px] font-medium text-stone-600 dark:text-slate-300 truncate w-full text-center mt-1 group-hover:text-rose-600 dark:group-hover:text-rose-400">
                {sticker.name}
              </span>
            </motion.button>
          ))}
        </div>
      ) : (
        /* Grid of romantic emojis */
        <div className="p-4 max-h-56 sm:max-h-64 overflow-y-auto no-scrollbar grid grid-cols-8 sm:grid-cols-10 gap-2">
          {ROMANTIC_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => {
                soundEffects.playSoftTap();
                if (onSelectEmoji) onSelectEmoji(emoji);
              }}
              className="text-2xl sm:text-3xl p-2 rounded-xl hover:bg-rose-50 dark:hover:bg-slate-800 hover:scale-125 transition-transform cursor-pointer flex items-center justify-center"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      {/* Footer hint */}
      <div className="px-3 py-1.5 bg-rose-50/50 dark:bg-slate-900/60 border-t border-rose-100/40 dark:border-slate-800/40 flex items-center justify-between text-[11px] text-stone-500 dark:text-slate-400">
        <span className="flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-rose-400" />
          <span>
            {mainTab === 'stickers'
              ? (previewSticker ? previewSticker.label : 'Touchez un sticker pour l’envoyer d’un geste')
              : 'Touchez un emoji pour l’ajouter à votre message'}
          </span>
        </span>
        <span className="font-medium text-rose-500">
          {mainTab === 'stickers' ? `${filteredStickers.length} stickers` : `${ROMANTIC_EMOJIS.length} emojis`}
        </span>
      </div>
    </motion.div>
  );
};
