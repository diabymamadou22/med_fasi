import React, { useState } from 'react';
import { motion } from 'motion/react';
import { X, Image as ImageIcon, MapPin, Mic, Calendar, Heart, Plus } from 'lucide-react';
import { CoupleProfile, PartnerId, TimelineMemory } from '../../types';
import { soundEffects } from '../../lib/audio';
import { triggerHeartConfetti } from '../../lib/confetti';

interface AddMemoryModalProps {
  profile: CoupleProfile;
  activePartnerId: PartnerId;
  onClose: () => void;
  onAddMemory: (memory: Omit<TimelineMemory, 'id' | 'likes'>) => void;
}

export const AddMemoryModal: React.FC<AddMemoryModalProps> = ({
  profile,
  activePartnerId,
  onClose,
  onAddMemory,
}) => {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState<TimelineMemory['category']>('rencard');
  const [description, setDescription] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [locationName, setLocationName] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [includeVoiceNote, setIncludeVoiceNote] = useState(false);

  const samplePhotos = [
    { label: 'Café / Resto', url: 'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=800&auto=format&fit=crop&q=80' },
    { label: 'Voyage / Mer', url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=80' },
    { label: 'Cuisine / Fous rires', url: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=800&auto=format&fit=crop&q=80' },
    { label: 'Cocon / Maison', url: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800&auto=format&fit=crop&q=80' },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    onAddMemory({
      title: title.trim(),
      date,
      category,
      description: description.trim(),
      photoUrl: photoUrl.trim() || undefined,
      locationName: locationName.trim() || undefined,
      audioDuration: includeVoiceNote ? '0:35' : undefined,
      tags: tags.length > 0 ? tags : ['Moment précieux', 'Amour'],
      authorId: activePartnerId,
    });

    soundEffects.playSuccessSparkle();
    triggerHeartConfetti();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-3xl border border-rose-200 max-w-lg w-full p-6 shadow-2xl relative my-8"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-stone-400 hover:text-stone-700 p-1.5 rounded-full hover:bg-stone-100"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 rounded-xl bg-rose-100 text-rose-600">
            <Heart className="w-5 h-5 fill-rose-500 text-rose-500" />
          </div>
          <div>
            <h3 className="font-serif-romantic text-xl font-bold text-stone-900">
              Ajouter un Moment Inoubliable
            </h3>
            <p className="text-xs text-stone-500">
              Immortaliser un souvenir dans notre fil chronologique
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-stone-700 block mb-1">
              Titre du moment *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Notre coucher de soleil à la plage..."
              className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm text-stone-800 focus:outline-hidden focus:ring-2 focus:ring-rose-400"
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
                <option value="rencard">❤️ Rencard</option>
                <option value="voyage">✈️ Voyage</option>
                <option value="fourire">😂 Fou rire</option>
                <option value="etape">🏡 Grande étape</option>
                <option value="anecdote">✨ Anecdote</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-stone-700 block mb-1">
                Date du souvenir :
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-stone-700 block mb-1">
              L'histoire / Anecdote *
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Raconte ce qui s'est passé, les fous rires, ce que tu as ressenti..."
              rows={3}
              className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm text-stone-800 focus:outline-hidden focus:ring-2 focus:ring-rose-400 resize-none"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-stone-700 block mb-1">
                Lieu (optionnel) :
              </label>
              <input
                type="text"
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                placeholder="Ex: Plage d'Étretat, Paris..."
                className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-stone-700 block mb-1">
                Tags (séparés par des virgules) :
              </label>
              <input
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="Ex: Coucher de soleil, Magique"
                className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs"
              />
            </div>
          </div>

          {/* Photo url & quick presets */}
          <div>
            <label className="text-xs font-bold text-stone-700 block mb-1">
              Photo du souvenir (URL ou présélection) :
            </label>
            <input
              type="url"
              value={photoUrl}
              onChange={(e) => setPhotoUrl(e.target.value)}
              placeholder="https://images.unsplash.com/..."
              className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs mb-2"
            />
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] text-stone-400 font-medium">Suggestions :</span>
              {samplePhotos.map((sp) => (
                <button
                  key={sp.label}
                  type="button"
                  onClick={() => setPhotoUrl(sp.url)}
                  className="px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-rose-50 hover:bg-rose-100 text-rose-700 transition-colors"
                >
                  {sp.label}
                </button>
              ))}
            </div>
          </div>

          {/* Voice note simulation toggle */}
          <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mic className="w-4 h-4 text-rose-500" />
              <span className="text-xs font-semibold text-stone-700">
                Attacher un extrait audio / note vocale
              </span>
            </div>
            <input
              type="checkbox"
              checked={includeVoiceNote}
              onChange={(e) => setIncludeVoiceNote(e.target.checked)}
              className="w-4 h-4 text-rose-500 rounded-sm focus:ring-rose-400"
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
              className="px-5 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold shadow-md"
            >
              Enregistrer ce souvenir
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
