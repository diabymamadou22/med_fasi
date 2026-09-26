import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Heart,
  Sparkles,
  Smile,
  Coffee,
  Sun,
  CloudRain,
  Flame,
  Check,
  ChevronDown,
  Edit2,
  Clock,
  Send,
} from 'lucide-react';
import { CoupleProfile, PartnerId, MissYouPulse } from '../../types';
import { soundEffects } from '../../lib/audio';
import { triggerHeartConfetti } from '../../lib/confetti';
import { PartnerAvatar } from '../PartnerAvatar';

interface LoveMoodWidgetProps {
  profile: CoupleProfile;
  activePartnerId: PartnerId;
  onUpdateMood: (newMood: {
    status: string;
    need: string;
    energy: number;
    note?: string;
  }) => void;
  onSendQuickVibe?: (vibe: MissYouPulse['vibe'], msg: string) => void;
  onOpenLoveTouch?: () => void;
}

const PRESET_MOODS = [
  {
    status: 'Besoin de Câlins',
    need: 'Besoin d’un gros câlin 🧸',
    energy: 3,
    emoji: '🧸',
    color: 'bg-rose-50 border-rose-200 text-rose-700',
    desc: 'Un moment tout doux dans tes bras',
  },
  {
    status: 'Je Pense à Toi',
    need: 'Tu occupes toutes mes pensées 💭',
    energy: 4,
    emoji: '💭',
    color: 'bg-pink-50 border-pink-200 text-pink-700',
    desc: 'Mon esprit est avec toi',
  },
  {
    status: 'Rayonnant(e)',
    need: 'Super énergie & prêt(e) pour tout ! ✨',
    energy: 5,
    emoji: '✨',
    color: 'bg-amber-50 border-amber-200 text-amber-700',
    desc: 'Plein(e) d’amour et d’optimisme',
  },
  {
    status: 'Journée Épuisante',
    need: 'Un peu fatigué(e), besoin de calme ☕',
    energy: 2,
    emoji: '🥱',
    color: 'bg-stone-50 border-stone-200 text-stone-700',
    desc: 'Hâte de te retrouver pour souffler',
  },
  {
    status: 'Humeur Romantique',
    need: 'Envie d’une soirée en tête-à-tête 🌹',
    energy: 4,
    emoji: '🌹',
    color: 'bg-purple-50 border-purple-200 text-purple-700',
    desc: 'Ambiance bougie et mots doux',
  },
  {
    status: 'Sensible & Doux',
    need: 'Besoin d’écoute et de tendresse 🌧️',
    energy: 2,
    emoji: '🌧️',
    color: 'bg-sky-50 border-sky-200 text-sky-700',
    desc: 'Un petit mot gentil fera ma journée',
  },
];

