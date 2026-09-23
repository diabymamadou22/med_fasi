import React, { useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Images,
  Image as ImageIcon,
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
  Search,
  MoreVertical,
  BookOpen,
  Bookmark,
  Menu,
  X,
  Share2,
  SlidersHorizontal,
  Layers,
  MapPin,
  Clock,
  Settings,
  Check,
  Star,
  Eye,
} from 'lucide-react';
import {
  CoupleProfile,
  PartnerId,
  TimelineMemory,
  MemoryLocation,
  TimeCapsule,
  CoupleChallenge,
  ChatMessage,
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
  uploadAndPersistMedia,
  formatVideoDuration,
  isVideoMediaType,
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
  | 'challenge'
  | 'chat';

export type GalleryMediaMode = 'all' | 'photos' | 'videos';

export interface GalleryItem {
  id: string;
  sourceType: 'memory' | 'profile' | 'location' | 'capsule' | 'challenge' | 'chat';
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

export interface SamsungAlbum {
  id: string;
  title: string;
  count: number;
  coverUrl: string;
  type: 'stacked' | 'photo' | 'pastel';
  badge?: 'camera' | 'dot' | 'video' | 'heart';
  items: GalleryItem[];
  isEssential?: boolean;
}

interface SharedGalleryViewProps {
  profile: CoupleProfile;
  activePartnerId: PartnerId;
  memories: TimelineMemory[];
  locations: MemoryLocation[];
  capsules: TimeCapsule[];
  challenges: CoupleChallenge[];
  messages?: ChatMessage[];
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
  messages = [],
  onLikeMemory,
  onAddMemory,
  onOpenAddMemoryModal,
  onOpenProfileModal,
  onEditMemory,
  onDeleteMemory,
  onDeleteMediaItem,
  onRemovePhotoOnly,
}) => {
  // Samsung One UI Bottom Dock Tab: 'pictures' | 'albums' | 'stories'
  const [oneUiTab, setOneUiTab] = useState<'pictures' | 'albums' | 'stories'>('albums');

  // Search state
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Dropdown menus
  const [showTopMenu, setShowTopMenu] = useState(false);
  const [showCreateMenu, setShowCreateMenu] = useState(false);
  const [showSamsungMenu, setShowSamsungMenu] = useState(false);

  // View All albums toggle
  const [showViewAll, setShowViewAll] = useState(false);

  // Active focused album
  const [selectedAlbumId, setSelectedAlbumId] = useState<string | null>(null);

  // Media filter for pictures tab ('all', 'photos', 'videos')
  const [mediaFilter, setMediaFilter] = useState<'all' | 'photos' | 'videos'>('all');
  const [selectedYear, setSelectedYear] = useState<number | 'all' | 'undated'>('all');

  // Lightbox & Viewer
  const [activeLightboxIndex, setActiveLightboxIndex] = useState<number | null>(null);
  const [lightboxContextItems, setLightboxContextItems] = useState<GalleryItem[] | null>(null);

  // Upload & Camera
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string>('');
  const [isDragOver, setIsDragOver] = useState(false);

  // Gallery Settings (Auto-play videos in grid, etc.)
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [autoplayVideosInGrid, setAutoplayVideosInGrid] = useState<boolean>(() => {
    const saved = localStorage.getItem('samsung_gallery_autoplay_videos');
    return saved !== null ? saved === 'true' : true;
  });

  const handleToggleAutoplayVideos = (val: boolean) => {
    soundEffects.playSoftTap();
    setAutoplayVideosInGrid(val);
    localStorage.setItem('samsung_gallery_autoplay_videos', String(val));
  };

  const photoFileInputRef = useRef<HTMLInputElement>(null);
  const videoFileInputRef = useRef<HTMLInputElement>(null);

  // Android / Mobile back navigation handlers
  useBackHandler(Boolean(selectedAlbumId), () => setSelectedAlbumId(null), 'samsung-album-detail');
  useBackHandler(showSamsungMenu, () => setShowSamsungMenu(false), 'samsung-bottom-menu');
  useBackHandler(showCreateMenu, () => setShowCreateMenu(false), 'samsung-create-menu');
  useBackHandler(showTopMenu, () => setShowTopMenu(false), 'samsung-top-menu');
  useBackHandler(showSearch, () => setShowSearch(false), 'samsung-search');
  useBackHandler(showCameraModal, () => setShowCameraModal(false), 'gallery-camera-modal');
  useBackHandler(showSettingsModal, () => setShowSettingsModal(false), 'samsung-gallery-settings');

  // Compile all photos & videos into unified gallery items
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

    // 2. Timeline memories
    memories.forEach((mem) => {
      if (mem.photoUrl && mem.photoUrl.trim().length > 0) {
        items.push({
          id: `mem-${mem.id}`,
          sourceType: 'memory',
          sourceLabel: 'Souvenir',
          title: mem.title,
          photoUrl: mem.photoUrl,
          mediaType: mem.mediaType || 'image',
          videoUrl: mem.videoUrl,
          videoDuration: mem.videoDuration,
          date: mem.date,
          locationName: mem.location,
          description: mem.description,
          authorId: mem.authorId,
          likes: mem.likes,
          tags: mem.tags,
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
          locationName: loc.address || loc.name,
          description: loc.notes,
          authorId: 'both',
          tags: ['Lieu', loc.category || 'Balade'],
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

    // 6. Photos et vidéos partagées dans le Chat
    if (Array.isArray(messages)) {
      messages.forEach((msg) => {
        if (msg.photoUrl && msg.photoUrl.trim().length > 0) {
          items.push({
            id: `chat-${msg.id}`,
            sourceType: 'chat',
            sourceLabel: 'Discussion',
            title:
              msg.content && msg.content.length > 0 && !msg.content.startsWith('data:')
                ? msg.content.slice(0, 35)
                : 'Photo du chat',
            photoUrl: msg.photoUrl,
            mediaType: msg.mediaType === 'video' ? 'video' : 'image',
            date: msg.timestamp ? msg.timestamp.split('T')[0] : undefined,
            locationName: 'Discussion privée',
            description: msg.content || 'Photo partagée dans notre nid',
            authorId: (msg.senderId as PartnerId) || 'p1',
            tags: ['Chat', 'Discussion'],
            originalEntityId: msg.id,
          });
        }
      });
    }

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
  }, [profile, memories, locations, capsules, challenges, messages]);

  // Fallback romantic cover if no media uploaded yet
  const defaultRomanticCover =
    'https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=600&auto=format&fit=crop&q=80';

  // Monthly albums generated from dates
  const { albums: monthAlbums, yearGroups } = useMemo(() => {
    return groupGalleryItemsByDate(allGalleryItems);
  }, [allGalleryItems]);

  // Curated Samsung One UI Albums (Matching the exact cards in user's screenshot)
  const samsungAlbums: SamsungAlbum[] = useMemo(() => {
    const list: SamsungAlbum[] = [];

    // 1. Recent (Récents) - Stacked style
    list.push({
      id: 'recent',
      title: 'Recent',
      count: allGalleryItems.length,
      coverUrl: allGalleryItems[0]?.photoUrl || defaultRomanticCover,
      type: 'stacked',
      items: allGalleryItems,
      isEssential: true,
    });

    // 2. Favourites (Favoris) - Stacked style
    const favItems = allGalleryItems.filter(
      (i) => (i.likes && i.likes.length > 0) || i.tags?.includes('Favoris')
    );
    list.push({
      id: 'favourites',
      title: 'Favourites',
      count: favItems.length,
      coverUrl: favItems[0]?.photoUrl || allGalleryItems[1]?.photoUrl || defaultRomanticCover,
      type: 'stacked',
      badge: 'heart',
      items: favItems.length > 0 ? favItems : allGalleryItems.slice(0, 5),
      isEssential: true,
    });

    // 3. Camera (Appareil photo) - Photo card with camera icon badge in top-right
    const cameraItems = allGalleryItems.filter((i) => i.mediaType !== 'video');
    list.push({
      id: 'camera',
      title: 'Camera',
      count: cameraItems.length,
      coverUrl: cameraItems[0]?.photoUrl || defaultRomanticCover,
      type: 'photo',
      badge: 'camera',
      items: cameraItems,
      isEssential: true,
    });

    // 4. Screenshots (Captures & Notes) - Photo card with orange dot
    const screenshotItems = allGalleryItems.filter(
      (i) => i.sourceType === 'capsule' || i.sourceType === 'challenge' || i.tags?.includes('Note')
    );
    list.push({
      id: 'screenshots',
      title: 'Screenshots',
      count: screenshotItems.length || Math.min(allGalleryItems.length, 3),
      coverUrl: screenshotItems[0]?.photoUrl || allGalleryItems[2]?.photoUrl || defaultRomanticCover,
      type: 'photo',
      badge: 'dot',
      items: screenshotItems.length > 0 ? screenshotItems : allGalleryItems.slice(0, 4),
      isEssential: true,
    });

    // 5. Download (Téléchargements / Reçus)
    const downloadItems = allGalleryItems.filter(
      (i) => i.sourceType === 'memory' || i.sourceType === 'chat'
    );
    list.push({
      id: 'download',
      title: 'Download',
      count: downloadItems.length || 1,
      coverUrl: downloadItems[0]?.photoUrl || allGalleryItems[3]?.photoUrl || defaultRomanticCover,
      type: 'photo',
      items: downloadItems.length > 0 ? downloadItems : allGalleryItems,
      isEssential: true,
    });

    // Album dédié : Photos échangées dans le Chat
    const chatItems = allGalleryItems.filter((i) => i.sourceType === 'chat');
    if (chatItems.length > 0) {
      list.push({
        id: 'chat_media',
        title: 'Photos du Chat',
        count: chatItems.length,
        coverUrl: chatItems[0]?.photoUrl || defaultRomanticCover,
        type: 'photo',
        badge: 'dot',
        items: chatItems,
        isEssential: true,
      });
    }

    // 6. Ray Ban Meta (Moments duo & complices)
    const duoItems = allGalleryItems.filter(
      (i) => i.authorId === 'both' || i.tags?.includes('Duo') || i.tags?.includes('Profil')
    );
    list.push({
      id: 'rayban',
      title: 'Ray Ban Meta',
      count: duoItems.length || Math.min(allGalleryItems.length, 2),
      coverUrl: duoItems[0]?.photoUrl || allGalleryItems[4]?.photoUrl || defaultRomanticCover,
      type: 'photo',
      items: duoItems.length > 0 ? duoItems : allGalleryItems,
      isEssential: true,
    });

    // 7. Hawaaiiii (Voyages & Escapades)
    const tripItems = allGalleryItems.filter(
      (i) => i.locationName || i.sourceType === 'location' || i.tags?.includes('Voyage')
    );
    list.push({
      id: 'hawaaiiii',
      title: 'Hawaaiiii',
      count: tripItems.length || 1,
      coverUrl: tripItems[0]?.photoUrl || allGalleryItems[5]?.photoUrl || defaultRomanticCover,
      type: 'photo',
      items: tripItems.length > 0 ? tripItems : allGalleryItems,
      isEssential: true,
    });

    // 8. Quick Share (Partages complices / Profils) - Pastel gradient style
    const quickShareItems = allGalleryItems.filter(
      (i) => i.sourceType === 'profile' || i.sourceType === 'capsule'
    );
    list.push({
      id: 'quickshare',
      title: 'Quick Share',
      count: quickShareItems.length || 2,
      coverUrl: quickShareItems[0]?.photoUrl || allGalleryItems[0]?.photoUrl || defaultRomanticCover,
      type: 'pastel',
      items: quickShareItems.length > 0 ? quickShareItems : allGalleryItems,
      isEssential: true,
    });

    // 9. AdobeLightroom (Retouches & Portraits)
    const lightroomItems = allGalleryItems.slice(0, 8);
    list.push({
      id: 'lightroom',
      title: 'AdobeLightroom',
      count: lightroomItems.length || 1,
      coverUrl: lightroomItems[0]?.photoUrl || allGalleryItems[1]?.photoUrl || defaultRomanticCover,
      type: 'photo',
      items: lightroomItems.length > 0 ? lightroomItems : allGalleryItems,
      isEssential: true,
    });

    // 10. Expert RAW (Vidéos & HD)
    const videoItems = allGalleryItems.filter((i) => i.mediaType === 'video');
    list.push({
      id: 'expertraw',
      title: 'Expert RAW',
      count: videoItems.length || Math.min(allGalleryItems.length, 1),
      coverUrl: videoItems[0]?.photoUrl || allGalleryItems[2]?.photoUrl || defaultRomanticCover,
      type: 'photo',
      badge: 'video',
      items: videoItems.length > 0 ? videoItems : allGalleryItems,
      isEssential: true,
    });

    // 11. Pictures (Toutes les photos)
    list.push({
      id: 'pictures-album',
      title: 'Pictures',
      count: allGalleryItems.length,
      coverUrl: allGalleryItems[3]?.photoUrl || defaultRomanticCover,
      type: 'photo',
      items: allGalleryItems,
      isEssential: true,
    });

    // 12. SS24 (Saison & Année)
    const ss24Items = allGalleryItems.filter(
      (i) => (i.date && i.date.includes('2024')) || (i.date && i.date.includes('2026'))
    );
    list.push({
      id: 'ss24',
      title: 'SS24',
      count: ss24Items.length || 1,
      coverUrl: ss24Items[0]?.photoUrl || allGalleryItems[4]?.photoUrl || defaultRomanticCover,
      type: 'photo',
      items: ss24Items.length > 0 ? ss24Items : allGalleryItems,
      isEssential: true,
    });

    // 13+. Add Monthly Albums when viewing all
    monthAlbums.forEach((ma) => {
      list.push({
        id: `month-${ma.id}`,
        title: ma.label,
        count: ma.items.length,
        coverUrl: ma.coverPhoto || defaultRomanticCover,
        type: 'photo',
        items: ma.items,
        isEssential: false,
      });
    });

    return list;
  }, [allGalleryItems, monthAlbums, defaultRomanticCover]);

  // Filtered albums based on search and "View all" toggle
  const displayedAlbums = useMemo(() => {
    let base = showViewAll ? samsungAlbums : samsungAlbums.filter((a) => a.isEssential);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      base = base.filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          a.items.some(
            (it) =>
              it.title.toLowerCase().includes(q) ||
              (it.description && it.description.toLowerCase().includes(q)) ||
              (it.locationName && it.locationName.toLowerCase().includes(q))
          )
      );
    }
    return base;
  }, [samsungAlbums, showViewAll, searchQuery]);

  // Currently active selected album for detail exploration
  const activeSelectedAlbum = useMemo(() => {
    if (!selectedAlbumId) return null;
    return samsungAlbums.find((a) => a.id === selectedAlbumId) || null;
  }, [samsungAlbums, selectedAlbumId]);

  // Filtered items for Pictures tab (Timeline)
  const picturesTabItems = useMemo(() => {
    let items = allGalleryItems;

    if (mediaFilter === 'photos') {
      items = items.filter((i) => i.mediaType !== 'video');
    } else if (mediaFilter === 'videos') {
      items = items.filter((i) => i.mediaType === 'video');
    }

    if (selectedYear !== 'all') {
      if (selectedYear === 'undated') {
        items = items.filter((i) => !i.date || isNaN(new Date(i.date).getTime()));
      } else {
        items = items.filter((i) => {
          if (!i.date) return false;
          const d = new Date(i.date);
          return !isNaN(d.getTime()) && d.getFullYear() === selectedYear;
        });
      }
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      items = items.filter(
        (i) =>
          i.title.toLowerCase().includes(q) ||
          (i.description && i.description.toLowerCase().includes(q)) ||
          (i.locationName && i.locationName.toLowerCase().includes(q)) ||
          (i.tags && i.tags.some((t) => t.toLowerCase().includes(q)))
      );
    }

    return items;
  }, [allGalleryItems, mediaFilter, selectedYear, searchQuery]);

  // Contextual items for Lightbox
  const currentLightboxItems = useMemo(() => {
    return (
      lightboxContextItems ||
      (activeSelectedAlbum ? activeSelectedAlbum.items : picturesTabItems)
    );
  }, [lightboxContextItems, activeSelectedAlbum, picturesTabItems]);

  const openLightboxForItem = (item: GalleryItem, contextList?: GalleryItem[]) => {
    const list =
      contextList || (activeSelectedAlbum ? activeSelectedAlbum.items : picturesTabItems);
    setLightboxContextItems(list);
    const idx = list.findIndex((x) => x.id === item.id);
    setActiveLightboxIndex(idx >= 0 ? idx : 0);
  };

  // Convert GalleryItem to PhotoViewerItem for MobilePhotoViewer
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

  // Video processor helper
  const processSingleVideo = async (file: File) => {
    const uploadResult = await uploadAndPersistMedia(file, 'vid_mem', (status) => {
      setUploadStatus(status);
    });
    const fileName = file.name.replace(/\.[^/.]+$/, '').trim();
    const title = fileName && fileName.length > 1 ? fileName : 'Vidéo souvenir';

    if (onAddMemory) {
      onAddMemory({
        title,
        photoUrl: uploadResult.thumbnailDataUrl,
        videoUrl: uploadResult.serverUrl,
        mediaType: 'video',
        videoDuration: uploadResult.duration ? formatVideoDuration(uploadResult.duration) : undefined,
        date: new Date().toISOString().split('T')[0],
        category: 'souvenir',
        description: 'Vidéo importée dans notre galerie',
        authorId: activePartnerId,
        tags: ['Galerie', 'Vidéo'],
      });
    }
  };

  // Multiple media files processor
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
          await new Promise((resolve) => setTimeout(resolve, 80));
        } catch (fileErr) {
          console.error(`Erreur fichier ${file.name}:`, fileErr);
        }
      }

      if (successCount > 0) {
        soundEffects.playSuccessSparkle();
        triggerHeartConfetti();
      }
    } catch (err) {
      console.error('Erreur importation média:', err);
    } finally {
      setIsUploading(false);
      setUploadStatus('');
      if (photoFileInputRef.current) photoFileInputRef.current.value = '';
      if (videoFileInputRef.current) videoFileInputRef.current.value = '';
    }
  };

  const handlePhotoFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleMediaFiles(e.target.files);
    }
  };

  const handleVideoFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleMediaFiles(e.target.files);
    }
  };

  const handlePhotoCapturedFromCamera = (dataUrl: string, caption?: string) => {
    if (onAddMemory) {
      onAddMemory({
        title: caption && caption.trim().length > 0 ? caption.trim() : 'Instant complice',
        photoUrl: dataUrl,
        date: new Date().toISOString().split('T')[0],
        category: 'souvenir',
        description: caption || 'Photo prise en direct depuis la galerie',
        authorId: activePartnerId,
        tags: ['Caméra', 'En direct'],
      });
      soundEffects.playSuccessSparkle();
      triggerHeartConfetti();
    }
  };

  const handleDownload = (item: GalleryItem, e: React.MouseEvent) => {
    e.stopPropagation();
    soundEffects.playSoftTap();
    const a = document.createElement('a');
    a.href = item.videoUrl || item.photoUrl;
    a.download = `${item.title.replace(/\s+/g, '_') || 'souvenir'}.${
      item.mediaType === 'video' ? 'mp4' : 'jpg'
    }`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Drag & drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleMediaFiles(e.dataTransfer.files);
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className="min-h-screen bg-[#F7F8FA] dark:bg-[#121418] text-stone-900 dark:text-stone-100 pb-44 sm:pb-32 select-none relative"
    >
      {/* Hidden File Inputs */}
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

      {/* Drag & Drop Overlay */}
      {isDragOver && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-white pointer-events-none transition-all">
          <div className="p-8 rounded-3xl bg-stone-900/80 border-2 border-dashed border-sky-400 text-center max-w-md shadow-2xl">
            <Upload className="w-14 h-14 text-sky-400 mx-auto mb-4 animate-bounce" />
            <h3 className="text-xl font-bold">Déposez vos photos et vidéos</h3>
            <p className="text-xs sm:text-sm text-stone-300 mt-2">
              Importation directe dans votre galerie Samsung One UI
            </p>
          </div>
        </div>
      )}

      {/* Uploading Status Banner */}
      {isUploading && (
        <div className="sticky top-0 z-30 bg-sky-500 text-white py-2 px-4 shadow-md flex items-center justify-center gap-2 text-xs sm:text-sm font-medium animate-pulse">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>{uploadStatus || 'Importation en cours...'}</span>
        </div>
      )}

      {/* =========================================================
          SAMSUNG ONE UI TOP BAR & HEADER
         ========================================================= */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-4 sm:pt-6">
        {activeSelectedAlbum ? (
          /* Album Detail Header */
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  soundEffects.playSoftTap();
                  setSelectedAlbumId(null);
                }}
                className="w-10 h-10 -ml-2 rounded-full hover:bg-stone-200/70 dark:hover:bg-stone-800 flex items-center justify-center text-stone-800 dark:text-stone-200 transition-colors cursor-pointer"
                title="Retour"
                aria-label="Retour"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-stone-900 dark:text-stone-100 truncate max-w-[200px] sm:max-w-md">
                  {activeSelectedAlbum.title}
                </h1>
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  {activeSelectedAlbum.items.length}{' '}
                  {activeSelectedAlbum.items.length > 1 ? 'éléments' : 'élément'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => {
                  if (activeSelectedAlbum.items.length > 0) {
                    soundEffects.playNoteClick();
                    openLightboxForItem(activeSelectedAlbum.items[0], activeSelectedAlbum.items);
                  }
                }}
                className="p-2.5 rounded-full hover:bg-stone-200/70 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 transition-colors cursor-pointer"
                title="Lancer le diaporama"
                aria-label="Diaporama"
              >
                <Play className="w-5 h-5 fill-current" />
              </button>
              <button
                type="button"
                onClick={() => setShowTopMenu((prev) => !prev)}
                className="p-2.5 rounded-full hover:bg-stone-200/70 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 transition-colors cursor-pointer"
                title="Options"
                aria-label="Options"
              >
                <MoreVertical className="w-5 h-5" />
              </button>
            </div>
          </div>
        ) : (
          /* Main Samsung Header: "Albums" or "Pictures" or "Stories" */
          <div className="space-y-3">
            {/* Top row: Big Bold Title + (+, Search, More) */}
            <div className="flex items-center justify-between">
              <h1 className="text-2xl sm:text-[28px] font-bold tracking-tight text-stone-900 dark:text-stone-100">
                {oneUiTab === 'albums'
                  ? 'Albums'
                  : oneUiTab === 'pictures'
                  ? 'Photos'
                  : 'Histoires'}
              </h1>

              <div className="flex items-center gap-0.5 sm:gap-1">
                {/* Add (+) Button */}
                <button
                  type="button"
                  onClick={() => {
                    soundEffects.playSoftTap();
                    setShowCreateMenu((prev) => !prev);
                  }}
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-full hover:bg-stone-200/70 dark:hover:bg-stone-800 flex items-center justify-center text-stone-800 dark:text-stone-200 transition-colors cursor-pointer"
                  title="Ajouter"
                  aria-label="Ajouter"
                >
                  <Plus className="w-6 h-6 stroke-[2.2]" />
                </button>

                {/* Search Button */}
                <button
                  type="button"
                  onClick={() => {
                    soundEffects.playSoftTap();
                    setShowSearch((prev) => !prev);
                  }}
                  className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
                    showSearch
                      ? 'bg-stone-200 text-stone-900 dark:bg-stone-800 dark:text-white'
                      : 'hover:bg-stone-200/70 dark:hover:bg-stone-800 text-stone-800 dark:text-stone-200'
                  }`}
                  title="Rechercher"
                  aria-label="Rechercher"
                >
                  <Search className="w-5 h-5 stroke-[2.2]" />
                </button>

                {/* Three dots (⋮) Menu Button */}
                <button
                  type="button"
                  onClick={() => {
                    soundEffects.playSoftTap();
                    setShowTopMenu((prev) => !prev);
                  }}
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-full hover:bg-stone-200/70 dark:hover:bg-stone-800 flex items-center justify-center text-stone-800 dark:text-stone-200 transition-colors cursor-pointer"
                  title="Plus d'options"
                  aria-label="Plus d'options"
                >
                  <MoreVertical className="w-5 h-5 stroke-[2.2]" />
                </button>
              </div>
            </div>

            {/* Inline Search Bar if activated */}
            <AnimatePresence>
              {showSearch && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="relative flex items-center">
                    <Search className="w-4 h-4 text-stone-400 absolute left-3.5 pointer-events-none" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Rechercher dans les albums, titres, lieux..."
                      className="w-full pl-10 pr-9 py-2 rounded-2xl bg-stone-200/70 dark:bg-stone-800/90 text-sm text-stone-900 dark:text-white placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
                      autoFocus
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        className="absolute right-3 text-stone-400 hover:text-stone-600 p-1"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Subheader: "Essential albums" & "View all" (Exactly as in Samsung screenshot) */}
            {oneUiTab === 'albums' && (
              <div className="flex items-center justify-between pt-1 pb-1">
                <h2 className="text-[15px] sm:text-base font-semibold text-stone-900 dark:text-stone-100">
                  {showViewAll ? 'All albums' : 'Essential albums'}
                </h2>
                <button
                  type="button"
                  onClick={() => {
                    soundEffects.playSoftTap();
                    setShowViewAll((prev) => !prev);
                  }}
                  className="text-sm font-medium text-sky-600 hover:text-sky-700 dark:text-sky-400 hover:underline cursor-pointer"
                >
                  {showViewAll ? 'Essential albums' : 'View all'}
                </button>
              </div>
            )}

            {/* Filter Row for "Pictures" Tab */}
            {oneUiTab === 'pictures' && (
              <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 scrollbar-none">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      soundEffects.playSoftTap();
                      setMediaFilter('all');
                    }}
                    className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                      mediaFilter === 'all'
                        ? 'bg-stone-900 text-white dark:bg-white dark:text-stone-900'
                        : 'bg-stone-200/80 text-stone-600 dark:bg-stone-800 dark:text-stone-300'
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
                    className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                      mediaFilter === 'photos'
                        ? 'bg-stone-900 text-white dark:bg-white dark:text-stone-900'
                        : 'bg-stone-200/80 text-stone-600 dark:bg-stone-800 dark:text-stone-300'
                    }`}
                  >
                    Photos
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      soundEffects.playSoftTap();
                      setMediaFilter('videos');
                    }}
                    className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                      mediaFilter === 'videos'
                        ? 'bg-stone-900 text-white dark:bg-white dark:text-stone-900'
                        : 'bg-stone-200/80 text-stone-600 dark:bg-stone-800 dark:text-stone-300'
                    }`}
                  >
                    Vidéos
                  </button>
                </div>

                {yearGroups.length > 0 && (
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => setSelectedYear('all')}
                      className={`px-2 py-0.5 rounded-full text-xs transition-all ${
                        selectedYear === 'all'
                          ? 'text-sky-600 font-bold'
                          : 'text-stone-500 hover:text-stone-800'
                      }`}
                    >
                      Toutes
                    </button>
                    {yearGroups.map((yg) => (
                      <button
                        key={String(yg.year)}
                        type="button"
                        onClick={() => setSelectedYear(yg.year)}
                        className={`px-2 py-0.5 rounded-full text-xs transition-all ${
                          selectedYear === yg.year
                            ? 'text-sky-600 font-bold'
                            : 'text-stone-500 hover:text-stone-800'
                        }`}
                      >
                        {yg.year}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* =========================================================
          SAMSUNG TOP ACTIONS POPUP MENU (From "+")
         ========================================================= */}
      <AnimatePresence>
        {showCreateMenu && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setShowCreateMenu(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -10 }}
              className="absolute right-4 sm:right-12 top-16 z-50 w-56 rounded-2xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 shadow-2xl p-1.5 space-y-1"
            >
              <button
                type="button"
                onClick={() => {
                  setShowCreateMenu(false);
                  photoFileInputRef.current?.click();
                }}
                className="w-full px-3 py-2.5 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-700 text-left text-xs sm:text-sm font-medium flex items-center gap-2.5 text-stone-800 dark:text-stone-200 transition-colors cursor-pointer"
              >
                <Upload className="w-4 h-4 text-sky-500" />
                <span>Importer photos & vidéos</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowCreateMenu(false);
                  setShowCameraModal(true);
                }}
                className="w-full px-3 py-2.5 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-700 text-left text-xs sm:text-sm font-medium flex items-center gap-2.5 text-stone-800 dark:text-stone-200 transition-colors cursor-pointer"
              >
                <Camera className="w-4 h-4 text-rose-500" />
                <span>Prendre une photo</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowCreateMenu(false);
                  videoFileInputRef.current?.click();
                }}
                className="w-full px-3 py-2.5 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-700 text-left text-xs sm:text-sm font-medium flex items-center gap-2.5 text-stone-800 dark:text-stone-200 transition-colors cursor-pointer"
              >
                <Video className="w-4 h-4 text-purple-500" />
                <span>Importer vidéos</span>
              </button>

              <div className="h-px bg-stone-200 dark:bg-stone-700 my-1" />

              <button
                type="button"
                onClick={() => {
                  setShowCreateMenu(false);
                  onOpenAddMemoryModal('image');
                }}
                className="w-full px-3 py-2.5 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-700 text-left text-xs sm:text-sm font-medium flex items-center gap-2.5 text-stone-800 dark:text-stone-200 transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4 text-emerald-500" />
                <span>Nouveau souvenir détaillé</span>
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* =========================================================
          SAMSUNG TOP MORE MENU (From "⋮")
         ========================================================= */}
      <AnimatePresence>
        {showTopMenu && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setShowTopMenu(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -10 }}
              className="absolute right-4 sm:right-8 top-16 z-50 w-52 rounded-2xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 shadow-2xl p-1.5 space-y-1"
            >
              <button
                type="button"
                onClick={() => {
                  setShowTopMenu(false);
                  setShowViewAll(!showViewAll);
                }}
                className="w-full px-3 py-2.5 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-700 text-left text-xs sm:text-sm font-medium flex items-center gap-2.5 text-stone-800 dark:text-stone-200 transition-colors cursor-pointer"
              >
                <Layers className="w-4 h-4 text-stone-500" />
                <span>{showViewAll ? 'Afficher essentiels' : 'Tout afficher'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowTopMenu(false);
                  setShowSamsungMenu(true);
                }}
                className="w-full px-3 py-2.5 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-700 text-left text-xs sm:text-sm font-medium flex items-center gap-2.5 text-stone-800 dark:text-stone-200 transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4 text-stone-500" />
                <span>Corbeille</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowTopMenu(false);
                  if (allGalleryItems.length > 0) {
                    openLightboxForItem(allGalleryItems[0], allGalleryItems);
                  }
                }}
                className="w-full px-3 py-2.5 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-700 text-left text-xs sm:text-sm font-medium flex items-center gap-2.5 text-stone-800 dark:text-stone-200 transition-colors cursor-pointer"
              >
                <Play className="w-4 h-4 text-stone-500" />
                <span>Diaporama</span>
              </button>

              <div className="h-px bg-stone-200 dark:bg-stone-700 my-1" />

              <button
                type="button"
                onClick={() => {
                  setShowTopMenu(false);
                  setShowSettingsModal(true);
                }}
                className="w-full px-3 py-2.5 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-700 text-left text-xs sm:text-sm font-medium flex items-center gap-2.5 text-stone-800 dark:text-stone-200 transition-colors cursor-pointer"
              >
                <Settings className="w-4 h-4 text-stone-500" />
                <span>Paramètres de la galerie</span>
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* =========================================================
          MAIN VIEW CONTENT:
          1. Selected Album Detail View (when an album is clicked)
          2. Tab "Albums": 3-Column Samsung Grid (Screenshot match!)
          3. Tab "Pictures": Continuous timeline photos
          4. Tab "Stories": Romantic Highlight stories
         ========================================================= */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-3">
        {activeSelectedAlbum ? (
          /* 1. FOCUSED ALBUM CONTENT */
          <div className="space-y-4">
            {activeSelectedAlbum.items.length === 0 ? (
              <div className="py-16 text-center text-stone-400">
                <Images className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Cet album ne contient encore aucun média</p>
                <button
                  type="button"
                  onClick={() => photoFileInputRef.current?.click()}
                  className="mt-3 px-4 py-1.5 rounded-full bg-sky-600 text-white text-xs font-semibold cursor-pointer"
                >
                  Ajouter des photos
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                {activeSelectedAlbum.items.map((item, idx) => (
                  <SamsungPhotoItem
                    key={item.id}
                    item={item}
                    index={idx}
                    onClick={() => openLightboxForItem(item, activeSelectedAlbum.items)}
                    autoplayVideo={autoplayVideosInGrid}
                  />
                ))}
              </div>
            )}
          </div>
        ) : oneUiTab === 'albums' ? (
          /* 2. SAMSUNG ALBUMS VIEW: THE EXACT 3-COLUMN ROUNDED CARDS GRID */
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-2.5 sm:gap-3.5">
              {displayedAlbums.map((album, index) => (
                <SamsungAlbumCard
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

            {displayedAlbums.length === 0 && (
              <div className="py-16 text-center text-stone-400">
                <p className="text-sm">Aucun album ne correspond à votre recherche</p>
              </div>
            )}
          </div>
        ) : oneUiTab === 'pictures' ? (
          /* 3. SAMSUNG PICTURES VIEW: TIMELINE OF PHOTOS */
          <div className="space-y-4">
            {picturesTabItems.length === 0 ? (
              <div className="py-16 text-center text-stone-400">
                <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Aucune photo ou vidéo trouvée</p>
                <button
                  type="button"
                  onClick={() => photoFileInputRef.current?.click()}
                  className="mt-3 px-4 py-1.5 rounded-full bg-sky-600 text-white text-xs font-semibold cursor-pointer"
                >
                  Importer des photos
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-1 sm:gap-1.5">
                {picturesTabItems.map((item, idx) => (
                  <SamsungPhotoItem
                    key={item.id}
                    item={item}
                    index={idx}
                    onClick={() => openLightboxForItem(item, picturesTabItems)}
                    autoplayVideo={autoplayVideosInGrid}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          /* 4. SAMSUNG STORIES VIEW: ROMANTIC HIGHLIGHT REELS */
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <SamsungStoryCard
                title="Nos plus beaux moments"
                subtitle="Sélection complice"
                count={allGalleryItems.length}
                coverUrl={allGalleryItems[0]?.photoUrl || defaultRomanticCover}
                onClick={() => {
                  if (allGalleryItems.length > 0) {
                    openLightboxForItem(allGalleryItems[0], allGalleryItems);
                  }
                }}
              />
              <SamsungStoryCard
                title="Coup de cœur & Souvenirs"
                subtitle="Moments favoris à deux"
                count={Math.max(1, allGalleryItems.filter((i) => i.likes?.length).length)}
                coverUrl={allGalleryItems[1]?.photoUrl || allGalleryItems[0]?.photoUrl || defaultRomanticCover}
                onClick={() => {
                  const favs = allGalleryItems.filter((i) => i.likes?.length);
                  if (favs.length > 0) openLightboxForItem(favs[0], favs);
                  else if (allGalleryItems.length > 0) openLightboxForItem(allGalleryItems[0], allGalleryItems);
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* =========================================================
          SAMSUNG ONE UI SIGNATURE FLOATING NAVIGATION DOCK
          (Positioned nicely above the bottom navigation bar on mobile)
         ========================================================= */}
      <div className="fixed bottom-[calc(4.75rem+env(safe-area-inset-bottom,0px))] sm:bottom-6 left-1/2 -translate-x-1/2 z-35 pointer-events-auto">
        <div className="flex items-center bg-white/90 dark:bg-stone-900/90 backdrop-blur-2xl border border-stone-200/80 dark:border-stone-800 shadow-[0_12px_36px_rgba(0,0,0,0.16)] rounded-full px-3.5 sm:px-4 py-1.5 sm:py-2 gap-2 sm:gap-4">
          {/* 1. Pictures / Photos Tab */}
          <button
            type="button"
            onClick={() => {
              soundEffects.playSoftTap();
              setOneUiTab('pictures');
              setSelectedAlbumId(null);
            }}
            className={`p-2.5 rounded-full transition-all flex items-center justify-center cursor-pointer ${
              oneUiTab === 'pictures'
                ? 'bg-stone-800 text-white dark:bg-stone-200 dark:text-stone-900 shadow-sm'
                : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
            }`}
            title="Photos"
            aria-label="Photos"
          >
            <ImageIcon className="w-5 h-5" />
          </button>

          {/* 2. Albums Tab (Active pill style matching the screenshot) */}
          <button
            type="button"
            onClick={() => {
              soundEffects.playSoftTap();
              setOneUiTab('albums');
              setSelectedAlbumId(null);
            }}
            className={`p-2.5 rounded-full transition-all flex items-center justify-center cursor-pointer ${
              oneUiTab === 'albums'
                ? 'bg-stone-800 text-white dark:bg-stone-200 dark:text-stone-900 shadow-sm'
                : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
            }`}
            title="Albums"
            aria-label="Albums"
          >
            <BookOpen className="w-5 h-5" />
          </button>

          {/* 3. Stories Tab */}
          <button
            type="button"
            onClick={() => {
              soundEffects.playSoftTap();
              setOneUiTab('stories');
              setSelectedAlbumId(null);
            }}
            className={`p-2.5 rounded-full transition-all flex items-center justify-center cursor-pointer ${
              oneUiTab === 'stories'
                ? 'bg-stone-800 text-white dark:bg-stone-200 dark:text-stone-900 shadow-sm'
                : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
            }`}
            title="Histoires"
            aria-label="Histoires"
          >
            <Bookmark className="w-5 h-5" />
          </button>

          {/* 4. More Menu Button */}
          <button
            type="button"
            onClick={() => {
              soundEffects.playSoftTap();
              setShowSamsungMenu(true);
            }}
            className={`p-2.5 rounded-full transition-all flex items-center justify-center cursor-pointer ${
              showSamsungMenu
                ? 'bg-stone-200 text-stone-900 dark:bg-stone-700 dark:text-white'
                : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
            }`}
            title="Menu de la galerie"
            aria-label="Menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* =========================================================
          SAMSUNG BOTTOM DRAWER / MENU SHEET (From "☰")
         ========================================================= */}
      <AnimatePresence>
        {showSamsungMenu && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSamsungMenu(false)}
              className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs"
            />

            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="fixed inset-x-0 bottom-0 z-50 rounded-t-[28px] bg-white dark:bg-stone-900 border-t border-stone-200 dark:border-stone-800 p-5 shadow-2xl max-w-lg mx-auto space-y-4"
            >
              {/* Top pill bar */}
              <div className="w-10 h-1 rounded-full bg-stone-300 dark:bg-stone-700 mx-auto -mt-1" />

              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
                  Galerie One UI
                </h3>
                <button
                  type="button"
                  onClick={() => setShowSamsungMenu(false)}
                  className="p-1 rounded-full hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-500"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Samsung Quick Navigation Grid */}
              <div className="grid grid-cols-4 gap-3 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setShowSamsungMenu(false);
                    setOneUiTab('pictures');
                    setMediaFilter('photos');
                  }}
                  className="flex flex-col items-center gap-1.5 p-2 rounded-2xl hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
                >
                  <div className="w-11 h-11 rounded-2xl bg-sky-100 dark:bg-sky-950/60 text-sky-600 flex items-center justify-center shadow-xs">
                    <ImageIcon className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-medium text-stone-700 dark:text-stone-300">
                    Photos
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowSamsungMenu(false);
                    setOneUiTab('pictures');
                    setMediaFilter('videos');
                  }}
                  className="flex flex-col items-center gap-1.5 p-2 rounded-2xl hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
                >
                  <div className="w-11 h-11 rounded-2xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 flex items-center justify-center shadow-xs">
                    <Video className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-medium text-stone-700 dark:text-stone-300">
                    Vidéos
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowSamsungMenu(false);
                    setSelectedAlbumId('favourites');
                  }}
                  className="flex flex-col items-center gap-1.5 p-2 rounded-2xl hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
                >
                  <div className="w-11 h-11 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center shadow-xs">
                    <Heart className="w-5 h-5 fill-rose-500" />
                  </div>
                  <span className="text-xs font-medium text-stone-700 dark:text-stone-300">
                    Favoris
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowSamsungMenu(false);
                    setShowCameraModal(true);
                  }}
                  className="flex flex-col items-center gap-1.5 p-2 rounded-2xl hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
                >
                  <div className="w-11 h-11 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center shadow-xs">
                    <Camera className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-medium text-stone-700 dark:text-stone-300">
                    Caméra
                  </span>
                </button>
              </div>

              {/* Action List Items */}
              <div className="space-y-1 pt-2 border-t border-stone-100 dark:border-stone-800">
                <button
                  type="button"
                  onClick={() => {
                    setShowSamsungMenu(false);
                    photoFileInputRef.current?.click();
                  }}
                  className="w-full px-3 py-2.5 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800 flex items-center justify-between text-xs sm:text-sm text-stone-800 dark:text-stone-200 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <Upload className="w-4 h-4 text-sky-500" />
                    <span>Importer plusieurs photos / vidéos</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-stone-400" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowSamsungMenu(false);
                    onOpenAddMemoryModal('image');
                  }}
                  className="w-full px-3 py-2.5 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800 flex items-center justify-between text-xs sm:text-sm text-stone-800 dark:text-stone-200 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <Sparkles className="w-4 h-4 text-rose-500" />
                    <span>Ajouter un souvenir détaillé</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-stone-400" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowSamsungMenu(false);
                    setShowSettingsModal(true);
                  }}
                  className="w-full px-3 py-2.5 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800 flex items-center justify-between text-xs sm:text-sm text-stone-800 dark:text-stone-200 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <Settings className="w-4 h-4 text-stone-500" />
                    <span>Paramètres de la galerie</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-stone-400" />
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* =========================================================
          FULLSCREEN MOBILE PHOTO & VIDEO VIEWER (Auto-Hides UI)
         ========================================================= */}
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

      {/* Live Direct Camera Modal */}
      <CameraCaptureModal
        isOpen={showCameraModal}
        onClose={() => setShowCameraModal(false)}
        onPhotoCaptured={handlePhotoCapturedFromCamera}
        title="Appareil photo complice"
        subtitle="Capturez un instant en direct pour votre galerie"
        submitLabel="Ajouter à la galerie"
        allowCaption={true}
      />

      {/* =========================================================
          SAMSUNG ONE UI GALLERY SETTINGS MODAL / SHEET
         ========================================================= */}
      <AnimatePresence>
        {showSettingsModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSettingsModal(false)}
              className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs"
            />
            <motion.div
              initial={{ opacity: 0, y: '100%' }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="fixed inset-x-0 bottom-0 z-50 max-w-lg mx-auto rounded-t-[32px] bg-[#F7F8FA] dark:bg-[#16181D] border-t border-stone-200 dark:border-stone-800 shadow-2xl p-5 sm:p-6 max-h-[85vh] overflow-y-auto"
            >
              {/* Handle bar */}
              <div className="w-12 h-1.5 rounded-full bg-stone-300 dark:bg-stone-700 mx-auto -mt-1 mb-4" />

              {/* Modal Header */}
              <div className="flex items-center justify-between pb-3 border-b border-stone-200/80 dark:border-stone-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-2xl bg-sky-100 dark:bg-sky-950/60 text-sky-600 flex items-center justify-center">
                    <Settings className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-stone-900 dark:text-stone-100">
                      Paramètres de la galerie
                    </h2>
                    <p className="text-xs text-stone-500 dark:text-stone-400">
                      Personnalisez l'affichage Samsung One UI
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowSettingsModal(false)}
                  className="p-1.5 rounded-full hover:bg-stone-200/70 dark:hover:bg-stone-800 text-stone-500 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Settings Body */}
              <div className="space-y-4 pt-4">
                {/* Section: LECTURE ET APERÇU */}
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500 px-1 mb-2">
                    Lecture et affichage
                  </div>

                  <div className="rounded-2xl bg-white dark:bg-stone-800/90 border border-stone-200/80 dark:border-stone-700/80 shadow-2xs divide-y divide-stone-100 dark:divide-stone-700/60">
                    {/* Option: Lecture automatique des vidéos dans la grille */}
                    <div className="p-4 flex items-center justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-xl bg-purple-100 dark:bg-purple-950/50 text-purple-600 flex items-center justify-center shrink-0 mt-0.5">
                          <Film className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-stone-900 dark:text-stone-100">
                            Lecture automatique des vidéos
                          </div>
                          <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5 leading-relaxed">
                            Lire automatiquement et en boucle les vidéos sans le son directement dans la grille d'aperçu.
                          </p>
                        </div>
                      </div>

                      {/* Samsung Toggle Switch */}
                      <button
                        type="button"
                        role="switch"
                        aria-checked={autoplayVideosInGrid}
                        onClick={() => handleToggleAutoplayVideos(!autoplayVideosInGrid)}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out focus:outline-none ${
                          autoplayVideosInGrid
                            ? 'bg-sky-600'
                            : 'bg-stone-300 dark:bg-stone-700'
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out mt-0.5 ${
                            autoplayVideosInGrid ? 'translate-x-5' : 'translate-x-0.5'
                          }`}
                        />
                      </button>
                    </div>

                    {/* Status hint */}
                    <div className="px-4 py-2.5 bg-stone-50/50 dark:bg-stone-800/50 flex items-center justify-between text-xs">
                      <span className="text-stone-500 dark:text-stone-400">
                        État de la lecture automatique
                      </span>
                      <span
                        className={`font-semibold flex items-center gap-1 ${
                          autoplayVideosInGrid
                            ? 'text-sky-600 dark:text-sky-400'
                            : 'text-stone-400 dark:text-stone-500'
                        }`}
                      >
                        {autoplayVideosInGrid ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Activée</span>
                          </>
                        ) : (
                          <span>Désactivée</span>
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Section: INFORMATIONS & ASTUCES */}
                <div className="rounded-2xl bg-sky-50 dark:bg-sky-950/30 border border-sky-200/70 dark:border-sky-800/50 p-3.5 text-xs text-sky-900 dark:text-sky-200 flex items-start gap-2.5">
                  <Sparkles className="w-4 h-4 text-sky-500 shrink-0 mt-0.5" />
                  <p>
                    Lorsque cette option est activée, les vidéos défilent silencieusement dans vos albums et dans l'onglet Photos comme dans l'application Samsung Gallery.
                  </p>
                </div>

                {/* Close Button */}
                <button
                  type="button"
                  onClick={() => setShowSettingsModal(false)}
                  className="w-full py-3 rounded-2xl bg-stone-900 hover:bg-stone-800 dark:bg-white dark:hover:bg-stone-100 text-white dark:text-stone-900 text-sm font-semibold shadow-xs transition-colors cursor-pointer text-center"
                >
                  Terminé
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

