import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Heart,
  X,
  Sparkles,
  Wifi,
  Radio,
  Fingerprint,
} from 'lucide-react';
import { CoupleProfile, PartnerId, LoveTouchSession } from '../../types';
import { soundEffects } from '../../lib/audio';
import { triggerHeartConfetti } from '../../lib/confetti';
import { subscribeLoveTouch, setLoveTouchStatus } from '../../lib/firestoreService';

interface LoveTouchModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: CoupleProfile;
  activePartnerId: PartnerId;
}

export const LoveTouchModal: React.FC<LoveTouchModalProps> = ({
  isOpen,
  onClose,
  profile,
  activePartnerId,
}) => {
  const [isMeTouching, setIsMeTouching] = useState(false);
  const [isOtherTouching, setIsOtherTouching] = useState(false);
  const [connectedSeconds, setConnectedSeconds] = useState(0);
  const [hasCelebratedFusion, setHasCelebratedFusion] = useState(false);

  const otherPartner = activePartnerId === 'p1' ? profile.partner2 : profile.partner1;
  const currentPartner = activePartnerId === 'p1' ? profile.partner1 : profile.partner2;

  const isBothTouching = isMeTouching && isOtherTouching;

  const channelRef = useRef<BroadcastChannel | null>(null);

  // Broadcast channel for multi-tab same-browser testing
  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        channelRef.current = new BroadcastChannel('nid_amour_touch_live');
        channelRef.current.onmessage = (event) => {
          if (event.data && typeof event.data === 'object') {
            const data = event.data as { partnerId: PartnerId; isTouching: boolean };
            if (data.partnerId !== activePartnerId) {
              setIsOtherTouching(Boolean(data.isTouching));
            }
          }
        };
      }
    } catch {}

    return () => {
      channelRef.current?.close();
    };
  }, [activePartnerId]);

  // Real-time Firestore subscription
  useEffect(() => {
    if (!isOpen) return;

    const unsub = subscribeLoveTouch((session) => {
      if (!session) return;
      if (activePartnerId === 'p1') {
        setIsOtherTouching(Boolean(session.p2Touching));
      } else {
        setIsOtherTouching(Boolean(session.p1Touching));
      }
    });

    return () => {
      unsub();
      // Ensure touch is released on unmount/close
      setLoveTouchStatus(activePartnerId, false).catch(() => {});
    };
  }, [isOpen, activePartnerId]);

  // Connected Timer & Haptics when both are touching
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    let pulseInterval: NodeJS.Timeout | null = null;

    if (isBothTouching) {
      if (!hasCelebratedFusion) {
        setHasCelebratedFusion(true);
        soundEffects.playHeartPulse();
        triggerHeartConfetti();
        try {
          if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
            navigator.vibrate([60, 80, 60, 100, 120]);
          }
        } catch {}
      }

      interval = setInterval(() => {
        setConnectedSeconds((prev) => prev + 1);
      }, 1000);

      pulseInterval = setInterval(() => {
        soundEffects.playHeartPulse();
        try {
          if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
            navigator.vibrate([40, 60, 40]);
          }
        } catch {}
      }, 1800);
    } else {
      setConnectedSeconds(0);
      setHasCelebratedFusion(false);
    }

    return () => {
      if (interval) clearInterval(interval);
      if (pulseInterval) clearInterval(pulseInterval);
    };
  }, [isBothTouching, hasCelebratedFusion]);

  // Touch start & end handlers
  const handleTouchStart = () => {
    setIsMeTouching(true);
    soundEffects.playSoftTap();

    try {
      channelRef.current?.postMessage({
        partnerId: activePartnerId,
        isTouching: true,
      });
    } catch {}

    setLoveTouchStatus(activePartnerId, true).catch(console.error);
  };

  const handleTouchEnd = () => {
    setIsMeTouching(false);

    try {
      channelRef.current?.postMessage({
        partnerId: activePartnerId,
        isTouching: false,
      });
    } catch {}

    setLoveTouchStatus(activePartnerId, false).catch(console.error);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-between p-4 sm:p-6 text-white select-none">
        {/* Top Header */}
        <div className="w-full max-w-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
            <span className="text-xs font-bold uppercase tracking-wider text-rose-300">
              Toucher Connecté en Direct
            </span>
          </div>

          <button
            onClick={() => {
              handleTouchEnd();
              onClose();
            }}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            title="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Central Visual Stage */}
        <div className="flex-1 flex flex-col items-center justify-center my-auto w-full max-w-md text-center relative">
          {/* Fusion Heart Burst when both touching */}
          <AnimatePresence>
            {isBothTouching && (
              <motion.div
                initial={{ scale: 0.4, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.4, opacity: 0 }}
                className="absolute z-20 flex flex-col items-center justify-center"
              >
                <div className="relative">
                  <div className="w-36 h-36 rounded-full bg-rose-500/30 blur-2xl animate-pulse" />
                  <Heart className="w-24 h-24 text-rose-500 fill-rose-500 animate-bounce drop-shadow-[0_0_25px_rgba(244,63,94,0.9)] absolute inset-0 m-auto" />
                </div>
                <div className="mt-6 px-4 py-2 rounded-full bg-rose-600/80 backdrop-blur-md text-white font-extrabold text-sm border border-rose-300/40 shadow-lg">
                  Connectés à l’unisson : {connectedSeconds}s ❤️
                </div>
                <p className="text-xs text-rose-200 mt-2 font-medium">
                  Vos deux cœurs battent ensemble à travers la distance.
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Interactive Touch Pad for Current User */}
          <div className="flex flex-col items-center justify-center gap-6 z-10">
            <div>
              <h2 className="font-serif-romantic text-2xl sm:text-3xl font-bold tracking-tight">
                {isBothTouching
                  ? 'Fusion Émotionnelle Active ✨'
                  : 'Posez & maintenez votre doigt'}
              </h2>
              <p className="text-stone-300 text-xs mt-1 max-w-xs mx-auto">
                {isBothTouching
                  ? 'Maintenez tous les deux vos doigts posés sur l’écran pour prolonger la pulsation.'
                  : `Dès que ${otherPartner.name} pose aussi son doigt, vos écrans vibrent à l'unisson.`}
              </p>
            </div>

            {/* Glowing Touch Target */}
            <div className="relative my-4">
              {/* Outer Pulsing Glow */}
              <div
                className={`w-40 h-40 sm:w-48 sm:h-48 rounded-full border-2 transition-all flex items-center justify-center relative ${
                  isMeTouching
                    ? 'border-rose-400 bg-rose-500/20 scale-105 shadow-[0_0_40px_rgba(244,63,94,0.5)]'
                    : 'border-rose-500/40 bg-white/5 hover:border-rose-400/70'
                }`}
              >
                {/* Fingerprint / Touch Pad Button */}
                <button
                  type="button"
                  onMouseDown={handleTouchStart}
                  onMouseUp={handleTouchEnd}
                  onMouseLeave={handleTouchEnd}
                  onTouchStart={(e) => {
                    e.preventDefault();
                    handleTouchStart();
                  }}
                  onTouchEnd={(e) => {
                    e.preventDefault();
                    handleTouchEnd();
                  }}
                  className={`w-28 h-28 sm:w-32 sm:h-32 rounded-full flex flex-col items-center justify-center transition-all cursor-pointer select-none ${
                    isMeTouching
                      ? 'bg-gradient-to-tr from-rose-600 to-pink-500 scale-95 shadow-inner'
                      : 'bg-white/10 hover:bg-white/15'
                  }`}
                >
                  <Fingerprint
                    className={`w-12 h-12 transition-all ${
                      isMeTouching ? 'text-white scale-110' : 'text-rose-400'
                    }`}
                  />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-rose-100 mt-1">
                    {isMeTouching ? 'Maintenu' : 'Poser le doigt'}
                  </span>
                </button>
              </div>

              {/* Status ripple around button */}
              {isMeTouching && !isBothTouching && (
                <div className="absolute inset-0 rounded-full border border-rose-400 animate-ping pointer-events-none" />
              )}
            </div>

            {/* Live indicators of both partners */}
            <div className="flex items-center gap-4 bg-white/10 px-4 py-2 rounded-2xl backdrop-blur-md text-xs">
              <div className="flex items-center gap-2">
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    isMeTouching ? 'bg-emerald-400 animate-pulse' : 'bg-stone-500'
                  }`}
                />
                <span className="font-semibold">{currentPartner.name} (Moi)</span>
              </div>

              <span className="text-white/40">•</span>

              <div className="flex items-center gap-2">
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    isOtherTouching ? 'bg-emerald-400 animate-pulse' : 'bg-stone-500'
                  }`}
                />
                <span className="font-semibold">
                  {otherPartner.name} {isOtherTouching ? 'touche l’écran !' : 'en attente...'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom instructions */}
        <div className="text-center text-[11px] text-stone-400 pb-2">
          <span>Conseil : Activez le vibreur de votre téléphone pour ressentir la pulsation cardiaque.</span>
        </div>
      </div>
    </AnimatePresence>
  );
};