export const LoveMoodWidget: React.FC<LoveMoodWidgetProps> = ({
  profile,
  activePartnerId,
  onUpdateMood,
  onSendQuickVibe,
  onOpenLoveTouch,
}) => {
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [customNote, setCustomNote] = useState('');
  const [sentFeedback, setSentFeedback] = useState<string | null>(null);

  const currentPartner = activePartnerId === 'p1' ? profile.partner1 : profile.partner2;
  const otherPartner = activePartnerId === 'p1' ? profile.partner2 : profile.partner1;

  const myMood = currentPartner.mood || {
    status: 'Rayonnant',
    need: 'Besoin d’un câlin',
    energy: 4,
    lastUpdated: new Date().toISOString(),
  };

  const otherMood = otherPartner.mood || {
    status: 'Rayonnant',
    need: 'Besoin d’un câlin',
    energy: 4,
    lastUpdated: new Date().toISOString(),
  };

  const handleSelectMood = (preset: typeof PRESET_MOODS[0]) => {
    soundEffects.playSoftTap();
    onUpdateMood({
      status: preset.status,
      need: preset.need,
      energy: preset.energy,
      note: customNote.trim() || undefined,
    });
    setIsPickerOpen(false);
    triggerHeartConfetti();
  };

  const handleSendComfort = () => {
    if (onSendQuickVibe) {
      onSendQuickVibe('hug', `Un gros câlin réconfortant pour toi mon amour 🧸❤️`);
      soundEffects.playHeartPulse();
      triggerHeartConfetti();
      setSentFeedback('Câlin télépathique envoyé ! 🧸');
      setTimeout(() => setSentFeedback(null), 3000);
    }
  };

  const handleSendKiss = () => {
    if (onSendQuickVibe) {
      onSendQuickVibe('kiss', `Plein de doux baisers rien que pour toi mon cœur 💋✨`);
      soundEffects.playHeartPulse();
      triggerHeartConfetti();
      setSentFeedback('Baisers envoyés ! 💋');
      setTimeout(() => setSentFeedback(null), 3000);
    }
  };

  return (
    <div className="bg-white rounded-3xl p-5 sm:p-6 border border-rose-100 shadow-2xs space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-rose-50 flex items-center justify-center text-rose-500 shadow-2xs">
            <Sparkles className="w-4 h-4 text-rose-500" />
          </div>
          <div>
            <h3 className="font-serif-romantic text-base sm:text-lg font-bold text-stone-900 leading-tight">
              Météo du Cœur & Humeurs
            </h3>
            <p className="text-[11px] text-stone-500">
              Synchronisée en direct entre vous deux
            </p>
          </div>
        </div>

        {onOpenLoveTouch && (
          <button
            type="button"
            onClick={onOpenLoveTouch}
            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-2xs hover:scale-102 active:scale-95 transition-all cursor-pointer"
            title="Poser vos doigts en même temps pour faire vibrer vos téléphones à l'unisson"
          >
            <Heart className="w-3.5 h-3.5 fill-white animate-pulse" />
            <span>Toucher Connecté</span>
          </button>
        )}
      </div>

      {/* Two Mood Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {/* 1. Mon Humeur */}
        <div className="p-4 rounded-2xl bg-rose-50/50 border border-rose-100/80 relative">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <PartnerAvatar
                name={currentPartner.name}
                avatar={currentPartner.avatar}
                partnerId={activePartnerId}
                size="sm"
              />
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-rose-500 block leading-tight">
                  Moi ({currentPartner.name})
                </span>
                <span className="text-xs font-bold text-stone-800">
                  {myMood.status}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsPickerOpen(!isPickerOpen)}
              className="px-2.5 py-1 rounded-xl bg-white border border-rose-200 text-rose-600 font-semibold text-[11px] hover:bg-rose-50 flex items-center gap-1 shadow-2xs cursor-pointer transition-colors"
            >
              <Edit2 className="w-3 h-3" />
              <span>Changer</span>
            </button>
          </div>

          <p className="text-xs text-stone-700 font-medium bg-white/80 p-2 rounded-xl border border-rose-100/60 mt-2">
            « {myMood.need} »
          </p>

          {myMood.note && (
            <p className="text-[11px] text-stone-500 italic mt-1.5 px-1 truncate">
              Note : {myMood.note}
            </p>
          )}
        </div>

        {/* 2. Humeur du Partenaire */}
        <div className="p-4 rounded-2xl bg-purple-50/50 border border-purple-100/80 relative">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <PartnerAvatar
                name={otherPartner.name}
                avatar={otherPartner.avatar}
                partnerId={activePartnerId === 'p1' ? 'p2' : 'p1'}
                size="sm"
              />
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600 block leading-tight">
                  Mon Amour ({otherPartner.name})
                </span>
                <span className="text-xs font-bold text-stone-800">
                  {otherMood.status}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleSendComfort}
                className="p-1.5 rounded-xl bg-white hover:bg-rose-50 text-rose-600 border border-purple-200 shadow-2xs text-[11px] font-bold cursor-pointer transition-all active:scale-95"
                title="Envoyer un câlin instantané"
              >
                🧸 Câlin
              </button>
              <button
                type="button"
                onClick={handleSendKiss}
                className="p-1.5 rounded-xl bg-white hover:bg-pink-50 text-pink-600 border border-purple-200 shadow-2xs text-[11px] font-bold cursor-pointer transition-all active:scale-95"
                title="Envoyer un baiser instantané"
              >
                💋 Bisou
              </button>
            </div>
          </div>

          <p className="text-xs text-stone-700 font-medium bg-white/80 p-2 rounded-xl border border-purple-100/60 mt-2">
            « {otherMood.need} »
          </p>

          {otherMood.note && (
            <p className="text-[11px] text-stone-500 italic mt-1.5 px-1 truncate">
              Note : {otherMood.note}
            </p>
          )}

          {sentFeedback && (
            <div className="text-[11px] text-emerald-600 font-bold mt-1 text-center animate-fade-in">
              {sentFeedback}
            </div>
          )}
        </div>
      </div>

      {/* Mood Picker Dropdown Modal */}
      <AnimatePresence>
        {isPickerOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="pt-2 border-t border-rose-100 overflow-hidden"
          >
            <p className="text-xs font-bold text-stone-700 mb-2">
              Comment vous sentez-vous en ce moment ?
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {PRESET_MOODS.map((preset) => {
                const isSelected = myMood.status === preset.status;
                return (
                  <button
                    key={preset.status}
                    type="button"
                    onClick={() => handleSelectMood(preset)}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${preset.color} ${
                      isSelected ? 'ring-2 ring-rose-400 font-bold shadow-xs' : 'hover:scale-102'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="text-lg">{preset.emoji}</span>
                      <span className="text-xs font-bold truncate">{preset.status}</span>
                    </div>
                    <p className="text-[10px] opacity-80 mt-1 line-clamp-1">
                      {preset.desc}
                    </p>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
