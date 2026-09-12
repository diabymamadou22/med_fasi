import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Heart, Zap, Coffee, Edit3, Check, Camera } from 'lucide-react';
import { CoupleProfile, PartnerId } from '../types';
import { PartnerAvatar } from './PartnerAvatar';

interface MoodAndNeedsBarProps {
  profile: CoupleProfile;
  activePartnerId: PartnerId;
  onUpdateMood: (
    partnerId: PartnerId,
    mood: { energy: number; status: string; need: string; note?: string }
  ) => void;
  onOpenPhotoPicker?: (partnerId: PartnerId) => void;
}

const MOOD_OPTIONS = [
  { label: 'Rayonnant', emoji: '☀️', color: 'text-amber-500 bg-amber-50' },
  { label: 'Zen & Calme', emoji: '🌿', color: 'text-emerald-500 bg-emerald-50' },
  { label: 'Câlin & Tendre', emoji: '🧸', color: 'text-rose-500 bg-rose-50' },
  { label: 'Fatigué / Ko', emoji: '😴', color: 'text-indigo-500 bg-indigo-50' },
  { label: 'Stressé / Débordé', emoji: '⚡', color: 'text-orange-500 bg-orange-50' },
  { label: 'Créatif & Énergique', emoji: '✨', color: 'text-purple-500 bg-purple-50' },
];

const NEED_OPTIONS = [
  'Besoin d\'un câlin',
  'Envie d\'être tranquille',
  'Prêt à sortir',
  'Besoin d\'écoute',
  'Surprise-moi',
  'Envie de cuisiner ensemble',
  'Besoin d\'un bon massage',
];

