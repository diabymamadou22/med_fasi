import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize2,
  Repeat,
  Heart,
  AlertCircle,
  MoreVertical,
  Download,
  Sliders,
  RotateCcw,
  RotateCw,
} from 'lucide-react';
import { resolveMediaUrl, formatVideoDuration } from '../lib/videoUtils';
import { useBackHandler } from '../lib/backNavigation';

interface SleekLoveVideoPlayerProps {
  src: string;
  poster?: string;
  title?: string;
  autoPlay?: boolean;
  loop?: boolean;
  compact?: boolean; // compact mode for chat bubble or modal preview
  onOpenFullscreen?: () => void;
  className?: string;
  onEnded?: () => void;
  // Options to coordinate with parent viewer (e.g. MobilePhotoViewer)
  isMuted?: boolean;
  onToggleMute?: () => void;
  isLooping?: boolean;
  onToggleLoop?: () => void;
  playbackRate?: number;
  onPlaybackRateChange?: (rate: number) => void;
  hideExtraMenu?: boolean;
  onPlayingChange?: (isPlaying: boolean) => void;
  onControlsVisibilityChange?: (visible: boolean) => void;
  onVideoRefReady?: (videoEl: HTMLVideoElement | null) => void;
  onTimeUpdate?: (currentTime: number, duration: number) => void;
  hideDefaultControls?: boolean;
  onStageClick?: () => void;
}

