import React, { useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
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
  Calendar,
  CalendarDays,
  FolderHeart,
  LayoutGrid,
  ChevronRight,
  ArrowLeft,
  Heart,
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
import { useBackHandler } from '../../lib/backNavigation';
import { processPhotoWithoutCropping } from '../../lib/imageUtils';
import {
  extractVideoThumbnail,
  storeMediaBlob,
  formatVideoDuration,
} from '../../lib/videoUtils';
import {
  groupGalleryItemsByDate,
  MonthAlbum,
  YearGroup,
} from '../../lib/albumUtils';

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

  useBackHandler(showCameraModal, () => setShowCameraModal(false), 'gallery-camera-modal');

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

  // Drag & drop state for multiple media upload
  const [isDragOver, setIsDragOver] = useState(false);

  // View modes: 'timeline' (grouped chronologically by month), 'albums' (automatic monthly album cards), 'grid' (continuous flat grid)
  const [viewMode, setViewMode] = useState<'timeline' | 'albums' | 'grid'>('timeline');

  // Selected Album for focused exploration
  const [selectedAlbumId, setSelectedAlbumId] = useState<string | null>(null);

  // Year filter ('all', specific year number, or 'undated')
  const [selectedYear, setSelectedYear] = useState<number | 'all' | 'undated'>('all');

  // Media type filter ('all', 'photos', 'videos')
  const [mediaFilter, setMediaFilter] = useState<'all' | 'photos' | 'videos'>('all');

  // Lightbox context items
  const [lightboxContextItems, setLightboxContextItems] = useState<GalleryItem[] | null>(null);

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

  // Unified batch media importer (supports multiple photos, videos, or mixed)
  const handleMediaFiles = async (files: FileList | File[]) => {
    if (!files || files.length === 0) return;

    setIsUploading(true);
    const total = files.length;
    let successCount = 0;

    try {
      for (let i = 0; i < total; i++) {
        const file = files[i];
        const isVideo = file.type.startsWith('video/');
        setUploadStatus(
          total > 1
            ? `Importation de ${i + 1}/${total} (${isVideo ? 'vidéo' : 'photo'})...`
            : isVideo
            ? 'Traitement de la vidéo...'
            : 'Optimisation de la photo...'
        );

        try {
          if (isVideo) {
            await processSingleVideo(file);
          } else {
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
          successCount++;
          // Small pause between items to ensure clean ordering
          await new Promise((resolve) => setTimeout(resolve, 100));
        } catch (fileErr) {
          console.error(`Erreur sur le fichier ${file.name}:`, fileErr);
        }
      }

      if (successCount > 0) {
        soundEffects.playSuccessSparkle();
        triggerHeartConfetti();
      }
    } catch (err) {
      console.error('Erreur importation médias:', err);
      alert("Une erreur est survenue lors de l'importation de vos médias.");
    } finally {
      setIsUploading(false);
      setUploadStatus('');
      if (photoFileInputRef.current) photoFileInputRef.current.value = '';
      if (videoFileInputRef.current) videoFileInputRef.current.value = '';
    }
  };

  // Handle direct photo & video file selection
  const handlePhotoFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleMediaFiles(e.target.files);
    }
  };

  // Handle direct video file selection
  const handleVideoFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleMediaFiles(e.target.files);
    }
  };

  // Drag & drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleMediaFiles(e.dataTransfer.files);
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

  // Filter items by media type (photos vs videos)
  const filteredGalleryItems = useMemo(() => {
    if (mediaFilter === 'photos') {
      return allGalleryItems.filter((i) => i.mediaType !== 'video');
    }
    if (mediaFilter === 'videos') {
      return allGalleryItems.filter((i) => i.mediaType === 'video');
    }
    return allGalleryItems;
  }, [allGalleryItems, mediaFilter]);

  // Group into MonthAlbums and YearGroups automatically!
  const { albums, yearGroups, availableYears, totalPhotos, totalVideos } = useMemo(() => {
    return groupGalleryItemsByDate(filteredGalleryItems);
  }, [filteredGalleryItems]);

  // Active focused album if selected
  const activeAlbum = useMemo(() => {
    if (!selectedAlbumId) return null;
    return albums.find((a) => a.id === selectedAlbumId) || null;
  }, [albums, selectedAlbumId]);

  // Filter albums by selected year if active
  const displayedAlbums = useMemo(() => {
    if (selectedYear === 'all') return albums;
    if (selectedYear === 'undated') {
      return albums.filter((a) => a.year === null);
    }
    return albums.filter((a) => a.year === selectedYear);
  }, [albums, selectedYear]);

  // Items to display in continuous grid view (filtered by year if applicable)
  const gridDisplayedItems = useMemo(() => {
    if (selectedYear === 'all') return filteredGalleryItems;
    if (selectedYear === 'undated') {
      return filteredGalleryItems.filter(
        (item) => !item.date || isNaN(new Date(item.date).getTime())
      );
    }
    return filteredGalleryItems.filter((item) => {
      if (!item.date) return false;
      const d = new Date(item.date);
      return !isNaN(d.getTime()) && d.getFullYear() === selectedYear;
    });
  }, [filteredGalleryItems, selectedYear]);

  // Contextual items currently for Lightbox
  const currentLightboxItems = useMemo(() => {
    return (
      lightboxContextItems ||
      (activeAlbum ? activeAlbum.items : filteredGalleryItems)
    );
  }, [lightboxContextItems, activeAlbum, filteredGalleryItems]);

  const openLightboxForItem = (
    item: GalleryItem,
    contextItems?: GalleryItem[]
  ) => {
    const list =
      contextItems || (activeAlbum ? activeAlbum.items : filteredGalleryItems);
    setLightboxContextItems(list);
    const idx = list.findIndex((x) => x.id === item.id);
    setActiveLightboxIndex(idx >= 0 ? idx : 0);
  };

  // Lightbox items mapping
  const photoViewerItems: PhotoViewerItem[] = useMemo(() => {
    return currentLightboxItems.map((item) => {
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
        videoDuration: item.videoDuration,
        title: item.title,
        description: item.description,
        date: item.date,
        locationName: item.locationName,
        badgeLabel: item.mediaType === 'video' ? 'Vidéo' : item.sourceLabel,
        badgeBg:
          item.mediaType === 'video'
            ? 'bg-purple-100 text-purple-700'
            : 'bg-rose-100 text-rose-700',
        authorId: item.authorId,
        authorName:
          author?.name || (item.authorId === 'both' ? 'En duo' : undefined),
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
        onRemovePhotoOnly: onRemovePhotoOnly
          ? () => onRemovePhotoOnly(item)
          : undefined,
      };
    });
  }, [
    currentLightboxItems,
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
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className="max-w-6xl mx-auto px-3.5 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6 relative"
    >
      {/* Drag & Drop Visual Dropzone Overlay */}
      {isDragOver && (
        <div className="fixed inset-0 z-50 bg-rose-950/70 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-white pointer-events-none transition-all">
          <div className="p-8 rounded-3xl bg-white/10 border-2 border-dashed border-rose-300 text-center max-w-md shadow-2xl">
            <Upload className="w-14 h-14 text-rose-300 mx-auto mb-4 animate-bounce" />
            <h3 className="text-xl font-bold font-serif-romantic">
              Déposez vos photos et vidéos complices
            </h3>
            <p className="text-xs sm:text-sm text-rose-200 mt-2">
              Toutes vos photos et vidéos sélectionnées seront importées ensemble dans votre galerie ❤️
            </p>
          </div>
        </div>
      )}

      {/* Hidden File Inputs for Direct Native Pickers */}
      <input
        type="file"
        ref={photoFileInputRef}
        onChange={handlePhotoFilesSelected}
        accept="image/*,video/*"
        multiple
        className="hidden"
      />
      <input
        type="file"
        ref={videoFileInputRef}
        onChange={handleVideoFilesSelected}
        accept="video/*"
        multiple
        className="hidden"
      />

      {/* 1. Header Principal avec Statistiques et Boutons d'Importation */}
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
              : `${allGalleryItems.length} souvenir${
                  allGalleryItems.length > 1 ? 's' : ''
                } • ${albums.length} album${albums.length > 1 ? 's' : ''} mensuel${
                  albums.length > 1 ? 's' : ''
                }`}
          </p>
        </div>

        {/* Boutons d'action et d'importation */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* Importer Photos & Vidéos (Multiple) */}
          <button
            type="button"
            onClick={() => {
              soundEffects.playSoftTap();
              photoFileInputRef.current?.click();
            }}
            disabled={isUploading}
            className="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-white text-xs sm:text-sm font-semibold shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            title="Importer plusieurs photos et vidéos à la fois"
          >
            <Upload className="w-4 h-4" />
            <span>Importer photos & vidéos</span>
          </button>

          {/* Importer Vidéos (Multiple) */}
          <button
            type="button"
            onClick={() => {
              soundEffects.playSoftTap();
              videoFileInputRef.current?.click();
            }}
            disabled={isUploading}
            className="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 active:scale-95 text-white text-xs sm:text-sm font-semibold shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            title="Importer une ou plusieurs vidéos souvenirs"
          >
            <Video className="w-4 h-4" />
            <span>Importer vidéos</span>
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
            className="p-2 sm:p-2 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-600 hover:text-stone-900 transition-colors cursor-pointer"
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

      {/* 2. Barre de Navigation et Modes d'Album (Par Mois, Albums, Grille) */}
      {allGalleryItems.length > 0 && !activeAlbum && (
        <div className="bg-white rounded-2xl border border-stone-200/80 p-2.5 sm:p-3 shadow-2xs space-y-2.5">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
            {/* Mode Switcher */}
            <div className="flex items-center bg-stone-100/90 p-1 rounded-xl gap-1">
              <button
                type="button"
                onClick={() => {
                  soundEffects.playSoftTap();
                  setViewMode('timeline');
                  setSelectedAlbumId(null);
                }}
                className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  viewMode === 'timeline'
                    ? 'bg-white text-stone-900 shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
                title="Regroupement automatique chronologique par mois et par année"
              >
                <CalendarDays className="w-4 h-4 text-rose-500" />
                <span>Par Mois</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  soundEffects.playSoftTap();
                  setViewMode('albums');
                  setSelectedAlbumId(null);
                }}
                className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  viewMode === 'albums'
                    ? 'bg-white text-stone-900 shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
                title="Albums photo mensuels automatiques avec couvertures"
              >
                <FolderHeart className="w-4 h-4 text-rose-500" />
                <span>Albums</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-rose-100 text-rose-700 font-medium">
                  {albums.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  soundEffects.playSoftTap();
                  setViewMode('grid');
                  setSelectedAlbumId(null);
                }}
                className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-white text-stone-900 shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
                title="Affichage continu de tous les médias"
              >
                <LayoutGrid className="w-4 h-4 text-stone-500" />
                <span>Grille</span>
              </button>
            </div>

            {/* Media Type Filter Pills (Tous, Photos, Vidéos) */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 sm:pb-0 scrollbar-none">
              <button
                type="button"
                onClick={() => {
                  soundEffects.playSoftTap();
                  setMediaFilter('all');
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
                  mediaFilter === 'all'
                    ? 'bg-stone-900 text-white shadow-2xs'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                Tous ({allGalleryItems.length})
              </button>

              <button
                type="button"
                onClick={() => {
                  soundEffects.playSoftTap();
                  setMediaFilter('photos');
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all whitespace-nowrap cursor-pointer flex items-center gap-1 ${
                  mediaFilter === 'photos'
                    ? 'bg-rose-600 text-white shadow-2xs'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                <span>Photos ({totalPhotos})</span>
              </button>

              {totalVideos > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    soundEffects.playSoftTap();
                    setMediaFilter('videos');
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all whitespace-nowrap cursor-pointer flex items-center gap-1 ${
                    mediaFilter === 'videos'
                      ? 'bg-purple-600 text-white shadow-2xs'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}
                >
                  <span>Vidéos ({totalVideos})</span>
                </button>
              )}
            </div>
          </div>

          {/* Quick Year Selector Pills */}
          {(availableYears.length > 1 || availableYears.length === 1) && (
            <div className="pt-2 border-t border-stone-100 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
              <span className="text-[11px] text-stone-400 font-medium shrink-0 flex items-center gap-1 mr-1">
                <Calendar className="w-3 h-3 text-stone-400" />
                <span>Année :</span>
              </span>

              <button
                type="button"
                onClick={() => {
                  soundEffects.playSoftTap();
                  setSelectedYear('all');
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
                  selectedYear === 'all'
                    ? 'bg-rose-50 text-rose-700 font-semibold border border-rose-200'
                    : 'text-stone-600 hover:bg-stone-100'
                }`}
              >
                Toutes ({filteredGalleryItems.length})
              </button>

              {yearGroups.map((yg) => (
                <button
                  key={String(yg.year)}
                  type="button"
                  onClick={() => {
                    soundEffects.playSoftTap();
                    setSelectedYear(yg.year);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
                    selectedYear === yg.year
                      ? 'bg-rose-50 text-rose-700 font-semibold border border-rose-200'
                      : 'text-stone-600 hover:bg-stone-100'
                  }`}
                >
                  {yg.yearLabel} ({yg.totalItems})
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 3. Empty State */}
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
              Importez vos photos et vidéos de couple. Elles seront automatiquement organisées en albums par mois et par année !
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-2 pt-2">
            <button
              type="button"
              onClick={() => photoFileInputRef.current?.click()}
              className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs sm:text-sm font-semibold shadow-xs flex items-center gap-2 cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              <span>Importer photos & vidéos</span>
            </button>
            <button
              type="button"
              onClick={() => videoFileInputRef.current?.click()}
              className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs sm:text-sm font-semibold shadow-xs flex items-center gap-2 cursor-pointer"
            >
              <Video className="w-4 h-4" />
              <span>Importer vidéos</span>
            </button>
          </div>
        </div>
      ) : activeAlbum ? (
        /* 4. Vue Détaillée d'un Album Spécifique */
        <div className="space-y-4 sm:space-y-6">
          {/* Bannière de l'Album Sélectionné */}
          <div className="bg-gradient-to-r from-rose-50 via-pink-50 to-purple-50 rounded-2xl sm:rounded-3xl border border-rose-200/70 p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  soundEffects.playSoftTap();
                  setSelectedAlbumId(null);
                }}
                className="p-2 sm:p-2.5 rounded-xl bg-white border border-rose-200 text-stone-700 hover:bg-rose-100 hover:text-rose-900 transition-all flex items-center gap-1 text-xs sm:text-sm font-semibold cursor-pointer shadow-2xs"
                title="Revenir aux albums"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Retour aux albums</span>
              </button>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg sm:text-2xl font-bold text-stone-900 font-serif-romantic tracking-tight">
                    {activeAlbum.label}
                  </h2>
                  <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 text-xs font-semibold">
                    {activeAlbum.items.length} {activeAlbum.items.length > 1 ? 'médias' : 'média'}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-stone-600 mt-0.5">
                  {activeAlbum.photoCount} photo{activeAlbum.photoCount > 1 ? 's' : ''}
                  {activeAlbum.videoCount > 0
                    ? ` • ${activeAlbum.videoCount} vidéo${activeAlbum.videoCount > 1 ? 's' : ''}`
                    : ''}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                if (activeAlbum.items.length > 0) {
                  soundEffects.playNoteClick();
                  openLightboxForItem(activeAlbum.items[0], activeAlbum.items);
                }
              }}
              className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs sm:text-sm font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95 transition-all"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Diaporama de l'album</span>
            </button>
          </div>

          {/* Grille des photos de l'album */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-3.5">
            {activeAlbum.items.map((item, index) => (
              <MediaCard
                key={item.id}
                item={item}
                index={index}
                onClick={() => {
                  soundEffects.playNoteClick();
                  openLightboxForItem(item, activeAlbum.items);
                }}
                onDownload={(e) => handleDownload(item, e)}
                onDelete={
                  onDeleteMediaItem
                    ? () => {
                        soundEffects.playTrashDelete();
                        onDeleteMediaItem(item);
                      }
                    : undefined
                }
              />
            ))}
          </div>
        </div>
      ) : viewMode === 'albums' ? (
        /* 5. Vue Albums Automatiques (Cartes d'Albums Mensuels avec Effet Empilé) */
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm sm:text-base font-bold text-stone-800 font-serif-romantic">
              Albums mensuels ({displayedAlbums.length})
            </h2>
            <span className="text-xs text-stone-500">
              Touchez un album pour explorer ses souvenirs
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 pt-1">
            {displayedAlbums.map((album, index) => (
              <MonthAlbumCard
                key={album.id}
                album={album}
                index={index}
                onClick={() => {
                  soundEffects.playSoftTap();
                  setSelectedAlbumId(album.id);
                }}
              />
            ))}
          </div>
        </div>
      ) : viewMode === 'timeline' ? (
        /* 6. Vue Chronologique par Mois & Année (Sections avec En-têtes) */
        <div className="space-y-6 sm:space-y-8">
          {displayedAlbums.map((album) => (
            <div key={album.id} className="space-y-2.5 sm:space-y-3">
              {/* En-tête de section mensuelle élégante */}
              <div className="sticky top-2 z-20 backdrop-blur-md bg-white/95 border border-stone-200/80 rounded-xl sm:rounded-2xl px-3.5 sm:px-4 py-2 sm:py-2.5 shadow-2xs flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                    <CalendarDays className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-stone-900 font-serif-romantic tracking-tight">
                      {album.label}
                    </h3>
                  </div>
                  <span className="text-[11px] sm:text-xs text-stone-500 font-medium">
                    • {album.items.length} {album.items.length > 1 ? 'souvenirs' : 'souvenir'}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    soundEffects.playSoftTap();
                    setSelectedAlbumId(album.id);
                  }}
                  className="text-xs text-rose-600 hover:text-rose-800 font-semibold flex items-center gap-0.5 hover:underline cursor-pointer"
                  title="Ouvrir cet album"
                >
                  <span>Ouvrir l'album</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Grille de photos pour ce mois */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-3.5">
                {album.items.map((item, index) => (
                  <MediaCard
                    key={item.id}
                    item={item}
                    index={index}
                    onClick={() => {
                      soundEffects.playNoteClick();
                      openLightboxForItem(item, album.items);
                    }}
                    onDownload={(e) => handleDownload(item, e)}
                    onDelete={
                      onDeleteMediaItem
                        ? () => {
                            soundEffects.playTrashDelete();
                            onDeleteMediaItem(item);
                          }
                        : undefined
                    }
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* 7. Vue Grille Continue Classique */
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-3.5">
          {gridDisplayedItems.map((item, index) => (
            <MediaCard
              key={item.id}
              item={item}
              index={index}
              onClick={() => {
                soundEffects.playNoteClick();
                openLightboxForItem(item, gridDisplayedItems);
              }}
              onDownload={(e) => handleDownload(item, e)}
              onDelete={
                onDeleteMediaItem
                  ? () => {
                      soundEffects.playTrashDelete();
                      onDeleteMediaItem(item);
                    }
                  : undefined
              }
            />
          ))}
        </div>
      )}

      {/* Fullscreen Photo & Video Viewer */}
      <MobilePhotoViewer
        items={photoViewerItems}
        initialIndex={activeLightboxIndex ?? 0}
        isOpen={activeLightboxIndex !== null}
        onClose={() => {
          setActiveLightboxIndex(null);
          setLightboxContextItems(null);
        }}
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

// Sub-component: MediaCard for photo or video item
const MediaCard: React.FC<{
  item: GalleryItem;
  index: number;
  onClick: () => void;
  onDownload: (e: React.MouseEvent) => void;
  onDelete?: () => void;
}> = ({ item, index, onClick, onDownload, onDelete }) => {
  const isVideo = item.mediaType === 'video';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.15, delay: Math.min(index * 0.015, 0.2) }}
      onClick={onClick}
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
          onClick={onDownload}
          className="p-1.5 rounded-full bg-black/60 hover:bg-black/80 text-white backdrop-blur-xs transition-colors cursor-pointer"
          title="Télécharger"
        >
          <Download className="w-3 h-3" />
        </button>
        {onDelete && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="p-1.5 rounded-full bg-rose-600/80 hover:bg-rose-700 text-white backdrop-blur-xs transition-colors cursor-pointer"
            title="Supprimer"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        )}
      </div>
    </motion.div>
  );
};

// Sub-component: MonthAlbumCard (Automatic monthly album card with layered romantic look)
const MonthAlbumCard: React.FC<{
  album: MonthAlbum;
  index: number;
  onClick: () => void;
}> = ({ album, index, onClick }) => {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: Math.min(index * 0.03, 0.3) }}
      onClick={onClick}
      className="group relative cursor-pointer select-none"
    >
      {/* Background stacked polaroid illusion layers */}
      <div className="absolute inset-0 rounded-2xl sm:rounded-3xl bg-rose-200/40 transform rotate-2 group-hover:rotate-3 transition-transform duration-300 pointer-events-none" />
      <div className="absolute inset-0 rounded-2xl sm:rounded-3xl bg-stone-200/50 transform -rotate-1 group-hover:-rotate-2 transition-transform duration-300 pointer-events-none" />

      {/* Main Album Card */}
      <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden bg-white border border-stone-200/90 shadow-xs group-hover:shadow-xl transition-all duration-300 flex flex-col">
        {/* Cover Photo */}
        <div className="relative aspect-4/3 w-full overflow-hidden bg-stone-100">
          <img
            src={album.coverPhoto}
            alt={album.label}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-stone-950/70 via-transparent to-black/10" />

          {/* Badges on Cover */}
          <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5">
            <span className="px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-xs text-white text-[11px] font-medium shadow-xs">
              {album.items.length} {album.items.length > 1 ? 'souvenirs' : 'souvenir'}
            </span>
          </div>

          {/* Quick open hover button */}
          <div className="absolute bottom-2.5 right-2.5 w-7 h-7 rounded-full bg-white/90 text-stone-800 flex items-center justify-center opacity-0 group-hover:opacity-100 transform translate-y-1 group-hover:translate-y-0 transition-all shadow-sm">
            <ChevronRight className="w-4 h-4 text-stone-800" />
          </div>
        </div>

        {/* Album Label & Details */}
        <div className="p-3 sm:p-4 bg-white flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1">
            <h3 className="text-sm sm:text-base font-bold text-stone-900 font-serif-romantic tracking-tight group-hover:text-rose-600 transition-colors truncate">
              {album.label}
            </h3>
            {album.year && (
              <span className="text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 shrink-0">
                {album.year}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1.5 text-[11px] sm:text-xs text-stone-500">
            {album.photoCount > 0 && (
              <span className="flex items-center gap-1">
                📸 {album.photoCount} photo{album.photoCount > 1 ? 's' : ''}
              </span>
            )}
            {album.videoCount > 0 && (
              <span className="flex items-center gap-1">
                🎬 {album.videoCount} vidéo{album.videoCount > 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};
