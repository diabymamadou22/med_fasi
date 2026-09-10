import React, { useState } from 'react';
import { motion } from 'motion/react';
import { X, Settings, Heart, Calendar, RefreshCw } from 'lucide-react';
import { CoupleProfile } from '../../types';
import { soundEffects } from '../../lib/audio';
import { triggerCelebrationConfetti } from '../../lib/confetti';

interface ProfileModalProps {
  profile: CoupleProfile;
  onClose: () => void;
  onSaveProfile: (profile: CoupleProfile) => void;
  onResetToDefault: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  profile,
  onClose,
  onSaveProfile,
  onResetToDefault,
}) => {
  const [partner1Name, setPartner1Name] = useState(profile.partner1.name);
  const [partner1Nickname, setPartner1Nickname] = useState(profile.partner1.nickname);
  const [partner1Avatar, setPartner1Avatar] = useState(profile.partner1.avatar);

  const [partner2Name, setPartner2Name] = useState(profile.partner2.name);
  const [partner2Nickname, setPartner2Nickname] = useState(profile.partner2.nickname);
  const [partner2Avatar, setPartner2Avatar] = useState(profile.partner2.avatar);

  const [anniversaryDate, setAnniversaryDate] = useState(profile.anniversaryDate);
  const [relationshipTitle, setRelationshipTitle] = useState(profile.relationshipTitle);

  const sampleAvatars = [
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80',
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveProfile({
      ...profile,
      partner1: {
        ...profile.partner1,
        name: partner1Name.trim() || 'Partenaire 1',
        nickname: partner1Nickname.trim(),
        avatar: partner1Avatar.trim(),
      },
      partner2: {
        ...profile.partner2,
        name: partner2Name.trim() || 'Partenaire 2',
        nickname: partner2Nickname.trim(),
        avatar: partner2Avatar.trim(),
      },
      anniversaryDate,
      relationshipTitle:
        relationshipTitle.trim() || `${partner1Name} & ${partner2Name}`,
    });

    soundEffects.playSuccessSparkle();
    triggerCelebrationConfetti();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-3xl border border-stone-200 max-w-xl w-full p-6 sm:p-7 shadow-2xl relative my-8"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-stone-400 hover:text-stone-700 p-1.5 rounded-full hover:bg-stone-100"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2 mb-6">
          <div className="p-2 rounded-xl bg-rose-100 text-rose-600">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-serif-romantic text-xl font-bold text-stone-900">
              Paramètres de Notre Couple
            </h3>
            <p className="text-xs text-stone-500">
              Personnalisez vos prénoms, surnoms, avatars et date de rencontre
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Partner 1 Info */}
          <div className="p-4 bg-rose-50/50 rounded-2xl border border-rose-100 space-y-3">
            <h4 className="font-serif-romantic text-sm font-bold text-rose-900 flex items-center gap-1.5">
              <span>Partenaire 1</span>
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-stone-700 block mb-1">
                  Prénom :
                </label>
                <input
                  type="text"
                  value={partner1Name}
                  onChange={(e) => setPartner1Name(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-rose-200 rounded-xl text-xs"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-bold text-stone-700 block mb-1">
                  Surnom d'amour :
                </label>
                <input
                  type="text"
                  value={partner1Nickname}
                  onChange={(e) => setPartner1Nickname(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-rose-200 rounded-xl text-xs"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-stone-700 block mb-1">
                URL Photo de profil :
              </label>
              <input
                type="url"
                value={partner1Avatar}
                onChange={(e) => setPartner1Avatar(e.target.value)}
                className="w-full px-3 py-1.5 bg-white border border-rose-200 rounded-xl text-xs"
              />
            </div>
          </div>

          {/* Partner 2 Info */}
          <div className="p-4 bg-sky-50/50 rounded-2xl border border-sky-100 space-y-3">
            <h4 className="font-serif-romantic text-sm font-bold text-sky-900 flex items-center gap-1.5">
              <span>Partenaire 2</span>
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-stone-700 block mb-1">
                  Prénom :
                </label>
                <input
                  type="text"
                  value={partner2Name}
                  onChange={(e) => setPartner2Name(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-sky-200 rounded-xl text-xs"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-bold text-stone-700 block mb-1">
                  Surnom d'amour :
                </label>
                <input
                  type="text"
                  value={partner2Nickname}
                  onChange={(e) => setPartner2Nickname(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-sky-200 rounded-xl text-xs"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-stone-700 block mb-1">
                URL Photo de profil :
              </label>
              <input
                type="url"
                value={partner2Avatar}
                onChange={(e) => setPartner2Avatar(e.target.value)}
                className="w-full px-3 py-1.5 bg-white border border-sky-200 rounded-xl text-xs"
              />
            </div>
          </div>

          {/* Couple Anniversary & Title */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-stone-700 block mb-1">
                Date de début de notre histoire :
              </label>
              <input
                type="date"
                value={anniversaryDate}
                onChange={(e) => setAnniversaryDate(e.target.value)}
                className="w-full px-3 py-1.5 bg-stone-50 border border-stone-200 rounded-xl text-xs"
                required
              />
            </div>

            <div>
              <label className="text-xs font-bold text-stone-700 block mb-1">
                Titre de notre duo :
              </label>
              <input
                type="text"
                value={relationshipTitle}
                onChange={(e) => setRelationshipTitle(e.target.value)}
                placeholder="Ex: Med & Safi"
                className="w-full px-3 py-1.5 bg-stone-50 border border-stone-200 rounded-xl text-xs"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-stone-100">
            <button
              type="button"
              onClick={() => {
                if (confirm('Réinitialiser avec les données par défaut ?')) {
                  onResetToDefault();
                  onClose();
                }
              }}
              className="text-xs text-stone-400 hover:text-rose-600 flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Remettre à zéro</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-stone-600 hover:bg-stone-100"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold shadow-md"
              >
                Enregistrer
              </button>
            </div>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
