import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Volume2, AlertCircle } from 'lucide-react';
import { ChatMessage } from '../../types';
import { formatAudioTime } from '../../lib/audioRecorderUtils';

interface ChatAudioBubbleProps {
  message: ChatMessage;
  isMe: boolean;
  chatTheme?: string;
  onPlayStateChange?: (isPlaying: boolean) => void;
}

export const ChatAudioBubble: React.FC<ChatAudioBubbleProps> = ({
  message,
  isMe,
  chatTheme,
  onPlayStateChange,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState<number>(message.audioDuration || 0);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [loadError, setLoadError] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const rawSrc = message.mediaUrl || '';

  // Clean up audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
        audioRef.current = null;
      }
    };
  }, []);

  // Update duration if message prop has it
  useEffect(() => {
    if (message.audioDuration && (!duration || duration === 0)) {
      setDuration(message.audioDuration);
    }
  }, [message.audioDuration, duration]);

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!rawSrc) return;

    if (!audioRef.current) {
      const audio = new Audio();
      // iOS / WebKit compatibility settings
      audio.preload = 'metadata';
      audio.crossOrigin = 'anonymous';
      audio.src = rawSrc;
      audio.playbackRate = playbackSpeed;

      audio.onloadedmetadata = () => {
        if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
          setDuration(Math.round(audio.duration));
        }
      };

      audio.ontimeupdate = () => {
        setCurrentTime(audio.currentTime);
        if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
          setDuration(Math.round(audio.duration));
        }
      };

      audio.onended = () => {
        setIsPlaying(false);
        setCurrentTime(0);
        onPlayStateChange?.(false);
      };

      audio.onerror = (err) => {
        console.warn('Erreur lecture audio:', err);
        setLoadError(true);
        setIsPlaying(false);
        onPlayStateChange?.(false);
      };

      audioRef.current = audio;
    }

    const audio = audioRef.current;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
      onPlayStateChange?.(false);
    } else {
      audio.playbackRate = playbackSpeed;
      audio
        .play()
        .then(() => {
          setIsPlaying(true);
          setLoadError(false);
          onPlayStateChange?.(true);
        })
        .catch((err) => {
          console.warn('Lecture bloquée par le navigateur (autoplay policy):', err);
          setIsPlaying(false);
          onPlayStateChange?.(false);
        });
    }
  };

  const handleSpeedToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    const speeds = [1, 1.5, 2];
    const currentIndex = speeds.indexOf(playbackSpeed);
    const nextSpeed = speeds[(currentIndex + 1) % speeds.length];
    setPlaybackSpeed(nextSpeed);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextSpeed;
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (!audioRef.current || duration <= 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    const targetTime = ratio * duration;
    audioRef.current.currentTime = targetTime;
    setCurrentTime(targetTime);
  };

  // 16 waveform bar height ratios for visual rhythm
  const waveformBars = [30, 60, 45, 85, 40, 95, 70, 50, 80, 100, 65, 90, 55, 75, 40, 60];

  const progressRatio = duration > 0 ? Math.min(1, currentTime / duration) : 0;

  if (loadError) {
    return (
      <div className="flex items-center gap-2 py-1.5 px-2 text-xs text-rose-200">
        <AlertCircle className="w-4 h-4 text-amber-300 shrink-0" />
        <span>Format audio non lisible sur cet appareil.</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2.5 sm:gap-3 py-1 px-0.5 min-w-[220px] sm:min-w-[270px]">
      {/* Play/Pause Main Button */}
      <button
        type="button"
        onClick={togglePlay}
        className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-xs active:scale-95 shrink-0 ${
          isMe
            ? isPlaying
              ? 'bg-white text-rose-600 shadow-md scale-105'
              : 'bg-white text-rose-600 hover:bg-rose-50'
            : isPlaying
            ? 'bg-rose-600 text-white shadow-md scale-105'
            : 'bg-rose-500 hover:bg-rose-600 text-white'
        }`}
        title={isPlaying ? 'Mettre en pause' : 'Écouter le message vocal'}
        aria-label={isPlaying ? 'Mettre en pause' : 'Écouter'}
      >
        {isPlaying ? (
          <Pause className="w-5 h-5 fill-current" />
        ) : (
          <Play className="w-5 h-5 fill-current ml-0.5" />
        )}
      </button>

      {/* Interactive Waveform & Scrubbing */}
      <div className="flex-1 min-w-0">
        <div
          onClick={handleSeek}
          className="flex items-center gap-[2.5px] sm:gap-[3px] h-7 cursor-pointer py-1 group/wave relative"
          title="Cliquer pour avancer dans le vocal"
        >
          {waveformBars.map((baseH, idx) => {
            const barRatio = idx / waveformBars.length;
            const isPlayed = barRatio <= progressRatio;

            return (
              <div
                key={idx}
                className={`flex-1 rounded-full transition-all duration-150 ${
                  isMe
                    ? isPlayed
                      ? 'bg-white'
                      : 'bg-white/40 group-hover/wave:bg-white/60'
                    : isPlayed
                    ? 'bg-rose-500'
                    : chatTheme === 'velvet-night'
                    ? 'bg-slate-700 group-hover/wave:bg-slate-600'
                    : 'bg-rose-200 group-hover/wave:bg-rose-300'
                } ${isPlaying && isPlayed ? 'scale-y-110' : ''}`}
                style={{
                  height: isPlaying
                    ? `${Math.min(100, Math.max(25, baseH * (0.8 + 0.4 * Math.sin((currentTime * 8) + idx))))}%`
                    : `${baseH}%`,
                }}
              />
            );
          })}
        </div>

        {/* Timers & Speed controller */}
        <div
          className={`flex items-center justify-between text-[11px] font-medium leading-none ${
            isMe ? 'text-white/95' : 'text-stone-600 dark:text-slate-400'
          }`}
        >
          <span className="font-mono tabular-nums tracking-tight">
            {isPlaying || currentTime > 0
              ? `${formatAudioTime(currentTime)} / ${formatAudioTime(duration)}`
              : formatAudioTime(duration || message.audioDuration || 0)}
          </span>

          {/* Speed Toggle (1x, 1.5x, 2x) */}
          <button
            type="button"
            onClick={handleSpeedToggle}
            className={`font-bold text-[10px] sm:text-[10.5px] px-2 py-0.5 rounded-full cursor-pointer transition-all active:scale-90 ${
              isMe
                ? 'text-white bg-white/20 hover:bg-white/30'
                : 'text-rose-700 bg-rose-100 hover:bg-rose-200 dark:text-rose-300 dark:bg-slate-800'
            }`}
            title="Modifier la vitesse de lecture"
          >
            {playbackSpeed}x
          </button>
        </div>
      </div>
    </div>
  );
};
