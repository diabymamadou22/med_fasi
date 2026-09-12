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
  ArrowUpDown,
  Pencil,
  Trash2,
} from 'lucide-react';
import {
  CoupleProfile,
  PartnerId,
  TimelineMemory,
  MemoryLocation,
  TimeCapsule,
  CoupleChallenge,
  BucketItem,
} from '../../types';
import { soundEffects } from '../../lib/audio';
import { PartnerAvatar } from '../PartnerAvatar';
import { triggerHeartConfetti } from '../../lib/confetti';

export type GallerySourceType =
  | 'all'
  | 'memory'
  | 'profile'
  | 'location'
  | 'capsule'
  | 'challenge'
  | 'bucket';

export interface GalleryItem {
  id: string;
  sourceType: 'memory' | 'profile' | 'location' | 'capsule' | 'challenge' | 'bucket';
  sourceLabel: string;
  title: string;
  photoUrl: string;
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
  bucketList: BucketItem[];
  onLikeMemory?: (memoryId: string) => void;
  onOpenAddMemoryModal: () => void;
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
  bucketList,
  onLikeMemory,
  onOpenAddMemoryModal,
  onOpenProfileModal,
  onEditMemory,
  onDeleteMemory,
  onDeleteMediaItem,
  onRemovePhotoOnly,
}) => {
  const [selectedSource, setSelectedSource] = useState<GallerySourceType>('all');
  const [selectedPartnerFilter, setSelectedPartnerFilter] = useState<'all' | 'p1' | 'p2'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [activeLightboxIndex, setActiveLightboxIndex] = useState<number | null>(null);

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
      if (mem.photoUrl && mem.photoUrl.trim().length > 0) {
        items.push({
          id: `mem-${mem.id}`,
          sourceType: 'memory',
          sourceLabel: 'Souvenir Timeline',
          title: mem.title,
          photoUrl: mem.photoUrl,
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

    // 6. Bucket List with photo
    bucketList.forEach((bkt) => {
      if (bkt.photoUrl && bkt.photoUrl.trim().length > 0) {
        items.push({
          id: `bkt-${bkt.id}`,
          sourceType: 'bucket',
          sourceLabel: 'Projet Bucket List',
          title: bkt.title,
          photoUrl: bkt.photoUrl,
          date: bkt.targetDate,
          description: bkt.notes,
          authorId: bkt.addedBy,
          tags: ['Projet', bkt.category],
          originalEntityId: bkt.id,
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
  }, [profile, memories, locations, capsules, challenges, bucketList]);

  // Filtered & Sorted items
  const filteredItems = useMemo(() => {
    return allGalleryItems
      .filter((item) => {
        // Source filter
        if (selectedSource !== 'all' && item.sourceType !== selectedSource) {
          return false;
        }

        // Partner filter
        if (selectedPartnerFilter !== 'all') {
          if (item.authorId !== selectedPartnerFilter && item.authorId !== 'both') {
            return false;
          }
        }

        // Search query
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
  }, [allGalleryItems, selectedSource, selectedPartnerFilter, searchQuery, sortOrder]);

  // Handle keyboard navigation for Lightbox
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (activeLightboxIndex === null) return;
      if (e.key === 'Escape') {
        setActiveLightboxIndex(null);
      } else if (e.key === 'ArrowLeft') {
        setActiveLightboxIndex((prev) =>
          prev !== null && prev > 0 ? prev - 1 : filteredItems.length - 1
        );
      } else if (e.key === 'ArrowRight') {
        setActiveLightboxIndex((prev) =>
          prev !== null && prev < filteredItems.length - 1 ? prev + 1 : 0
        );
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeLightboxIndex, filteredItems.length]);

  const activePhoto =
    activeLightboxIndex !== null && filteredItems[activeLightboxIndex]
      ? filteredItems[activeLightboxIndex]
      : null;

  const currentPartner =
    activePartnerId === 'p1' ? profile.partner1 : profile.partner2;

  // Source badges styling
  const getSourceBadgeInfo = (source: GalleryItem['sourceType']) => {
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
      case 'bucket':
        return {
          label: 'Bucket List',
          bg: 'bg-teal-50 text-teal-700 border-teal-200',
        };
      default:
        return {
          label: 'Photo',
          bg: 'bg-stone-50 text-stone-700 border-stone-200',
        };
    }
  };

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
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <h1 className="text-xl sm:text-3xl font-serif font-bold text-white tracking-tight">
                  Galerie Partagée
                </h1>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/20 text-white backdrop-blur-xs">
                  <Images className="w-3.5 h-3.5" />
                  {allGalleryItems.length} photos
                </span>
              </div>
              <p className="text-rose-100 text-xs sm:text-sm mt-1 max-w-xl">
                Toutes vos photos de profils, souvenirs de couple, escapades et défis réunis en une vue unique.
              </p>
            </div>
          </div>

          {/* Quick actions */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0 w-full sm:w-auto justify-center sm:justify-end">
            <button
              onClick={() => {
                soundEffects.playNoteClick();
                onOpenAddMemoryModal();
              }}
              className="flex-1 sm:flex-initial px-3.5 py-2.5 bg-white text-rose-600 hover:bg-rose-50 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-semibold shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
              id="btn-gallery-add-memory"
            >
              <Plus className="w-4 h-4 text-rose-600" />
              <span>Nouveau Souvenir</span>
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

            {/* Sort Order */}
            <button
              onClick={() => {
                soundEffects.playNoteClick();
                setSortOrder((prev) => (prev === 'newest' ? 'oldest' : 'newest'));
              }}
              className="flex items-center gap-1 px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-semibold transition-colors shrink-0"
              title="Changer l'ordre de tri"
            >
              <ArrowUpDown className="w-3.5 h-3.5 text-stone-500" />
              <span>{sortOrder === 'newest' ? 'Plus récents' : 'Plus anciens'}</span>
            </button>
          </div>
        </div>

        {/* Source Categories Badges */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-1 pb-0.5 no-scrollbar">
          {[
            { id: 'all' as GallerySourceType, label: 'Toutes les photos', count: allGalleryItems.length },
            {
              id: 'memory' as GallerySourceType,
              label: 'Souvenirs Timeline',
              count: allGalleryItems.filter((i) => i.sourceType === 'memory').length,
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
          ].map((cat) => {
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
                    ? 'bg-rose-500 text-white shadow-xs'
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
          <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center mx-auto shadow-xs">
            <Images className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-lg font-serif font-bold text-stone-800">
              Aucune photo trouvée
            </h3>
            <p className="text-stone-500 text-sm mt-1">
              {searchQuery || selectedSource !== 'all' || selectedPartnerFilter !== 'all'
                ? 'Essayez de réinitialiser vos filtres ou termes de recherche pour afficher toutes vos photos.'
                : 'Commencez à immortaliser vos moments en ajoutant des photos à vos souvenirs !'}
            </p>
          </div>
          <div className="pt-2 flex justify-center gap-3">
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
            <button
              onClick={() => {
                soundEffects.playNoteClick();
                onOpenAddMemoryModal();
              }}
              className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors flex items-center gap-2"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Ajouter un souvenir</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4">
          {filteredItems.map((item, index) => {
            const badge = getSourceBadgeInfo(item.sourceType);
            const isLiked =
              item.likes && item.likes.includes(activePartnerId);
            const author =
              item.authorId === 'p1'
                ? profile.partner1
                : item.authorId === 'p2'
                ? profile.partner2
                : null;

            return (
              <motion.div
                key={`${item.id}-${index}`}
                layout
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: index * 0.02 }}
                onClick={() => {
                  soundEffects.playNoteClick();
                  setActiveLightboxIndex(index);
                }}
                className="group relative bg-white rounded-2xl overflow-hidden border border-stone-200/80 shadow-xs hover:shadow-md hover:border-rose-300 transition-all cursor-pointer flex flex-col"
              >
                {/* Image Container with fixed aspect ratio */}
                <div className="relative aspect-4/3 sm:aspect-square overflow-hidden bg-stone-100">
                  <img
                    src={item.photoUrl}
                    alt={item.title}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />

                  {/* Gradient Overlay on Hover */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 opacity-80 group-hover:opacity-100 transition-opacity" />

                  {/* Top Badge: Source Type */}
                  <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.8 rounded-full border backdrop-blur-md shadow-xs ${badge.bg}`}
                    >
                      {badge.label}
                    </span>
                  </div>

                  {/* Author Avatar Pill & Delete Button */}
                  <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 z-10">
                    {author ? (
                      <div
                        className="flex items-center gap-1 px-1.5 py-0.8 rounded-full bg-black/40 backdrop-blur-md text-white text-[10px] font-medium border border-white/20"
                        title={`Partagé par ${author.name}`}
                      >
                        <PartnerAvatar
                          name={author.name}
                          avatar={author.avatar}
                          partnerId={author.id}
                          size="xs"
                        />
                        <span className="hidden group-hover:inline pr-0.5">
                          {author.name}
                        </span>
                      </div>
                    ) : (
                      <div
                        className="flex items-center gap-1 px-1.5 py-0.8 rounded-full bg-black/40 backdrop-blur-md text-white text-[10px] font-medium border border-white/20"
                        title="Souvenir de couple"
                      >
                        <Heart className="w-3 h-3 text-rose-400 fill-rose-400" />
                        <span className="hidden group-hover:inline pr-0.5">En duo</span>
                      </div>
                    )}

                    {onDeleteMediaItem && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          soundEffects.playTrashDelete();
                          onDeleteMediaItem(item);
                        }}
                        className="p-2 sm:p-1.5 rounded-full bg-black/60 hover:bg-rose-600 active:bg-rose-700 text-white backdrop-blur-md transition-all shadow-md border border-white/30 hover:scale-110 active:scale-95 cursor-pointer"
                        title="Supprimer ce média de la galerie"
                        aria-label="Supprimer ce média de la galerie"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Bottom details on image */}
                  <div className="absolute bottom-2.5 inset-x-2.5 text-white">
                    <h4 className="font-serif font-bold text-sm text-white line-clamp-1 drop-shadow-xs">
                      {item.title}
                    </h4>
                    <div className="flex items-center justify-between text-[11px] text-stone-200 mt-0.5">
                      {item.locationName ? (
                        <span className="flex items-center gap-1 truncate max-w-[70%]">
                          <MapPin className="w-3 h-3 text-rose-400 shrink-0" />
                          <span className="truncate">{item.locationName}</span>
                        </span>
                      ) : (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-rose-300" />
                          <span>{item.date || 'Moment précieux'}</span>
                        </span>
                      )}

                      {/* Like indicator if memory */}
                      {item.sourceType === 'memory' && item.likes && (
                        <span className="flex items-center gap-1 text-[11px] font-bold text-rose-300">
                          <Heart
                            className={`w-3 h-3 ${
                              item.likes.length > 0
                                ? 'fill-rose-400 text-rose-400'
                                : 'text-stone-300'
                            }`}
                          />
                          {item.likes.length}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Subtle caption bottom panel */}
                {item.description && (
                  <div className="p-3 bg-white text-xs text-stone-600 line-clamp-2 leading-relaxed border-t border-stone-100">
                    {item.description}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Fullscreen Lightbox Modal */}
      <AnimatePresence>
        {activePhoto && activeLightboxIndex !== null && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-md">
            {/* Close button */}
            <button
              onClick={() => setActiveLightboxIndex(null)}
              className="absolute top-4 right-4 z-50 p-2.5 rounded-full bg-white/15 hover:bg-white/30 text-white transition-colors"
              title="Fermer (Échap)"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Prev / Next buttons */}
            {filteredItems.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    soundEffects.playNoteClick();
                    setActiveLightboxIndex((prev) =>
                      prev !== null && prev > 0 ? prev - 1 : filteredItems.length - 1
                    );
                  }}
                  className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 z-50 p-3 rounded-full bg-white/15 hover:bg-white/30 text-white transition-colors"
                  title="Photo précédente (Flèche gauche)"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    soundEffects.playNoteClick();
                    setActiveLightboxIndex((prev) =>
                      prev !== null && prev < filteredItems.length - 1 ? prev + 1 : 0
                    );
                  }}
                  className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 z-50 p-3 rounded-full bg-white/15 hover:bg-white/30 text-white transition-colors"
                  title="Photo suivante (Flèche droite)"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}

            {/* Lightbox Content Container */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-4xl w-full max-h-[92vh] flex flex-col bg-stone-950 rounded-3xl overflow-hidden border border-white/10 shadow-2xl"
            >
              {/* Main Image View */}
              <div className="relative flex-1 min-h-[300px] max-h-[65vh] flex items-center justify-center bg-black/60 overflow-hidden">
                <img
                  src={activePhoto.photoUrl}
                  alt={activePhoto.title}
                  className="max-h-[65vh] max-w-full w-auto h-auto object-contain select-none"
                />

                {/* Counter pill */}
                <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-white/90 text-xs font-semibold border border-white/10">
                  {activeLightboxIndex + 1} / {filteredItems.length}
                </div>

                {/* Direct Image Actions */}
                <div className="absolute top-4 right-4 flex items-center gap-2">
                  <a
                    href={activePhoto.photoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 rounded-full bg-black/60 hover:bg-black/80 text-white text-xs backdrop-blur-md border border-white/10 transition-colors"
                    title="Ouvrir dans un nouvel onglet"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>

              {/* Photo Meta & Story Footer */}
              <div className="p-4 sm:p-6 bg-stone-900 text-white border-t border-white/10 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                          getSourceBadgeInfo(activePhoto.sourceType).bg
                        }`}
                      >
                        {getSourceBadgeInfo(activePhoto.sourceType).label}
                      </span>
                      {activePhoto.locationName && (
                        <span className="flex items-center gap-1 text-xs text-rose-300 font-medium">
                          <MapPin className="w-3.5 h-3.5" />
                          {activePhoto.locationName}
                        </span>
                      )}
                      {activePhoto.date && (
                        <span className="flex items-center gap-1 text-xs text-stone-400">
                          <Calendar className="w-3.5 h-3.5" />
                          {activePhoto.date}
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg sm:text-xl font-serif font-bold text-white mt-1">
                      {activePhoto.title}
                    </h3>
                  </div>

                  {/* Heart / Like & Action */}
                  <div className="flex items-center gap-3 shrink-0">
                    {activePhoto.sourceType === 'memory' &&
                      activePhoto.originalEntityId &&
                      onLikeMemory && (
                        <button
                          onClick={() => {
                            if (activePhoto.originalEntityId) {
                              onLikeMemory(activePhoto.originalEntityId);
                              triggerHeartConfetti();
                              soundEffects.playHeartPulse();
                            }
                          }}
                          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors ${
                            activePhoto.likes?.includes(activePartnerId)
                              ? 'bg-rose-500 text-white'
                              : 'bg-white/10 hover:bg-white/20 text-rose-300'
                          }`}
                        >
                          <Heart
                            className={`w-4 h-4 ${
                              activePhoto.likes?.includes(activePartnerId)
                                ? 'fill-white text-white'
                                : 'fill-rose-400 text-rose-400'
                            }`}
                          />
                          <span>{activePhoto.likes?.length || 0} J'aime</span>
                        </button>
                      )}

                    {/* Media Actions for Lightbox */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {onRemovePhotoOnly && (
                        <button
                          type="button"
                          onClick={() => {
                            const target = activePhoto;
                            setActiveLightboxIndex(null);
                            onRemovePhotoOnly(target);
                          }}
                          className="px-3 py-2 bg-amber-600/80 hover:bg-amber-600 text-white rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                          title="Supprimer uniquement cette photo"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Retirer photo</span>
                        </button>
                      )}

                      {onDeleteMediaItem ? (
                        <button
                          type="button"
                          onClick={() => {
                            const target = activePhoto;
                            setActiveLightboxIndex(null);
                            onDeleteMediaItem(target);
                          }}
                          className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                          title="Supprimer ce média"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Supprimer</span>
                        </button>
                      ) : (
                        activePhoto.sourceType === 'memory' &&
                        activePhoto.originalEntityId &&
                        onDeleteMemory && (
                          <button
                            onClick={() => {
                              const memId = activePhoto.originalEntityId!;
                              setActiveLightboxIndex(null);
                              onDeleteMemory(memId);
                            }}
                            className="px-3 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
                            title="Supprimer ce souvenir"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Supprimer</span>
                          </button>
                        )
                      )}

                      {activePhoto.sourceType === 'memory' &&
                        activePhoto.originalEntityId &&
                        onEditMemory && (
                          <button
                            onClick={() => {
                              const mem = memories.find(
                                (m) => m.id === activePhoto.originalEntityId
                              );
                              if (mem) {
                                setActiveLightboxIndex(null);
                                onEditMemory(mem);
                              }
                            }}
                            className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
                            title="Modifier ce souvenir"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                            <span>Modifier</span>
                          </button>
                        )}

                      {activePhoto.sourceType === 'profile' && (
                        <button
                          onClick={() => {
                            setActiveLightboxIndex(null);
                            onOpenProfileModal(
                              activePhoto.authorId === 'p1' || activePhoto.authorId === 'p2'
                                ? activePhoto.authorId
                                : undefined
                            );
                          }}
                          className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
                        >
                          <Camera className="w-3.5 h-3.5" />
                          <span>Changer photo</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Story / Description */}
                {activePhoto.description && (
                  <p className="text-xs sm:text-sm text-stone-300 leading-relaxed max-w-3xl">
                    {activePhoto.description}
                  </p>
                )}

                {/* Tags */}
                {activePhoto.tags && activePhoto.tags.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap pt-1">
                    {activePhoto.tags.map((t, idx) => (
                      <span
                        key={`${t}-${idx}`}
                        className="text-[11px] px-2 py-0.5 rounded-md bg-white/10 text-stone-300 flex items-center gap-1"
                      >
                        <Tag className="w-2.5 h-2.5 text-rose-400" />
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
