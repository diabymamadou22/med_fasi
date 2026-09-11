import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Volume2,
  VolumeX,
  Play,
  Pause,
  Music,
  ChevronUp,
  ChevronDown,
  Sparkles,
  Heart,
  Sliders,
} from 'lucide-react';
import { AmbientTrackId, CoupleSettings } from '../types';
import { romanticAmbientEngine } from '../lib/audio';

interface RomanticMusicBarProps {
  settings: CoupleSettings;
  onUpdateSettings: (newSettings: Partial<CoupleSettings>) => void;
}

const TRACK_LABELS: Record<AmbientTrackId, { name: string; subtitle: string; icon: string }> = {
  kora_serenade: {
    name: 'Kora & Sérénade Malienne',
    subtitle: 'Arpèges doux et mélodieux',
    icon: '🪕',
  },
  river_breeze: {
    name: 'Brise douce sur le Djoliba',
    subtitle: 'Ondes apaisantes du fleuve Niger',
    icon: '🌊',
  },
  starry_night: {
    name: 'Nuit Étoilée & Piano',
    subtitle: 'Harmonies romantiques nocturnes',
    icon: '✨',
  },
  soft_rain: {
    name: 'Pluie Douce & Cocooning',
    subtitle: 'Ambiance intime et chaleureuse',
    icon: '🌧️',
  },
  none: {
    name: 'Silence & Calme',
    subtitle: 'Aucune musique de fond',
    icon: '🔇',
  },
};

export const RomanticMusicBar: React.FC<RomanticMusicBarProps> = ({
  settings,
  onUpdateSettings,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(settings.isMusicPlaying);
  const [volume, setVolume] = useState(settings.musicVolume);

  // Sync engine when settings change
  useEffect(() => {
    if (settings.isMusicPlaying && settings.ambientTrackId !== 'none') {
      romanticAmbientEngine.setVolume(settings.musicVolume);
      romanticAmbientEngine.start(settings.ambientTrackId, settings.songAudioUrl);
      setIsPlaying(true);
    } else {
      romanticAmbientEngine.stop();
      setIsPlaying(false);
    }
  }, [settings.ambientTrackId, settings.isMusicPlaying, settings.songAudioUrl]);

  const handleTogglePlay = () => {
    const nextState = !isPlaying;
    setIsPlaying(nextState);
    onUpdateSettings({ isMusicPlaying: nextState });
    if (nextState) {
      romanticAmbientEngine.setVolume(volume);
      romanticAmbientEngine.start(settings.ambientTrackId, settings.songAudioUrl);
    } else {
      romanticAmbientEngine.stop();
    }
  };

  const handleSelectTrack = (trackId: AmbientTrackId) => {
    onUpdateSettings({
      ambientTrackId: trackId,
      isMusicPlaying: trackId !== 'none',
    });
    if (trackId !== 'none') {
      romanticAmbientEngine.start(trackId, settings.songAudioUrl);
      setIsPlaying(true);
    } else {
      romanticAmbientEngine.stop();
      setIsPlaying(false);
    }
  };

  const handleVolumeChange = (newVol: number) => {
    setVolume(newVol);
    romanticAmbientEngine.setVolume(newVol);
    onUpdateSettings({ musicVolume: newVol });
  };

  const currentTrackInfo = TRACK_LABELS[settings.ambientTrackId] || TRACK_LABELS.kora_serenade;

  return (
    <div className="fixed bottom-20 sm:bottom-4 left-3 sm:left-4 z-30">
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.95 }}
            className="mb-2 p-3.5 bg-white/95 backdrop-blur-md rounded-2xl border border-rose-200/90 shadow-xl w-[calc(100vw-1.5rem)] sm:w-80 max-w-sm text-stone-800 space-y-3"
          >
            <div className="flex items-center justify-between pb-2 border-b border-rose-100">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-rose-100 text-rose-600">
                  <Music className="w-3.5 h-3.5" />
                </span>
                <div>
                  <h4 className="text-xs font-bold text-stone-900">
                    {settings.songTitle || 'Notre Ambiance Musicale'}
                  </h4>
                  <p className="text-[10px] text-stone-500">Mélodies romantiques générées en direct</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsExpanded(false)}
                className="text-stone-400 hover:text-stone-700 p-1"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>

            {/* Track choices */}
            <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
              {(Object.keys(TRACK_LABELS) as AmbientTrackId[]).map((tid) => {
                const info = TRACK_LABELS[tid];
                const active = settings.ambientTrackId === tid;
                return (
                  <button
                    key={tid}
                    type="button"
                    onClick={() => handleSelectTrack(tid)}
                    className={`w-full text-left px-2.5 py-1.5 rounded-xl text-xs flex items-center justify-between transition-all ${
                      active
                        ? 'bg-rose-500 text-white font-semibold shadow-2xs'
                        : 'hover:bg-stone-100 text-stone-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span>{info.icon}</span>
                      <div>
                        <p className="font-medium text-xs leading-tight">{info.name}</p>
                        <p
                          className={`text-[10px] ${
                            active ? 'text-rose-100' : 'text-stone-400'
                          }`}
                        >
                          {info.subtitle}
                        </p>
                      </div>
                    </div>
                    {active && isPlaying && (
                      <span className="flex items-center gap-0.5">
                        <span className="w-1 h-3 bg-white rounded-full animate-pulse" />
                        <span className="w-1 h-2 bg-white rounded-full animate-pulse delay-75" />
                        <span className="w-1 h-3.5 bg-white rounded-full animate-pulse delay-150" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Volume bar */}
            <div className="pt-2 border-t border-rose-100 flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleVolumeChange(volume > 0 ? 0 : 0.4)}
                className="text-stone-500 hover:text-rose-600 transition-colors"
                title={volume === 0 ? 'Activer le son' : 'Couper le son'}
              >
                {volume === 0 ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={volume}
                onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                className="w-full accent-rose-500 h-1.5 bg-stone-200 rounded-lg cursor-pointer"
              />
              <span className="text-[10px] text-stone-500 w-7 text-right font-medium">
                {Math.round(volume * 100)}%
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Mini Pill */}
      <div className="flex items-center bg-white/95 backdrop-blur-md border border-rose-200/90 rounded-full px-2.5 py-1.5 shadow-lg gap-2 text-stone-800 transition-all hover:shadow-xl">
        <button
          type="button"
          onClick={handleTogglePlay}
          className={`p-1.5 rounded-full transition-all cursor-pointer ${
            isPlaying
              ? 'bg-rose-500 text-white shadow-xs animate-pulse'
              : 'bg-stone-100 text-stone-700 hover:bg-rose-100 hover:text-rose-600'
          }`}
          title={isPlaying ? 'Mettre en pause' : 'Lancer notre musique'}
        >
          {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
        </button>

        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-1.5 text-left cursor-pointer group"
        >
          <span className="text-xs">{currentTrackInfo.icon}</span>
          <div className="hidden sm:block max-w-[130px] truncate">
            <p className="text-[11px] font-bold text-stone-800 truncate group-hover:text-rose-600 transition-colors">
              {currentTrackInfo.name}
            </p>
          </div>
          {isExpanded ? (
            <ChevronDown className="w-3.5 h-3.5 text-stone-400" />
          ) : (
            <ChevronUp className="w-3.5 h-3.5 text-stone-400" />
          )}
        </button>
      </div>
    </div>
  );
};
