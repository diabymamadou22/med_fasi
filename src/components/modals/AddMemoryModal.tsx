import React, { useState, useRef } from 'react';
import { motion } from 'motion/react';
import {
  X,
  Heart,
  Upload,
  Camera,
  Trash2,
  Link as LinkIcon,
  Sparkles,
} from 'lucide-react';
import { CoupleProfile, PartnerId, TimelineMemory } from '../../types';
import { soundEffects } from '../../lib/audio';
import { triggerHeartConfetti } from '../../lib/confetti';
import { processPhotoWithoutCropping } from '../../lib/imageUtils';
import { CameraCaptureModal } from './CameraCaptureModal';

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

  const [photoUrl, setPhotoUrl] = useState(initialMemory?.photoUrl || '');
  const [caption, setCaption] = useState(initialMemory?.title || '');
  const [isProcessingPhoto, setIsProcessingPhoto] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlDraft, setUrlDraft] = useState('');
  const [showCameraModal, setShowCameraModal] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsProcessingPhoto(true);
    try {
      // Process photo keeping 100% original aspect ratio without any crop
      const dataUrl = await processPhotoWithoutCropping(file, 1400, 0.85);
      setPhotoUrl(dataUrl);
      soundEffects.playSuccessSparkle();
    } catch (err: any) {
      alert(err?.message || 'Erreur lors du traitement de la photo.');
    } finally {
      setIsProcessingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleApplyUrl = () => {
    if (urlDraft.trim()) {
      setPhotoUrl(urlDraft.trim());
      setShowUrlInput(false);
      setUrlDraft('');
      soundEffects.playSuccessSparkle();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!photoUrl.trim() && !caption.trim()) {
      alert('Veuillez sélectionner une photo à ajouter !');
      return;
    }

    const safeTitle = caption.trim() || 'Notre doux souvenir';
    const safeDate = initialMemory?.date || new Date().toISOString().split('T')[0];
    const safeCategory = initialMemory?.category || 'rencard';
    const safeDescription = initialMemory?.description || '';
    const safePhotoUrl = photoUrl.trim();
    const safeLocationName = initialMemory?.locationName || '';
    const safeTags = initialMemory?.tags && initialMemory.tags.length > 0
      ? initialMemory.tags
      : ['Amour', 'Photo'];

    if (isEditing && initialMemory && onUpdateMemory) {
      onUpdateMemory({
        ...initialMemory,
        title: safeTitle,
        date: safeDate,
        category: safeCategory,
        description: safeDescription,
        photoUrl: safePhotoUrl,
        locationName: safeLocationName,
        tags: safeTags,
      });
      soundEffects.playSuccessSparkle();
    } else if (onAddMemory) {
      onAddMemory({
        title: safeTitle,
        date: safeDate,
        category: safeCategory,
        description: safeDescription,
        photoUrl: safePhotoUrl,
        locationName: safeLocationName,
        tags: safeTags,
        authorId: activePartnerId,
      });
      soundEffects.playSuccessSparkle();
      triggerHeartConfetti();
    }

    onClose();
  };

  const authorName = activePartnerId === 'p1' ? profile.partner1.name : profile.partner2.name;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-3xl border border-rose-200 max-w-md w-full p-5 sm:p-6 shadow-2xl relative my-6"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-stone-400 hover:text-stone-700 p-1.5 rounded-full hover:bg-stone-100 transition-colors cursor-pointer"
          aria-label="Fermer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2.5 rounded-2xl bg-rose-100 text-rose-600 shadow-2xs">
            <Heart className="w-5 h-5 fill-rose-500 text-rose-500" />
          </div>
          <div>
            <h3 className="font-serif-romantic text-lg sm:text-xl font-bold text-stone-900">
              {isEditing ? 'Modifier la photo' : 'Ajouter une Photo'}
            </h3>
            <p className="text-xs text-stone-500">
              {isEditing ? (
                'Ajustez votre photo de souvenir'
              ) : (
                <>
                  Partagée par <span className="font-semibold text-rose-600">{authorName}</span>
                </>
              )}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Main Photo Dropzone / Upload Area */}
          <div className="space-y-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />

            {photoUrl && photoUrl.trim() !== '' ? (
              <div className="relative rounded-2xl overflow-hidden border-2 border-rose-200 bg-stone-900/5 group">
                {/* Ambient blur background */}
                <img
                  src={photoUrl}
                  alt=""
                  aria-hidden="true"
                  className="absolute inset-0 w-full h-full object-cover blur-xl opacity-25 scale-110 pointer-events-none"
                />
                {/* 100% Uncropped preview */}
                <div className="relative flex items-center justify-center min-h-[220px] max-h-[340px] p-2">
                  <img
                    src={photoUrl}
                    alt="Aperçu du souvenir"
                    className="max-h-[320px] w-auto max-w-full object-contain rounded-xl drop-shadow-sm"
                  />
                </div>

                {/* Top action buttons */}
                <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 z-10">
                  <button
                    type="button"
                    onClick={() => setShowCameraModal(true)}
                    className="px-2.5 py-1.5 bg-black/75 hover:bg-black/90 text-white rounded-xl text-xs font-semibold backdrop-blur-md flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
                    title="Prendre une autre photo en direct"
                  >
                    <Camera className="w-3.5 h-3.5 text-rose-400" />
                    <span>Caméra</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-2.5 py-1.5 bg-black/75 hover:bg-black/90 text-white rounded-xl text-xs font-semibold backdrop-blur-md flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
                    title="Changer via vos fichiers"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Fichier</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPhotoUrl('')}
                    className="p-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs backdrop-blur-md shadow-md transition-all cursor-pointer"
                    title="Retirer la photo"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              /* Two distinct options: Direct Live Camera & File Upload */
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* 1. Direct Live Camera Capture */}
                <button
                  type="button"
                  onClick={() => setShowCameraModal(true)}
                  className="border-2 border-rose-300 hover:border-rose-500 bg-rose-50/60 hover:bg-rose-100/70 rounded-2xl p-4 sm:p-5 text-center cursor-pointer transition-all flex flex-col items-center justify-center group shadow-xs active:scale-98"
                >
                  <div className="w-12 h-12 rounded-2xl bg-rose-600 text-white flex items-center justify-center shadow-md mb-2.5 group-hover:scale-110 transition-transform">
                    <Camera className="w-6 h-6" />
                  </div>
                  <h4 className="font-bold text-stone-900 text-xs sm:text-sm">
                    Prendre une photo
                  </h4>
                  <p className="text-[11px] text-stone-500 mt-1 leading-tight">
                    En direct avec la caméra
                  </p>
                </button>

                {/* 2. Choose from files / phone library */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-stone-300 hover:border-stone-400 bg-stone-50/70 hover:bg-stone-100/80 rounded-2xl p-4 sm:p-5 text-center cursor-pointer transition-all flex flex-col items-center justify-center group active:scale-98"
                >
                  <div className="w-12 h-12 rounded-2xl bg-stone-700 text-white flex items-center justify-center shadow-md mb-2.5 group-hover:scale-110 transition-transform">
                    {isProcessingPhoto ? (
                      <Sparkles className="w-6 h-6 animate-spin text-rose-300" />
                    ) : (
                      <Upload className="w-6 h-6" />
                    )}
                  </div>
                  <h4 className="font-bold text-stone-900 text-xs sm:text-sm">
                    Choisir un fichier
                  </h4>
                  <p className="text-[11px] text-stone-500 mt-1 leading-tight">
                    Depuis la pellicule du smartphone
                  </p>
                </button>
              </div>
            )}

            {/* Alternative: Link via URL */}
            <div className="flex items-center justify-end pt-1">
              {!showUrlInput ? (
                <button
                  type="button"
                  onClick={() => setShowUrlInput(true)}
                  className="text-[11px] text-stone-400 hover:text-rose-600 flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <LinkIcon className="w-3 h-3" />
                  <span>Coller un lien d'image web</span>
                </button>
              ) : (
                <div className="w-full flex items-center gap-2 mt-1">
                  <input
                    type="url"
                    value={urlDraft}
                    onChange={(e) => setUrlDraft(e.target.value)}
                    placeholder="https://... photo.jpg"
                    className="flex-1 px-3 py-1.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-800 focus:outline-hidden focus:ring-2 focus:ring-rose-400"
                  />
                  <button
                    type="button"
                    onClick={handleApplyUrl}
                    className="px-3 py-1.5 bg-rose-500 text-white rounded-xl text-xs font-semibold hover:bg-rose-600 cursor-pointer"
                  >
                    Valider
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowUrlInput(false);
                      setUrlDraft('');
                    }}
                    className="text-stone-400 hover:text-stone-600 text-xs px-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Simple Optional Note / Caption (Optionnel) */}
          <div>
            <label className="text-xs font-semibold text-stone-600 block mb-1">
              Légende ou mot doux <span className="text-stone-400 font-normal">(optionnel)</span>
            </label>
            <input
              type="text"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Ex: Mon amour, notre soirée..."
              className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm text-stone-800 placeholder-stone-400 focus:outline-hidden focus:ring-2 focus:ring-rose-400"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between gap-2 pt-3 border-t border-stone-100">
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
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-stone-600 hover:bg-stone-100 transition-colors cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={!photoUrl && !caption.trim()}
                className={`px-5 py-2.5 rounded-xl text-white text-xs font-bold shadow-md transition-all flex items-center gap-1.5 ${
                  !photoUrl && !caption.trim()
                    ? 'bg-stone-300 cursor-not-allowed opacity-70'
                    : 'bg-rose-500 hover:bg-rose-600 hover:scale-[1.02] active:scale-95 cursor-pointer'
                }`}
              >
                <Heart className="w-3.5 h-3.5 fill-white" />
                <span>{isEditing ? 'Enregistrer' : 'Ajouter la photo'}</span>
              </button>
            </div>
          </div>
        </form>
      </motion.div>

      {/* Live In-App Camera Viewfinder Modal */}
      <CameraCaptureModal
        isOpen={showCameraModal}
        onClose={() => setShowCameraModal(false)}
        onPhotoCaptured={(capturedUrl, cap) => {
          setPhotoUrl(capturedUrl);
          if (cap && !caption.trim()) {
            setCaption(cap);
          }
        }}
        title="Prendre une photo"
        subtitle="Capturez votre souvenir directement"
        submitLabel="Utiliser cette photo"
        allowCaption={true}
      />
    </div>
  );
};
