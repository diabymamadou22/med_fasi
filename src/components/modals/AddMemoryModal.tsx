import React, { useState, useRef } from 'react';
import { motion } from 'motion/react';
import {
  X,
  Image as ImageIcon,
  MapPin,
  Mic,
  Calendar,
  Heart,
  Plus,
  Upload,
  Camera,
  Trash2,
  Link as LinkIcon,
} from 'lucide-react';
import { CoupleProfile, PartnerId, TimelineMemory } from '../../types';
import { soundEffects } from '../../lib/audio';
import { triggerHeartConfetti } from '../../lib/confetti';
import { processImageFile } from '../../lib/imageUtils';

interface AddMemoryModalProps {
  profile: CoupleProfile;
  activePartnerId: PartnerId;
  onClose: () => void;
  onAddMemory?: (memory: Omit<TimelineMemory, 'id' | 'likes'>) => void;
  initialMemory?: TimelineMemory | null;
  onUpdateMemory?: (memory: TimelineMemory) => void;
  onDeleteMemory?: (memoryId: string) => void;
}

export const AddMemoryModal: React.FC<AddMemoryModalProps> = ({
  profile,
  activePartnerId,
  onClose,
  onAddMemory,
  initialMemory,
  onUpdateMemory,
  onDeleteMemory,
}) => {
  const isEditing = Boolean(initialMemory);

  const [title, setTitle] = useState(initialMemory?.title || '');
  const [date, setDate] = useState(
    initialMemory?.date || new Date().toISOString().split('T')[0]
  );
  const [category, setCategory] = useState<TimelineMemory['category']>(
    initialMemory?.category || 'rencard'
  );
  const [description, setDescription] = useState(initialMemory?.description || '');
  const [photoUrl, setPhotoUrl] = useState(initialMemory?.photoUrl || '');
  const [isProcessingPhoto, setIsProcessingPhoto] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [locationName, setLocationName] = useState(initialMemory?.locationName || '');
  const [tagsInput, setTagsInput] = useState(initialMemory?.tags?.join(', ') || '');
  const [includeVoiceNote, setIncludeVoiceNote] = useState(
    Boolean(initialMemory?.audioDuration)
  );

  const fileInputRef = useRef<HTMLInputElement>(null);

  const samplePhotos = [
    { label: 'Sortie / Restaurant', url: 'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=800&auto=format&fit=crop&q=80' },
    { label: 'Coucher de soleil', url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=80' },
    { label: 'Fous rires complices', url: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=800&auto=format&fit=crop&q=80' },
    { label: 'Thé & Douceur', url: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800&auto=format&fit=crop&q=80' },
  ];

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsProcessingPhoto(true);
    try {
      const dataUrl = await processImageFile(file, 900, 0.82);
      setPhotoUrl(dataUrl);
      soundEffects.playSuccessSparkle();
    } catch (err: any) {
      alert(err?.message || 'Erreur lors du traitement de la photo.');
    } finally {
      setIsProcessingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    if (isEditing && initialMemory && onUpdateMemory) {
      onUpdateMemory({
        ...initialMemory,
        title: title.trim(),
        date,
        category,
        description: description.trim(),
        photoUrl: photoUrl.trim() || undefined,
        locationName: locationName.trim() || undefined,
        audioDuration: includeVoiceNote ? (initialMemory.audioDuration || '0:35') : undefined,
        tags: tags.length > 0 ? tags : ['Moment précieux', 'Amour'],
      });
      soundEffects.playSuccessSparkle();
    } else if (onAddMemory) {
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
    }

    onClose();
  };

  const authorName = activePartnerId === 'p1' ? profile.partner1.name : profile.partner2.name;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/40 backdrop-blur-xs overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-3xl border border-rose-200 max-w-lg w-full p-5 sm:p-6 shadow-2xl relative my-6"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-stone-400 hover:text-stone-700 p-1.5 rounded-full hover:bg-stone-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="p-2.5 rounded-2xl bg-rose-100 text-rose-600 shadow-2xs">
            <Heart className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-serif-romantic text-lg sm:text-xl font-bold text-stone-900">
              {isEditing ? 'Modifier ce Souvenir' : 'Ajouter un Nouveau Souvenir'}
            </h3>
            <p className="text-xs text-stone-500">
              {isEditing
                ? 'Mettez à jour les détails de ce moment précieux'
                : <>Posté avec amour par <span className="font-semibold text-rose-600">{authorName}</span></>}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-stone-700 block mb-1">
              Titre du souvenir *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Coucher de soleil magique sur le fleuve Niger"
              className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm text-stone-800 focus:outline-hidden focus:ring-2 focus:ring-rose-400"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-stone-700 block mb-1">
                Date du moment :
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs"
                required
              />
            </div>

            <div>
              <label className="text-xs font-bold text-stone-700 block mb-1">
                Catégorie :
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as TimelineMemory['category'])}
                className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs"
              >
                <option value="rencard">Rendez-vous amoureux 🥂</option>
                <option value="voyage">Escapade / Balade 🚗</option>
                <option value="maison">Moment à la maison 🏡</option>
                <option value="fou_rire">Fou rire inoubliable 😂</option>
                <option value="anniversaire">Anniversaire / Célébration 🎂</option>
                <option value="autre">Autre moment doux ✨</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-stone-700 block mb-1">
              L'histoire / Anecdote *
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Raconte ce qui s'est passé, les fous rires, vos regards complices..."
              rows={3}
              className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm text-stone-800 focus:outline-hidden focus:ring-2 focus:ring-rose-400 resize-none"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-stone-700 block mb-1">
                Lieu :
              </label>
              <input
                type="text"
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                placeholder="Ex: Bamako, Siby, Les berges du Niger..."
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
                placeholder="Ex: Coucher de soleil, Capitaine braisé"
                className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs"
              />
            </div>
          </div>

          {/* Photo upload from device with preview */}
          <div className="p-3.5 bg-rose-50/40 rounded-2xl border border-rose-100 space-y-2.5">
            <label className="text-xs font-bold text-stone-800 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-rose-500" />
                <span>Photo du souvenir (depuis votre téléphone/ordinateur)</span>
              </span>
              {photoUrl && (
                <button
                  type="button"
                  onClick={() => setPhotoUrl('')}
                  className="text-[11px] text-red-500 hover:text-red-700 flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Retirer la photo</span>
                </button>
              )}
            </label>

            {photoUrl ? (
              <div className="relative rounded-xl overflow-hidden border border-rose-200 max-h-48 bg-black/5">
                <img src={photoUrl} alt="Aperçu du souvenir" className="w-full h-44 object-cover" />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-2 right-2 px-3 py-1 bg-black/60 hover:bg-black/80 text-white rounded-lg text-xs font-medium backdrop-blur-xs flex items-center gap-1"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Changer</span>
                </button>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row items-center gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isProcessingPhoto}
                  className="w-full sm:w-auto px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>{isProcessingPhoto ? 'Optimisation...' : 'Téléverser notre photo'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowUrlInput(!showUrlInput)}
                  className="px-3 py-2 rounded-xl bg-white border border-stone-200 hover:bg-stone-50 text-stone-600 text-xs font-medium flex items-center gap-1 transition-colors"
                >
                  <LinkIcon className="w-3 h-3" />
                  <span>Entrer une URL</span>
                </button>
              </div>
            )}

            {showUrlInput && !photoUrl && (
              <input
                type="url"
                value={photoUrl}
                onChange={(e) => setPhotoUrl(e.target.value)}
                placeholder="https://..."
                className="w-full px-3 py-2 bg-white border border-stone-200 rounded-xl text-xs mt-1"
              />
            )}

            {/* Quick sample photos */}
            {!photoUrl && (
              <div className="flex items-center gap-1.5 flex-wrap pt-1">
                <span className="text-[10px] text-stone-400 font-medium">Suggestions d'images :</span>
                {samplePhotos.map((sp) => (
                  <button
                    key={sp.label}
                    type="button"
                    onClick={() => setPhotoUrl(sp.url)}
                    className="px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-white border border-rose-100 hover:bg-rose-50 text-rose-700 transition-colors"
                  >
                    {sp.label}
                  </button>
                ))}
              </div>
            )}
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
              className="w-4 h-4 text-rose-500 rounded-sm focus:ring-rose-400 cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between gap-2 pt-2 border-t border-stone-100">
            {isEditing && initialMemory && onDeleteMemory ? (
              <button
                type="button"
                onClick={() => {
                  onDeleteMemory(initialMemory.id);
                  onClose();
                }}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Supprimer</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-stone-600 hover:bg-stone-100 transition-colors"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold shadow-md transition-all hover:scale-[1.02] active:scale-95 cursor-pointer"
              >
                {isEditing ? 'Enregistrer les modifications' : 'Enregistrer ce souvenir'}
              </button>
            </div>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