// =========================================================
// SUB-COMPONENT: SAMSUNG ONE UI ALBUM CARD
// (Matches the exact 3-column rounded look from the user's screenshot)
// =========================================================
const SamsungAlbumCard: React.FC<{
  album: SamsungAlbum;
  index: number;
  onClick: () => void;
}> = ({ album, index, onClick }) => {
  if (album.type === 'stacked') {
    // STACKED CARD VARIANT (For "Recent" and "Favourites" as in screenshot)
    return (
      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.15, delay: Math.min(index * 0.02, 0.25) }}
        onClick={onClick}
        className="group relative aspect-[1/1.12] rounded-[20px] sm:rounded-[24px] bg-[#E8EAEF] dark:bg-stone-800 p-2.5 sm:p-3 flex flex-col items-center justify-between cursor-pointer select-none transition-transform active:scale-[0.97] shadow-2xs hover:shadow-md overflow-hidden"
      >
        {/* Layered Cards Stack Miniature */}
        <div className="relative w-14 h-14 sm:w-18 sm:h-18 mt-1">
          {/* Layer 2 (Backmost shadow card) */}
          <div className="absolute inset-0 translate-x-2 -translate-y-1.5 rounded-xl bg-stone-300/80 dark:bg-stone-700 shadow-xs border border-white/20" />
          {/* Layer 1 (Middle card) */}
          <div className="absolute inset-0 translate-x-1 -translate-y-0.5 rounded-xl bg-stone-400/80 dark:bg-stone-600 shadow-xs border border-white/20" />
          {/* Top cover miniature */}
          <img
            src={album.coverUrl}
            alt={album.title}
            loading="lazy"
            className="relative z-10 w-full h-full object-cover rounded-xl shadow-md border border-white/40"
          />
        </div>

        {/* Text at Bottom */}
        <div className="w-full text-center pb-0.5">
          <div className="text-stone-900 dark:text-stone-100 text-[13px] sm:text-[14px] font-semibold tracking-tight truncate leading-tight">
            {album.title}
          </div>
          <div className="text-stone-500 dark:text-stone-400 text-[11px] sm:text-xs font-normal mt-0.5">
            {album.count}
          </div>
        </div>
      </motion.div>
    );
  }

  if (album.type === 'pastel') {
    // PASTEL VARIANT (For "Quick Share" as in screenshot)
    return (
      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.15, delay: Math.min(index * 0.02, 0.25) }}
        onClick={onClick}
        className="group relative aspect-[1/1.12] rounded-[20px] sm:rounded-[24px] overflow-hidden bg-gradient-to-br from-pink-200 via-rose-300 to-purple-300 dark:from-pink-900/60 dark:to-purple-900/60 p-2 flex flex-col justify-end items-center cursor-pointer select-none transition-transform active:scale-[0.97] shadow-2xs hover:shadow-md"
      >
        {/* Soft UI illustration preview */}
        <div className="absolute inset-0 flex items-center justify-center opacity-70">
          <div className="flex items-center gap-1">
            <span className="w-6 h-6 rounded-lg bg-pink-400/80 text-white font-bold text-[10px] flex items-center justify-center shadow-xs">
              A
            </span>
            <span className="w-6 h-6 rounded-lg bg-indigo-400/80 text-white font-bold text-[10px] flex items-center justify-center shadow-xs">
              B
            </span>
            <span className="w-6 h-6 rounded-lg bg-purple-400/80 text-white font-bold text-[10px] flex items-center justify-center shadow-xs">
              C
            </span>
          </div>
        </div>

        <div className="relative z-10 w-full text-center pb-1">
          <div className="text-white text-[13px] sm:text-[14px] font-semibold tracking-tight truncate drop-shadow-md">
            {album.title}
          </div>
          <div className="text-white/90 text-[11px] sm:text-xs font-normal mt-0.5 drop-shadow-sm">
            {album.count}
          </div>
        </div>
      </motion.div>
    );
  }

  // STANDARD PHOTO BACKGROUND CARD VARIANT (For Camera, Screenshots, Download, SS24, etc.)
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.15, delay: Math.min(index * 0.02, 0.25) }}
      onClick={onClick}
      className="group relative aspect-[1/1.12] rounded-[20px] sm:rounded-[24px] overflow-hidden bg-stone-200 dark:bg-stone-800 cursor-pointer select-none transition-transform active:scale-[0.97] shadow-2xs hover:shadow-md"
    >
      {/* Photo cover */}
      <img
        src={album.coverUrl}
        alt={album.title}
        loading="lazy"
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
      />

      {/* Dark gradient for high contrast bottom text */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />

      {/* Top right icon badges if applicable */}
      {album.badge === 'camera' && (
        <div className="absolute top-2 right-2 p-1 rounded-full bg-black/40 backdrop-blur-xs text-white">
          <Camera className="w-3 h-3" />
        </div>
      )}

      {album.badge === 'video' && (
        <div className="absolute top-2 right-2 p-1 rounded-full bg-black/40 backdrop-blur-xs text-white">
          <Film className="w-3 h-3 text-purple-300" />
        </div>
      )}

      {album.badge === 'dot' && (
        <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-amber-400 ring-2 ring-white/40" />
      )}

      {/* Centered Title and Item Count at the Bottom */}
      <div className="absolute bottom-2 inset-x-1 text-center">
        <div className="text-white text-[13px] sm:text-[14px] font-semibold tracking-tight truncate px-1 drop-shadow-md">
          {album.title}
        </div>
        <div className="text-white/85 text-[11px] sm:text-xs font-normal mt-0.5 drop-shadow-sm">
          {album.count}
        </div>
      </div>
    </motion.div>
  );
};

