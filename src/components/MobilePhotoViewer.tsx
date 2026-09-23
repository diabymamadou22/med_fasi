import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Download,
  ExternalLink,
  Heart,
  Calendar,
  MapPin,
  Trash2,
  Pencil,
  Tag,
  Maximize2,
  Minimize2,
  Sparkles,
  Play,
  Pause,
  Camera,
  Share2,
  Video,
  MoreVertical,
  Volume2,
  VolumeX,
  Repeat,
  Sliders,
  Info,
  Check,
  Palette,
  Eye,
} from 'lucide-react';
import { soundEffects } from '../lib/audio';
import { triggerHeartConfetti } from '../lib/confetti';
import { triggerVibration } from '../lib/notificationService';
import { PartnerAvatar } from './PartnerAvatar';
import { PartnerId } from '../types';
import {
  isVideoMediaType,
  resolveMediaUrl,
  formatVideoDuration,
} from '../lib/videoUtils';
import { SleekLoveVideoPlayer } from './SleekLoveVideoPlayer';
import { useBackHandler } from '../lib/backNavigation';
import { useGesture, usePinch } from 'react-use-gesture';

export type PhotoFilterMode = 'normal' | 'vivid' | 'warm' | 'soft' | 'bw';

export interface PhotoFilterOption {
  id: PhotoFilterMode;
  label: string;
  shortDesc: string;
  filter: string;
  icon: string;
}

export const PHOTO_FILTERS: PhotoFilterOption[] = [
  { id: 'normal', label: 'Naturel', shortDesc: 'Fidèle à l’originale', filter: 'none', icon: '🌿' },
  { id: 'vivid', label: 'Éclat d’amour', shortDesc: 'Couleurs vives et lumineuses', filter: 'contrast(106%) saturate(122%) brightness(102%)', icon: '✨' },
  { id: 'warm', label: 'Romance dorée', shortDesc: 'Tons chauds & chaleureux', filter: 'sepia(20%) saturate(115%) brightness(103%) hue-rotate(-5deg)', icon: '🌅' },
  { id: 'soft', label: 'Nuit douce', shortDesc: 'Confort visuel reposant', filter: 'brightness(92%) contrast(96%)', icon: '🌙' },
  { id: 'bw', label: 'Noir & Blanc', shortDesc: 'Argentique & intemporel', filter: 'grayscale(100%) contrast(110%)', icon: '🎞️' },
];

export interface PhotoMeta {
  width: number;
  height: number;
  aspectRatio: string;
  megapixels: string;
  format: string;
}

export interface PhotoViewerItem {
  id: string;
  photoUrl: string;
  videoUrl?: string;
  mediaType?: 'image' | 'video';
  videoDuration?: number;
  title?: string;
  description?: string;
  date?: string;
  locationName?: string;
  badgeLabel?: string;
  badgeBg?: string;
  authorId?: PartnerId | 'both';
  authorName?: string;
  authorAvatar?: string;
  isLiked?: boolean;
  likeCount?: number;
  tags?: string[];
  onLike?: () => void;
  onDelete?: () => void;
  onEdit?: () => void;
  onRemovePhotoOnly?: () => void;
  canDelete?: boolean;
}

interface MobilePhotoViewerProps {
  items: PhotoViewerItem[];
  initialIndex: number;
  isOpen: boolean;
  onClose: () => void;
  onIndexChange?: (index: number) => void;
}

