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
  Sparkles,
  Play,
  Video,
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
  items,
  initialIndex,
  isOpen,
  onClose,
  onIndexChange,
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [pullDownOffset, setPullDownOffset] = useState(0);
  const [direction, setDirection] = useState<number>(0);
  const [showUiChrome, setShowUiChrome] = useState(true);
  const [isInteracting, setIsInteracting] = useState(false);

  // Gesture refs
  const touchStartRef = useRef<{
    x: number;
    y: number;
    time: number;
    scale: number;
    pan: { x: number; y: number };
    initialDistance: number;
    initialCenter: { x: number; y: number };
  }>({
    x: 0,
    y: 0,
    time: 0,
    scale: 1,
    pan: { x: 0, y: 0 },
    initialDistance: 0,
    initialCenter: { x: 0, y: 0 },
  });

  const lastTapRef = useRef<{ time: number; x: number; y: number }>({ time: 0, x: 0, y: 0 });
  const isDraggingRef = useRef(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const thumbnailStripRef = useRef<HTMLDivElement | null>(null);

  // Keep index in sync with initialIndex when opening
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(Math.max(0, Math.min(initialIndex, items.length - 1)));
      setScale(1);
      setPan({ x: 0, y: 0 });
      setSwipeOffset(0);
      setPullDownOffset(0);
      setShowUiChrome(true);
    }
  }, [isOpen, initialIndex, items.length]);

  // Scroll active thumbnail into view
  useEffect(() => {
    if (!thumbnailStripRef.current) return;
    const activeThumb = thumbnailStripRef.current.children[currentIndex] as HTMLElement;
    if (activeThumb) {
      activeThumb.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [currentIndex]);

  const activeItem = items[currentIndex] || null;

  const [resolvedVideoUrl, setResolvedVideoUrl] = useState<string>('');

  const isCurrentItemVideo = Boolean(
    activeItem &&
      (activeItem.mediaType === 'video' ||
        isVideoMediaType(activeItem.videoUrl || activeItem.photoUrl, activeItem.mediaType))
  );

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
  }, []);

  // Navigate to photo
  const goToIndex = useCallback(
    (newIndex: number, navDirection?: number) => {
      if (items.length === 0) return;
      const targetIndex = (newIndex + items.length) % items.length;
      setDirection(navDirection ?? (newIndex > currentIndex ? 1 : -1));
      setCurrentIndex(targetIndex);
      resetZoom();
      soundEffects.playNoteClick();
      triggerVibration([20]);
      if (onIndexChange) {
        onIndexChange(targetIndex);
      }
    },
    [items.length, currentIndex, resetZoom, onIndexChange]
  );

  const goNext = useCallback(() => {
    if (items.length <= 1) return;
    goToIndex(currentIndex + 1, 1);
  }, [items.length, currentIndex, goToIndex]);

  const goPrev = useCallback(() => {
    if (items.length <= 1) return;
    goToIndex(currentIndex - 1, -1);
  }, [items.length, currentIndex, goToIndex]);

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

  // Touch handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    setIsInteracting(true);
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      const now = Date.now();

      // Check double tap
      if (
        now - lastTapRef.current.time < 300 &&
        Math.hypot(touch.clientX - lastTapRef.current.x, touch.clientY - lastTapRef.current.y) < 35
      ) {
        handleDoubleTap(touch.clientX, touch.clientY);
        lastTapRef.current = { time: 0, x: 0, y: 0 };
        return;
      }
      lastTapRef.current = { time: now, x: touch.clientX, y: touch.clientY };

      touchStartRef.current = {
        x: touch.clientX,
        y: touch.clientY,
        time: now,
        scale,
        pan: { ...pan },
        initialDistance: 0,
        initialCenter: { x: touch.clientX, y: touch.clientY },
      };
      isDraggingRef.current = true;
    } else if (e.touches.length === 2) {
      // Pinch start
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.hypot(touch1.clientX - touch2.clientX, touch1.clientY - touch2.clientY);
      const center = {
        x: (touch1.clientX + touch2.clientX) / 2,
        y: (touch1.clientY + touch2.clientY) / 2,
      };
      touchStartRef.current = {
        x: center.x,
        y: center.y,
        time: Date.now(),
        scale,
        pan: { ...pan },
        initialDistance: distance,
        initialCenter: center,
      };
      isDraggingRef.current = true;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDraggingRef.current) return;

    // Two finger pinch to zoom
    if (e.touches.length === 2 && touchStartRef.current.initialDistance > 0) {
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const currentDistance = Math.hypot(touch1.clientX - touch2.clientX, touch1.clientY - touch2.clientY);
      const ratio = currentDistance / touchStartRef.current.initialDistance;

      // Elastic zoom limits (min 0.7x, max 5.0x during pinch)
      const targetScale = touchStartRef.current.scale * ratio;
      const newScale = Math.max(0.7, Math.min(5.0, targetScale));
      setScale(Number(newScale.toFixed(2)));

      // Simultaneous two-finger pan tracking
      const currentCenter = {
        x: (touch1.clientX + touch2.clientX) / 2,
        y: (touch1.clientY + touch2.clientY) / 2,
      };
      const deltaCenterX = currentCenter.x - touchStartRef.current.initialCenter.x;
      const deltaCenterY = currentCenter.y - touchStartRef.current.initialCenter.y;

      setPan({
        x: touchStartRef.current.pan.x + deltaCenterX,
        y: touchStartRef.current.pan.y + deltaCenterY,
      });
      return;
    }

    // Single finger interaction
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      const deltaX = touch.clientX - touchStartRef.current.x;
      const deltaY = touch.clientY - touchStartRef.current.y;

      if (scale > 1.05) {
        // Pan image smoothly when zoomed in
        const maxPanX = (scale - 1) * 260;
        const maxPanY = (scale - 1) * 360;
        setPan({
          x: Math.max(-maxPanX, Math.min(maxPanX, touchStartRef.current.pan.x + deltaX)),
          y: Math.max(-maxPanY, Math.min(maxPanY, touchStartRef.current.pan.y + deltaY)),
        });
      } else {
        // At 1x: Swipe horizontal (change photo) or pull down (dismiss)
        if (Math.abs(deltaY) > Math.abs(deltaX) * 1.4 && deltaY > 0) {
          // Pulling down to dismiss
          setPullDownOffset(deltaY);
          setSwipeOffset(0);
        } else {
          // Swiping left/right
          setSwipeOffset(deltaX);
          setPullDownOffset(0);
        }
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    isDraggingRef.current = false;
    setIsInteracting(false);

    // Handle pull down to dismiss
    if (pullDownOffset > 90) {
      soundEffects.playSoftTap();
      triggerVibration([20]);
      onClose();
      return;
    }
    setPullDownOffset(0);

    // Handle swipe left / right
    if (scale <= 1.05 && Math.abs(swipeOffset) > 55) {
      if (swipeOffset < 0) {
        goNext();
      } else {
        goPrev();
      }
    }
    setSwipeOffset(0);

    // Snap scale with spring physics if out of bounds
    if (scale < 1.02) {
      resetZoom();
    } else if (scale > 4) {
      setScale(4);
      const maxPanX = 3 * 220;
      const maxPanY = 3 * 320;
      setPan((prev) => ({
        x: Math.max(-maxPanX, Math.min(maxPanX, prev.x)),
        y: Math.max(-maxPanY, Math.min(maxPanY, prev.y)),
      }));
    } else {
      // Re-bound pan so the photo remains centered and visible
      const maxPanX = (scale - 1) * 220;
      const maxPanY = (scale - 1) * 320;
      setPan((prev) => ({
        x: Math.max(-maxPanX, Math.min(maxPanX, prev.x)),
        y: Math.max(-maxPanY, Math.min(maxPanY, prev.y)),
      }));
    }
  };

  // Mouse wheel zoom support for desktop
  const handleWheel = (e: React.WheelEvent) => {
    e.stopPropagation();
    if (e.deltaY < 0) {
      setScale((prev) => Math.min(4, Number((prev + 0.2).toFixed(1))));
    } else {
      setScale((prev) => {
        const next = Math.max(1, Number((prev - 0.2).toFixed(1)));
        if (next === 1) setPan({ x: 0, y: 0 });
        return next;
      });
    }
  };

  if (!isOpen || !activeItem) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.22 }}
        className="fixed inset-0 z-50 flex flex-col justify-between bg-black/95 select-none overflow-hidden touch-none"
        style={{
          transform: pullDownOffset > 0 ? `translateY(${pullDownOffset}px)` : undefined,
          opacity: pullDownOffset > 0 ? Math.max(0.2, 1 - pullDownOffset / 300) : 1,
        }}
      >
        {/* =========================================================
            1. FLOATING HEADER (CONTROLS, COUNTER & ZOOM)
           ========================================================= */}
        <div
          className={`relative z-50 flex items-center justify-between px-3 sm:px-6 py-3 bg-gradient-to-b from-black/80 via-black/40 to-transparent transition-opacity duration-300 ${
            showUiChrome ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          {/* Close button & Counter */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={onClose}
              className="p-2.5 rounded-full bg-white/15 hover:bg-white/25 active:scale-95 text-white transition-all cursor-pointer shadow-md"
              title="Fermer (Échap ou glisser vers le bas)"
              aria-label="Fermer la vue photo"
            >
              <X className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>

            <div className="px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-white text-xs sm:text-sm font-semibold tracking-wide">
              <span>{currentIndex + 1}</span>
              <span className="text-white/40 mx-1">/</span>
              <span>{items.length}</span>
            </div>
          </div>

          {/* Zoom Tools & Action Pill */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Zoom percentage badge */}
            <div className="hidden sm:flex items-center px-2.5 py-1 rounded-full bg-white/10 text-white/80 text-xs font-mono">
              {Math.round(scale * 100)}%
            </div>

            {/* Zoom In / Out Buttons */}
            <button
              onClick={handleZoomIn}
              disabled={scale >= 4}
              className="p-2 sm:p-2.5 rounded-full bg-white/15 hover:bg-white/25 disabled:opacity-30 disabled:cursor-not-allowed active:scale-95 text-white transition-all cursor-pointer"
              title="Agrandir (+)"
              aria-label="Agrandir"
            >
              <ZoomIn className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            <button
              onClick={handleZoomOut}
              disabled={scale <= 1}
              className="p-2 sm:p-2.5 rounded-full bg-white/15 hover:bg-white/25 disabled:opacity-30 disabled:cursor-not-allowed active:scale-95 text-white transition-all cursor-pointer"
              title="Réduire (-)"
              aria-label="Réduire"
            >
              <ZoomOut className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            {/* Reset Zoom Button */}
            {scale > 1.05 && (
              <button
                onClick={resetZoom}
                className="p-2 sm:p-2.5 rounded-full bg-rose-600 hover:bg-rose-700 active:scale-95 text-white transition-all cursor-pointer shadow-md flex items-center gap-1 text-xs font-bold"
                title="Réinitialiser zoom (100%)"
                aria-label="Réinitialiser zoom"
              >
                <RotateCcw className="w-4 h-4" />
                <span className="hidden sm:inline">1:1</span>
              </button>
            )}

            {/* Direct Media Download */}
            <a
              href={isCurrentItemVideo ? (resolvedVideoUrl || activeItem.videoUrl || activeItem.photoUrl) : activeItem.photoUrl}
              download={isCurrentItemVideo ? `souvenir-video-${currentIndex + 1}.mp4` : `souvenir-amoureux-${currentIndex + 1}.jpg`}
              target="_blank"
              rel="noreferrer"
              className="p-2 sm:p-2.5 rounded-full bg-white/15 hover:bg-white/25 active:scale-95 text-white transition-all cursor-pointer"
              title={isCurrentItemVideo ? "Télécharger la vidéo" : "Télécharger / Ouvrir en taille réelle"}
              aria-label={isCurrentItemVideo ? "Télécharger la vidéo" : "Télécharger la photo"}
            >
              <Download className="w-4 h-4 sm:w-5 sm:h-5" />
            </a>
          </div>
        </div>

        {/* =========================================================
            2. MAIN INTERACTIVE PHOTO/VIDEO STAGE (SWIPE, PINCH, PAN)
           ========================================================= */}
        <div
          ref={containerRef}
          onWheel={handleWheel}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onClick={(e) => {
            // Single tap toggles UI chrome
            if (scale <= 1.05 && Math.abs(swipeOffset) < 5 && Math.abs(pullDownOffset) < 5) {
              setShowUiChrome((prev) => !prev);
            }
          }}
          className="relative flex-1 w-full h-full flex items-center justify-center overflow-hidden cursor-grab active:cursor-grabbing"
        >
          {/* Navigation Arrows (Desktop / Tablet) */}
          {items.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  goPrev();
                }}
                className="absolute left-2 sm:left-5 top-1/2 -translate-y-1/2 z-40 p-3 sm:p-4 rounded-full bg-black/40 hover:bg-black/70 active:scale-95 text-white transition-all cursor-pointer backdrop-blur-md border border-white/10 hidden sm:flex items-center justify-center shadow-xl"
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
                className="absolute right-2 sm:right-5 top-1/2 -translate-y-1/2 z-40 p-3 sm:p-4 rounded-full bg-black/40 hover:bg-black/70 active:scale-95 text-white transition-all cursor-pointer backdrop-blur-md border border-white/10 hidden sm:flex items-center justify-center shadow-xl"
                title="Suivant"
                aria-label="Suivant"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </>
          )}

          {/* Render Active Image / Video with smooth Pan/Zoom & Swipe translation */}
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
            className="relative max-w-full max-h-full flex items-center justify-center p-2 sm:p-6"
          >
            {isCurrentItemVideo ? (
              <div
                className="relative max-h-[72vh] sm:max-h-[78vh] max-w-[94vw] sm:max-w-[88vw] flex items-center justify-center"
                onClick={(e) => e.stopPropagation()}
              >
                <video
                  key={resolvedVideoUrl || activeItem.videoUrl || activeItem.photoUrl}
                  src={resolvedVideoUrl || activeItem.videoUrl || activeItem.photoUrl}
                  poster={activeItem.photoUrl}
                  controls
                  playsInline
                  autoPlay
                  className="max-h-[72vh] sm:max-h-[78vh] max-w-[94vw] sm:max-w-[88vw] w-auto h-auto rounded-xl sm:rounded-2xl shadow-2xl bg-black"
                />
              </div>
            ) : (
              <img
                src={activeItem.photoUrl}
                alt={activeItem.title || 'Photo complice'}
                draggable={false}
                className="max-h-[72vh] sm:max-h-[78vh] max-w-[94vw] sm:max-w-[88vw] w-auto h-auto object-contain rounded-xl sm:rounded-2xl shadow-2xl select-none"
              />
            )}
          </motion.div>

          {/* Dynamic Pinch & Zoom HUD Badge */}
          <AnimatePresence>
            {scale > 1.05 && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.85 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.85 }}
                transition={{ duration: 0.15 }}
                className="absolute top-16 left-1/2 -translate-x-1/2 z-40 px-3.5 py-1 rounded-full bg-black/75 backdrop-blur-md border border-white/20 text-white font-mono text-xs shadow-xl flex items-center gap-1.5 pointer-events-none"
              >
                <ZoomIn className="w-3.5 h-3.5 text-rose-400" />
                <span className="font-semibold">{Math.round(scale * 100)}%</span>
                <span className="text-white/50">({scale.toFixed(1)}x)</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Quick hint on mobile */}
          <div
            className={`absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-white/70 text-[11px] font-medium pointer-events-none transition-opacity duration-300 sm:hidden ${
              showUiChrome && scale <= 1 ? 'opacity-100' : 'opacity-0'
            }`}
          >
            {isCurrentItemVideo ? 'Lecture vidéo complice' : 'Pincer pour zoomer • Glisser pour défiler'}
          </div>
        </div>

        {/* =========================================================
            3. BOTTOM SHEET: THUMBNAILS FILMSTRIP & PHOTO DETAILS
           ========================================================= */}
        <div
          className={`relative z-50 bg-gradient-to-t from-black/95 via-stone-950/90 to-transparent pt-3 pb-4 sm:pb-6 px-3 sm:px-6 transition-opacity duration-300 ${
            showUiChrome ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          {/* Filmstrip of all photos */}
          {items.length > 1 && (
            <div
              ref={thumbnailStripRef}
              className="flex items-center gap-2 overflow-x-auto pb-3 mb-2 scrollbar-none snap-x"
            >
              {items.map((item, idx) => {
                const itemIsVideo = item.mediaType === 'video' || isVideoMediaType(item.videoUrl, item.mediaType);
                return (
                  <button
                    key={item.id}
                    onClick={() => goToIndex(idx)}
                    className={`relative shrink-0 w-12 h-12 sm:w-14 sm:h-14 rounded-xl overflow-hidden border-2 transition-all cursor-pointer snap-center ${
                      idx === currentIndex
                        ? 'border-rose-500 scale-105 shadow-md shadow-rose-500/30 ring-2 ring-rose-400/40'
                        : 'border-white/20 opacity-50 hover:opacity-90'
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
                    {idx === currentIndex && (
                      <div className="absolute inset-0 bg-rose-500/10 pointer-events-none" />
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* Photo Details & Actions Bar */}
          <div className="max-w-4xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-white">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap text-xs">
                {isCurrentItemVideo && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold border backdrop-blur-md bg-purple-500/30 border-purple-400/50 text-purple-200 flex items-center gap-1">
                    <Video className="w-3 h-3" />
                    <span>Vidéo {activeItem.videoDuration ? `(${formatVideoDuration(activeItem.videoDuration)})` : ''}</span>
                  </span>
                )}
                {activeItem.badgeLabel && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold border backdrop-blur-md ${
                      activeItem.badgeBg || 'bg-rose-500/30 border-rose-400/50 text-rose-200'
                    }`}
                  >
                    {activeItem.badgeLabel}
                  </span>
                )}
                {activeItem.locationName && (
                  <span className="flex items-center gap-1 text-rose-300 font-medium">
                    <MapPin className="w-3.5 h-3.5" />
                    {activeItem.locationName}
                  </span>
                )}
                {activeItem.date && (
                  <span className="flex items-center gap-1 text-stone-400">
                    <Calendar className="w-3.5 h-3.5" />
                    {activeItem.date}
                  </span>
                )}
              </div>

              {activeItem.title && (
                <h3 className="text-base sm:text-lg font-serif font-bold text-white mt-1 truncate">
                  {activeItem.title}
                </h3>
              )}

              {activeItem.description && (
                <p className="text-xs sm:text-sm text-stone-300 mt-0.5 line-clamp-2 leading-relaxed">
                  {activeItem.description}
                </p>
              )}
            </div>

            {/* Action Buttons (Like, Edit, Delete) */}
            <div className="flex items-center gap-2 shrink-0 pt-1 sm:pt-0">
              {activeItem.onLike && (
                <button
                  onClick={() => {
                    triggerHeartConfetti();
                    soundEffects.playHeartPulse();
                    triggerVibration([40, 30, 40]);
                    activeItem.onLike?.();
                  }}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer active:scale-95 ${
                    activeItem.isLiked
                      ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                      : 'bg-white/10 hover:bg-white/20 text-rose-300'
                  }`}
                  title="Aimer ce souvenir"
                >
                  <Heart
                    className={`w-4 h-4 ${
                      activeItem.isLiked ? 'fill-white text-white' : 'fill-rose-400 text-rose-400'
                    }`}
                  />
                  <span>{activeItem.likeCount ?? 0}</span>
                </button>
              )}

              {activeItem.onEdit && (
                <button
                  onClick={() => {
                    onClose();
                    activeItem.onEdit?.();
                  }}
                  className="px-3 py-2 bg-white/10 hover:bg-white/20 active:scale-95 text-white rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
                  title="Modifier ce souvenir"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Modifier</span>
                </button>
              )}

              {activeItem.onRemovePhotoOnly && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    activeItem.onRemovePhotoOnly?.();
                  }}
                  className="px-3 py-2 bg-amber-600/80 hover:bg-amber-600 active:scale-95 text-white rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
                  title="Retirer uniquement cette photo"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Retirer photo</span>
                </button>
              )}

              {activeItem.onDelete && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    activeItem.onDelete?.();
                  }}
                  className="px-3 py-2 bg-rose-600/90 hover:bg-rose-600 active:scale-95 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
                  title="Supprimer ce média"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Supprimer</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