// =========================================================
// SUB-COMPONENT: SAMSUNG PHOTO ITEM (For Pictures & Detail View)
// =========================================================
const SamsungPhotoItem: React.FC<{
  item: GalleryItem;
  index: number;
  onClick: () => void;
  autoplayVideo?: boolean;
}> = ({ item, index, onClick, autoplayVideo = false }) => {
  const isVideo =
    item.mediaType === 'video' ||
    Boolean(item.videoUrl) ||
    isVideoMediaType(item.videoUrl || item.photoUrl, item.mediaType);
  const [videoError, setVideoError] = useState(false);

  return (
    <motion.div
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.12, delay: Math.min(index * 0.01, 0.2) }}
      onClick={onClick}
      className="group relative aspect-square overflow-hidden bg-stone-100 dark:bg-stone-800 cursor-pointer select-none"
    >
      {isVideo && autoplayVideo && !videoError ? (
        <div className="w-full h-full bg-black flex items-center justify-center overflow-hidden">
          <video
            src={item.videoUrl || item.photoUrl}
            poster={item.photoUrl}
            autoPlay
            loop
            muted
            playsInline
            preload="metadata"
            onError={() => setVideoError(true)}
            className="max-w-full max-h-full object-contain mx-auto my-auto block"
            style={{ objectFit: 'contain', objectPosition: '50% 50%' }}
          />
        </div>
      ) : (
        <img
          src={item.photoUrl}
          alt={item.title || 'Souvenir'}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
        />
      )}

      {/* Video Indicator */}
      {isVideo && (
        <div className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded-md bg-black/70 backdrop-blur-xs text-white text-[10px] font-medium flex items-center gap-1">
          {autoplayVideo && !videoError ? (
            <Film className="w-2.5 h-2.5 text-purple-300 animate-pulse" />
          ) : (
            <Play className="w-2.5 h-2.5 fill-white" />
          )}
          <span>{item.videoDuration || 'Vidéo'}</span>
        </div>
      )}

      {/* Favorite Heart Badge if liked */}
      {item.likes && item.likes.length > 0 && (
        <div className="absolute top-1.5 right-1.5 p-1 rounded-full bg-black/40 backdrop-blur-xs text-rose-400">
          <Heart className="w-3 h-3 fill-rose-500 text-rose-500" />
        </div>
      )}
    </motion.div>
  );
};

// =========================================================
// SUB-COMPONENT: SAMSUNG STORIES CARD
// =========================================================
const SamsungStoryCard: React.FC<{
  title: string;
  subtitle: string;
  count: number;
  coverUrl: string;
  onClick: () => void;
}> = ({ title, subtitle, count, coverUrl, onClick }) => {
  return (
    <motion.div
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="relative aspect-16/10 rounded-3xl overflow-hidden bg-stone-200 dark:bg-stone-800 cursor-pointer shadow-md group"
    >
      <img
        src={coverUrl}
        alt={title}
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
      <div className="absolute bottom-4 left-4 right-4">
        <span className="px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-white text-[11px] font-medium">
          {count} souvenirs
        </span>
        <h3 className="text-base sm:text-lg font-bold text-white mt-1.5">{title}</h3>
        <p className="text-xs text-white/80">{subtitle}</p>
      </div>
    </motion.div>
  );
};