export const MobilePhotoViewer: React.FC<MobilePhotoViewerProps> = ({
  items = [],
  initialIndex = 0,
  isOpen,
  onClose,
  onIndexChange,
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex || 0);
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [pullDownOffset, setPullDownOffset] = useState(0);
  const [direction, setDirection] = useState<number>(0);
  const [showUiChrome, setShowUiChrome] = useState(true);
  const [isInteracting, setIsInteracting] = useState(false);

  // Gesture refs
  const gestureStateRef = useRef<{ wasGesture: boolean }>({ wasGesture: false });
  const lastTapRef = useRef<{ time: number; x: number; y: number }>({ time: 0, x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement | null>(null);
  const thumbnailStripRef = useRef<HTMLDivElement | null>(null);

  // Keep index in sync with initialIndex when opening
  useEffect(() => {
    if (isOpen) {
      const safeItems = items || [];
      let targetIndex = 0;
      if (safeItems.length > 0) {
        const safeInit = typeof initialIndex === 'number' ? initialIndex : 0;
        targetIndex = Math.max(0, Math.min(safeInit, safeItems.length - 1));
        setCurrentIndex(targetIndex);
      } else {
        setCurrentIndex(0);
      }
      setScale(1);
      setPan({ x: 0, y: 0 });
      setSwipeOffset(0);
      setPullDownOffset(0);

      // If opening directly on a video, hide all buttons so the video takes full screen
      const active = safeItems[targetIndex];
      const isVideo = Boolean(
        active &&
          (active.mediaType === 'video' ||
            Boolean(active.videoUrl) ||
            isVideoMediaType(active.videoUrl || active.photoUrl, active.mediaType))
      );
      setShowUiChrome(!isVideo);
    }
  }, [isOpen, initialIndex, items]);

  // Scroll active thumbnail into view
  useEffect(() => {
    if (!thumbnailStripRef.current || !items || items.length === 0) return;
    const activeThumb = thumbnailStripRef.current.children[currentIndex] as HTMLElement;
    if (activeThumb) {
      activeThumb.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [currentIndex, items]);

  const activeItem = items[currentIndex] || null;

  const isCurrentItemVideo = Boolean(
    activeItem &&
      (activeItem.mediaType === 'video' ||
        Boolean(activeItem.videoUrl) ||
        isVideoMediaType(activeItem.videoUrl || activeItem.photoUrl, activeItem.mediaType))
  );

  const [resolvedVideoUrl, setResolvedVideoUrl] = useState<string>('');
  const [isVideoMuted, setIsVideoMuted] = useState<boolean>(false);
  const [isVideoLooping, setIsVideoLooping] = useState<boolean>(false);
  const [videoPlaybackRate, setVideoPlaybackRate] = useState<number>(1);
  const [showOptionsMenu, setShowOptionsMenu] = useState<boolean>(false);
  const [showDetailsModal, setShowDetailsModal] = useState<boolean>(false);

  // Photo Visual Ambiance, Fullscreen & Metadata States
  const [filterMode, setFilterMode] = useState<PhotoFilterMode>('normal');
  const [showFilterPicker, setShowFilterPicker] = useState<boolean>(false);
  const [currentImageMeta, setCurrentImageMeta] = useState<PhotoMeta | null>(null);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 2400);
  }, []);

  // Sync browser fullscreen status
  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const toggleNativeFullscreen = useCallback(() => {
    soundEffects.playSoftTap();
    triggerVibration([20]);
    if (!document.fullscreenElement) {
      if (containerRef.current?.requestFullscreen) {
        containerRef.current.requestFullscreen().catch(() => {});
      } else if ((containerRef.current as any)?.webkitRequestFullscreen) {
        (containerRef.current as any).webkitRequestFullscreen();
      }
      setIsFullscreen(true);
      showToast('Plein écran immersif activé ⛶');
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      } else if ((document as any).webkitExitFullscreen) {
        (document as any).webkitExitFullscreen();
      }
      setIsFullscreen(false);
      showToast('Plein écran quitté');
    }
  }, [showToast]);

  // Reset metadata when photo changes
  useEffect(() => {
    setCurrentImageMeta(null);
  }, [currentIndex]);

  const handleImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    const w = img.naturalWidth;
    const h = img.naturalHeight;
    if (!w || !h) return;

    const ratio = w / h;
    let ratioLabel = `${ratio.toFixed(2)}:1`;
    if (Math.abs(ratio - 1) < 0.05) ratioLabel = '1:1 Carré';
    else if (Math.abs(ratio - 16 / 9) < 0.08) ratioLabel = '16:9 Paysage';
    else if (Math.abs(ratio - 9 / 16) < 0.08) ratioLabel = '9:16 Portrait';
    else if (Math.abs(ratio - 4 / 3) < 0.08) ratioLabel = '4:3 Standard';
    else if (Math.abs(ratio - 3 / 4) < 0.08) ratioLabel = '3:4 Portrait';
    else if (w > h) ratioLabel = `${ratio.toFixed(1)}:1 Paysage`;
    else ratioLabel = `1:${(1 / ratio).toFixed(1)} Portrait`;

    const mp = ((w * h) / 1_000_000).toFixed(1) + ' MP';

    let format = 'Photo HD';
    const url = activeItem?.photoUrl || '';
    if (url.includes('image/png') || url.endsWith('.png')) format = 'Format PNG HD';
    else if (url.includes('image/webp') || url.endsWith('.webp')) format = 'Format WebP';
    else if (url.includes('image/jpeg') || url.endsWith('.jpg') || url.endsWith('.jpeg')) format = 'Format JPEG HD';

    setCurrentImageMeta({
      width: w,
      height: h,
      aspectRatio: ratioLabel,
      megapixels: mp,
      format,
    });
  }, [activeItem?.photoUrl]);

  // Samsung Video Player States & Ref
  const videoElRef = useRef<HTMLVideoElement | null>(null);
  const [videoCurrentTime, setVideoCurrentTime] = useState<number>(0);
  const [videoDuration, setVideoDuration] = useState<number>(0);
  const [isVideoPlaying, setIsVideoPlaying] = useState<boolean>(false);
  const [isScrubbing, setIsScrubbing] = useState<boolean>(false);
  const [captureFeedback, setCaptureFeedback] = useState<boolean>(false);
  const [showVisionOverlay, setShowVisionOverlay] = useState<boolean>(false);

  // When switching to a video: hide all buttons so the video takes full screen and lock position perfectly fixed
  useEffect(() => {
    if (isCurrentItemVideo) {
      setShowUiChrome(false);
      setShowOptionsMenu(false);
      setShowVisionOverlay(false);
      setScale(1);
      setPan({ x: 0, y: 0 });
      setSwipeOffset(0);
      setPullDownOffset(0);
      setIsInteracting(false);
    }
  }, [currentIndex, isCurrentItemVideo]);

  // Auto-hide UI controls when video is playing and user has been idle for 3.5s
  useEffect(() => {
    if (!isCurrentItemVideo || !isVideoPlaying || !showUiChrome) return;

    const timer = setTimeout(() => {
      setShowUiChrome(false);
      setShowOptionsMenu(false);
      setShowVisionOverlay(false);
    }, 3500);

    return () => clearTimeout(timer);
  }, [isCurrentItemVideo, isVideoPlaying, showUiChrome]);

  // Stable handler for video playback state changes (avoids loop cascades)
  const handleVideoPlayingChange = useCallback((playing: boolean) => {
    setIsVideoPlaying(playing);
  }, []);

  // Toggle UI Chrome (appear on 1st click, disappear on 2nd click)
  const toggleUiChrome = useCallback(() => {
    soundEffects.playSoftTap();
    triggerVibration([15]);
    setShowUiChrome((prev) => {
      const next = !prev;
      if (!next) {
        setShowOptionsMenu(false);
        setShowVisionOverlay(false);
      }
      return next;
    });
  }, []);

  const handleTogglePlayVideo = useCallback((e?: React.MouseEvent | React.TouchEvent) => {
    e?.stopPropagation();
    soundEffects.playSoftTap();
    triggerVibration([20]);
    const el = videoElRef.current;
    if (!el) return;
    if (el.paused || el.ended) {
      el.play()
        .then(() => {
          setIsVideoPlaying(true);
        })
        .catch(() => {});
    } else {
      el.pause();
      setIsVideoPlaying(false);
      setShowUiChrome(true);
    }
  }, []);

  const handleToggleVideoMute = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    soundEffects.playSoftTap();
    setIsVideoMuted((prev) => {
      const next = !prev;
      if (videoElRef.current) {
        videoElRef.current.muted = next;
      }
      return next;
    });
  }, []);

  const handleToggleVideoLoop = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    soundEffects.playSoftTap();
    setIsVideoLooping((prev) => {
      const next = !prev;
      if (videoElRef.current) {
        videoElRef.current.loop = next;
      }
      return next;
    });
  }, []);

  const handleCaptureFrame = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    const el = videoElRef.current;
    if (!el) return;
    try {
      const canvas = document.createElement('canvas');
      canvas.width = el.videoWidth || 1280;
      canvas.height = el.videoHeight || 720;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(el, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = `samsung-capture-${Date.now()}.jpg`;
        a.click();
        soundEffects.playCameraShutter();
        triggerVibration([50]);
        setCaptureFeedback(true);
        setTimeout(() => setCaptureFeedback(false), 2000);
      }
    } catch (err) {
      console.error('Frame capture error:', err);
    }
  }, []);

  const handleShare = useCallback(async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    soundEffects.playSoftTap();
    if (navigator.share) {
      try {
        await navigator.share({
          title: activeItem?.title || 'Souvenir d’amour',
          text: activeItem?.description || 'Regarde ce souvenir avec moi ❤️',
          url: activeItem?.photoUrl || window.location.href,
        });
      } catch {
        // cancelled
      }
    } else {
      const mediaUrl = isCurrentItemVideo
        ? (resolvedVideoUrl || activeItem?.videoUrl || activeItem?.photoUrl)
        : activeItem?.photoUrl;
      if (mediaUrl) {
        const a = document.createElement('a');
        a.href = mediaUrl;
        a.download = isCurrentItemVideo ? 'souvenir.mp4' : 'souvenir.jpg';
        a.click();
      }
      triggerVibration([30]);
    }
  }, [activeItem, isCurrentItemVideo, resolvedVideoUrl]);

  // Mobile Back Button Support: closes modals/menus first, then closes viewer without exiting the app
  useBackHandler(isOpen && showFilterPicker, () => setShowFilterPicker(false), 'photo-viewer-filter-picker');
  useBackHandler(isOpen && showDetailsModal, () => setShowDetailsModal(false), 'photo-viewer-details');
  useBackHandler(isOpen && showOptionsMenu, () => setShowOptionsMenu(false), 'photo-viewer-options');
  useBackHandler(isOpen, onClose, 'mobile-photo-viewer');

  useEffect(() => {
    if (!activeItem || !isCurrentItemVideo) {
      setResolvedVideoUrl('');
      return;
    }
    const mediaToResolve = activeItem.videoUrl || activeItem.photoUrl;
    resolveMediaUrl(mediaToResolve).then((url) => {
      setResolvedVideoUrl(url);
    });
  }, [activeItem, isCurrentItemVideo]);

  // Reset zoom and pan
  const resetZoom = useCallback(() => {
    setScale(1);
    setPan({ x: 0, y: 0 });
    setSwipeOffset(0);
    setPullDownOffset(0);
    setShowOptionsMenu(false);
    setShowDetailsModal(false);
  }, []);

  // Navigate to photo
  const goToIndex = useCallback(
    (newIndex: number, navDirection?: number) => {
      const len = items?.length || 0;
      if (len === 0) return;
      const targetIndex = (newIndex + len) % len;
      setDirection(navDirection ?? (newIndex > currentIndex ? 1 : -1));
      setCurrentIndex(targetIndex);
      resetZoom();
      soundEffects.playNoteClick();
      triggerVibration([20]);
      if (onIndexChange) {
        onIndexChange(targetIndex);
      }
    },
    [items, currentIndex, resetZoom, onIndexChange]
  );

  const goNext = useCallback(() => {
    if (!items || items.length <= 1) return;
    goToIndex(currentIndex + 1, 1);
  }, [items, currentIndex, goToIndex]);

  const goPrev = useCallback(() => {
    if (!items || items.length <= 1) return;
    goToIndex(currentIndex - 1, -1);
  }, [items, currentIndex, goToIndex]);

  // Handle keyboard shortcuts
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowRight') {
        goNext();
      } else if (e.key === 'ArrowLeft') {
        goPrev();
      } else if (e.key === '+' || e.key === '=') {
        handleZoomIn();
      } else if (e.key === '-') {
        handleZoomOut();
      } else if (e.key === '0' || e.key === 'r') {
        resetZoom();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, goNext, goPrev, resetZoom]);

  // Zoom helpers
  const handleZoomIn = () => {
    soundEffects.playSoftTap();
    setIsInteracting(false);
    setScale((prev) => Math.min(4, Number((prev + 0.5).toFixed(1))));
  };

  const handleZoomOut = () => {
    soundEffects.playSoftTap();
    setIsInteracting(false);
    setScale((prev) => {
      const next = Math.max(1, Number((prev - 0.5).toFixed(1)));
      if (next === 1) setPan({ x: 0, y: 0 });
      return next;
    });
  };

  // Double tap / double click to toggle zoom (1x <-> 2.5x)
  const handleDoubleTap = (clientX: number, clientY: number) => {
    if (isCurrentItemVideo) return;
    triggerVibration([30]);
    soundEffects.playSoftTap();
    setIsInteracting(false);
    if (scale > 1.1) {
      resetZoom();
    } else {
      setScale(2.5);
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const offsetX = (rect.left + rect.width / 2 - clientX) * 1.3;
        const offsetY = (rect.top + rect.height / 2 - clientY) * 1.3;
        const maxPanX = 1.5 * 200;
        const maxPanY = 1.5 * 280;
        setPan({
          x: Math.max(-maxPanX, Math.min(maxPanX, offsetX)),
          y: Math.max(-maxPanY, Math.min(maxPanY, offsetY)),
        });
      }
    }
  };

  // Helper to re-clamp pan bounds when zoom level changes
  const clampPanToBounds = useCallback((currentScale: number) => {
    if (currentScale <= 1.05) {
      setPan({ x: 0, y: 0 });
      return;
    }
    const maxPanX = (currentScale - 1) * 260;
    const maxPanY = (currentScale - 1) * 360;
    setPan((prev) => ({
      x: Math.max(-maxPanX, Math.min(maxPanX, prev.x)),
      y: Math.max(-maxPanY, Math.min(maxPanY, prev.y)),
    }));
  }, []);

  // React-Use-Gesture Engine: Native pinch-to-zoom, pan, swipe & dismiss
  const bindGesture = (useGesture as any)(
    {
      onPinch: ({ first, last, active, da: [distance], origin: [ox, oy], memo, event }) => {
        if (isCurrentItemVideo) return memo;
        event?.preventDefault?.();
        gestureStateRef.current.wasGesture = true;

        if (first) {
          setIsInteracting(true);
          return {
            initialScale: scale,
            initialPan: { ...pan },
            initialDistance: Math.max(10, distance || 0),
            initialOrigin: [ox, oy],
          };
        }

        if (active && memo && memo.initialDistance > 0) {
          const ratio = distance / memo.initialDistance;
          // Elastic zoom limits (0.75x to 5.0x) during active pinch
          const rawScale = memo.initialScale * ratio;
          const targetScale = Math.max(0.75, Math.min(5.0, rawScale));
          setScale(Number(targetScale.toFixed(3)));

          // Native focal point zoom: keeps the point between fingers anchored
          if (containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;

            const originDeltaX = ox - centerX;
            const originDeltaY = oy - centerY;

            const dragDeltaX = ox - memo.initialOrigin[0];
            const dragDeltaY = oy - memo.initialOrigin[1];

            const scaleRatio = targetScale / (memo.initialScale || 1);
            const zoomFocalShiftX = (originDeltaX - memo.initialPan.x) * (1 - scaleRatio);
            const zoomFocalShiftY = (originDeltaY - memo.initialPan.y) * (1 - scaleRatio);

            const nextPanX = memo.initialPan.x + dragDeltaX + zoomFocalShiftX;
            const nextPanY = memo.initialPan.y + dragDeltaY + zoomFocalShiftY;

            setPan({ x: nextPanX, y: nextPanY });
          }
        }

        if (last) {
          setIsInteracting(false);
          if (scale < 1.05) {
            resetZoom();
            triggerVibration([20]);
          } else if (scale > 4.0) {
            setScale(4.0);
            clampPanToBounds(4.0);
          } else {
            clampPanToBounds(scale);
          }
        }

        return memo;
      },

      onDrag: ({ first, last, active, movement: [mx, my], velocities: [vx, vy], memo, pinching, tap }) => {
        if (isCurrentItemVideo) return memo;
        if (pinching) return memo;

        if (tap) {
          return memo;
        }

        if (first) {
          setIsInteracting(true);
          return {
            initialPan: { ...pan },
            initialScale: scale,
          };
        }

        if (active && memo) {
          if (Math.hypot(mx, my) > 6) {
            gestureStateRef.current.wasGesture = true;
          }

          if (memo.initialScale > 1.05) {
            // Pan image / video smoothly when zoomed in
            const nextX = memo.initialPan.x + mx;
            const nextY = memo.initialPan.y + my;
            const maxPanX = (memo.initialScale - 1) * 260 + 60;
            const maxPanY = (memo.initialScale - 1) * 360 + 60;
            setPan({
              x: Math.max(-maxPanX, Math.min(maxPanX, nextX)),
              y: Math.max(-maxPanY, Math.min(maxPanY, nextY)),
            });
          } else if (!isCurrentItemVideo) {
            // At 1x FOR PHOTOS ONLY: Swipe horizontal (change photo) or pull down (dismiss)
            // Videos stay completely centered and NEVER swipe horizontally!
            if (Math.abs(my) > Math.abs(mx) * 1.3 && my > 0) {
              setPullDownOffset(my);
              setSwipeOffset(0);
            } else {
              setSwipeOffset(mx);
              setPullDownOffset(0);
            }
          }
        }

        if (last) {
          setIsInteracting(false);

          if (!isCurrentItemVideo) {
            // Pull down dismiss threshold or high downward velocity (photos only)
            if (pullDownOffset > 85 || (vy > 0.6 && pullDownOffset > 30)) {
              soundEffects.playSoftTap();
              triggerVibration([25]);
              onClose();
              return memo;
            }
            setPullDownOffset(0);

            // Swipe horizontal threshold or fast swipe velocity (photos only)
            if (scale <= 1.05) {
              if (swipeOffset < -55 || (vx < -0.5 && swipeOffset < -20)) {
                goNext();
              } else if (swipeOffset > 55 || (vx > 0.5 && swipeOffset > 20)) {
                goPrev();
              }
            }
            setSwipeOffset(0);
          }

          if (scale > 1.05) {
            clampPanToBounds(scale);
          } else if (scale < 1.02) {
            resetZoom();
          }
        }

        return memo;
      },

      onWheel: ({ delta: [, dy], event }) => {
        if (isCurrentItemVideo) return;
        event?.stopPropagation?.();
        if (dy < 0) {
          setScale((prev) => Math.min(4, Number((prev + 0.2).toFixed(1))));
        } else {
          setScale((prev) => {
            const next = Math.max(1, Number((prev - 0.2).toFixed(1)));
            if (next === 1) setPan({ x: 0, y: 0 });
            return next;
          });
        }
      },
    },
    {
      enabled: isOpen && !isCurrentItemVideo,
      drag: {
        filterTaps: true,
      },
    }
  );

  const handleStageClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('input') || target.closest('a')) {
      return;
    }
    if (gestureStateRef.current.wasGesture) {
      gestureStateRef.current.wasGesture = false;
      return;
    }
    const now = Date.now();
    if (
      !isCurrentItemVideo &&
      now - lastTapRef.current.time < 300 &&
      Math.hypot(e.clientX - lastTapRef.current.x, e.clientY - lastTapRef.current.y) < 40
    ) {
      handleDoubleTap(e.clientX, e.clientY);
      lastTapRef.current = { time: 0, x: 0, y: 0 };
      return;
    }
    lastTapRef.current = { time: now, x: e.clientX, y: e.clientY };
    toggleUiChrome();
  };

  if (!isOpen || !activeItem) return null;

  return (
    <AnimatePresence>
      <motion.div
        ref={containerRef}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.22 }}
        className="fixed inset-0 z-50 bg-black select-none overflow-hidden touch-none"
        style={{
          transform: !isCurrentItemVideo && pullDownOffset > 0 ? `translateY(${pullDownOffset}px)` : undefined,
          opacity: !isCurrentItemVideo && pullDownOffset > 0 ? Math.max(0.2, 1 - pullDownOffset / 300) : 1,
        }}
      >
        {/* =========================================================
            1. SAMSUNG ONE UI TOP BAR (BACK, CAPSULE & QUICK ACTIONS)
           ========================================================= */}
        <div
          className={`absolute top-0 inset-x-0 z-50 flex items-center justify-between px-3 sm:px-6 pt-[calc(0.75rem+env(safe-area-inset-top,0px))] pb-4 bg-gradient-to-b from-black/90 via-black/50 to-transparent transition-all duration-300 ${
            showUiChrome ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 -translate-y-4 pointer-events-none'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Back button & Partner Info Capsule */}
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 active:scale-95 text-white flex items-center justify-center backdrop-blur-md border border-white/15 transition-all shadow-md shrink-0 cursor-pointer"
              title="Retour"
              aria-label="Retour"
            >
              <ChevronLeft className="w-6 h-6 -ml-0.5" />
            </button>

            {/* Samsung Capsule Card */}
            <div className="flex flex-col min-w-0 max-w-[210px] sm:max-w-xs md:max-w-md bg-black/50 backdrop-blur-xl border border-white/20 px-3.5 py-1.5 rounded-2xl text-white shadow-xl">
              <div className="flex items-center gap-1.5 text-xs font-bold leading-tight truncate">
                <span>{activeItem.authorName || (activeItem.authorId === 'p2' ? 'Med' : 'Safi')}</span>
                <Heart className="w-3 h-3 fill-rose-500 text-rose-500 inline shrink-0" />
                <span className="text-[10px] font-semibold text-rose-300 px-1.5 py-0.2 rounded-full bg-white/15 font-mono">
                  {currentIndex + 1} / {items.length}
                </span>
                {activeItem.date && (
                  <span className="text-[10px] font-normal text-white/70 truncate hidden sm:inline">
                    • {activeItem.date}
                  </span>
                )}
              </div>
              <div className="text-[11px] text-white/80 truncate font-medium">
                {activeItem.title || activeItem.description || 'Photo partagée dans votre salon d’amour'}
              </div>
            </div>
          </div>

          {/* Quick Circular Action Buttons (Fullscreen, Filters, Details, Download) */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Loop Toggle Button for Videos */}
            {isCurrentItemVideo && (
              <button
                type="button"
                onClick={handleToggleVideoLoop}
                className={`w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-md border transition-all cursor-pointer shadow-md active:scale-95 ${
                  isVideoLooping
                    ? 'bg-rose-600 border-rose-400 text-white shadow-rose-600/30 ring-2 ring-rose-400/40'
                    : 'bg-black/50 hover:bg-black/70 border-white/15 text-white'
                }`}
                title={isVideoLooping ? 'Boucle activée' : 'Répéter la vidéo'}
              >
                <Repeat className="w-4.5 h-4.5" />
              </button>
            )}

            {/* Native Fullscreen Toggle Button ⛶ */}
            <button
              type="button"
              onClick={toggleNativeFullscreen}
              className={`w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-md border transition-all cursor-pointer shadow-md active:scale-95 ${
                isFullscreen
                  ? 'bg-rose-600/80 border-rose-300 text-white shadow-rose-600/40 ring-2 ring-rose-400/50'
                  : 'bg-black/50 hover:bg-black/70 border-white/15 text-white'
              }`}
              title={isFullscreen ? 'Quitter le plein écran' : 'Plein écran immersif'}
            >
              {isFullscreen ? (
                <Minimize2 className="w-4.5 h-4.5 text-rose-300" />
              ) : (
                <Maximize2 className="w-4.5 h-4.5 text-white" />
              )}
            </button>

            {/* Visual Ambiance / Filters for Photos */}
            {!isCurrentItemVideo && (
              <button
                type="button"
                onClick={() => {
                  soundEffects.playSoftTap();
                  setShowFilterPicker((prev) => !prev);
                }}
                className={`w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-md border transition-all cursor-pointer shadow-md active:scale-95 ${
                  filterMode !== 'normal'
                    ? 'bg-rose-600/80 border-rose-300 text-white shadow-rose-600/40 ring-2 ring-rose-400/50'
                    : 'bg-black/50 hover:bg-black/70 border-white/15 text-white'
                }`}
                title="Ambiance & Confort Visuel"
              >
                <Palette className="w-4.5 h-4.5 text-rose-300" />
              </button>
            )}

            {/* Details Modal Trigger directly in Top Bar */}
            <button
              type="button"
              onClick={() => {
                soundEffects.playSoftTap();
                setShowDetailsModal(true);
              }}
              className="w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 active:scale-95 text-white flex items-center justify-center backdrop-blur-md border border-white/15 transition-all shadow-md cursor-pointer"
              title="Détails & Fiche Technique"
            >
              <Info className="w-4.5 h-4.5 text-rose-300" />
            </button>

            {/* Vision Amour (Sparkles / Smart Scan) */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                soundEffects.playSuccessSparkle();
                triggerVibration([30, 40]);
                setShowVisionOverlay((prev) => !prev);
              }}
              className={`w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-md border transition-all cursor-pointer shadow-md active:scale-95 ${
                showVisionOverlay
                  ? 'bg-purple-600 border-purple-400 text-white shadow-purple-600/30 ring-2 ring-purple-400/40'
                  : 'bg-black/50 hover:bg-black/70 border-white/15 text-white'
              }`}
              title="Vision Romance Complice ✨"
            >
              <Sparkles className="w-4.5 h-4.5 text-purple-200" />
            </button>

            {/* Download HD */}
            <a
              href={activeItem.photoUrl}
              download={`souvenir-${currentIndex + 1}.jpg`}
              target="_blank"
              rel="noreferrer"
              onClick={() => showToast('Téléchargement haute qualité...')}
              className="w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 active:scale-95 text-white flex items-center justify-center backdrop-blur-md border border-white/15 transition-all shadow-md cursor-pointer hidden sm:flex"
              title="Télécharger la photo HD"
            >
              <Download className="w-4.5 h-4.5" />
            </a>

            {/* Three Dots More Options Button ⋮ */}
            <button
              type="button"
              onClick={() => setShowOptionsMenu((prev) => !prev)}
              className={`w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-md border transition-all cursor-pointer shadow-md active:scale-95 ${
                showOptionsMenu
                  ? 'bg-white/30 border-white/40 text-white'
                  : 'bg-black/50 hover:bg-black/70 border-white/15 text-white'
              }`}
              title="Plus d'options"
            >
              <MoreVertical className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Vision Romance Overlay Banner */}
        <AnimatePresence>
          {showVisionOverlay && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -10 }}
              onClick={(e) => {
                e.stopPropagation();
                setShowVisionOverlay(false);
              }}
              className="absolute top-20 left-1/2 -translate-x-1/2 z-55 max-w-sm w-[calc(100%-32px)] px-4 py-2.5 rounded-2xl bg-purple-900/90 backdrop-blur-xl border border-purple-400/40 text-white text-xs shadow-2xl flex items-center gap-3 cursor-pointer"
            >
              <div className="w-8 h-8 rounded-full bg-purple-500/40 border border-purple-300 flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4 text-purple-200" />
              </div>
              <div className="min-w-0">
                <div className="font-bold text-purple-200 truncate">Vision Romance Samsung ✨</div>
                <div className="text-[11px] text-purple-100/90 truncate">Amour & complicité détectés : 100% pur bonheur</div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Screen Capture Instant Toast */}
        <AnimatePresence>
          {captureFeedback && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.9 }}
              className="absolute top-24 left-1/2 -translate-x-1/2 z-55 px-4 py-2 rounded-full bg-black/85 backdrop-blur-xl border border-white/20 text-white text-xs font-semibold shadow-2xl flex items-center gap-2 pointer-events-none"
            >
              <Camera className="w-4 h-4 text-rose-400" />
              <span>Instantané Samsung capturé ! 📸</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* =========================================================
            2. MAIN INTERACTIVE PHOTO/VIDEO STAGE (SWIPE, PINCH, PAN)
           ========================================================= */}
        <div
          {...(isCurrentItemVideo ? {} : bindGesture())}
          onClick={handleStageClick}
          className="absolute inset-0 w-full h-full flex items-center justify-center overflow-hidden select-none cursor-pointer"
          style={{ touchAction: isCurrentItemVideo ? 'manipulation' : 'none' }}
        >
          {/* Navigation Arrows (Desktop / Tablet) */}
          {items.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  goPrev();
                }}
                className={`absolute left-2 sm:left-5 top-1/2 -translate-y-1/2 z-40 p-3 sm:p-4 rounded-full bg-black/40 hover:bg-black/70 active:scale-95 text-white transition-all cursor-pointer backdrop-blur-md border border-white/10 hidden sm:flex items-center justify-center shadow-xl ${
                  showUiChrome ? 'opacity-100' : 'opacity-0 pointer-events-none'
                }`}
                title="Précédent"
                aria-label="Précédent"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  goNext();
                }}
                className={`absolute right-2 sm:right-5 top-1/2 -translate-y-1/2 z-40 p-3 sm:p-4 rounded-full bg-black/40 hover:bg-black/70 active:scale-95 text-white transition-all cursor-pointer backdrop-blur-md border border-white/10 hidden sm:flex items-center justify-center shadow-xl ${
                  showUiChrome ? 'opacity-100' : 'opacity-0 pointer-events-none'
                }`}
                title="Suivant"
                aria-label="Suivant"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </>
          )}

          {/* Render Active Video (Completely Fixed, Centered, No CSS Transforms or Gestures) OR Active Photo (Pan/Zoom/Swipe) */}
          {isCurrentItemVideo ? (
            <div
              key={activeItem.id}
              className="absolute inset-0 w-full h-full flex items-center justify-center bg-black overflow-hidden select-none m-auto pointer-events-auto"
              style={{
                transform: 'none',
                WebkitTransform: 'none',
              }}
            >
              <SleekLoveVideoPlayer
                key={resolvedVideoUrl || activeItem.videoUrl || activeItem.photoUrl}
                src={resolvedVideoUrl || activeItem.videoUrl || activeItem.photoUrl}
                poster={activeItem.photoUrl}
                title={activeItem.title}
                autoPlay={true}
                compact={false}
                isMuted={isVideoMuted}
                onToggleMute={handleToggleVideoMute}
                isLooping={isVideoLooping}
                onToggleLoop={handleToggleVideoLoop}
                playbackRate={videoPlaybackRate}
                onPlaybackRateChange={setVideoPlaybackRate}
                hideExtraMenu={true}
                hideDefaultControls={true}
                onVideoRefReady={(el) => {
                  videoElRef.current = el;
                  if (el) {
                    setIsVideoPlaying(!el.paused);
                    setVideoCurrentTime(el.currentTime);
                    setVideoDuration(el.duration || 0);
                  }
                }}
                onPlayingChange={handleVideoPlayingChange}
                onTimeUpdate={(cur, dur) => {
                  if (!isScrubbing) {
                    setVideoCurrentTime(cur);
                    setVideoDuration(dur);
                  }
                }}
                onStageClick={toggleUiChrome}
                className="w-full h-full max-w-full max-h-full"
              />
            </div>
          ) : (
            <motion.div
              key={activeItem.id}
              initial={{ opacity: 0, x: direction * 40 }}
              animate={{
                opacity: 1,
                x: swipeOffset,
                scale: scale,
              }}
              transition={
                isInteracting
                  ? { duration: 0 }
                  : {
                      type: 'spring',
                      stiffness: 350,
                      damping: 30,
                    }
              }
              style={{
                translateX: pan.x,
                translateY: pan.y,
              }}
              className="relative max-w-full max-h-full flex items-center justify-center p-1 sm:p-4"
            >
              <img
                src={activeItem.photoUrl}
                alt={activeItem.title || 'Photo complice'}
                draggable={false}
                onLoad={handleImageLoad}
                style={{
                  filter: PHOTO_FILTERS.find((f) => f.id === filterMode)?.filter || 'none',
                }}
                className={`transition-all duration-300 w-auto h-auto object-contain select-none drop-shadow-2xl ${
                  showUiChrome
                    ? 'max-h-[82vh] sm:max-h-[85vh] max-w-[96vw] sm:max-w-[92vw] rounded-xl sm:rounded-2xl'
                    : 'max-h-[96vh] sm:max-h-[97vh] max-w-[98vw] sm:max-w-[98vw] rounded-none sm:rounded-xl'
                }`}
              />
            </motion.div>
          )}

          {/* Dynamic Pinch & Zoom HUD Badge */}
          <AnimatePresence>
            {!isCurrentItemVideo && scale > 1.05 && (
              <motion.div
                key="zoom-badge-hud"
                initial={{ opacity: 0, y: -10, scale: 0.85 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.85 }}
                transition={{ duration: 0.15 }}
                className="absolute top-16 left-1/2 -translate-x-1/2 z-50 px-3.5 py-1.5 rounded-full bg-black/85 hover:bg-black/95 backdrop-blur-xl border border-white/20 text-white font-mono text-xs shadow-2xl flex items-center gap-2 pointer-events-auto"
              >
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleZoomOut();
                  }}
                  className="p-1 rounded-full hover:bg-white/20 active:scale-90 text-white transition-transform"
                  title="Dézoomer"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>

                <div className="flex items-center gap-1">
                  <span className="font-semibold text-rose-300">{Math.round(scale * 100)}%</span>
                  <span className="text-white/60 text-[11px]">({scale.toFixed(1)}x)</span>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleZoomIn();
                  }}
                  className="p-1 rounded-full hover:bg-white/20 active:scale-90 text-white transition-transform"
                  title="Zoomer"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    resetZoom();
                    triggerVibration([20]);
                    showToast('Zoom 1x');
                  }}
                  className="text-[10px] bg-white/20 hover:bg-white/30 px-2 py-0.5 rounded text-white font-bold ml-1 active:scale-95 transition-all"
                  title="Réinitialiser à 1x"
                >
                  1x
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Quick hint on mobile */}
          <div
            className={`absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-white/70 text-[11px] font-medium pointer-events-none transition-opacity duration-300 sm:hidden ${
              showUiChrome && scale <= 1 ? 'opacity-100' : 'opacity-0'
            }`}
          >
            {isCurrentItemVideo
              ? 'Appuyez pour afficher ou masquer les commandes'
              : 'Pincer pour zoomer • Glisser pour défiler'}
          </div>

          {/* Central Play/Pause Button on Video tap for iPhone & Mobile */}
          <AnimatePresence>
            {isCurrentItemVideo && (showUiChrome || !isVideoPlaying) && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-40">
                <motion.button
                  key="central-video-play-btn"
                  initial={{ opacity: 0, scale: 0.7 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.7 }}
                  transition={{ duration: 0.18 }}
                  type="button"
                  onClick={handleTogglePlayVideo}
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-black/65 hover:bg-black/85 active:scale-90 text-white flex items-center justify-center backdrop-blur-xl border border-white/25 shadow-2xl transition-transform cursor-pointer pointer-events-auto select-none"
                  title={isVideoPlaying ? 'Mettre en pause' : 'Lire la vidéo'}
                  aria-label={isVideoPlaying ? 'Pause' : 'Lecture'}
                >
                  {isVideoPlaying ? (
                    <Pause className="w-7 h-7 sm:w-9 sm:h-9 fill-white text-white" />
                  ) : (
                    <Play className="w-7 h-7 sm:w-9 sm:h-9 fill-white text-white ml-1" />
                  )}
                </motion.button>
              </div>
            )}
          </AnimatePresence>
        </div>

        {/* =========================================================
            3. SAMSUNG ONE UI CONTROLS & BOTTOM FLOATING DOCK
           ========================================================= */}
        <div
          className={`absolute bottom-0 inset-x-0 z-50 bg-gradient-to-t from-black/95 via-stone-950/85 to-transparent pt-4 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] px-3 sm:px-6 transition-all duration-300 flex flex-col gap-2.5 ${
            showUiChrome ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-4 pointer-events-none'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Samsung Mid-Lower Video Control Pill (Capture [◎], Play/Pause, Timeline, Mute 🔊) */}
          {isCurrentItemVideo && (
            <div className="w-full max-w-xl mx-auto flex items-center justify-between gap-2.5 mb-1 px-1">
              {/* Capture frame snapshot button [◎] */}
              <button
                type="button"
                onClick={handleCaptureFrame}
                className="w-10 h-10 rounded-full bg-black/65 hover:bg-black/85 active:scale-90 text-white flex items-center justify-center backdrop-blur-xl border border-white/15 shadow-xl transition-all cursor-pointer shrink-0"
                title="Capturer l'image (instantané)"
              >
                <Camera className="w-4.5 h-4.5 text-white" />
              </button>

              {/* Samsung Center Scrubber Pill */}
              <div className="flex-1 rounded-full bg-black/80 backdrop-blur-2xl border border-white/15 px-3.5 py-1.5 flex items-center gap-2.5 shadow-2xl text-white min-w-0">
                {/* Play / Pause */}
                <button
                  type="button"
                  onClick={handleTogglePlayVideo}
                  className="p-1 rounded-full hover:bg-white/15 active:scale-95 text-white transition-all cursor-pointer shrink-0"
                  title={isVideoPlaying ? 'Pause' : 'Lecture'}
                >
                  {isVideoPlaying ? (
                    <Pause className="w-4 h-4 fill-white" />
                  ) : (
                    <Play className="w-4 h-4 fill-white ml-0.5" />
                  )}
                </button>

                {/* Progress bar / Scrubber */}
                <div className="flex-1 relative flex items-center group/scrub min-w-[60px]">
                  <div className="w-full h-1 bg-white/25 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-white rounded-full transition-all duration-75"
                      style={{
                        width: `${videoDuration > 0 ? (videoCurrentTime / videoDuration) * 100 : 0}%`,
                      }}
                    />
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={videoDuration || 100}
                    step={0.1}
                    value={videoCurrentTime}
                    onMouseDown={() => setIsScrubbing(true)}
                    onTouchStart={() => setIsScrubbing(true)}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      setVideoCurrentTime(val);
                      if (videoElRef.current) videoElRef.current.currentTime = val;
                    }}
                    onMouseUp={() => {
                      setIsScrubbing(false);
                      if (isVideoPlaying && videoElRef.current) videoElRef.current.play().catch(() => {});
                    }}
                    onTouchEnd={() => {
                      setIsScrubbing(false);
                      if (isVideoPlaying && videoElRef.current) videoElRef.current.play().catch(() => {});
                    }}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    title="Défilement de la vidéo"
                  />
                </div>

                {/* Time Readout: 00:32 / 00:33 */}
                <div className="text-[11px] font-mono text-white/90 font-medium select-none whitespace-nowrap shrink-0">
                  <span>{formatVideoDuration(videoCurrentTime)}</span>
                  <span className="text-white/40 mx-1">/</span>
                  <span className="text-white/70">{formatVideoDuration(videoDuration)}</span>
                </div>
              </div>

              {/* Sound Mute / Unmute */}
              <button
                type="button"
                onClick={handleToggleVideoMute}
                className="w-10 h-10 rounded-full bg-black/65 hover:bg-black/85 active:scale-90 text-white flex items-center justify-center backdrop-blur-xl border border-white/15 shadow-xl transition-all cursor-pointer shrink-0"
                title={isVideoMuted ? 'Activer le son' : 'Couper le son'}
              >
                {isVideoMuted ? (
                  <VolumeX className="w-4.5 h-4.5 text-rose-400" />
                ) : (
                  <Volume2 className="w-4.5 h-4.5 text-white" />
                )}
              </button>
            </div>
          )}

          {/* Samsung Filmstrip of thumbnails (Both photos & videos) */}
          {items.length > 1 && (
            <div
              ref={thumbnailStripRef}
              className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none snap-x px-2 max-w-2xl mx-auto"
            >
              {items.map((item, idx) => {
                const itemIsVideo = item.mediaType === 'video' || isVideoMediaType(item.videoUrl, item.mediaType);
                return (
                  <button
                    key={item.id}
                    onClick={() => goToIndex(idx)}
                    className={`relative shrink-0 w-12 h-12 rounded-xl overflow-hidden transition-all cursor-pointer snap-center ${
                      idx === currentIndex
                        ? 'ring-2 ring-white scale-105 shadow-xl'
                        : 'border border-white/20 opacity-50 hover:opacity-90'
                    }`}
                    title={item.title || `Média ${idx + 1}`}
                  >
                    <img
                      src={item.photoUrl}
                      alt=""
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    {itemIsVideo && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <Play className="w-3.5 h-3.5 text-white fill-white" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* Samsung Bottom Floating Action Dock */}
          <div className="max-w-xs sm:max-w-md mx-auto w-full px-2 pt-0.5">
            <div className="rounded-full bg-white/95 dark:bg-stone-900/95 backdrop-blur-2xl border border-stone-200/80 dark:border-stone-800 shadow-2xl px-5 sm:px-6 py-2.5 flex items-center justify-between gap-3 sm:gap-4">
              {/* Favoris (Heart) */}
              <button
                type="button"
                onClick={() => {
                  triggerHeartConfetti();
                  soundEffects.playHeartPulse();
                  triggerVibration([40, 30, 40]);
                  activeItem.onLike?.();
                  showToast(activeItem.isLiked ? 'Retiré des favoris' : 'Ajouté aux favoris ❤️');
                }}
                className="p-1 text-stone-700 dark:text-stone-300 hover:text-rose-500 dark:hover:text-rose-400 active:scale-90 transition-all cursor-pointer shrink-0"
                title="Ajouter aux favoris"
              >
                <Heart
                  className={`w-5 h-5 ${
                    activeItem.isLiked ? 'fill-rose-500 text-rose-500' : 'stroke-[1.8]'
                  }`}
                />
              </button>

              {/* Photo Ambiance & Confort (for photos) */}
              {!isCurrentItemVideo && (
                <button
                  type="button"
                  onClick={() => {
                    soundEffects.playSoftTap();
                    setShowFilterPicker((prev) => !prev);
                  }}
                  className={`p-1 transition-all active:scale-90 cursor-pointer shrink-0 ${
                    filterMode !== 'normal'
                      ? 'text-rose-500'
                      : 'text-stone-700 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white'
                  }`}
                  title="Filtres & Ambiance de vision"
                >
                  <Palette className="w-5 h-5 stroke-[1.8]" />
                </button>
              )}

              {/* Détails (Info ⓘ) */}
              <button
                type="button"
                onClick={() => {
                  soundEffects.playSoftTap();
                  setShowDetailsModal(true);
                }}
                className="p-1 text-stone-700 dark:text-stone-300 hover:text-rose-500 dark:hover:text-rose-400 active:scale-90 transition-all cursor-pointer shrink-0"
                title="Détails & Informations"
              >
                <Info className="w-5 h-5 stroke-[1.8]" />
              </button>

              {/* Quick Zoom / Fullscreen toggle */}
              {!isCurrentItemVideo && (
                <button
                  type="button"
                  onClick={() => {
                    soundEffects.playSoftTap();
                    if (scale > 1.05) {
                      resetZoom();
                      showToast('Zoom 1x');
                    } else {
                      setScale(2);
                      showToast('Zoom 2x');
                    }
                    triggerVibration([20]);
                  }}
                  className="p-1 text-stone-700 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white active:scale-90 transition-all cursor-pointer shrink-0"
                  title={scale > 1.05 ? 'Réinitialiser zoom (1x)' : 'Zoom avant (2x)'}
                >
                  <ZoomIn className={`w-5 h-5 ${scale > 1.05 ? 'text-rose-500' : 'stroke-[1.8]'}`} />
                </button>
              )}

              {/* Partager (Share2) */}
              <button
                type="button"
                onClick={handleShare}
                className="p-1 text-stone-700 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white active:scale-90 transition-all cursor-pointer shrink-0"
                title="Partager"
              >
                <Share2 className="w-5 h-5 stroke-[1.8]" />
              </button>

              {/* Modifier (Pencil if onEdit available) */}
              {activeItem.onEdit && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    activeItem.onEdit?.();
                  }}
                  className="p-1 text-stone-700 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white active:scale-90 transition-all cursor-pointer shrink-0"
                  title="Modifier"
                >
                  <Pencil className="w-5 h-5 stroke-[1.8]" />
                </button>
              )}

              {/* Supprimer (Trash2) */}
              {(activeItem.onDelete || activeItem.onRemovePhotoOnly) && (
                <button
                  type="button"
                  onClick={() => {
                    if (activeItem.onDelete) {
                      activeItem.onDelete();
                      onClose();
                    } else if (activeItem.onRemovePhotoOnly) {
                      activeItem.onRemovePhotoOnly();
                      onClose();
                    }
                  }}
                  className="p-1 text-stone-700 dark:text-stone-300 hover:text-rose-500 dark:hover:text-rose-400 active:scale-90 transition-all cursor-pointer shrink-0"
                  title="Supprimer"
                >
                  <Trash2 className="w-5 h-5 stroke-[1.8]" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* =========================================================
            4. THE REQUESTED "..." VIDEO OPTIONS MENU
           ========================================================= */}
        <AnimatePresence>
          {showOptionsMenu && isCurrentItemVideo && (
            <>
              {/* Invisible touch backdrop to close menu */}
              <div
                onClick={() => setShowOptionsMenu(false)}
                className="fixed inset-0 z-55 bg-black/40 backdrop-blur-2xs"
              />

              {/* Elegant Dropdown Card positioned top-right */}
              <motion.div
                initial={{ opacity: 0, scale: 0.94, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.94, y: -10 }}
                transition={{ duration: 0.16 }}
                onClick={(e) => e.stopPropagation()}
                className="absolute top-16 right-3 sm:right-6 z-60 w-72 max-w-[calc(100vw-24px)] rounded-2xl bg-stone-900/95 backdrop-blur-xl border border-white/15 p-3 shadow-2xl text-white space-y-3"
              >
                {/* Header */}
                <div className="flex items-center justify-between pb-2 border-b border-white/10">
                  <span className="text-[11px] font-semibold text-white/70 uppercase tracking-wider">
                    Options vidéo
                  </span>
                  <button
                    onClick={() => setShowOptionsMenu(false)}
                    className="p-1 rounded-full hover:bg-white/10 text-white/60 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* View Details Button */}
                <button
                  type="button"
                  onClick={() => {
                    setShowOptionsMenu(false);
                    setShowDetailsModal(true);
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 active:scale-98 transition-all text-left text-xs font-medium cursor-pointer"
                >
                  <span className="flex items-center gap-2.5">
                    <Info className="w-4 h-4 text-rose-400" />
                    <span>Détails & description</span>
                  </span>
                  <span className="text-[10px] text-rose-300 font-semibold">Afficher</span>
                </button>

                {/* Playback Speed Control */}
                <div className="px-1 space-y-1.5">
                  <div className="flex items-center justify-between text-xs text-white/80 font-medium">
                    <span className="flex items-center gap-2">
                      <Sliders className="w-3.5 h-3.5 text-rose-400" />
                      <span>Vitesse de lecture</span>
                    </span>
                    <span className="font-mono text-rose-300 font-bold text-xs">{videoPlaybackRate}x</span>
                  </div>
                  <div className="grid grid-cols-5 gap-1 pt-0.5">
                    {[0.75, 1, 1.25, 1.5, 2].map((rate) => (
                      <button
                        key={rate}
                        type="button"
                        onClick={() => setVideoPlaybackRate(rate)}
                        className={`py-1 rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer ${
                          videoPlaybackRate === rate
                            ? 'bg-rose-600 text-white shadow-sm'
                            : 'bg-white/5 text-white/70 hover:bg-white/10'
                        }`}
                      >
                        {rate}x
                      </button>
                    ))}
                  </div>
                </div>

                {/* Loop Mode Toggle */}
                <button
                  type="button"
                  onClick={() => setIsVideoLooping((prev) => !prev)}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 active:scale-98 transition-all text-xs font-medium cursor-pointer"
                >
                  <span className="flex items-center gap-2.5">
                    <Repeat className="w-4 h-4 text-rose-400" />
                    <span>Lecture en boucle</span>
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      isVideoLooping
                        ? 'bg-rose-500/30 text-rose-300 border border-rose-500/40'
                        : 'bg-white/10 text-white/40'
                    }`}
                  >
                    {isVideoLooping ? 'Activée' : 'Désactivée'}
                  </span>
                </button>

                {/* Direct Download */}
                <a
                  href={resolvedVideoUrl || activeItem.videoUrl || activeItem.photoUrl}
                  download={`souvenir-video-${currentIndex + 1}.mp4`}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => setShowOptionsMenu(false)}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 active:scale-98 transition-all text-xs font-medium text-white cursor-pointer"
                >
                  <Download className="w-4 h-4 text-rose-400" />
                  <span>Télécharger la vidéo</span>
                </a>

                {/* Actions: Like, Edit, Delete */}
                {(activeItem.onLike || activeItem.onEdit || activeItem.onDelete) && (
                  <div className="pt-2 border-t border-white/10 flex flex-col gap-1.5">
                    {activeItem.onLike && (
                      <button
                        type="button"
                        onClick={() => {
                          triggerHeartConfetti();
                          soundEffects.playHeartPulse();
                          triggerVibration([40, 30, 40]);
                          activeItem.onLike?.();
                          setShowOptionsMenu(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                          activeItem.isLiked
                            ? 'bg-rose-600/30 text-rose-300 border border-rose-500/40'
                            : 'bg-white/5 hover:bg-white/10 text-rose-300'
                        }`}
                      >
                        <span className="flex items-center gap-2.5">
                          <Heart
                            className={`w-4 h-4 ${
                              activeItem.isLiked ? 'fill-rose-400 text-rose-400' : 'text-rose-400'
                            }`}
                          />
                          <span>{activeItem.isLiked ? 'Aimé de tout cœur' : 'Aimer ce souvenir'}</span>
                        </span>
                        <span>{activeItem.likeCount ?? 0}</span>
                      </button>
                    )}

                    {activeItem.onEdit && (
                      <button
                        type="button"
                        onClick={() => {
                          setShowOptionsMenu(false);
                          onClose();
                          activeItem.onEdit?.();
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-medium text-white transition-all cursor-pointer"
                      >
                        <Pencil className="w-4 h-4 text-stone-400" />
                        <span>Modifier ce souvenir</span>
                      </button>
                    )}

                    {activeItem.onDelete && (
                      <button
                        type="button"
                        onClick={() => {
                          setShowOptionsMenu(false);
                          onClose();
                          activeItem.onDelete?.();
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 text-xs font-semibold transition-all cursor-pointer border border-rose-500/20"
                      >
                        <Trash2 className="w-4 h-4 text-rose-400" />
                        <span>Supprimer la vidéo</span>
                      </button>
                    )}
                  </div>
                )}
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* =========================================================
            5. PHOTO AMBIANCE & VISUAL COMFORT PICKER POPOVER
           ========================================================= */}
        <AnimatePresence>
          {showFilterPicker && !isCurrentItemVideo && (
            <>
              <div
                className="fixed inset-0 z-55 bg-black/40 backdrop-blur-2xs"
                onClick={() => setShowFilterPicker(false)}
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.92, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.92, y: -10 }}
                onClick={(e) => e.stopPropagation()}
                className="absolute top-18 right-3 sm:right-6 z-60 w-80 max-w-[calc(100vw-24px)] rounded-3xl bg-stone-900/95 backdrop-blur-2xl border border-white/20 p-4 shadow-2xl text-white space-y-3"
              >
                <div className="flex items-center justify-between pb-2 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <Palette className="w-4 h-4 text-rose-400" />
                    <span className="text-xs font-bold uppercase tracking-wider text-white">
                      Vision & Ambiance Confort
                    </span>
                  </div>
                  <button
                    onClick={() => setShowFilterPicker(false)}
                    className="p-1 rounded-full hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <p className="text-[11px] text-stone-300 leading-relaxed">
                  Ajustez l’ambiance de la photo pour une vue agréable et douce pour vos yeux :
                </p>

                <div className="grid grid-cols-1 gap-2 pt-0.5">
                  {PHOTO_FILTERS.map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => {
                        setFilterMode(f.id);
                        soundEffects.playSoftTap();
                        triggerVibration([20]);
                        showToast(`Ambiance : ${f.icon} ${f.label}`);
                        setShowFilterPicker(false);
                      }}
                      className={`flex items-center justify-between p-2.5 rounded-2xl border transition-all cursor-pointer ${
                        filterMode === f.id
                          ? 'bg-rose-600/30 border-rose-400 text-white shadow-lg ring-1 ring-rose-400/40'
                          : 'bg-white/5 hover:bg-white/10 border-white/10 text-stone-300'
                      }`}
                    >
                      <div className="flex items-center gap-3 text-left">
                        <span className="text-lg">{f.icon}</span>
                        <div>
                          <div className="text-xs font-bold text-white flex items-center gap-1.5">
                            {f.label}
                            {filterMode === f.id && (
                              <span className="text-[10px] text-rose-300 font-mono">● Actif</span>
                            )}
                          </div>
                          <div className="text-[10px] text-stone-400">{f.shortDesc}</div>
                        </div>
                      </div>
                      {filterMode === f.id && <Check className="w-4 h-4 text-rose-400 shrink-0" />}
                    </button>
                  ))}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* =========================================================
            6. RICH FULLSCREEN DETAILS & TECHNICAL SPECIFICATIONS MODAL
           ========================================================= */}
        <AnimatePresence>
          {showDetailsModal && activeItem && (
            <div className="fixed inset-0 z-65 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md">
              <motion.div
                initial={{ opacity: 0, scale: 0.94, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.94, y: 15 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-lg rounded-3xl bg-stone-900/95 backdrop-blur-2xl border border-white/20 p-5 sm:p-6 shadow-2xl text-white space-y-4 max-h-[90vh] overflow-y-auto"
              >
                {/* Modal Header */}
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-2xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400">
                      {isCurrentItemVideo ? <Video className="w-5 h-5" /> : <Camera className="w-5 h-5" />}
                    </div>
                    <div>
                      <h4 className="text-sm sm:text-base font-bold text-white">
                        {isCurrentItemVideo ? 'Fiche détaillée du souvenir vidéo' : 'Détails & Fiche Photo Haute Définition'}
                      </h4>
                      <p className="text-[11px] text-stone-400">
                        Élément {currentIndex + 1} sur {items.length} • Salon complice
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowDetailsModal(false)}
                    className="p-2 rounded-full hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Technical Specifications Card (Résolution, Définition, Ratio, Format) */}
                <div className="rounded-2xl bg-white/5 border border-white/10 p-3.5 space-y-2.5">
                  <div className="flex items-center justify-between text-xs font-bold text-stone-200 uppercase tracking-wider">
                    <span className="flex items-center gap-1.5 text-rose-300">
                      <Maximize2 className="w-3.5 h-3.5" />
                      Spécifications de l'image
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 font-medium">
                      Qualité Originale
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {/* Dimensions */}
                    <div className="p-2.5 rounded-xl bg-black/30 border border-white/5">
                      <span className="text-[10px] text-stone-400 block uppercase">Résolution</span>
                      <span className="font-mono font-bold text-stone-100 text-xs mt-0.5 block">
                        {currentImageMeta ? `${currentImageMeta.width} × ${currentImageMeta.height} px` : (isCurrentItemVideo ? 'Format Haute Qualité' : 'Détection HD...')}
                      </span>
                    </div>

                    {/* Megapixels & Ratio */}
                    <div className="p-2.5 rounded-xl bg-black/30 border border-white/5">
                      <span className="text-[10px] text-stone-400 block uppercase">Définition & Ratio</span>
                      <span className="font-bold text-stone-100 text-xs mt-0.5 block">
                        {currentImageMeta ? `${currentImageMeta.megapixels} • ${currentImageMeta.aspectRatio}` : (isCurrentItemVideo ? '16:9 HD' : 'Optimisée')}
                      </span>
                    </div>

                    {/* Format */}
                    <div className="p-2.5 rounded-xl bg-black/30 border border-white/5">
                      <span className="text-[10px] text-stone-400 block uppercase">Format de fichier</span>
                      <span className="font-bold text-stone-100 text-xs mt-0.5 block">
                        {isCurrentItemVideo ? 'Vidéo MP4 HD' : (currentImageMeta?.format || 'Image Web')}
                      </span>
                    </div>

                    {/* Zoom / Ambiance */}
                    <div className="p-2.5 rounded-xl bg-black/30 border border-white/5">
                      <span className="text-[10px] text-stone-400 block uppercase">Zoom & Ambiance</span>
                      <span className="font-bold text-rose-300 text-xs mt-0.5 block">
                        {scale > 1.05 ? `${Math.round(scale * 100)}% (${scale.toFixed(1)}x)` : '1.0x (Plein écran)'}
                        {!isCurrentItemVideo && ` • ${PHOTO_FILTERS.find((f) => f.id === filterMode)?.label}`}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Sender & Complice Information */}
                <div className="rounded-2xl bg-white/5 border border-white/10 p-3.5 space-y-2.5">
                  <span className="text-[10px] text-stone-400 uppercase tracking-wider block font-semibold">
                    Informations de partage
                  </span>
                  <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
                    <div className="flex items-center gap-2.5">
                      <PartnerAvatar
                        name={activeItem.authorName || (activeItem.authorId === 'p2' ? 'Med' : 'Safi')}
                        avatar={activeItem.authorAvatar}
                        partnerId={activeItem.authorId === 'p2' ? 'p2' : 'p1'}
                        size="sm"
                      />
                      <div>
                        <span className="font-bold text-white block">
                          {activeItem.authorName || (activeItem.authorId === 'p2' ? 'Med' : 'Safi')}
                        </span>
                        <span className="text-[10px] text-rose-300 font-medium">Partenaire complice</span>
                      </div>
                    </div>

                    {activeItem.date && (
                      <div className="flex items-center gap-1.5 text-stone-300 text-xs font-medium">
                        <Calendar className="w-3.5 h-3.5 text-rose-400" />
                        <span>{activeItem.date}</span>
                      </div>
                    )}
                  </div>

                  {activeItem.locationName && (
                    <div className="flex items-center gap-1.5 text-xs text-stone-300 pt-1 border-t border-white/5">
                      <MapPin className="w-3.5 h-3.5 text-rose-400" />
                      <span>{activeItem.locationName}</span>
                    </div>
                  )}
                </div>

                {/* Note / Caption if present */}
                {(activeItem.title || activeItem.description) && (
                  <div className="rounded-2xl bg-white/5 border border-white/10 p-3.5 space-y-1.5">
                    <span className="text-[10px] text-stone-400 uppercase tracking-wider block font-semibold">
                      Mot doux ou légende
                    </span>
                    <p className="text-xs text-stone-100 italic leading-relaxed bg-black/30 p-3 rounded-xl border border-white/5">
                      « {activeItem.description || activeItem.title} »
                    </p>
                  </div>
                )}

                {/* Action Buttons inside Details */}
                <div className="pt-2 flex items-center justify-between gap-2.5 flex-wrap">
                  <div className="flex items-center gap-2">
                    <a
                      href={activeItem.photoUrl}
                      download={`photo-${currentIndex + 1}.jpg`}
                      target="_blank"
                      rel="noreferrer"
                      onClick={() => showToast('Téléchargement haute qualité...')}
                      className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-white text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Download className="w-4 h-4 text-rose-300" />
                      <span>Télécharger HD</span>
                    </a>
                    <button
                      type="button"
                      onClick={handleShare}
                      className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-white text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Share2 className="w-4 h-4 text-stone-300" />
                      <span>Partager</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowDetailsModal(false)}
                    className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-white text-xs font-bold transition-all cursor-pointer shadow-md"
                  >
                    Fermer
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* =========================================================
            7. FLOATING TOAST NOTIFICATION FEEDBACK
           ========================================================= */}
        <AnimatePresence>
          {toastMessage && (
            <motion.div
              initial={{ opacity: 0, y: 15, scale: 0.92 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.92 }}
              className="absolute bottom-24 sm:bottom-28 left-1/2 -translate-x-1/2 z-65 px-4 py-2 rounded-full bg-stone-900/90 text-white border border-white/20 backdrop-blur-xl text-xs font-medium shadow-2xl flex items-center gap-2 pointer-events-none"
            >
              <span>{toastMessage}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
};
