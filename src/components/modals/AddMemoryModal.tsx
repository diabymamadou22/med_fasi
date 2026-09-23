import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  X,
  Heart,
  Upload,
  Camera,
  Trash2,
  Link as LinkIcon,
  Sparkles,
  Video,
  Play,
  Film,
} from 'lucide-react';
import { CoupleProfile, PartnerId, TimelineMemory } from '../../types';
import { soundEffects } from '../../lib/audio';
import { triggerHeartConfetti } from '../../lib/confetti';
import { processPhotoWithoutCropping } from '../../lib/imageUtils';
import {
  extractVideoThumbnail,
  storeMediaBlob,
  uploadAndPersistMedia,
  formatVideoDuration,
  resolveMediaUrl,
} from '../../lib/videoUtils';
import { SleekLoveVideoPlayer } from '../SleekLoveVideoPlayer';
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

  const [photoUrl, setPhotoUrl] = useState(initialMemory?.photoUrl || initialMemory?.videoThumbnail || '');
  const [videoUrl, setVideoUrl] = useState(initialMemory?.videoUrl || '');
  const [mediaType, setMediaType] = useState<'image' | 'video'>(
    initialMemory?.mediaType || (initialMemory?.videoUrl ? 'video' : 'image')
  );
  const [videoDuration, setVideoDuration] = useState<number | undefined>(initialMemory?.videoDuration);
  const [resolvedVideoSrc, setResolvedVideoSrc] = useState<string>('');

  const [caption, setCaption] = useState(initialMemory?.title || '');
  const [isProcessingMedia, setIsProcessingMedia] = useState(false);
  const [processingStatusText, setProcessingStatusText] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlDraft, setUrlDraft] = useState('');
  const [showCameraModal, setShowCameraModal] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  // Resolve video blob URL if videoUrl changes
  useEffect(() => {
    if (videoUrl) {
      resolveMediaUrl(videoUrl).then((url) => {
        setResolvedVideoSrc(url);
      });
    } else {
      setResolvedVideoSrc('');
    }
  }, [videoUrl]);

  const handlePhotoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type.startsWith('video/')) {
      handleVideoFile(file);
      return;
    }

    setIsProcessingMedia(true);
    setProcessingStatusText('Optimisation de la photo...');
    try {
      const dataUrl = await processPhotoWithoutCropping(file, 1280, 0.82);
      setPhotoUrl(dataUrl);
      setVideoUrl('');
      setMediaType('image');
      setVideoDuration(undefined);
      soundEffects.playSuccessSparkle();
    } catch (err: any) {
      alert(err?.message || 'Erreur lors du traitement de la photo.');
    } finally {
      setIsProcessingMedia(false);
      setProcessingStatusText('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleVideoFile = async (file: File) => {
    setIsProcessingMedia(true);
    setProcessingStatusText('Préparation et téléversement de la vidéo pour votre partenaire...');
    try {
      const uploadResult = await uploadAndPersistMedia(file, 'vid_mem', (status) => {
        setProcessingStatusText(status);
      });

      setPhotoUrl(uploadResult.thumbnailDataUrl);
      setVideoUrl(uploadResult.serverUrl);
      setResolvedVideoSrc(uploadResult.localBlobUrl || uploadResult.serverUrl);
      setMediaType('video');
      setVideoDuration(uploadResult.duration);

      if (!caption.trim()) {
        const fileBase = file.name.replace(/\.[^/.]+$/, '').trim();
        setCaption(fileBase && fileBase.length > 1 ? fileBase : 'Notre vidéo complice');
      }

      soundEffects.playSuccessSparkle();
      triggerHeartConfetti();
    } catch (err: any) {
      console.error('Erreur traitement vidéo:', err);
      alert('Impossible d’importer cette vidéo. Format ou codec non pris en charge.');
    } finally {
      setIsProcessingMedia(false);
      setProcessingStatusText('');
      if (videoInputRef.current) videoInputRef.current.value = '';
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleApplyUrl = () => {
    if (urlDraft.trim()) {
      setPhotoUrl(urlDraft.trim());
      setVideoUrl('');
      setMediaType('image');
      setVideoDuration(undefined);
      setShowUrlInput(false);
      setUrlDraft('');
      soundEffects.playSuccessSparkle();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!photoUrl.trim() && !videoUrl.trim() && !caption.trim()) {
      alert('Veuillez sélectionner une photo ou une vidéo à ajouter !');
      return;
    }

    const safeTitle = caption.trim() || (mediaType === 'video' ? 'Notre vidéo complice' : 'Notre doux souvenir');
    const safeDate = initialMemory?.date || new Date().toISOString().split('T')[0];
    const safeCategory = initialMemory?.category || 'rencard';
    const safeDescription = initialMemory?.description || '';
    const safePhotoUrl = photoUrl.trim();
    const safeVideoUrl = mediaType === 'video' && videoUrl ? videoUrl.trim() : undefined;
    const safeLocationName = initialMemory?.locationName || '';
    const initialTags =
      initialMemory?.tags && initialMemory.tags.length > 0
        ? initialMemory.tags
        : ['Amour'];

    const safeTags = Array.from(
      new Set([...initialTags, mediaType === 'video' ? 'Vidéo' : 'Photo'])
    );

    if (isEditing && initialMemory && onUpdateMemory) {
      onUpdateMemory({
        ...initialMemory,
        title: safeTitle,
        date: safeDate,
        category: safeCategory,
        description: safeDescription,
        photoUrl: safePhotoUrl,
        videoUrl: safeVideoUrl,
        mediaType: mediaType,
        videoDuration: videoDuration,
        videoThumbnail: mediaType === 'video' ? safePhotoUrl : undefined,
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
        videoUrl: safeVideoUrl,
        mediaType: mediaType,
        videoDuration: videoDuration,
        videoThumbnail: mediaType === 'video' ? safePhotoUrl : undefined,
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
            {mediaType === 'video' ? (
              <Video className="w-5 h-5 text-purple-600" />
            ) : (
              <Heart className="w-5 h-5 fill-rose-500 text-rose-500" />
            )}
          </div>
          <div>
            <h3 className="font-serif-romantic text-lg sm:text-xl font-bold text-stone-900">
              {isEditing
                ? mediaType === 'video'
                  ? 'Modifier la vidéo'
                  : 'Modifier la photo'
                : mediaType === 'video'
                ? 'Ajouter une Vidéo'
                : 'Ajouter une Photo ou Vidéo'}
            </h3>
            <p className="text-xs text-stone-500">
              {isEditing ? (
                'Ajustez votre souvenir de couple'
              ) : (
                <>
                  Partagé par <span className="font-semibold text-rose-600">{authorName}</span>
                </>
              )}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Main Media Dropzone / Upload Area */}
          <div className="space-y-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoFileChange}
              className="hidden"
            />
            <input
              ref={videoInputRef}
              type="file"
              accept="video/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleVideoFile(file);
              }}
              className="hidden"
            />

            {/* Processing banner */}
            {isProcessingMedia && (
              <div className="p-3 bg-purple-50 border border-purple-200 text-purple-900 rounded-2xl text-xs flex items-center gap-2.5 animate-pulse">
                <Sparkles className="w-4 h-4 text-purple-600 animate-spin shrink-0" />
                <span className="font-medium">{processingStatusText || 'Traitement en cours...'}</span>
              </div>
            )}

            {(photoUrl && photoUrl.trim() !== '') || (videoUrl && videoUrl.trim() !== '') ? (
              <div className="relative rounded-2xl overflow-hidden border-2 border-rose-200 bg-stone-900/5 group">
                {/* Ambient blur background */}
                {photoUrl && (
                  <img
                    src={photoUrl}
                    alt=""
                    aria-hidden="true"
                    className="absolute inset-0 w-full h-full object-cover blur-xl opacity-25 scale-110 pointer-events-none"
                  />
                )}

                {/* Uncropped preview or Video Player */}
                <div className="relative flex items-center justify-center min-h-[200px] max-h-[320px] p-2 bg-black/5">
                  {mediaType === 'video' ? (
                    <div className="relative max-h-[300px] w-full flex items-center justify-center rounded-xl overflow-hidden shadow-md bg-black">
                      <SleekLoveVideoPlayer
                        src={resolvedVideoSrc || videoUrl || photoUrl}
                        poster={photoUrl}
                        compact={true}
                        className="max-h-[300px] w-full"
                      />
                    </div>
                  ) : (
                    <img
                      src={photoUrl}
                      alt="Aperçu du souvenir"
                      className="max-h-[300px] w-auto max-w-full object-contain rounded-xl drop-shadow-sm"
                    />
                  )}
                </div>

                {/* Top left duration badge if video */}
                {mediaType === 'video' && (
                  <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 z-10 pointer-events-none">
                    <span className="px-2.5 py-1 rounded-full bg-black/75 text-purple-300 backdrop-blur-md text-[11px] font-bold border border-purple-400/40 flex items-center gap-1 shadow-md">
                      <Video className="w-3.5 h-3.5" />
                      <span>{videoDuration ? formatVideoDuration(videoDuration) : 'Vidéo'}</span>
                    </span>
                  </div>
                )}

                {/* Top action buttons */}
                <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 z-10">
                  <button
                    type="button"
                    onClick={() => setShowCameraModal(true)}
                    className="px-2.5 py-1.5 bg-black/75 hover:bg-black/90 text-white rounded-xl text-xs font-semibold backdrop-blur-md flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
                    title="Prendre une photo en direct"
                  >
                    <Camera className="w-3.5 h-3.5 text-rose-400" />
                    <span className="hidden sm:inline">Caméra</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-2.5 py-1.5 bg-black/75 hover:bg-black/90 text-white rounded-xl text-xs font-semibold backdrop-blur-md flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
                    title="Changer de photo"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Photo</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => videoInputRef.current?.click()}
                    className="px-2.5 py-1.5 bg-purple-900/80 hover:bg-purple-900 text-white rounded-xl text-xs font-semibold backdrop-blur-md flex items-center gap-1.5 shadow-md transition-all cursor-pointer border border-purple-400/30"
                    title="Changer de vidéo"
                  >
                    <Video className="w-3.5 h-3.5 text-purple-300" />
                    <span className="hidden sm:inline">Vidéo</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPhotoUrl('');
                      setVideoUrl('');
                      setMediaType('image');
                      setVideoDuration(undefined);
                      setResolvedVideoSrc('');
                    }}
                    className="p-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs backdrop-blur-md shadow-md transition-all cursor-pointer"
                    title="Retirer ce média"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              /* Three distinct options: Direct Live Camera & File Upload & Video Upload */
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {/* 1. Direct Live Camera Capture */}
                <button
                  type="button"
                  onClick={() => setShowCameraModal(true)}
                  className="border-2 border-rose-200 hover:border-rose-400 bg-rose-50/50 hover:bg-rose-100/60 rounded-2xl p-3 text-center cursor-pointer transition-all flex flex-col items-center justify-center group shadow-2xs active:scale-98"
                >
                  <div className="w-10 h-10 rounded-2xl bg-rose-600 text-white flex items-center justify-center shadow-md mb-2 group-hover:scale-110 transition-transform">
                    <Camera className="w-5 h-5" />
                  </div>
                  <h4 className="font-bold text-stone-900 text-xs">
                    Prendre photo
                  </h4>
                  <p className="text-[10px] text-stone-500 mt-0.5 leading-tight">
                    Caméra directe
                  </p>
                </button>

                {/* 2. Choose from files / photo library */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-stone-200 hover:border-stone-400 bg-stone-50/70 hover:bg-stone-100/80 rounded-2xl p-3 text-center cursor-pointer transition-all flex flex-col items-center justify-center group active:scale-98"
                >
                  <div className="w-10 h-10 rounded-2xl bg-stone-700 text-white flex items-center justify-center shadow-md mb-2 group-hover:scale-110 transition-transform">
                    <Upload className="w-5 h-5" />
                  </div>
                  <h4 className="font-bold text-stone-900 text-xs">
                    Choisir photo
                  </h4>
                  <p className="text-[10px] text-stone-500 mt-0.5 leading-tight">
                    Pellicule images
                  </p>
                </button>

                {/* 3. Choose video */}
                <button
                  type="button"
                  onClick={() => videoInputRef.current?.click()}
                  className="border-2 border-purple-200 hover:border-purple-400 bg-purple-50/50 hover:bg-purple-100/60 rounded-2xl p-3 text-center cursor-pointer transition-all flex flex-col items-center justify-center group shadow-2xs active:scale-98"
                >
                  <div className="w-10 h-10 rounded-2xl bg-purple-600 text-white flex items-center justify-center shadow-md mb-2 group-hover:scale-110 transition-transform">
                    <Video className="w-5 h-5" />
                  </div>
                  <h4 className="font-bold text-stone-900 text-xs text-purple-900">
                    Importer vidéo
                  </h4>
                  <p className="text-[10px] text-stone-500 mt-0.5 leading-tight">
                    Fichiers MP4/MOV
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

          {/* Simple Optional Note / Caption */}
          <div>
            <label className="text-xs font-semibold text-stone-600 block mb-1">
              Légende ou mot doux <span className="text-stone-400 font-normal">(optionnel)</span>
            </label>
            <input
              type="text"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder={mediaType === 'video' ? 'Ex: Notre danse complice...' : 'Ex: Mon amour, notre soirée...'}
              className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm text-stone-800 placeholder-stone-400 focus:outline-hidden focus:ring-2 focus:ring-rose-400"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between gap-2 pt-3 border-t border-stone-100">
            {isEditing && initialMemory && onDeleteMemory ? (
              <button
                type="button"
                onClick={() => {
                  if (confirm('Voulez-vous vraiment supprimer ce souvenir ?')) {
                    onDeleteMemory(initialMemory.id);
                    onClose();
                  }
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
                disabled={isProcessingMedia || (!photoUrl && !videoUrl && !caption.trim())}
                className={`px-5 py-2.5 rounded-xl text-white text-xs font-bold shadow-md transition-all flex items-center gap-1.5 ${
                  !photoUrl && !videoUrl && !caption.trim()
                    ? 'bg-stone-300 cursor-not-allowed opacity-70'
                    : 'bg-rose-500 hover:bg-rose-600 hover:scale-[1.02] active:scale-95 cursor-pointer'
                }`}
              >
                <Heart className="w-3.5 h-3.5 fill-white" />
                <span>
                  {isEditing
                    ? 'Enregistrer'
                    : mediaType === 'video'
                    ? 'Ajouter la vidéo'
                    : 'Ajouter la photo'}
                </span>
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
          setVideoUrl('');
          setMediaType('image');
          setVideoDuration(undefined);
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
