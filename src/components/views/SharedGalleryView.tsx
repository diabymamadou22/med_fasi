import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Images,
  Heart,
  Calendar,
  MapPin,
  Tag,
  Filter,
  Search,
  Plus,
  X,
  ChevronLeft,
  ChevronRight,
  Download,
  ExternalLink,
  User,
  Sparkles,
  Camera,
  Layers,
  LayoutGrid,
  ArrowUpDown,
  Pencil,
  Trash2,
  Video,
  Film,
  Play,
  MoreHorizontal,
  Maximize2,
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
import { PartnerAvatar } from '../PartnerAvatar';
import { triggerHeartConfetti } from '../../lib/confetti';
import { MobilePhotoViewer, PhotoViewerItem } from '../MobilePhotoViewer';
import { CameraCaptureModal } from '../modals/CameraCaptureModal';

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
  // Strict separation: 'photos' | 'videos' | 'all' (defaults to 'photos' so photos and videos are never mixed)
  const [mediaMode, setMediaMode] = useState<GalleryMediaMode>('photos');
  const [selectedSource, setSelectedSource] = useState<GallerySourceType>('all');
  const [selectedPartnerFilter, setSelectedPartnerFilter] = useState<'all' | 'p1' | 'p2'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [galleryLayout, setGalleryLayout] = useState<'fit' | 'natural'>('fit');
  const [activeLightboxIndex, setActiveLightboxIndex] = useState<number | null>(null);
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // Close active dropdown on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && activeMenuId) {
        setActiveMenuId(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeMenuId]);

  const handleDownloadMedia = (item: GalleryItem) => {
    try {
      const link = document.createElement('a');
      link.href = item.videoUrl || item.photoUrl;
      link.download = `${item.title ? item.title.replace(/[^a-z0-9]/gi, '_').toLowerCase() : 'media'}-${item.id}.${
        item.mediaType === 'video' ? 'mp4' : 'jpg'
      }`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Download error:', err);
    }
  };

  const handlePhotoCapturedFromCamera = (dataUrl: string, caption?: string) => {
    if (onAddMemory) {
      onAddMemory({
        title: caption && caption.trim() ? caption.trim() : 'Photo capturée en direct',
        photoUrl: dataUrl,
        date: new Date().toISOString().split('T')[0],
        category: 'rencard',
        description: 'Photo prise sur le vif depuis la Galerie partagée',
        authorId: activePartnerId,
        tags: ['Galerie', 'En direct', 'Amour'],
      });
      soundEffects.playSuccessSparkle();
      triggerHeartConfetti();
    } else {
      onOpenAddMemoryModal();
    }
  };

  // Compile all photos across the application into unified items
  const allGalleryItems: GalleryItem[] = useMemo(() => {
    const items: GalleryItem[] = [];

    // 1. Partner Profiles Photos
    if (profile.partner1?.avatar) {
      items.push({
        id: 'profile-p1',
        sourceType: 'profile',
        sourceLabel: 'Portrait profil',
        title: `Portrait de ${profile.partner1.name}`,
        photoUrl: profile.partner1.avatar,
        date: profile.anniversaryDate,
        locationName: 'Notre cocon',
        description: `Photo de profil de ${profile.partner1.name} (${profile.partner1.nickname || 'Chérie'}).`,
        authorId: 'p1',
        tags: ['Profil', profile.partner1.name],
      });
    }

    if (profile.partner2?.avatar) {
      items.push({
        id: 'profile-p2',
        sourceType: 'profile',
        sourceLabel: 'Portrait profil',
        title: `Portrait de ${profile.partner2.name}`,
        photoUrl: profile.partner2.avatar,
        date: profile.anniversaryDate,
        locationName: 'Notre cocon',
        description: `Photo de profil de ${profile.partner2.name} (${profile.partner2.nickname || 'Mon amour'}).`,
        authorId: 'p2',
        tags: ['Profil', profile.partner2.name],
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
          sourceLabel: isVideo ? 'Vidéo souvenir' : 'Souvenir Timeline',
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

    // 3. Shared Memory Locations (Places)
    locations.forEach((loc) => {
      if (loc.photoUrl && loc.photoUrl.trim().length > 0) {
        items.push({
          id: `loc-${loc.id}`,
          sourceType: 'location',
          sourceLabel: 'Lieu partagé',
          title: loc.name,
          photoUrl: loc.photoUrl,
          date: loc.date,
          locationName: loc.city,
          description: loc.description,
          authorId: 'both',
          tags: ['Escapade', loc.category],
          originalEntityId: loc.id,
        });
      }
    });

    // 4. Time Capsules with photos
    capsules.forEach((cap) => {
      if (cap.photoUrl && cap.photoUrl.trim().length > 0) {
        items.push({
          id: `cap-${cap.id}`,
          sourceType: 'capsule',
          sourceLabel: 'Capsule temporelle',
          title: cap.title,
          photoUrl: cap.photoUrl,
          date: cap.createdAt,
          description: cap.message,
          authorId: cap.authorId,
          tags: ['Capsule secrète'],
          originalEntityId: cap.id,
        });
      }
    });

    // 5. Couple Challenges with photo proof
    challenges.forEach((chal) => {
      if (chal.photoProof && chal.photoProof.trim().length > 0) {
        items.push({
          id: `chal-${chal.id}`,
          sourceType: 'challenge',
          sourceLabel: 'Défi relevé',
          title: chal.title,
          photoUrl: chal.photoProof,
          date: chal.completedDate,
          description: chal.description,
          authorId: 'both',
          tags: ['Défi', chal.category],
          originalEntityId: chal.id,
        });
      }
    });

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

    return uniqueItems;
  }, [profile, memories, locations, capsules, challenges]);

  const photoCount = useMemo(
    () => allGalleryItems.filter((i) => i.mediaType !== 'video').length,
    [allGalleryItems]
  );
  const videoCount = useMemo(
    () => allGalleryItems.filter((i) => i.mediaType === 'video').length,
    [allGalleryItems]
  );

  // Filtered & Sorted items
  const filteredItems = useMemo(() => {
    return allGalleryItems
      .filter((item) => {
        // 1. Strict Media Type separation (Photos vs Videos)
        if (mediaMode === 'photos') {
          if (item.mediaType === 'video') {
            return false;
          }
        } else if (mediaMode === 'videos') {
          if (item.mediaType !== 'video') {
            return false;
          }
        }

        // 2. Source filter
        if (selectedSource === 'video') {
          if (item.mediaType !== 'video') {
            return false;
          }
        } else if (selectedSource !== 'all' && item.sourceType !== selectedSource) {
          return false;
        }

        // 3. Partner filter
        if (selectedPartnerFilter !== 'all') {
          if (item.authorId !== selectedPartnerFilter && item.authorId !== 'both') {
            return false;
          }
        }

        // 4. Search query
        if (searchQuery.trim().length > 0) {
          const q = searchQuery.toLowerCase();
          const matchTitle = item.title.toLowerCase().includes(q);
          const matchDesc = (item.description || '').toLowerCase().includes(q);
          const matchLoc = (item.locationName || '').toLowerCase().includes(q);
          const matchTags = (item.tags || []).some((t) => t.toLowerCase().includes(q));
          if (!matchTitle && !matchDesc && !matchLoc && !matchTags) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        const dateA = a.date ? new Date(a.date).getTime() : 0;
        const dateB = b.date ? new Date(b.date).getTime() : 0;
        if (sortOrder === 'newest') {
          return dateB - dateA;
        } else {
          return dateA - dateB;
        }
      });
  }, [allGalleryItems, mediaMode, selectedSource, selectedPartnerFilter, searchQuery, sortOrder]);

  const currentPartner =
    activePartnerId === 'p1' ? profile.partner1 : profile.partner2;

  // Source badges styling
  const getSourceBadgeInfo = (source: GalleryItem['sourceType'], mediaType?: 'image' | 'video') => {
    if (mediaType === 'video') {
      return {
        label: 'Vidéo',
        bg: 'bg-purple-100 text-purple-800 border-purple-300',
      };
    }
    switch (source) {
      case 'memory':
        return {
          label: 'Souvenir',
          bg: 'bg-rose-50 text-rose-700 border-rose-200',
        };
      case 'profile':
        return {
          label: 'Profil',
          bg: 'bg-purple-50 text-purple-700 border-purple-200',
        };
      case 'location':
        return {
          label: 'Lieu partagé',
          bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        };
      case 'capsule':
        return {
          label: 'Capsule',
          bg: 'bg-amber-50 text-amber-700 border-amber-200',
        };
      case 'challenge':
        return {
          label: 'Défi',
          bg: 'bg-blue-50 text-blue-700 border-blue-200',
        };
      default:
        return {
          label: 'Photo',
          bg: 'bg-stone-50 text-stone-700 border-stone-200',
        };
    }
  };

  // Sleek popover menu for media items containing all metadata and actions
  const renderMediaMenu = (
    item: GalleryItem,
    badge: { label: string; bg: string },
    author: { id: PartnerId; name: string; avatar?: string } | null,
    index: number
  ) => {
    if (activeMenuId !== item.id) return null;

    return (
      <div
        className="absolute top-9 right-0 w-64 max-w-[calc(100vw-2.5rem)] bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-stone-200/90 p-3 text-left z-30 animate-in fade-in zoom-in-95 duration-150 select-text"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Source Badge and Close Button */}
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-stone-100">
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badge.bg}`}>
            {badge.label}
          </span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setActiveMenuId(null);
            }}
            className="p-1 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
            aria-label="Fermer le menu"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Details and Information */}
        <div className="space-y-2 mb-2.5">
          {item.title && item.title !== 'Sans titre' && (
            <div>
              <p className="text-[9px] uppercase tracking-wider font-semibold text-stone-400">Titre</p>
              <p className="text-xs font-semibold text-stone-800 line-clamp-2">{item.title}</p>
            </div>
          )}

          {item.description && (
            <div>
              <p className="text-[9px] uppercase tracking-wider font-semibold text-stone-400">Note</p>
              <p className="text-xs text-stone-600 line-clamp-3 leading-relaxed">{item.description}</p>
            </div>
          )}

          <div className="space-y-1.5 pt-1.5 border-t border-stone-100 text-xs text-stone-600">
            {author ? (
              <div className="flex items-center gap-1.5">
                <PartnerAvatar name={author.name} avatar={author.avatar} partnerId={author.id} size="xs" />
                <span className="text-[11px] truncate">
                  Partagé par <strong className="font-semibold text-stone-800">{author.name}</strong>
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-[11px] text-stone-600">
                <Heart className="w-3 h-3 text-rose-500 fill-rose-500 shrink-0" />
                <span>Souvenir de couple en duo</span>
              </div>
            )}

            {item.date && (
              <div className="flex items-center gap-1.5 text-[11px] text-stone-500">
                <Calendar className="w-3 h-3 text-stone-400 shrink-0" />
                <span className="truncate">{item.date}</span>
              </div>
            )}

            {item.locationName && (
              <div className="flex items-center gap-1.5 text-[11px] text-stone-500">
                <MapPin className="w-3 h-3 text-rose-500 shrink-0" />
                <span className="truncate">{item.locationName}</span>
              </div>
            )}

            {item.sourceType === 'memory' && item.likes && item.likes.length > 0 && (
              <div className="flex items-center gap-1.5 text-[11px] text-rose-500 font-medium">
                <Heart className="w-3 h-3 fill-rose-500" />
                <span>{item.likes.length} coup{item.likes.length > 1 ? 's' : ''} de cœur</span>
              </div>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="pt-2 border-t border-stone-100 space-y-1">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setActiveMenuId(null);
              setActiveLightboxIndex(index);
            }}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-stone-700 hover:text-stone-900 hover:bg-stone-100 rounded-xl transition-colors font-medium text-left cursor-pointer"
          >
            <Maximize2 className="w-3.5 h-3.5 text-stone-500" />
            <span>Plein écran</span>
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setActiveMenuId(null);
              handleDownloadMedia(item);
            }}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-stone-700 hover:text-stone-900 hover:bg-stone-100 rounded-xl transition-colors font-medium text-left cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-stone-500" />
            <span>Télécharger</span>
          </button>

          {onDeleteMediaItem && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setActiveMenuId(null);
                soundEffects.playTrashDelete();
                onDeleteMediaItem(item);
              }}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-colors font-medium text-left cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-500" />
              <span>Supprimer de la galerie</span>
            </button>
          )}
        </div>
      </div>
    );
  };

  // Mobile & Desktop Swipeable Photo Items for Lightbox
  const photoViewerItems: PhotoViewerItem[] = useMemo(() => {
    return filteredItems.map((item) => {
      const badge = getSourceBadgeInfo(item.sourceType, item.mediaType);
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
        badgeLabel: badge.label,
        badgeBg: badge.bg,
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
    filteredItems,
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

  const p1Name = profile.partner1?.name || 'Safi';
  const p2Name = profile.partner2?.name || 'Med';

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Hero Header Banner */}
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-r from-rose-500 via-rose-600 to-amber-600 text-white p-4 sm:p-8 shadow-md">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-4 sm:gap-6">
          <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 text-center sm:text-left">
            {/* Avatars Duo */}
            <div className="flex items-center -space-x-3 shrink-0">
              <PartnerAvatar
                name={p1Name}
                avatar={profile.partner1?.avatar}
                partnerId="p1"
                size="lg"
                className="border-2 border-white shadow-md"
              />
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white text-rose-600 flex items-center justify-center shadow-md z-10 -mx-1">
                <Heart className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-rose-500 text-rose-500" />
              </div>
              <PartnerAvatar
                name={p2Name}
                avatar={profile.partner2?.avatar}
                partnerId="p2"
                size="lg"
                className="border-2 border-white shadow-md"
              />
            </div>

            <div>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h1 className="text-xl sm:text-3xl font-serif font-bold text-white tracking-tight">
                  Galerie Partagée
                </h1>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/20 text-white backdrop-blur-xs">
                  <Images className="w-3.5 h-3.5" />
                  {photoCount} photos
                </span>
                {videoCount > 0 && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-500/40 text-white border border-purple-300/40 backdrop-blur-xs">
                    <Video className="w-3.5 h-3.5" />
                    {videoCount} vidéos
                  </span>
                )}
              </div>
              <p className="text-rose-100 text-xs sm:text-sm mt-1 max-w-xl">
                Vos photos et vidéos de couple soigneusement organisées et séparées.
              </p>
            </div>
          </div>

          {/* Quick actions */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 shrink-0 w-full sm:w-auto justify-center sm:justify-end">
            <button
              onClick={() => {
                soundEffects.playSoftTap();
                setShowCameraModal(true);
              }}
              className="flex-1 sm:flex-initial px-3.5 py-2.5 bg-rose-700 hover:bg-rose-800 active:scale-95 text-white rounded-xl sm:rounded-2xl text-xs sm:text-sm font-semibold shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer border border-white/20"
              title="Prendre une photo directement avec la caméra"
              id="btn-gallery-take-photo"
            >
              <Camera className="w-4 h-4 text-white" />
              <span>Prendre une photo</span>
            </button>
            <button
              onClick={() => {
                soundEffects.playNoteClick();
                onOpenAddMemoryModal('image');
              }}
              className="flex-1 sm:flex-initial px-3.5 py-2.5 bg-white text-rose-600 hover:bg-rose-50 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-semibold shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
              id="btn-gallery-add-memory"
            >
              <Plus className="w-4 h-4 text-rose-600" />
              <span>Ajouter une photo</span>
            </button>
            <button
              onClick={() => {
                soundEffects.playNoteClick();
                onOpenAddMemoryModal('video');
              }}
              className="flex-1 sm:flex-initial px-3.5 py-2.5 bg-gradient-to-r from-purple-600 to-rose-600 hover:from-purple-700 hover:to-rose-700 active:scale-95 text-white rounded-xl sm:rounded-2xl text-xs sm:text-sm font-semibold shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer border border-white/20"
              title="Importer une vidéo souvenir"
              id="btn-gallery-add-video"
            >
              <Video className="w-4 h-4 text-white" />
              <span>Importer une vidéo</span>
            </button>
            <button
              onClick={() => {
                soundEffects.playNoteClick();
                onOpenProfileModal();
              }}
              className="p-2.5 bg-white/20 hover:bg-white/30 text-white rounded-xl sm:rounded-2xl transition-all cursor-pointer"
              title="Changer les photos de profil"
              id="btn-gallery-change-avatar"
            >
              <Camera className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Mode Navigation: Strict Separation Photos vs Vidéos */}
      <div className="bg-white rounded-2xl border border-stone-200 p-2 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 p-1 bg-stone-100 rounded-xl">
          <button
            type="button"
            id="tab-gallery-photos"
            onClick={() => {
              soundEffects.playNoteClick();
              setMediaMode('photos');
              if (selectedSource === 'video') setSelectedSource('all');
            }}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              mediaMode === 'photos'
                ? 'bg-white text-rose-600 shadow-xs ring-1 ring-rose-200/50'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/60'
            }`}
          >
            <Images className="w-4 h-4" />
            <span>Photos uniquement</span>
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                mediaMode === 'photos' ? 'bg-rose-100 text-rose-700' : 'bg-stone-200 text-stone-600'
              }`}
            >
              {photoCount}
            </span>
          </button>

          <button
            type="button"
            id="tab-gallery-videos"
            onClick={() => {
              soundEffects.playNoteClick();
              setMediaMode('videos');
              if (selectedSource === 'video') setSelectedSource('all');
            }}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              mediaMode === 'videos'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/60'
            }`}
          >
            <Video className="w-4 h-4" />
            <span>Vidéos uniquement</span>
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                mediaMode === 'videos' ? 'bg-white/25 text-white' : 'bg-stone-200 text-stone-600'
              }`}
            >
              {videoCount}
            </span>
          </button>

          <button
            type="button"
            id="tab-gallery-all"
            onClick={() => {
              soundEffects.playSoftTap();
              setMediaMode('all');
            }}
            className={`hidden md:flex px-3 py-2 rounded-lg text-xs font-medium transition-all items-center justify-center gap-1.5 cursor-pointer ${
              mediaMode === 'all'
                ? 'bg-white text-stone-900 shadow-xs ring-1 ring-stone-200'
                : 'text-stone-500 hover:text-stone-800'
            }`}
            title="Vue combinée"
          >
            <span>Tout ({allGalleryItems.length})</span>
          </button>
        </div>

        {/* Informative helper pill */}
        <div className="text-[11px] text-stone-500 text-center sm:text-right px-2">
          {mediaMode === 'photos' ? (
            <span className="inline-flex items-center gap-1 font-medium text-rose-700 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-100">
              <Images className="w-3 h-3" /> Affichage exclusif de vos photos ({photoCount})
            </span>
          ) : mediaMode === 'videos' ? (
            <span className="inline-flex items-center gap-1 font-medium text-purple-700 bg-purple-50 px-2.5 py-1 rounded-full border border-purple-100">
              <Video className="w-3 h-3" /> Affichage exclusif de vos vidéos ({videoCount})
            </span>
          ) : (
            <span className="text-stone-400">Tous les médias</span>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-stone-200/80 p-4 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          {/* Search Box */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Rechercher par titre, ville, tag..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm rounded-xl bg-stone-50 border border-stone-200 text-stone-800 placeholder-stone-400 focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Partner and Sort Filter */}
          <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-end overflow-x-auto">
            {/* Filter by Partner */}
            <div className="flex items-center bg-stone-100 p-1 rounded-xl shrink-0">
              <button
                onClick={() => {
                  soundEffects.playNoteClick();
                  setSelectedPartnerFilter('all');
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  selectedPartnerFilter === 'all'
                    ? 'bg-white text-stone-900 shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Tous les 2
              </button>
              <button
                onClick={() => {
                  soundEffects.playNoteClick();
                  setSelectedPartnerFilter('p1');
                }}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  selectedPartnerFilter === 'p1'
                    ? 'bg-white text-rose-600 shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <PartnerAvatar
                  name={p1Name}
                  avatar={profile.partner1?.avatar}
                  partnerId="p1"
                  size="xs"
                />
                <span>{p1Name}</span>
              </button>
              <button
                onClick={() => {
                  soundEffects.playNoteClick();
                  setSelectedPartnerFilter('p2');
                }}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  selectedPartnerFilter === 'p2'
                    ? 'bg-white text-rose-600 shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <PartnerAvatar
                  name={p2Name}
                  avatar={profile.partner2?.avatar}
                  partnerId="p2"
                  size="xs"
                />
                <span>{p2Name}</span>
              </button>
            </div>

            {/* Layout Mode Toggle */}
            <div className="flex items-center bg-stone-100 p-0.5 rounded-xl border border-stone-200 shrink-0">
              <button
                type="button"
                onClick={() => {
                  soundEffects.playSoftTap();
                  setGalleryLayout('fit');
                }}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  galleryLayout === 'fit'
                    ? 'bg-white text-stone-900 shadow-2xs'
                    : 'text-stone-500 hover:text-stone-800'
                }`}
                title="Grille avec photos entières (aucun recadrage, fond doux)"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Grille entière</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  soundEffects.playSoftTap();
                  setGalleryLayout('natural');
                }}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  galleryLayout === 'natural'
                    ? 'bg-white text-stone-900 shadow-2xs'
                    : 'text-stone-500 hover:text-stone-800'
                }`}
                title="Format naturel libre (hauteur réelle originale)"
              >
                <Layers className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Format libre</span>
              </button>
            </div>

            {/* Sort Order */}
            <button
              onClick={() => {
                soundEffects.playNoteClick();
                setSortOrder((prev) => (prev === 'newest' ? 'oldest' : 'newest'));
              }}
              className="flex items-center gap-1 px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-semibold transition-colors shrink-0 cursor-pointer"
              title="Changer l'ordre de tri"
            >
              <ArrowUpDown className="w-3.5 h-3.5 text-stone-500" />
              <span>{sortOrder === 'newest' ? 'Plus récents' : 'Plus anciens'}</span>
            </button>
          </div>
        </div>

        {/* Source Categories Badges */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-1 pb-0.5 no-scrollbar">
          {(mediaMode === 'videos'
            ? [
                { id: 'all' as GallerySourceType, label: 'Toutes les vidéos', count: videoCount },
                {
                  id: 'memory' as GallerySourceType,
                  label: 'Souvenirs Vidéos',
                  count: allGalleryItems.filter((i) => i.sourceType === 'memory' && i.mediaType === 'video').length,
                },
                {
                  id: 'location' as GallerySourceType,
                  label: 'Lieux & Escapades',
                  count: allGalleryItems.filter((i) => i.sourceType === 'location' && i.mediaType === 'video').length,
                },
              ]
            : mediaMode === 'photos'
            ? [
                { id: 'all' as GallerySourceType, label: 'Toutes les photos', count: photoCount },
                {
                  id: 'memory' as GallerySourceType,
                  label: 'Souvenirs Photos',
                  count: allGalleryItems.filter((i) => i.sourceType === 'memory' && i.mediaType !== 'video').length,
                },
                {
                  id: 'profile' as GallerySourceType,
                  label: 'Portraits Profil',
                  count: allGalleryItems.filter((i) => i.sourceType === 'profile').length,
                },
                {
                  id: 'location' as GallerySourceType,
                  label: 'Lieux & Escapades',
                  count: allGalleryItems.filter((i) => i.sourceType === 'location' && i.mediaType !== 'video').length,
                },
                {
                  id: 'challenge' as GallerySourceType,
                  label: 'Défis complétés',
                  count: allGalleryItems.filter((i) => i.sourceType === 'challenge').length,
                },
                {
                  id: 'capsule' as GallerySourceType,
                  label: 'Capsules',
                  count: allGalleryItems.filter((i) => i.sourceType === 'capsule').length,
                },
              ]
            : [
                { id: 'all' as GallerySourceType, label: 'Tous les médias', count: allGalleryItems.length },
                {
                  id: 'video' as GallerySourceType,
                  label: 'Vidéos',
                  count: allGalleryItems.filter((i) => i.mediaType === 'video').length,
                },
                {
                  id: 'memory' as GallerySourceType,
                  label: 'Souvenirs Photos',
                  count: allGalleryItems.filter((i) => i.sourceType === 'memory' && i.mediaType !== 'video').length,
                },
                {
                  id: 'profile' as GallerySourceType,
                  label: 'Portraits Profil',
                  count: allGalleryItems.filter((i) => i.sourceType === 'profile').length,
                },
                {
                  id: 'location' as GallerySourceType,
                  label: 'Lieux & Escapades',
                  count: allGalleryItems.filter((i) => i.sourceType === 'location').length,
                },
                {
                  id: 'challenge' as GallerySourceType,
                  label: 'Défis complétés',
                  count: allGalleryItems.filter((i) => i.sourceType === 'challenge').length,
                },
                {
                  id: 'capsule' as GallerySourceType,
                  label: 'Capsules',
                  count: allGalleryItems.filter((i) => i.sourceType === 'capsule').length,
                },
              ]
          ).map((cat) => {
            const isActive = selectedSource === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => {
                  soundEffects.playNoteClick();
                  setSelectedSource(cat.id);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                  isActive
                    ? mediaMode === 'videos'
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'bg-rose-500 text-white shadow-xs'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200 hover:text-stone-900'
                }`}
              >
                <span>{cat.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    isActive ? 'bg-white/25 text-white' : 'bg-stone-200 text-stone-600'
                  }`}
                >
                  {cat.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Gallery Grid */}
      {filteredItems.length === 0 ? (
        <div className="bg-white rounded-3xl border border-dashed border-stone-300 p-12 text-center max-w-lg mx-auto space-y-4">
          <div
            className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto shadow-xs ${
              mediaMode === 'videos' ? 'bg-purple-50 text-purple-600' : 'bg-rose-50 text-rose-500'
            }`}
          >
            {mediaMode === 'videos' ? <Video className="w-8 h-8" /> : <Images className="w-8 h-8" />}
          </div>
          <div>
            <h3 className="text-lg font-serif font-bold text-stone-800">
              {mediaMode === 'videos' ? 'Aucune vidéo trouvée' : 'Aucune photo trouvée'}
            </h3>
            <p className="text-stone-500 text-sm mt-1">
              {searchQuery || selectedSource !== 'all' || selectedPartnerFilter !== 'all'
                ? `Essayez de réinitialiser vos filtres ou termes de recherche pour afficher toutes vos ${
                    mediaMode === 'videos' ? 'vidéos' : 'photos'
                  }.`
                : mediaMode === 'videos'
                ? 'Importez vos premières vidéos de couple pour les visionner ici séparément !'
                : 'Commencez à immortaliser vos moments en ajoutant des photos à vos souvenirs !'}
            </p>
          </div>
          <div className="pt-2 flex flex-wrap justify-center gap-3">
            {(searchQuery || selectedSource !== 'all' || selectedPartnerFilter !== 'all') && (
              <button
                onClick={() => {
                  setSelectedSource('all');
                  setSelectedPartnerFilter('all');
                  setSearchQuery('');
                }}
                className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-semibold transition-colors"
              >
                Réinitialiser les filtres
              </button>
            )}
            {mediaMode === 'videos' ? (
              <button
                onClick={() => {
                  soundEffects.playNoteClick();
                  onOpenAddMemoryModal('video');
                }}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
              >
                <Video className="w-3.5 h-3.5" />
                <span>Importer une vidéo</span>
              </button>
            ) : (
              <>
                <button
                  onClick={() => {
                    soundEffects.playSoftTap();
                    setShowCameraModal(true);
                  }}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Prendre une photo</span>
                </button>
                <button
                  onClick={() => {
                    soundEffects.playNoteClick();
                    onOpenAddMemoryModal('image');
                  }}
                  className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs font-semibold transition-colors flex items-center gap-2 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Ajouter une photo</span>
                </button>
              </>
            )}
          </div>
        </div>
      ) : galleryLayout === 'fit' ? (
        /* Fit Grid: Square frames with 100% full uncropped image, ambient glow, and no clutter */
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4">
          {filteredItems.map((item, index) => {
            const badge = getSourceBadgeInfo(item.sourceType, item.mediaType);
            const author =
              item.authorId === 'p1'
                ? profile.partner1
                : item.authorId === 'p2'
                ? profile.partner2
                : null;

            return (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: index * 0.02 }}
                onClick={() => {
                  soundEffects.playNoteClick();
                  setActiveLightboxIndex(index);
                }}
                className="group relative aspect-square w-full bg-stone-900/5 rounded-2xl overflow-hidden border border-stone-200/80 shadow-xs hover:shadow-md hover:border-rose-300 transition-all cursor-pointer flex items-center justify-center p-2 select-none"
              >
                {/* Soft ambient blur in background */}
                <img
                  src={item.photoUrl}
                  alt=""
                  aria-hidden="true"
                  className="absolute inset-0 w-full h-full object-cover blur-xl opacity-20 scale-125 select-none pointer-events-none"
                />

                {/* Main Full Image: Exactly in full, never cropped */}
                <img
                  src={item.photoUrl}
                  alt=""
                  loading="lazy"
                  className="relative max-w-full max-h-full w-auto h-auto object-contain drop-shadow-xs transition-transform duration-300 group-hover:scale-[1.02] select-none"
                />

                {/* Video Play Overlay */}
                {item.mediaType === 'video' && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                    <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-black/60 text-white backdrop-blur-xs flex items-center justify-center shadow-lg border border-white/30 group-hover:scale-110 group-hover:bg-rose-600/90 transition-all duration-300">
                      <Play className="w-5 h-5 sm:w-6 sm:h-6 fill-white text-white ml-0.5" />
                    </div>
                  </div>
                )}

                {/* Video duration pill */}
                {item.mediaType === 'video' && item.videoDuration && (
                  <div className="absolute bottom-2.5 left-2.5 z-10 px-2 py-0.5 rounded-lg bg-black/75 backdrop-blur-md text-white text-[10px] font-semibold flex items-center gap-1 border border-white/20">
                    <Film className="w-3 h-3 text-rose-400" />
                    <span>{item.videoDuration}</span>
                  </div>
                )}

                {/* Top-Right Options & Details Button (...) */}
                <div className="absolute top-2.5 right-2.5 z-20">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      soundEffects.playSoftTap();
                      setActiveMenuId(activeMenuId === item.id ? null : item.id);
                    }}
                    className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-black/45 hover:bg-black/75 active:scale-95 text-white backdrop-blur-md transition-all shadow-md border border-white/25 flex items-center justify-center cursor-pointer"
                    title="Options et informations"
                    aria-label="Options et informations"
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </button>

                  {renderMediaMenu(item, badge, author, index)}
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        /* Natural Masonry: Each photo in its 100% natural height and aspect ratio without clutter */
        <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-3 sm:gap-4 space-y-3 sm:space-y-4">
          {filteredItems.map((item, index) => {
            const badge = getSourceBadgeInfo(item.sourceType, item.mediaType);
            const author =
              item.authorId === 'p1'
                ? profile.partner1
                : item.authorId === 'p2'
                ? profile.partner2
                : null;

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: index * 0.02 }}
                onClick={() => {
                  soundEffects.playNoteClick();
                  setActiveLightboxIndex(index);
                }}
                className="break-inside-avoid group relative bg-stone-100 rounded-2xl overflow-hidden border border-stone-200/80 shadow-xs hover:shadow-md hover:border-rose-300 transition-all cursor-pointer select-none"
              >
                {/* Natural Image View */}
                <div className="relative w-full bg-stone-100 flex items-center justify-center overflow-hidden">
                  <img
                    src={item.photoUrl}
                    alt=""
                    loading="lazy"
                    className="w-full h-auto object-contain block transition-transform duration-300 group-hover:scale-[1.01]"
                  />

                  {/* Video Play Overlay */}
                  {item.mediaType === 'video' && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                      <div className="w-12 h-12 rounded-full bg-black/60 text-white backdrop-blur-xs flex items-center justify-center shadow-lg border border-white/30 group-hover:scale-110 group-hover:bg-rose-600/90 transition-all duration-300">
                        <Play className="w-6 h-6 fill-white text-white ml-0.5" />
                      </div>
                    </div>
                  )}

                  {/* Video duration pill */}
                  {item.mediaType === 'video' && item.videoDuration && (
                    <div className="absolute bottom-2.5 left-2.5 z-10 px-2 py-0.5 rounded-lg bg-black/75 backdrop-blur-md text-white text-[10px] font-semibold flex items-center gap-1 border border-white/20">
                      <Film className="w-3 h-3 text-rose-400" />
                      <span>{item.videoDuration}</span>
                    </div>
                  )}

                  {/* Top-Right Options & Details Button (...) */}
                  <div className="absolute top-2.5 right-2.5 z-20">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        soundEffects.playSoftTap();
                        setActiveMenuId(activeMenuId === item.id ? null : item.id);
                      }}
                      className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-black/45 hover:bg-black/75 active:scale-95 text-white backdrop-blur-md transition-all shadow-md border border-white/25 flex items-center justify-center cursor-pointer"
                      title="Options et informations"
                      aria-label="Options et informations"
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </button>

                    {renderMediaMenu(item, badge, author, index)}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Backdrop for closing dropdown menu on click outside */}
      {activeMenuId && (
        <div
          className="fixed inset-0 z-20 cursor-default"
          onClick={(e) => {
            e.stopPropagation();
            setActiveMenuId(null);
          }}
        />
      )}

      {/* Fullscreen Mobile & Desktop Photo Viewer (Swipe & Pinch-to-Zoom like Android / iOS) */}
      <MobilePhotoViewer
        items={photoViewerItems}
        initialIndex={activeLightboxIndex ?? 0}
        isOpen={activeLightboxIndex !== null}
        onClose={() => setActiveLightboxIndex(null)}
        onIndexChange={(newIndex) => setActiveLightboxIndex(newIndex)}
      />

      {/* Live In-App Camera Viewfinder Modal */}
      <CameraCaptureModal
        isOpen={showCameraModal}
        onClose={() => setShowCameraModal(false)}
        onPhotoCaptured={handlePhotoCapturedFromCamera}
        title="Prendre une photo pour la galerie"
        subtitle="Capturez cet instant à deux et immortalisez-le"
        submitLabel="Ajouter à notre galerie"
        allowCaption={true}
      />
    </div>
  );
};
