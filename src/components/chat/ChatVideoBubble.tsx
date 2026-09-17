import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Maximize2, Download, Video, AlertCircle } from 'lucide-react';
import { ChatMessage } from '../../types';
import { resolveMediaUrl, formatVideoDuration } from '../../lib/videoUtils';

interface ChatVideoBubbleProps {
  message: ChatMessage;
  onOpenFullscreen?: () => void;
  isMe: boolean;
  chatTheme?: string;
}

export const ChatVideoBubble: React.FC<ChatVideoBubbleProps> = ({
  message,
  onOpenFullscreen,
  isMe,
  chatTheme,
}) => {
  const [resolvedSrc, setResolvedSrc] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hasError, setHasError] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const rawUrl = message.videoUrl || message.mediaUrl || '';

  useEffect(() => {
    let isMounted = true;
    if (!rawUrl) {
      setIsLoading(false);
      setHasError(true);
      return;
    }

    setIsLoading(true);
    setHasError(false);

    resolveMediaUrl(rawUrl)
      .then((url) => {
        if (isMounted) {
          setResolvedSrc(url);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        console.error('Erreur chargement vidéo:', err);
        if (isMounted) {
          setHasError(true);
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [rawUrl]);

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!videoRef.current) return;

    if (videoRef.current.paused) {
      videoRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => {});
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const formattedDuration = message.videoDuration
    ? formatVideoDuration(message.videoDuration)
    : null;

  return (
    <div className="rounded-2xl overflow-hidden mb-2 relative group/video border border-white/20 shadow-md bg-black/40 max-w-[290px] sm:max-w-[340px]">
      {/* Video Player */}
      <div className="relative aspect-video w-full bg-black/90 flex items-center justify-center overflow-hidden">
        {hasError ? (
          <div className="p-4 text-center text-rose-300 text-xs flex flex-col items-center gap-1.5">
            <AlertCircle className="w-5 h-5" />
            <span>Vidéo indisponible ou expirée</span>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              src={resolvedSrc || undefined}
              poster={message.videoThumbnail}
              preload="metadata"
              playsInline
              controls={isPlaying}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onEnded={() => setIsPlaying(false)}
              className="w-full h-full object-contain cursor-pointer"
              onClick={togglePlay}
            />

            {/* Play Button Overlay when paused */}
            {!isPlaying && (
              <div
                onClick={togglePlay}
                className="absolute inset-0 bg-black/30 hover:bg-black/40 backdrop-blur-xs flex items-center justify-center cursor-pointer transition-all"
              >
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-rose-600/90 hover:bg-rose-600 text-white flex items-center justify-center shadow-xl border border-white/40 transform transition-transform group-hover/video:scale-110 active:scale-95">
                  <Play className="w-6 h-6 fill-white text-white ml-0.5" />
                </div>
              </div>
            )}
          </>
        )}

        {/* Top Badges (Duration & Video type) */}
        <div className="absolute top-2 left-2 flex items-center gap-1.5 pointer-events-none z-10">
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-black/60 backdrop-blur-md text-white border border-white/20 flex items-center gap-1">
            <Video className="w-3 h-3 text-purple-300" />
            <span>{formattedDuration || 'Vidéo'}</span>
          </span>
        </div>

        {/* Top Right Quick Actions */}
        <div className="absolute top-2 right-2 flex items-center gap-1 z-10">
          {onOpenFullscreen && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenFullscreen();
              }}
              className="p-1.5 rounded-full bg-black/60 hover:bg-black/80 active:scale-95 text-white backdrop-blur-md transition-all cursor-pointer border border-white/20 shadow-md"
              title="Agrandir en plein écran"
              aria-label="Plein écran"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          )}

          {resolvedSrc && (
            <a
              href={resolvedSrc}
              download="video-souvenir.mp4"
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="p-1.5 rounded-full bg-black/60 hover:bg-black/80 active:scale-95 text-white backdrop-blur-md transition-all cursor-pointer border border-white/20 shadow-md"
              title="Télécharger la vidéo"
              aria-label="Télécharger"
            >
              <Download className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
};
