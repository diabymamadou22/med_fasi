import React, { useState, useMemo, useRef } from 'react';
import { motion } from 'motion/react';
import {
  Images,
  Plus,
  Camera,
  Video,
  Play,
  Film,
  Upload,
  Trash2,
  Download,
  Loader2,
  Sparkles,
} from 'lucide-react';
import {
  CoupleProfile,
  PartnerId,
  TimelineMemory,
  MemoryLocation,
  TimeCapsule,
  CoupleChallenge,
} from '../../types';
import { soundEffects } from '../../lib/audio';
import { triggerHeartConfetti } from '../../lib/confetti';
import { MobilePhotoViewer, PhotoViewerItem } from '../MobilePhotoViewer';
import { CameraCaptureModal } from '../modals/CameraCaptureModal';
import { processPhotoWithoutCropping } from '../../lib/imageUtils';
import {
  extractVideoThumbnail,
  storeMediaBlob,
  formatVideoDuration,
} from '../../lib/videoUtils';

export type GallerySourceType =
  | 'all'
  | 'video'
  | 'memory'
  | 'profile'
  | 'location'
  | 'capsule'
  | 'challenge';

export type GalleryMediaMode = 'all' | 'photos' | 'videos';

export interface GalleryItem {
  id: string;
  sourceType: 'memory' | 'profile' | 'location' | 'capsule' | 'challenge';
  sourceLabel: string;
  title: string;
  photoUrl: string;
  mediaType?: 'image' | 'video';
  videoUrl?: string;
  videoDuration?: string;
  date?: string;
  locationName?: string;
  description?: string;
  authorId: PartnerId | 'both';
  likes?: PartnerId[];
  tags?: string[];
  originalEntityId?: string;
}

interface SharedGalleryViewProps {
  profile: CoupleProfile;
  activePartnerId: PartnerId;
  memories: TimelineMemory[];
  locations: MemoryLocation[];
  capsules: TimeCapsule[];
  challenges: CoupleChallenge[];
  onLikeMemory?: (memoryId: string) => void;
  onAddMemory?: (memory: Omit<TimelineMemory, 'id' | 'likes'>) => void;
  onOpenAddMemoryModal: (defaultType?: 'image' | 'video') => void;
  onOpenProfileModal: (pId?: PartnerId) => void;
  onEditMemory?: (memory: TimelineMemory) => void;
  onDeleteMemory?: (memoryId: string) => void;
  onDeleteMediaItem?: (item: GalleryItem) => void;
  onRemovePhotoOnly?: (item: GalleryItem) => void;
}