export const SleekLoveVideoPlayer: React.FC<SleekLoveVideoPlayerProps> = ({
  src,
  poster,
  title,
  autoPlay = false,
  loop = false,
  compact = false,
  onOpenFullscreen,
  className = '',
  onEnded,
  isMuted: externalIsMuted,
  onToggleMute: externalToggleMute,
  isLooping: externalIsLooping,
  onToggleLoop: externalToggleLoop,
  playbackRate: externalPlaybackRate,
  onPlaybackRateChange: externalPlaybackRateChange,
  hideExtraMenu = false,
  onPlayingChange,
  onControlsVisibilityChange,
  onVideoRefReady,
  onTimeUpdate: onTimeUpdateProp,
  hideDefaultControls = false,
  onStageClick,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hideControlsTimerRef = useRef<any>(null);
  const lastTapTimeRef = useRef<number>(0);
  const tapTimeoutRef = useRef<any>(null);

  // States
  const [resolvedSrc, setResolvedSrc] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hasError, setHasError] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [internalIsMuted, setInternalIsMuted] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [internalIsLooping, setInternalIsLooping] = useState<boolean>(loop);
  const [internalPlaybackRate, setInternalPlaybackRate] = useState<number>(1);
  const [showControls, setShowControls] = useState<boolean>(true);
  const [isEnded, setIsEnded] = useState<boolean>(false);
  const [centerAnimation, setCenterAnimation] = useState<'play' | 'pause' | null>(null);
  const [isScrubbing, setIsScrubbing] = useState<boolean>(false);
  const [showStandaloneMenu, setShowStandaloneMenu] = useState<boolean>(false);
  const [skipFeedback, setSkipFeedback] = useState<{ type: 'rewind' | 'forward'; id: number } | null>(null);

  const isMuted = externalIsMuted !== undefined ? externalIsMuted : internalIsMuted;
  const isLooping = externalIsLooping !== undefined ? externalIsLooping : internalIsLooping;
  const playbackRate = externalPlaybackRate !== undefined ? externalPlaybackRate : internalPlaybackRate;

  useBackHandler(showStandaloneMenu, () => setShowStandaloneMenu(false), 'standalone-video-menu');

  // Notify parent of video element readiness
  useEffect(() => {
    if (onVideoRefReady) {
      onVideoRefReady(videoRef.current);
    }
  }, [onVideoRefReady, resolvedSrc]);

  // Sync playbackRate & loop with video element
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.loop = isLooping;
    }
  }, [isLooping]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
    }
  }, [isMuted]);

  // Resolve source URL (handles IndexedDB idb: references or standard urls)
  useEffect(() => {
    let isMounted = true;
    if (!src) {
      setIsLoading(false);
      setHasError(true);
      return;
    }

    setIsLoading(true);
    setHasError(false);

    resolveMediaUrl(src)
      .then((url) => {
        if (isMounted) {
          setResolvedSrc(url);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        console.error('Erreur de chargement de la vidéo:', err);
        if (isMounted) {
          setHasError(true);
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [src]);

  // Controls auto-hide timer
  const resetHideTimer = useCallback(
    (delay = 2500) => {
      setShowControls(true);
      if (hideControlsTimerRef.current) {
        clearTimeout(hideControlsTimerRef.current);
      }
      if (isPlaying && !isScrubbing) {
        hideControlsTimerRef.current = setTimeout(() => {
          setShowControls(false);
        }, compact ? Math.min(delay, 1800) : delay);
      }
    },
    [isPlaying, isScrubbing, compact]
  );

  useEffect(() => {
    if (isPlaying && !isScrubbing) {
      // When playback starts / launches, auto-hide all buttons & text after a brief moment
      resetHideTimer(1200);
    } else {
      setShowControls(true);
      if (hideControlsTimerRef.current) {
        clearTimeout(hideControlsTimerRef.current);
      }
    }
    return () => {
      if (hideControlsTimerRef.current) clearTimeout(hideControlsTimerRef.current);
    };
  }, [isPlaying, isScrubbing, resetHideTimer]);

  useEffect(() => {
    const isVisible = showControls || !isPlaying || isEnded;
    onControlsVisibilityChange?.(isVisible);
  }, [showControls, isPlaying, isEnded, onControlsVisibilityChange]);

  useEffect(() => {
    onPlayingChange?.(isPlaying);
  }, [isPlaying, onPlayingChange]);

  useEffect(() => {
    return () => {
      if (tapTimeoutRef.current) clearTimeout(tapTimeoutRef.current);
    };
  }, []);

  // Play / Pause Toggle
  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused || video.ended) {
      video
        .play()
        .then(() => {
          setIsPlaying(true);
          setIsEnded(false);
          setCenterAnimation('play');
          setTimeout(() => setCenterAnimation(null), 650);
        })
        .catch(() => {
          // Auto-play policy blocked, fallback to mute then play
          video.muted = true;
          setInternalIsMuted(true);
          video.play().then(() => setIsPlaying(true)).catch(() => {});
        });
    } else {
      video.pause();
      setIsPlaying(false);
      setCenterAnimation('pause');
      setTimeout(() => setCenterAnimation(null), 650);
    }
    resetHideTimer();
  }, [resetHideTimer]);

  // Seek relative
  const seekRelative = useCallback((seconds: number) => {
    const video = videoRef.current;
    if (!video) return;
    const target = Math.max(0, Math.min(video.duration || 0, video.currentTime + seconds));
    video.currentTime = target;
    setCurrentTime(target);

    setSkipFeedback({
      type: seconds < 0 ? 'rewind' : 'forward',
      id: Date.now(),
    });
    setTimeout(() => setSkipFeedback(null), 750);
    resetHideTimer();
  }, [resetHideTimer]);

  // Screen click handler:
  // - If controls/buttons are hidden while playing: single tap reveals all buttons & text with smooth transition
  // - If controls are already shown while playing: tap pauses the video
  // - If video is paused: tap resumes playback (and buttons/text auto-hide)
  // - Double tap on left/right side skips -5s / +5s
  const handleStageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // If clicking directly on controls bar, buttons, links, or sliders, do not toggle
    const target = e.target as HTMLElement;
    if (
      target.closest('.video-controls-bar') ||
      target.closest('button') ||
      target.closest('input') ||
      target.closest('a')
    ) {
      return;
    }

    const rect = containerRef.current?.getBoundingClientRect();
    const clickX = rect ? e.clientX - rect.left : 0;
    const width = rect ? rect.width : 0;
    const now = Date.now();

    // Check double tap (within 280ms)
    if (now - lastTapTimeRef.current < 280 && width > 0) {
      if (tapTimeoutRef.current) {
        clearTimeout(tapTimeoutRef.current);
        tapTimeoutRef.current = null;
      }
      lastTapTimeRef.current = 0;

      if (clickX < width * 0.35) {
        seekRelative(-5);
        return;
      } else if (clickX > width * 0.65) {
        seekRelative(5);
        return;
      }
    }

    lastTapTimeRef.current = now;

    if (tapTimeoutRef.current) {
      clearTimeout(tapTimeoutRef.current);
    }

    tapTimeoutRef.current = setTimeout(() => {
      if (onStageClick) {
        onStageClick();
      } else {
        setShowControls((prev) => !prev);
      }
    }, 200);
  };

  const handleMouseMove = () => {
    if (isPlaying) {
      if (!showControls) {
        setShowControls(true);
      }
      resetHideTimer(2500);
    }
  };

  // Toggle Mute
  const toggleMute = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (externalToggleMute) {
      externalToggleMute();
      resetHideTimer();
      return;
    }
    if (!videoRef.current) return;
    const nextMuted = !videoRef.current.muted;
    videoRef.current.muted = nextMuted;
    setInternalIsMuted(nextMuted);
    resetHideTimer();
  };

  // Toggle Speed
  const cyclePlaybackRate = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    const rates = [1, 1.25, 1.5, 2, 0.75];
    const nextIndex = (rates.indexOf(playbackRate) + 1) % rates.length;
    const nextRate = rates[nextIndex];
    if (externalPlaybackRateChange) {
      externalPlaybackRateChange(nextRate);
    } else {
      setInternalPlaybackRate(nextRate);
    }
    if (videoRef.current) {
      videoRef.current.playbackRate = nextRate;
    }
    resetHideTimer();
  };

  // Toggle Loop
  const toggleLoop = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (externalToggleLoop) {
      externalToggleLoop();
      resetHideTimer();
      return;
    }
    if (!videoRef.current) return;
    const nextLoop = !isLooping;
    videoRef.current.loop = nextLoop;
    setInternalIsLooping(nextLoop);
    resetHideTimer();
  };

  // Scrubber change
  const handleScrubberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    setCurrentTime(value);
    if (videoRef.current) {
      videoRef.current.currentTime = value;
    }
  };

  // Format progress
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onClick={handleStageClick}
      className={`relative select-none overflow-hidden bg-black flex items-center justify-center group/player ${className}`}
      style={{ touchAction: 'manipulation' }}
    >
      {/* Video Element */}
      {hasError ? (
        <div className="p-6 text-center text-rose-300 text-xs sm:text-sm flex flex-col items-center justify-center gap-2">
          <AlertCircle className="w-6 h-6 text-rose-400" />
          <span>Vidéo indisponible ou introuvable</span>
        </div>
      ) : (
        <video
          ref={videoRef}
          src={resolvedSrc || undefined}
          poster={poster}
          playsInline
          autoPlay={autoPlay}
          loop={isLooping}
          muted={isMuted}
          preload="metadata"
          onLoadedMetadata={() => {
            if (videoRef.current) {
              const d = videoRef.current.duration || 0;
              setDuration(d);
              if (onTimeUpdateProp) {
                onTimeUpdateProp(videoRef.current.currentTime || 0, d);
              }
            }
          }}
          onTimeUpdate={() => {
            if (!isScrubbing && videoRef.current) {
              const cur = videoRef.current.currentTime;
              const dur = videoRef.current.duration || 0;
              setCurrentTime(cur);
              if (onTimeUpdateProp) {
                onTimeUpdateProp(cur, dur);
              }
            }
          }}
          onPlay={() => {
            setIsPlaying(true);
            setIsEnded(false);
            if (onPlayingChange) onPlayingChange(true);
            resetHideTimer(1000);
          }}
          onPause={() => {
            setIsPlaying(false);
            if (onPlayingChange) onPlayingChange(false);
            setShowControls(true);
          }}
          onEnded={() => {
            setIsPlaying(false);
            setIsEnded(true);
            if (onPlayingChange) onPlayingChange(false);
            setShowControls(true);
            if (onEnded) onEnded();
          }}
          onWaiting={() => setIsLoading(true)}
          onPlaying={() => {
            setIsLoading(false);
            if (onPlayingChange) onPlayingChange(true);
            resetHideTimer(1000);
          }}
          className="w-full h-full object-contain cursor-pointer"
        />
      )}

      {/* Loading Spinner */}
      {isLoading && !hasError && (
        <div className="absolute inset-0 bg-black/40 backdrop-blur-xs flex flex-col items-center justify-center gap-2 pointer-events-none z-20">
          <motion.div
            animate={{ scale: [1, 1.25, 1], rotate: [0, 180, 360] }}
            transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
            className="w-10 h-10 rounded-full bg-rose-500/30 border-2 border-rose-500 flex items-center justify-center text-rose-400"
          >
            <Heart className="w-5 h-5 fill-rose-500 text-rose-500" />
          </motion.div>
          <span className="text-white/80 text-xs font-medium tracking-wide">
            Chargement de la vidéo...
          </span>
        </div>
      )}

      {/* Center Icon Flash (Play / Pause feedback) and Paused State Indicator */}
      <AnimatePresence>
        {centerAnimation ? (
          <motion.div
            key={centerAnimation}
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1.15 }}
            exit={{ opacity: 0, scale: 1.4 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none z-30"
          >
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-black/75 backdrop-blur-md border border-white/25 flex items-center justify-center text-white shadow-2xl">
              {centerAnimation === 'play' ? (
                <Play className="w-8 h-8 sm:w-10 sm:h-10 fill-white text-white ml-1" />
              ) : (
                <Pause className="w-8 h-8 sm:w-10 sm:h-10 fill-white text-white" />
              )}
            </div>
          </motion.div>
        ) : !isPlaying && !isLoading && !hasError && !isEnded ? (
          <motion.div
            key="center-paused-state"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none z-20"
          >
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-black/55 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white shadow-xl">
              <Play className="w-8 h-8 sm:w-10 sm:h-10 fill-white text-white ml-1" />
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* Double Tap Skip Feedback (-5s / +5s) */}
      <AnimatePresence>
        {skipFeedback && (
          <motion.div
            key={skipFeedback.id}
            initial={{ opacity: 0, x: skipFeedback.type === 'rewind' ? -20 : 20, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.3 }}
            className={`absolute top-1/2 -translate-y-1/2 pointer-events-none z-30 flex items-center gap-1 px-4 py-2 rounded-full bg-black/75 backdrop-blur-md border border-white/25 text-white text-xs sm:text-sm font-bold shadow-2xl ${
              skipFeedback.type === 'rewind' ? 'left-8' : 'right-8'
            }`}
          >
            {skipFeedback.type === 'rewind' ? (
              <>
                <RotateCcw className="w-4 h-4 text-rose-400" />
                <span>-5s</span>
              </>
            ) : (
              <>
                <span>+5s</span>
                <RotateCw className="w-4 h-4 text-rose-400" />
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Replay Overlay when video finishes */}
      {isEnded && !isLooping && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-xs flex flex-col items-center justify-center gap-3 z-25"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={() => {
              if (videoRef.current) {
                videoRef.current.currentTime = 0;
                videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
                setIsEnded(false);
              }
            }}
            className="px-5 py-2.5 rounded-full bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-semibold text-sm shadow-xl flex items-center gap-2 cursor-pointer transition-all border border-rose-400/40"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Revoir ce souvenir ❤️</span>
          </button>
        </motion.div>
      )}

      {/* Big Play Button Overlay when paused initially (hidden if hideDefaultControls) */}
      {!isPlaying && !isEnded && !isLoading && !hideDefaultControls && (
        <div
          onClick={togglePlay}
          className="absolute inset-0 bg-black/25 hover:bg-black/35 backdrop-blur-2xs flex items-center justify-center cursor-pointer transition-all z-15"
        >
          <motion.div
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.94 }}
            className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-rose-600/90 hover:bg-rose-600 text-white flex items-center justify-center shadow-2xl border-2 border-white/40"
          >
            <Play className="w-7 h-7 sm:w-8 sm:h-8 fill-white text-white ml-0.5" />
          </motion.div>
        </div>
      )}

      {/* Sleek Controls Overlay Bar */}
      <AnimatePresence>
        {!hideDefaultControls && (showControls || !isPlaying || isEnded) && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
            className="video-controls-bar absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent pt-8 pb-2 px-3 sm:px-4 z-30 flex flex-col gap-1.5"
          >
            {/* Scrubber Progress Bar */}
            <div className="relative flex items-center group/scrubber cursor-pointer w-full py-1">
              <div className="w-full h-1 sm:h-1.5 bg-white/25 rounded-full overflow-hidden relative">
                <div
                  className="h-full bg-gradient-to-r from-rose-500 to-pink-500 rounded-full transition-all duration-75 relative"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              {/* Native range input overlay for ultra-smooth touch & click scrubbing */}
              <input
                type="range"
                min={0}
                max={duration || 100}
                step={0.1}
                value={currentTime}
                onMouseDown={() => setIsScrubbing(true)}
                onTouchStart={() => setIsScrubbing(true)}
                onChange={handleScrubberChange}
                onMouseUp={() => {
                  setIsScrubbing(false);
                  if (isPlaying && videoRef.current) videoRef.current.play().catch(() => {});
                }}
                onTouchEnd={() => {
                  setIsScrubbing(false);
                  if (isPlaying && videoRef.current) videoRef.current.play().catch(() => {});
                }}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                title="Défilement de la vidéo"
                aria-label="Position vidéo"
              />
            </div>

            {/* Bottom Actions Row: Minimalist, clean, distraction-free */}
            <div className="flex items-center justify-between gap-2 text-white">
              {/* Left group: Play/Pause, Clean Time */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={togglePlay}
                  className="p-1.5 sm:p-2 rounded-full hover:bg-white/15 active:scale-95 text-white transition-all cursor-pointer"
                  title={isPlaying ? 'Mettre en pause' : 'Lire'}
                  aria-label={isPlaying ? 'Pause' : 'Lecture'}
                >
                  {isPlaying ? (
                    <Pause className="w-4 h-4 sm:w-5 sm:h-5 fill-white" />
                  ) : (
                    <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-white ml-0.5" />
                  )}
                </button>

                {/* Duration / Timestamp */}
                <div className="text-[11px] sm:text-xs font-mono text-white/90 font-medium select-none">
                  <span>{formatVideoDuration(currentTime)}</span>
                  <span className="text-white/40 mx-1">/</span>
                  <span className="text-white/70">{formatVideoDuration(duration)}</span>
                </div>
              </div>

              {/* Right group: Volume, Fullscreen, and optional standalone ... menu */}
              <div className="relative flex items-center gap-1 sm:gap-1.5">
                {/* Volume / Mute */}
                <button
                  type="button"
                  onClick={toggleMute}
                  className="p-1.5 sm:p-2 rounded-full hover:bg-white/15 active:scale-95 text-white transition-all cursor-pointer"
                  title={isMuted ? 'Activer le son' : 'Couper le son'}
                  aria-label={isMuted ? 'Son coupé' : 'Son activé'}
                >
                  {isMuted ? (
                    <VolumeX className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-rose-400" />
                  ) : (
                    <Volume2 className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                  )}
                </button>

                {/* Fullscreen Trigger */}
                {onOpenFullscreen && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenFullscreen();
                    }}
                    className="p-1.5 sm:p-2 rounded-full hover:bg-white/15 active:scale-95 text-white transition-all cursor-pointer"
                    title="Plein écran"
                    aria-label="Plein écran"
                  >
                    <Maximize2 className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                  </button>
                )}

                {/* Standalone ... menu if not handled by parent (e.g. outside MobilePhotoViewer) */}
                {!hideExtraMenu && !compact && (
                  <div className="relative">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowStandaloneMenu((prev) => !prev);
                      }}
                      className="p-1.5 sm:p-2 rounded-full hover:bg-white/15 active:scale-95 text-white transition-all cursor-pointer"
                      title="Plus d'options"
                      aria-label="Plus d'options"
                    >
                      <MoreVertical className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                    </button>

                    <AnimatePresence>
                      {showStandaloneMenu && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95, y: 8 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95, y: 8 }}
                          onClick={(e) => e.stopPropagation()}
                          className="absolute right-0 bottom-full mb-2 w-48 rounded-xl bg-stone-900/95 backdrop-blur-md border border-white/15 p-2 shadow-2xl z-50 text-white text-xs space-y-1"
                        >
                          <div className="px-2 py-1 text-[10px] text-white/50 uppercase tracking-wider font-semibold">
                            Options vidéo
                          </div>

                          {/* Loop toggle */}
                          <button
                            type="button"
                            onClick={(e) => {
                              toggleLoop(e);
                              setShowStandaloneMenu(false);
                            }}
                            className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                          >
                            <span className="flex items-center gap-2">
                              <Repeat className="w-3.5 h-3.5 text-rose-400" />
                              <span>Répéter en boucle</span>
                            </span>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded ${isLooping ? 'bg-rose-500/40 text-rose-200' : 'text-white/40'}`}>
                              {isLooping ? 'Oui' : 'Non'}
                            </span>
                          </button>

                          {/* Speed cycle */}
                          <button
                            type="button"
                            onClick={(e) => cyclePlaybackRate(e)}
                            className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                          >
                            <span className="flex items-center gap-2">
                              <Sliders className="w-3.5 h-3.5 text-rose-400" />
                              <span>Vitesse de lecture</span>
                            </span>
                            <span className="text-[11px] font-mono font-bold text-rose-300">
                              {playbackRate}x
                            </span>
                          </button>

                          {/* Download */}
                          {resolvedSrc && (
                            <a
                              href={resolvedSrc}
                              download="souvenir-video.mp4"
                              target="_blank"
                              rel="noreferrer"
                              onClick={() => setShowStandaloneMenu(false)}
                              className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer text-white"
                            >
                              <Download className="w-3.5 h-3.5 text-rose-400" />
                              <span>Télécharger la vidéo</span>
                            </a>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
