import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  RotateCcw,
  RotateCw,
  Maximize2,
  Minimize2,
  Repeat,
  Sparkles,
  Heart,
  FastForward,
  AlertCircle,
  Film,
} from 'lucide-react';
import { resolveMediaUrl, formatVideoDuration } from '../lib/videoUtils';

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
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [isLooping, setIsLooping] = useState<boolean>(loop);
  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const [showControls, setShowControls] = useState<boolean>(true);
  const [isEnded, setIsEnded] = useState<boolean>(false);
  const [skipFeedback, setSkipFeedback] = useState<{ type: 'rewind' | 'forward'; id: number } | null>(null);
  const [centerAnimation, setCenterAnimation] = useState<'play' | 'pause' | null>(null);
  const [isScrubbing, setIsScrubbing] = useState<boolean>(false);

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
  const resetHideTimer = useCallback(() => {
    setShowControls(true);
    if (hideControlsTimerRef.current) {
      clearTimeout(hideControlsTimerRef.current);
    }
    if (isPlaying && !isScrubbing) {
      hideControlsTimerRef.current = setTimeout(() => {
        setShowControls(false);
      }, compact ? 2200 : 3000);
    }
  }, [isPlaying, isScrubbing, compact]);

  useEffect(() => {
    if (isPlaying && !isScrubbing) {
      resetHideTimer();
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
          setIsMuted(true);
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

  // Double tap / Click handler for mobile & desktop
  const handleStageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // If clicking directly on controls, ignore
    const target = e.target as HTMLElement;
    if (target.closest('.video-controls-bar')) return;

    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) {
      togglePlay();
      return;
    }

    const clickX = e.clientX - rect.left;
    const width = rect.width;
    const now = Date.now();
    const timeSinceLastTap = now - lastTapTimeRef.current;

    // Detect double tap (< 300ms)
    if (timeSinceLastTap < 300) {
      if (tapTimeoutRef.current) clearTimeout(tapTimeoutRef.current);
      lastTapTimeRef.current = 0;

      // Check if left third (-5s) or right third (+5s)
      if (clickX < width * 0.35) {
        seekRelative(-5);
      } else if (clickX > width * 0.65) {
        seekRelative(5);
      } else {
        togglePlay();
      }
    } else {
      lastTapTimeRef.current = now;
      tapTimeoutRef.current = setTimeout(() => {
        // Single tap: toggle play or toggle controls visibility
        togglePlay();
      }, 250);
    }
  };

  // Toggle Mute
  const toggleMute = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!videoRef.current) return;
    const nextMuted = !videoRef.current.muted;
    videoRef.current.muted = nextMuted;
    setIsMuted(nextMuted);
    resetHideTimer();
  };

  // Toggle Speed
  const cyclePlaybackRate = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!videoRef.current) return;
    const rates = [1, 1.25, 1.5, 2, 0.75];
    const nextIndex = (rates.indexOf(playbackRate) + 1) % rates.length;
    const nextRate = rates[nextIndex];
    videoRef.current.playbackRate = nextRate;
    setPlaybackRate(nextRate);
    resetHideTimer();
  };

  // Toggle Loop
  const toggleLoop = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!videoRef.current) return;
    const nextLoop = !isLooping;
    videoRef.current.loop = nextLoop;
    setIsLooping(nextLoop);
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
      onMouseMove={resetHideTimer}
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
              setDuration(videoRef.current.duration || 0);
            }
          }}
          onTimeUpdate={() => {
            if (!isScrubbing && videoRef.current) {
              setCurrentTime(videoRef.current.currentTime);
            }
          }}
          onPlay={() => {
            setIsPlaying(true);
            setIsEnded(false);
          }}
          onPause={() => setIsPlaying(false)}
          onEnded={() => {
            setIsPlaying(false);
            setIsEnded(true);
            setShowControls(true);
            if (onEnded) onEnded();
          }}
          onWaiting={() => setIsLoading(true)}
          onPlaying={() => setIsLoading(false)}
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

      {/* Center Icon Flash (Play / Pause feedback) */}
      <AnimatePresence>
        {centerAnimation && (
          <motion.div
            key={centerAnimation}
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1.15 }}
            exit={{ opacity: 0, scale: 1.4 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none z-30"
          >
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-black/65 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shadow-2xl">
              {centerAnimation === 'play' ? (
                <Play className="w-8 h-8 sm:w-10 sm:h-10 fill-white text-white ml-1" />
              ) : (
                <Pause className="w-8 h-8 sm:w-10 sm:h-10 fill-white text-white" />
              )}
            </div>
          </motion.div>
        )}
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

      {/* Big Play Button Overlay when paused initially */}
      {!isPlaying && !isEnded && !isLoading && (
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
        {(showControls || !isPlaying || isEnded) && (
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

            {/* Bottom Actions Row */}
            <div className="flex items-center justify-between gap-2 text-white">
              {/* Left group: Play/Pause, -5s, +5s, Time */}
              <div className="flex items-center gap-1 sm:gap-2">
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

                {!compact && (
                  <>
                    <button
                      type="button"
                      onClick={() => seekRelative(-5)}
                      className="p-1.5 rounded-full hover:bg-white/15 active:scale-95 text-white/90 hover:text-white transition-all cursor-pointer hidden sm:flex"
                      title="Reculer de 5s"
                      aria-label="Reculer de 5s"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => seekRelative(5)}
                      className="p-1.5 rounded-full hover:bg-white/15 active:scale-95 text-white/90 hover:text-white transition-all cursor-pointer hidden sm:flex"
                      title="Avancer de 5s"
                      aria-label="Avancer de 5s"
                    >
                      <RotateCw className="w-4 h-4" />
                    </button>
                  </>
                )}

                {/* Duration / Timestamp */}
                <div className="text-[11px] sm:text-xs font-mono text-white/90 font-medium pl-1">
                  <span>{formatVideoDuration(currentTime)}</span>
                  <span className="text-white/40 mx-1">/</span>
                  <span className="text-white/70">{formatVideoDuration(duration)}</span>
                </div>
              </div>

              {/* Right group: Volume, Speed, Loop, Fullscreen */}
              <div className="flex items-center gap-1 sm:gap-1.5">
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

                {/* Speed toggle */}
                <button
                  type="button"
                  onClick={cyclePlaybackRate}
                  className="px-2 py-0.5 rounded-full hover:bg-white/15 active:scale-95 text-[10px] sm:text-xs font-mono font-bold text-white/90 hover:text-white border border-white/20 transition-all cursor-pointer"
                  title="Vitesse de lecture"
                >
                  {playbackRate}x
                </button>

                {/* Loop toggle */}
                {!compact && (
                  <button
                    type="button"
                    onClick={toggleLoop}
                    className={`p-1.5 rounded-full transition-all cursor-pointer ${
                      isLooping
                        ? 'bg-rose-500/30 text-rose-400 border border-rose-500/40'
                        : 'hover:bg-white/15 text-white/80 hover:text-white'
                    }`}
                    title={isLooping ? 'Boucle activée' : 'Activer la boucle'}
                  >
                    <Repeat className="w-3.5 h-3.5" />
                  </button>
                )}

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
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
