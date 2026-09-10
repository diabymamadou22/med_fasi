import React, { useState } from 'react';
import { motion } from 'motion/react';
import { X, Lock, Calendar, Sparkles, Image as ImageIcon } from 'lucide-react';
import { CoupleProfile, PartnerId, TimeCapsule } from '../../types';
import { soundEffects } from '../../lib/audio';
import { triggerCelebrationConfetti } from '../../lib/confetti';

interface AddCapsuleModalProps {
  profile: CoupleProfile;
  activePartnerId: PartnerId;
  onClose: () => void;
  onAddCapsule: (capsule: Omit<TimeCapsule, 'id' | 'createdAt' | 'isOpened'>) => void;
}

export const AddCapsuleModal: React.FC<AddCapsuleModalProps> = ({
  profile,
  activePartnerId,
  onClose,
  onAddCapsule,
}) => {
  const currentPartner = activePartnerId === 'p1' ? profile.partner1 : profile.partner2;
  const recipientPartner = activePartnerId === 'p1' ? profile.partner2 : profile.partner1;

  // Default target date: 6 months in the future
  const defaultFutureDate = new Date();
  defaultFutureDate.setMonth(defaultFutureDate.getMonth() + 6);
  const formattedFutureDate = defaultFutureDate.toISOString().split('T')[0];

  const [title, setTitle] = useState('');
  const [targetUnlockDate, setTargetUnlockDate] = useState(formattedFutureDate);
  const [message, setMessage] = useState('');
  const [sealTheme, setSealTheme] = useState<TimeCapsule['sealTheme']>('gold');
  const [photoUrl, setPhotoUrl] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) return;

    onAddCapsule({
      title: title.trim(),
      targetUnlockDate,
      authorId: activePartnerId,
      recipientId: recipientPartner.id,
      message: message.trim(),
      photoUrl: photoUrl.trim() || undefined,
      sealTheme,
    });

    soundEffects.playSuccessSparkle();
    triggerCelebrationConfetti();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-3xl border border-amber-200 max-w-lg w-full p-6 shadow-2xl relative"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-stone-400 hover:text-stone-700 p-1.5 rounded-full hover:bg-stone-100"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 rounded-xl bg-amber-100 text-amber-800">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-serif-romantic text-xl font-bold text-stone-900">
              Sceller une Capsule Temporelle
            </h3>
            <p className="text-xs text-stone-500">
              Message secret programmé pour s'ouvrir dans le futur
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-stone-700 block mb-1">
              Titre de la capsule *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Pour notre voyage de l'année prochaine / Nos 3 ans..."
              className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm text-stone-800 focus:outline-hidden focus:ring-2 focus:ring-amber-400"
              required
            />
          </div>

          <div>
            <label className="text-xs font-bold text-stone-700 block mb-1">
              Date d'ouverture programmée *
            </label>
            <input
              type="date"
              value={targetUnlockDate}
              onChange={(e) => setTargetUnlockDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium"
              required
            />
          </div>

          <div>
            <label className="text-xs font-bold text-stone-700 block mb-1">
              Sceau de cire magique :
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { id: 'gold', label: 'Or Royal', bg: 'bg-amber-500 text-white' },
                { id: 'ruby', label: 'Rubis Rouge', bg: 'bg-red-600 text-white' },
                { id: 'rose', label: 'Rose Amour', bg: 'bg-rose-500 text-white' },
                { id: 'emerald', label: 'Émeraude', bg: 'bg-emerald-600 text-white' },
              ].map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSealTheme(s.id as any)}
                  className={`py-2 rounded-xl text-[11px] font-bold transition-all ${s.bg} ${
                    sealTheme === s.id
                      ? 'ring-4 ring-amber-300 scale-105 shadow-sm'
                      : 'opacity-60 hover:opacity-100'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-stone-700 block mb-1">
              Message secret à sceller *
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Écris tout ce que tu ressens aujourd'hui, tes souhaits pour ce moment futur, vos projets..."
              rows={4}
              className="w-full p-3.5 bg-[#FFFDF9] border border-amber-200 rounded-xl font-handwriting text-xl text-stone-800 focus:outline-hidden focus:ring-2 focus:ring-amber-400 resize-none"
              required
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-stone-600 hover:bg-stone-100"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-md flex items-center gap-1.5"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Sceller la Capsule</span>
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