export const MoodAndNeedsBar: React.FC<MoodAndNeedsBarProps> = ({
  profile,
  activePartnerId,
  onUpdateMood,
  onOpenPhotoPicker,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const currentPartner = activePartnerId === 'p1' ? profile.partner1 : profile.partner2;
  const otherPartner = activePartnerId === 'p1' ? profile.partner2 : profile.partner1;

  const [selectedEnergy, setSelectedEnergy] = useState(currentPartner.mood.energy);
  const [selectedStatus, setSelectedStatus] = useState(currentPartner.mood.status);
  const [selectedNeed, setSelectedNeed] = useState(currentPartner.mood.need);
  const [customNote, setCustomNote] = useState(currentPartner.mood.note || '');

  const handleSave = () => {
    onUpdateMood(activePartnerId, {
      energy: selectedEnergy,
      status: selectedStatus,
      need: selectedNeed,
      note: customNote,
    });
    setIsEditing(false);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 my-3">
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-stone-200/80 p-3.5 sm:p-4 shadow-2xs">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          {/* Partner 1 card */}
          <div
            className={`flex-1 flex items-center gap-3 p-2.5 sm:p-3 rounded-xl transition-all ${
              activePartnerId === 'p1'
                ? 'bg-rose-50/70 border border-rose-200/80'
                : 'bg-stone-50/70 border border-stone-200/60'
            }`}
          >
            <div
              className="relative group/avatar cursor-pointer"
              onClick={() => onOpenPhotoPicker && onOpenPhotoPicker('p1')}
              title={`Profil de ${profile.partner1.name}`}
            >
              <PartnerAvatar
                name={profile.partner1.name}
                avatar={profile.partner1.avatar}
                partnerId="p1"
                size="lg"
                className="border-2 border-white shadow-2xs group-hover/avatar:ring-2 group-hover/avatar:ring-rose-400 transition-all"
              />
              <span className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity text-white">
                <Camera className="w-3.5 h-3.5" />
              </span>
              <span className="absolute -bottom-1 -right-1 text-xs">
                {MOOD_OPTIONS.find((m) => m.label.startsWith(profile.partner1.mood.status))?.emoji || '❤️'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1">
                <p className="font-semibold text-xs sm:text-sm text-stone-800 truncate">
                  {profile.partner1.name}
                </p>
                <div className="flex items-center gap-0.5 text-amber-500" title={`Énergie: ${profile.partner1.mood.energy}/5`}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Zap
                      key={`p1-star-${star}`}
                      className={`w-3 h-3 ${
                        star <= profile.partner1.mood.energy
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-stone-200'
                      }`}
                    />
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-white text-stone-700 shadow-2xs border border-stone-200/50">
                  {profile.partner1.mood.status}
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-100/80 text-rose-700">
                  {profile.partner1.mood.need}
                </span>
              </div>
              {profile.partner1.mood.note && (
                <p className="text-[11px] text-stone-500 italic truncate mt-1">
                  « {profile.partner1.mood.note} »
                </p>
              )}
            </div>
          </div>

          {/* Divider with heart pulse */}
          <div className="hidden md:flex flex-col items-center justify-center px-2 text-rose-300">
            <Heart className="w-4 h-4 fill-rose-100 text-rose-400 animate-pulse" />
          </div>

          {/* Partner 2 card */}
          <div
            className={`flex-1 flex items-center gap-3 p-2.5 sm:p-3 rounded-xl transition-all ${
              activePartnerId === 'p2'
                ? 'bg-sky-50/70 border border-sky-200/80'
                : 'bg-stone-50/70 border border-stone-200/60'
            }`}
          >
            <div
              className="relative group/avatar cursor-pointer"
              onClick={() => onOpenPhotoPicker && onOpenPhotoPicker('p2')}
              title={`Profil de ${profile.partner2.name}`}
            >
              <PartnerAvatar
                name={profile.partner2.name}
                avatar={profile.partner2.avatar}
                partnerId="p2"
                size="lg"
                className="border-2 border-white shadow-2xs group-hover/avatar:ring-2 group-hover/avatar:ring-sky-400 transition-all"
              />
              <span className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity text-white">
                <Camera className="w-3.5 h-3.5" />
              </span>
              <span className="absolute -bottom-1 -right-1 text-xs">
                {MOOD_OPTIONS.find((m) => m.label.startsWith(profile.partner2.mood.status))?.emoji || '❤️'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1">
                <p className="font-semibold text-xs sm:text-sm text-stone-800 truncate">
                  {profile.partner2.name}
                </p>
                <div className="flex items-center gap-0.5 text-amber-500" title={`Énergie: ${profile.partner2.mood.energy}/5`}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Zap
                      key={`p2-star-${star}`}
                      className={`w-3 h-3 ${
                        star <= profile.partner2.mood.energy
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-stone-200'
                      }`}
                    />
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-white text-stone-700 shadow-2xs border border-stone-200/50">
                  {profile.partner2.mood.status}
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-sky-100/80 text-sky-800">
                  {profile.partner2.mood.need}
                </span>
              </div>
              {profile.partner2.mood.note && (
                <p className="text-[11px] text-stone-500 italic truncate mt-1">
                  « {profile.partner2.mood.note} »
                </p>
              )}
            </div>
          </div>

          {/* Quick Edit Action Button */}
          <div className="flex items-center justify-end">
            <button
              onClick={() => {
                setSelectedEnergy(currentPartner.mood.energy);
                setSelectedStatus(currentPartner.mood.status);
                setSelectedNeed(currentPartner.mood.need);
                setCustomNote(currentPartner.mood.note || '');
                setIsEditing(!isEditing);
              }}
              className="w-full md:w-auto px-3.5 py-2 rounded-xl text-xs font-semibold bg-stone-100 hover:bg-rose-50 hover:text-rose-700 text-stone-700 transition-colors flex items-center justify-center gap-1.5"
              id="btn-edit-my-mood"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Mon humeur & besoin</span>
            </button>
          </div>
        </div>

        {/* Modal / Inline Editor */}
        <AnimatePresence>
          {isEditing && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 pt-4 border-t border-stone-200 overflow-hidden"
            >
              <div className="bg-stone-50/90 p-4 rounded-xl space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs sm:text-sm font-bold text-stone-800 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-rose-500" />
                    <span>Mettre à jour mon humeur du jour ({currentPartner.name})</span>
                  </h3>
                  <span className="text-[11px] text-stone-500">Visible par {otherPartner.name}</span>
                </div>

                {/* Energy Level */}
                <div>
                  <label className="text-xs font-semibold text-stone-700 block mb-1.5">
                    Niveau d'énergie : {selectedEnergy}/5
                  </label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((lvl) => (
                      <button
                        key={`modal-energy-${lvl}`}
                        type="button"
                        onClick={() => setSelectedEnergy(lvl)}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 ${
                          selectedEnergy === lvl
                            ? 'bg-amber-400 text-amber-950 shadow-xs ring-2 ring-amber-300'
                            : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-100'
                        }`}
                      >
                        <Zap className="w-3 h-3 fill-current" />
                        <span>{lvl}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Mood State */}
                <div>
                  <label className="text-xs font-semibold text-stone-700 block mb-1.5">
                    Humeur principale :
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {MOOD_OPTIONS.map((mood) => {
                      const isSelected = selectedStatus === mood.label;
                      return (
                        <button
                          key={`mood-opt-${mood.label}`}
                          type="button"
                          onClick={() => setSelectedStatus(mood.label)}
                          className={`px-3 py-2 rounded-xl text-xs font-medium flex items-center gap-2 border transition-all text-left ${
                            isSelected
                              ? 'bg-rose-500 text-white border-rose-600 shadow-xs'
                              : 'bg-white text-stone-700 border-stone-200 hover:border-rose-300'
                          }`}
                        >
                          <span className="text-base">{mood.emoji}</span>
                          <span className="truncate">{mood.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Explicit Need */}
                <div>
                  <label className="text-xs font-semibold text-stone-700 block mb-1.5">
                    Mon besoin essentiel pour aujourd'hui :
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {NEED_OPTIONS.map((need, nIdx) => {
                      const isSelected = selectedNeed === need;
                      return (
                        <button
                          key={`need-opt-${nIdx}-${need}`}
                          type="button"
                          onClick={() => setSelectedNeed(need)}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                            isSelected
                              ? 'bg-rose-600 text-white border-rose-700 shadow-2xs'
                              : 'bg-white text-stone-700 border-stone-200 hover:bg-rose-50'
                          }`}
                        >
                          {need}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Small note */}
                <div>
                  <label className="text-xs font-semibold text-stone-700 block mb-1">
                    Petit mot doux ou précision (optionnel) :
                  </label>
                  <input
                    type="text"
                    value={customNote}
                    onChange={(e) => setCustomNote(e.target.value)}
                    placeholder="Ex: Hâte de notre petit dîner ce soir !"
                    className="w-full px-3 py-2 bg-white border border-stone-200 rounded-xl text-xs text-stone-800 focus:outline-hidden focus:ring-2 focus:ring-rose-400"
                  />
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-3 py-1.5 rounded-xl text-xs font-medium text-stone-600 hover:bg-stone-200 transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    type="button"
                    onClick={handleSave}
                    className="px-4 py-1.5 rounded-xl text-xs font-semibold bg-rose-500 hover:bg-rose-600 text-white transition-colors flex items-center gap-1.5 shadow-xs"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Enregistrer mon état</span>
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
