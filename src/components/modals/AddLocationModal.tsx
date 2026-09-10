import React, { useState } from 'react';
import { motion } from 'motion/react';
import { X, MapPin, Compass, Image as ImageIcon } from 'lucide-react';
import { MemoryLocation } from '../../types';
import { soundEffects } from '../../lib/audio';
import { triggerHeartConfetti } from '../../lib/confetti';

interface AddLocationModalProps {
  onClose: () => void;
  onAddLocation: (loc: Omit<MemoryLocation, 'id'>) => void;
}

export const AddLocationModal: React.FC<AddLocationModalProps> = ({
  onClose,
  onAddLocation,
}) => {
  const [name, setName] = useState('');
  const [city, setCity] = useState('Paris');
  const [category, setCategory] = useState<MemoryLocation['category']>('1er Rencard');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('18 Mai 2024');
  const [photoUrl, setPhotoUrl] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !city.trim()) return;

    // Randomize relative pin coordinate on map for nice visual spread
    const xPercent = Math.floor(Math.random() * 60 + 20);
    const yPercent = Math.floor(Math.random() * 60 + 20);

    onAddLocation({
      name: name.trim(),
      city: city.trim(),
      category,
      description: description.trim() || 'Lieu inoubliable de notre histoire.',
      date: date.trim(),
      photoUrl: photoUrl.trim() || undefined,
      xPercent,
      yPercent,
      iconName: 'MapPin',
    });

    soundEffects.playSuccessSparkle();
    triggerHeartConfetti();
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
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-serif-romantic text-xl font-bold text-stone-900">
              Épingler un Lieu Précieux
            </h3>
            <p className="text-xs text-stone-500">
              Ajouter un repère sur la carte de notre histoire
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-stone-700 block mb-1">
              Nom du lieu *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Le banc au bord du lac, Café de Flore..."
              className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm text-stone-800 focus:outline-hidden focus:ring-2 focus:ring-sky-400"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-stone-700 block mb-1">
                Ville / Région *
              </label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Ex: Annecy, Paris, Venise..."
                className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium"
                required
              />
            </div>

            <div>
              <label className="text-xs font-bold text-stone-700 block mb-1">
                Type de lieu :
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium"
              >
                <option value="1er Rencard">❤️ 1er Rencard</option>
                <option value="Voyage">✈️ Voyage</option>
                <option value="Balade Romantique">🌿 Balade Romantique</option>
                <option value="Nid Douillet">🏡 Nid Douillet</option>
                <option value="Coup de Cœur">✨ Coup de Cœur</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-stone-700 block mb-1">
              Ce qui s'est passé ici :
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Une anecdote, ce qu'on s'est dit, l'émotion partagée..."
              rows={3}
              className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm text-stone-800 focus:outline-hidden focus:ring-2 focus:ring-sky-400 resize-none"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-stone-700 block mb-1">
              Date ou Période :
            </label>
            <input
              type="text"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              placeholder="Ex: Été 2024, 18 Mai 2024..."
              className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium"
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
              <MapPin className="w-3.5 h-3.5" />
              <span>Placer sur la Carte</span>
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