export const SharedGalleryView: React.FC<SharedGalleryViewProps> = ({
  profile,
  activePartnerId,
  memories,
  locations,
  capsules,
  challenges,
  onLikeMemory,
  onAddMemory,
  onOpenAddMemoryModal,
  onOpenProfileModal,
  onEditMemory,
  onDeleteMemory,
  onDeleteMediaItem,
  onRemovePhotoOnly,
}) => {
  const [activeLightboxIndex, setActiveLightboxIndex] = useState<number | null>(null);
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string>('');

  const photoFileInputRef = useRef<HTMLInputElement>(null);
  const videoFileInputRef = useRef<HTMLInputElement>(null);

  // Compile all photos & videos into unified items
  const allGalleryItems: GalleryItem[] = useMemo(() => {
    const items: GalleryItem[] = [];

    // 1. Profile photos
    if (profile.partner1?.avatar) {
      items.push({
        id: 'profile-p1',
        sourceType: 'profile',
        sourceLabel: 'Profil',
        title: `Portrait de ${profile.partner1.name}`,
        photoUrl: profile.partner1.avatar,
        date: profile.anniversaryDate,
        locationName: 'Notre cocon',
        authorId: 'p1',
        tags: ['Profil'],
      });
    }

    if (profile.partner2?.avatar) {
      items.push({
        id: 'profile-p2',
        sourceType: 'profile',
        sourceLabel: 'Profil',
        title: `Portrait de ${profile.partner2.name}`,
        photoUrl: profile.partner2.avatar,
        date: profile.anniversaryDate,
        locationName: 'Notre cocon',
        authorId: 'p2',
        tags: ['Profil'],
      });
    }

    // 2. Timeline Memories
    memories.forEach((mem) => {
      const isVideo = Boolean(
        mem.mediaType === 'video' ||
        mem.videoUrl ||
        mem.photoUrl?.startsWith('data:video/')
      );
      if ((mem.photoUrl && mem.photoUrl.trim().length > 0) || isVideo) {
        items.push({
          id: `mem-${mem.id}`,
          sourceType: 'memory',
          sourceLabel: isVideo ? 'Vidéo' : 'Souvenir',
          title: mem.title,
          photoUrl: mem.photoUrl || '',
          mediaType: isVideo ? 'video' : 'image',
          videoUrl: mem.videoUrl,
          videoDuration: mem.videoDuration,
          date: mem.date,
          locationName: mem.locationName,
          description: mem.description,
          authorId: mem.authorId,
          likes: mem.likes,
          tags: mem.tags || [],
          originalEntityId: mem.id,
        });
      }
    });

    // 3. Locations
    locations.forEach((loc) => {
      if (loc.photoUrl && loc.photoUrl.trim().length > 0) {
        items.push({
          id: `loc-${loc.id}`,
          sourceType: 'location',
          sourceLabel: 'Lieu',
          title: loc.name,
          photoUrl: loc.photoUrl,
          date: loc.date,
          locationName: loc.city,
          description: loc.description,
          authorId: 'both',
          tags: ['Lieu'],
          originalEntityId: loc.id,
        });
      }
    });

    // 4. Capsules
    capsules.forEach((cap) => {
      if (cap.photoUrl && cap.photoUrl.trim().length > 0) {
        items.push({
          id: `cap-${cap.id}`,
          sourceType: 'capsule',
          sourceLabel: 'Capsule',
          title: cap.title,
          photoUrl: cap.photoUrl,
          date: cap.createdAt,
          description: cap.message,
          authorId: cap.authorId,
          tags: ['Capsule'],
          originalEntityId: cap.id,
        });
      }
    });

    // 5. Challenges
    challenges.forEach((chal) => {
      if (chal.photoProof && chal.photoProof.trim().length > 0) {
        items.push({
          id: `chal-${chal.id}`,
          sourceType: 'challenge',
          sourceLabel: 'Défi',
          title: chal.title,
          photoUrl: chal.photoProof,
          date: chal.completedDate,
          description: chal.description,
          authorId: 'both',
          tags: ['Défi'],
          originalEntityId: chal.id,
        });
      }
    });

    // Unique IDs & Sort by date (newest first)
    const seenIds = new Set<string>();
    const uniqueItems: GalleryItem[] = [];
    for (const item of items) {
      let uniqueId = item.id;
      let counter = 1;
      while (seenIds.has(uniqueId)) {
        uniqueId = `${item.id}-${counter++}`;
      }
      seenIds.add(uniqueId);
      uniqueItems.push({ ...item, id: uniqueId });
    }

    return uniqueItems.sort((a, b) => {
      const dateA = a.date ? new Date(a.date).getTime() : 0;
      const dateB = b.date ? new Date(b.date).getTime() : 0;
      return dateB - dateA;
    });
  }, [profile, memories, locations, capsules, challenges]);

  // Handle direct photo upload
  const handlePhotoFilesSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    const total = files.length;

    try {
      for (let i = 0; i < total; i++) {
        const file = files[i];
        setUploadStatus(`Importation de la photo ${i + 1}/${total}...`);

        if (file.type.startsWith('video/')) {
          await processSingleVideo(file);
          continue;
        }

        const dataUrl = await processPhotoWithoutCropping(file, 1400, 0.85);
        const fileName = file.name.replace(/\.[^/.]+$/, '').trim();
        const title = fileName && fileName.length > 1 ? fileName : 'Photo souvenir';

        if (onAddMemory) {
          onAddMemory({
            title,
            photoUrl: dataUrl,
            date: new Date().toISOString().split('T')[0],
            category: 'souvenir',
            description: 'Photo importée dans notre galerie',
            authorId: activePartnerId,
            tags: ['Galerie'],
          });
        }
      }

      soundEffects.playSuccessSparkle();
      triggerHeartConfetti();
    } catch (err) {
      console.error('Erreur importation photo:', err);
      alert("Une erreur est survenue lors de l'importation de la photo.");
    } finally {
      setIsUploading(false);
      setUploadStatus('');
      if (photoFileInputRef.current) photoFileInputRef.current.value = '';
    }
  };

  // Helper for single video processing
  const processSingleVideo = async (file: File) => {
    const meta = await extractVideoThumbnail(file);
    const mediaKey = `vid_mem_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const idbRef = await storeMediaBlob(mediaKey, file);
    const fileName = file.name.replace(/\.[^/.]+$/, '').trim();
    const title = fileName && fileName.length > 1 ? fileName : 'Vidéo souvenir';

    if (onAddMemory) {
      onAddMemory({
        title,
        photoUrl: meta.thumbnailDataUrl,
        videoUrl: idbRef,
        mediaType: 'video',
        videoDuration: meta.duration ? formatVideoDuration(meta.duration) : undefined,
        date: new Date().toISOString().split('T')[0],
        category: 'souvenir',
        description: 'Vidéo importée dans notre galerie',
        authorId: activePartnerId,
        tags: ['Galerie', 'Vidéo'],
      });
    }
  };

  // Handle direct video upload
  const handleVideoFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadStatus('Traitement de la vidéo...');

    try {
      await processSingleVideo(file);
      soundEffects.playSuccessSparkle();
      triggerHeartConfetti();
    } catch (err) {
      console.error('Erreur importation vidéo:', err);
      alert("Impossible d'importer cette vidéo. Vérifiez le format du fichier.");
    } finally {
      setIsUploading(false);
      setUploadStatus('');
      if (videoFileInputRef.current) videoFileInputRef.current.value = '';
    }
  };

  // Handle photo from live camera
  const handlePhotoCapturedFromCamera = (dataUrl: string, caption?: string) => {
    if (onAddMemory) {
      onAddMemory({
        title: caption && caption.trim() ? caption.trim() : 'Photo capturée en direct',
        photoUrl: dataUrl,
        date: new Date().toISOString().split('T')[0],
        category: 'souvenir',
        description: 'Photo prise avec la caméra',
        authorId: activePartnerId,
        tags: ['Galerie', 'En direct'],
      });
      soundEffects.playSuccessSparkle();
      triggerHeartConfetti();
    }
  };

  // Direct download
  const handleDownload = (item: GalleryItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      const link = document.createElement('a');
      link.href = item.videoUrl || item.photoUrl;
      link.download = `${item.title ? item.title.replace(/[^a-z0-9]/gi, '_').toLowerCase() : 'souvenir'}-${item.id}.${
        item.mediaType === 'video' ? 'mp4' : 'jpg'
      }`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Erreur téléchargement:', err);
    }
  };

  // Lightbox items mapping
  const photoViewerItems: PhotoViewerItem[] = useMemo(() => {
    return allGalleryItems.map((item) => {
      const author =
        item.authorId === 'p1'
          ? profile.partner1
          : item.authorId === 'p2'
          ? profile.partner2
          : null;

      const mem =
        item.sourceType === 'memory' && item.originalEntityId
          ? memories.find((m) => m.id === item.originalEntityId)
          : null;

      return {
        id: item.id,
        photoUrl: item.photoUrl,
        mediaType: item.mediaType,
        videoUrl: item.videoUrl,
        videoDuration: undefined,
        title: item.title,
        description: item.description,
        date: item.date,
        locationName: item.locationName,
        badgeLabel: item.mediaType === 'video' ? 'Vidéo' : item.sourceLabel,
        badgeBg: item.mediaType === 'video' ? 'bg-purple-100 text-purple-700' : 'bg-rose-100 text-rose-700',
        authorId: item.authorId,
        authorName: author?.name || (item.authorId === 'both' ? 'En duo' : undefined),
        authorAvatar: author?.avatar,
        isLiked: item.likes?.includes(activePartnerId),
        likeCount: item.likes?.length,
        tags: item.tags,
        onLike:
          item.sourceType === 'memory' && item.originalEntityId && onLikeMemory
            ? () => onLikeMemory(item.originalEntityId!)
            : undefined,
        onDelete: onDeleteMediaItem
          ? () => onDeleteMediaItem(item)
          : item.sourceType === 'memory' && item.originalEntityId && onDeleteMemory
          ? () => onDeleteMemory(item.originalEntityId!)
          : undefined,
        onEdit: mem && onEditMemory ? () => onEditMemory(mem) : undefined,
        onRemovePhotoOnly: onRemovePhotoOnly ? () => onRemovePhotoOnly(item) : undefined,
      };
    });
  }, [
    allGalleryItems,
    profile.partner1,
    profile.partner2,
    activePartnerId,
    memories,
    onLikeMemory,
    onDeleteMediaItem,
    onDeleteMemory,
    onEditMemory,
    onRemovePhotoOnly,
  ]);

  return (
    <div className="max-w-6xl mx-auto px-3.5 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
      {/* Hidden File Inputs for Direct Native Pickers */}
      <input
        type="file"
        ref={photoFileInputRef}
        onChange={handlePhotoFilesSelected}
        accept="image/*"
        multiple
        className="hidden"
      />
      <input
        type="file"
        ref={videoFileInputRef}
        onChange={handleVideoFileSelected}
        accept="video/*"
        className="hidden"
      />

      {/* 1. Header Simple & Clean avec Boutons d'Importation */}
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-stone-200/80 p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <Images className="w-4 h-4" />
            </div>
            <h1 className="text-lg sm:text-xl font-bold text-stone-900 font-serif-romantic tracking-tight">
              Galerie Photos & Vidéos
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-stone-500 mt-0.5 ml-10">
            {allGalleryItems.length === 0
              ? 'Aucun média pour le moment'
              : `${allGalleryItems.length} souvenir${allGalleryItems.length > 1 ? 's' : ''} partagé${
                  allGalleryItems.length > 1 ? 's' : ''
                }`}
          </p>
        </div>

        {/* Boutons d'importation très simples */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* Importer Photo */}
          <button
            type="button"
            onClick={() => {
              soundEffects.playSoftTap();
              photoFileInputRef.current?.click();
            }}
            disabled={isUploading}
            className="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-white text-xs sm:text-sm font-semibold shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            title="Importer une ou plusieurs photos depuis votre appareil"
          >
            <Upload className="w-4 h-4" />
            <span>Importer photo</span>
          </button>

          {/* Importer Vidéo */}
          <button
            type="button"
            onClick={() => {
              soundEffects.playSoftTap();
              videoFileInputRef.current?.click();
            }}
            disabled={isUploading}
            className="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 active:scale-95 text-white text-xs sm:text-sm font-semibold shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            title="Importer une vidéo souvenir"
          >
            <Video className="w-4 h-4" />
            <span>Importer vidéo</span>
          </button>

          {/* Prendre Photo Caméra */}
          <button
            type="button"
            onClick={() => {
              soundEffects.playSoftTap();
              setShowCameraModal(true);
            }}
            disabled={isUploading}
            className="p-2 sm:px-3 sm:py-2 rounded-xl bg-stone-100 hover:bg-stone-200 active:scale-95 text-stone-700 text-xs sm:text-sm font-medium transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            title="Prendre une photo en direct"
          >
            <Camera className="w-4 h-4 text-stone-600" />
            <span className="hidden sm:inline">Caméra</span>
          </button>

          {/* Ajouter avec Titre & Note (Modal détaillé) */}
          <button
            type="button"
            onClick={() => {
              soundEffects.playNoteClick();
              onOpenAddMemoryModal('image');
            }}
            className="p-2 sm:p-2 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-600 hover:text-stone-900 transition-colors"
            title="Ajouter un souvenir avec titre, note et date"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Uploading Status Banner */}
      {isUploading && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-3 flex items-center justify-center gap-2 text-xs sm:text-sm text-rose-700 font-medium animate-pulse">
          <Loader2 className="w-4 h-4 animate-spin text-rose-600" />
          <span>{uploadStatus || 'Importation en cours...'}</span>
        </div>
      )}

      {/* 2. Simple, Beautiful Media Grid */}
      {allGalleryItems.length === 0 ? (
        <div className="bg-white rounded-3xl border border-dashed border-stone-200 p-8 sm:p-12 text-center max-w-md mx-auto space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center mx-auto">
            <Images className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-stone-800 font-serif-romantic">
              Votre galerie est vide
            </h3>
            <p className="text-xs sm:text-sm text-stone-500 mt-1">
              Importez vos photos et vidéos de couple pour les retrouver toutes au même endroit.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-2 pt-2">
            <button
              type="button"
              onClick={() => photoFileInputRef.current?.click()}
              className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs sm:text-sm font-semibold shadow-xs flex items-center gap-2 cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              <span>Importer une photo</span>
            </button>
            <button
              type="button"
              onClick={() => videoFileInputRef.current?.click()}
              className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs sm:text-sm font-semibold shadow-xs flex items-center gap-2 cursor-pointer"
            >
              <Video className="w-4 h-4" />
              <span>Importer une vidéo</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-3.5">
          {allGalleryItems.map((item, index) => {
            const isVideo = item.mediaType === 'video';

            return (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.15, delay: Math.min(index * 0.015, 0.2) }}
                onClick={() => {
                  soundEffects.playNoteClick();
                  setActiveLightboxIndex(index);
                }}
                className="group relative aspect-square rounded-xl sm:rounded-2xl overflow-hidden bg-stone-100 border border-stone-200/80 shadow-2xs hover:shadow-md transition-all cursor-pointer select-none"
              >
                {/* Media Image / Video Thumbnail */}
                <img
                  src={item.photoUrl}
                  alt={item.title || 'Souvenir'}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />

                {/* Video Play Overlay */}
                {isVideo && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/25 group-hover:bg-black/40 transition-colors">
                    <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-white/90 text-stone-900 flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                      <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-stone-900 ml-0.5" />
                    </div>
                  </div>
                )}

                {/* Video duration pill */}
                {isVideo && item.videoDuration && (
                  <div className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded-md bg-black/75 text-white text-[10px] font-medium flex items-center gap-1">
                    <Film className="w-2.5 h-2.5 text-rose-400" />
                    <span>{item.videoDuration}</span>
                  </div>
                )}

                {/* Quick actions on hover (Desktop) */}
                <div className="absolute top-1.5 right-1.5 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    onClick={(e) => handleDownload(item, e)}
                    className="p-1.5 rounded-full bg-black/60 hover:bg-black/80 text-white backdrop-blur-xs transition-colors"
                    title="Télécharger"
                  >
                    <Download className="w-3 h-3" />
                  </button>
                  {onDeleteMediaItem && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        soundEffects.playTrashDelete();
                        onDeleteMediaItem(item);
                      }}
                      className="p-1.5 rounded-full bg-rose-600/80 hover:bg-rose-700 text-white backdrop-blur-xs transition-colors"
                      title="Supprimer"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Fullscreen Photo & Video Viewer */}
      <MobilePhotoViewer
        items={photoViewerItems}
        initialIndex={activeLightboxIndex ?? 0}
        isOpen={activeLightboxIndex !== null}
        onClose={() => setActiveLightboxIndex(null)}
        onIndexChange={(newIndex) => setActiveLightboxIndex(newIndex)}
      />

      {/* Live Camera Viewfinder Modal */}
      <CameraCaptureModal
        isOpen={showCameraModal}
        onClose={() => setShowCameraModal(false)}
        onPhotoCaptured={handlePhotoCapturedFromCamera}
        title="Prendre une photo"
        subtitle="Capturez cet instant à deux pour la galerie"
        submitLabel="Ajouter à la galerie"
        allowCaption={true}
      />
    </div>
  );
};
