import React, { useState, useRef } from 'react';
import { motion } from 'motion/react';
import { X, MapPin, Compass, Image as ImageIcon, Upload, Camera, Trash2, Link as LinkIcon } from 'lucide-react';
import { MemoryLocation } from '../../types';
import { soundEffects } from '../../lib/audio';
import { triggerHeartConfetti } from '../../lib/confetti';
import { processImageFile } from '../../lib/imageUtils';

interface AddLocationModalProps {
  onClose: () => void;
  onAddLocation?: (loc: Omit<MemoryLocation, 'id'>) => void;
  initialLocation?: MemoryLocation | null;
  onUpdateLocation?: (loc: MemoryLocation) => void;
  onDeleteLocation?: (locationId: string) => void;
}

export const AddLocationModal: React.FC<AddLocationModalProps> = ({
  onClose,
  onAddLocation,
  initialLocation,
  onUpdateLocation,
  onDeleteLocation,
}) => {
  const isEditing = Boolean(initialLocation);

  const [name, setName] = useState(initialLocation?.name || '');
  const [city, setCity] = useState(initialLocation?.city || 'Bamako');
  const [category, setCategory] = useState<MemoryLocation['category']>(
    initialLocation?.category || '1er Rencard'
  );
  const [description, setDescription] = useState(initialLocation?.description || '');
  const [date, setDate] = useState(initialLocation?.date || 'Novembre 2024');
  const [photoUrl, setPhotoUrl] = useState(initialLocation?.photoUrl || '');
  const [isProcessingPhoto, setIsProcessingPhoto] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const quickLocations = ['Notre ville', 'En vacances', 'Cocon douillet', 'Au restaurant', 'En plein air'];

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
    if (!name.trim() || !city.trim()) return;

    if (isEditing && initialLocation && onUpdateLocation) {
      onUpdateLocation({
        ...initialLocation,
        name: name.trim(),
        city: city.trim(),
        category,
        description: description.trim() || 'Lieu inoubliable de notre histoire.',
        date: date.trim(),
        photoUrl: photoUrl.trim() || undefined,
      });
      soundEffects.playSuccessSparkle();
    } else if (onAddLocation) {
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
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/40 backdrop-blur-xs overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-3xl border border-sky-200 max-w-lg w-full p-5 sm:p-6 shadow-2xl relative my-6"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-stone-400 hover:text-stone-700 p-1.5 rounded-full hover:bg-stone-100 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5 mb-4">
          <div className="p-2 rounded-xl bg-sky-100 text-sky-800">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-serif-romantic text-lg sm:text-xl font-bold text-stone-900">
              {isEditing ? 'Modifier ce Lieu Précieux' : 'Épingler un Lieu Précieux'}
            </h3>
            <p className="text-xs text-stone-500">
              {isEditing
                ? 'Mettre à jour les informations de ce lieu romantique'
                : 'Ajouter un repère sur la carte de nos moments inoubliables'}
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
              placeholder="Ex: Notre restaurant préféré, La plage du premier baiser, Notre café secret..."
              className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm text-stone-800 focus:outline-hidden focus:ring-2 focus:ring-sky-400"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-stone-700 block mb-1">
                Ville / Lieu *
              </label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Ex: Notre ville, notre quartier..."
                className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium"
                required
              />
              <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                {quickLocations.map((c) => (
                  <button
                    key={`quick-loc-${c}`}
                    type="button"
                    onClick={() => setCity(c)}
                    className="text-[10px] px-1.5 py-0.5 rounded-md bg-sky-50 hover:bg-sky-100 text-sky-700 font-semibold transition-colors cursor-pointer"
                  >
                    {c}
                  </button>
                ))}
              </div>
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
                <option value="Voyage">✈️ Voyage / Escapade</option>
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
              placeholder="Une anecdote, ce qu'on s'est dit, la brise du fleuve, nos rires complices..."
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
              placeholder="Ex: Hivernage 2024, 18 Novembre 2024..."
              className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium"
            />
          </div>

          {/* Photo upload for Location */}
          <div className="p-3.5 bg-sky-50/50 rounded-2xl border border-sky-100 space-y-2.5">
            <label className="text-xs font-bold text-stone-800 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-sky-600" />
                <span>Photo du lieu (depuis votre téléphone/ordinateur)</span>
              </span>
              {photoUrl && (
                <button
                  type="button"
                  onClick={() => setPhotoUrl('')}
                  className="text-[11px] text-red-500 hover:text-red-700 flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Retirer</span>
                </button>
              )}
            </label>

            {photoUrl && photoUrl.trim() !== '' ? (
              <div className="relative rounded-xl overflow-hidden border border-sky-200 max-h-48 bg-black/5">
                <img src={photoUrl} alt="Aperçu du lieu" className="w-full h-40 object-cover" />
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
                  className="w-full sm:w-auto px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>{isProcessingPhoto ? 'Optimisation...' : 'Téléverser une photo'}</span>
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
          </div>

          <div className="flex items-center justify-between gap-2 pt-2 border-t border-stone-100">
            {isEditing && initialLocation && onDeleteLocation ? (
              <button
                type="button"
                onClick={() => {
                  onDeleteLocation(initialLocation.id);
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
                className="px-4 py-2 rounded-xl text-xs font-semibold text-stone-600 hover:bg-stone-100 transition-colors cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-md flex items-center gap-1.5 transition-all hover:scale-[1.02] active:scale-95 cursor-pointer"
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>{isEditing ? 'Enregistrer les modifications' : 'Placer sur la Carte'}</span>
              </button>
            </div>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
