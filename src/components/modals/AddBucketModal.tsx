import React, { useState } from 'react';
import { motion } from 'motion/react';
import { X, FolderHeart, Compass, Sparkles } from 'lucide-react';
import { PartnerId, BucketItem } from '../../types';
import { soundEffects } from '../../lib/audio';
import { triggerCelebrationConfetti } from '../../lib/confetti';

interface AddBucketModalProps {
  activePartnerId: PartnerId;
  onClose: () => void;
  onAddBucketItem: (item: Omit<BucketItem, 'id' | 'status'>) => void;
}

export const AddBucketModal: React.FC<AddBucketModalProps> = ({
  activePartnerId,
  onClose,
  onAddBucketItem,
}) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<BucketItem['category']>('Voyage');
  const [targetDate, setTargetDate] = useState('');
  const [budgetEstimate, setBudgetEstimate] = useState('');
  const [notes, setNotes] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onAddBucketItem({
      title: title.trim(),
      category,
      targetDate: targetDate.trim() || undefined,
      budgetEstimate: budgetEstimate.trim() || undefined,
      notes: notes.trim() || undefined,
      addedBy: activePartnerId,
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
        className="bg-white rounded-3xl border border-sky-200 max-w-lg w-full p-6 shadow-2xl relative"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-stone-400 hover:text-stone-700 p-1.5 rounded-full hover:bg-stone-100"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 rounded-xl bg-sky-100 text-sky-800">
            <FolderHeart className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-serif-romantic text-xl font-bold text-stone-900">
              Ajouter un Souhait Partagé
            </h3>
            <p className="text-xs text-stone-500">
              Nourrir notre Bucket List de rêves à accomplir
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-stone-700 block mb-1">
              Intitulé du rêve *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Road-trip en Écosse, Sauter en parachute à deux..."
              className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm text-stone-800 focus:outline-hidden focus:ring-2 focus:ring-sky-400"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-stone-700 block mb-1">
                Catégorie :
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium"
              >
                <option value="Voyage">✈️ Voyage</option>
                <option value="Projet de vie">🏡 Projet de vie</option>
                <option value="Activité insolite">✨ Activité insolite</option>
                <option value="Cadeau & Plaisir">🎁 Cadeau & Plaisir</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-stone-700 block mb-1">
                Date cible (optionnelle) :
              </label>
              <input
                type="text"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                placeholder="Ex: Été 2027, Printemps prochain..."
                className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-stone-700 block mb-1">
              Budget estimé :
            </label>
            <input
              type="text"
              value={budgetEstimate}
              onChange={(e) => setBudgetEstimate(e.target.value)}
              placeholder="Ex: 500 €, Gratuit, 1500 €..."
              className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-stone-700 block mb-1">
              Notes & idées de réalisation :
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Détails, liens, envies particulières..."
              rows={2}
              className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-800 focus:outline-hidden focus:ring-2 focus:ring-sky-400 resize-none"
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
              className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-md flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Ajouter à notre Bucket List</span>
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
