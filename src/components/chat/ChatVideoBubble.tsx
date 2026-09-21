import React, { useState, useEffect } from 'react';
import { Maximize2, Download, Video } from 'lucide-react';
import { ChatMessage } from '../../types';
import { formatVideoDuration, resolveMediaUrl } from '../../lib/videoUtils';
import { SleekLoveVideoPlayer } from '../SleekLoveVideoPlayer';

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
  const [showOverlay, setShowOverlay] = useState(true);
  const [downloadHref, setDownloadHref] = useState<string>('');
  const rawUrl = message.videoUrl || message.mediaUrl || '';

  useEffect(() => {
    if (!rawUrl) return;
    resolveMediaUrl(rawUrl).then((resolved) => {
      if (resolved) setDownloadHref(resolved);
    });
  }, [rawUrl]);

  const formattedDuration = message.videoDuration
    ? formatVideoDuration(message.videoDuration)
    : null;

  return (
    <div className="rounded-2xl overflow-hidden mb-2 relative group/video border border-white/20 shadow-md bg-black max-w-[290px] sm:max-w-[340px]">
      {/* Sleek Custom Video Player */}
      <div
        className="relative aspect-video w-full bg-black flex items-center justify-center overflow-hidden cursor-pointer"
        style={{ width: '100%', objectFit: 'contain' }}
        onClick={(e) => {
          if (onOpenFullscreen) {
            e.stopPropagation();
            onOpenFullscreen();
          }
        }}
      >
        <SleekLoveVideoPlayer
          src={rawUrl}
          poster={message.videoThumbnail}
          compact={true}
          onOpenFullscreen={onOpenFullscreen}
          onControlsVisibilityChange={setShowOverlay}
          className="w-full h-full object-contain"
        />

        {/* Top Badges (Duration & Video type) */}
        <div
          className={`absolute top-2 left-2 flex items-center gap-1.5 pointer-events-none z-20 transition-opacity duration-300 ${
            showOverlay ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-black/60 backdrop-blur-md text-white border border-white/20 flex items-center gap-1 shadow-xs">
            <Video className="w-3 h-3 text-purple-300" />
            <span>{formattedDuration || 'Vidéo'}</span>
          </span>
        </div>

        {/* Top Right Quick Actions */}
        <div
          className={`absolute top-2 right-2 flex items-center gap-1 z-20 transition-opacity duration-300 ${
            showOverlay ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
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

          {(downloadHref || rawUrl) && (
            <a
              href={downloadHref || rawUrl}
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
