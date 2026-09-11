import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, Sparkles, X, MessageCircleHeart } from 'lucide-react';
import { MissYouPulse, Partner } from '../types';
import { soundEffects } from '../lib/audio';
import { PartnerAvatar } from './PartnerAvatar';

interface MissYouModalProps {
  lastPulse: MissYouPulse | null;
  sender: Partner;
  receiver: Partner;
  onClose: () => void;
  onSendBack: (vibe: MissYouPulse['vibe'], msg: string) => void;
}

export const MissYouModal: React.FC<MissYouModalProps> = ({
  lastPulse,
  sender,
  receiver,
  onClose,
  onSendBack,
}) => {
  const [floatingHearts, setFloatingHearts] = useState<Array<{ id: number; left: number; delay: number; scale: number }>>([]);

  useEffect(() => {
    if (lastPulse) {
      soundEffects.playHeartPulse();
      // Generate bursts of floating hearts
      const hearts = Array.from({ length: 14 }).map((_, i) => ({
        id: i,
        left: Math.random() * 80 + 10,
        delay: Math.random() * 0.8,
        scale: Math.random() * 0.5 + 0.8,
      }));
      setFloatingHearts(hearts);
    }
  }, [lastPulse]);

  if (!lastPulse) return null;

  const vibesMap = {
    hug: { label: 'Câlin télépathique', emoji: '🧸', bg: 'from-amber-500 to-rose-500' },
    kiss: { label: 'Pluie de baisers', emoji: '💋', bg: 'from-rose-500 to-pink-600' },
    thought: { label: 'Pensée magique', emoji: '✨', bg: 'from-purple-500 to-indigo-600' },
    flame: { label: 'Flamme d\'amour', emoji: '🔥', bg: 'from-orange-500 to-red-600' },
    urgent: { label: 'Étreinte urgente', emoji: '💖', bg: 'from-rose-600 to-pink-600' },
  };

  const currentVibe = vibesMap[lastPulse.vibe] || vibesMap.hug;

  return (
    <div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center p-4">
      {/* Floating hearts particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {floatingHearts.map((heart) => (
          <div
            key={heart.id}
            className="absolute bottom-10 floating-heart text-2xl text-rose-500 select-none"
            style={{
              left: `${heart.left}%`,
              animationDelay: `${heart.delay}s`,
              transform: `scale(${heart.scale})`,
            }}
          >
            ❤️
          </div>
        ))}
      </div>

      {/* Floating Card popup */}
      <motion.div
        initial={{ opacity: 0, scale: 0.7, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.8, y: 20 }}
        className="pointer-events-auto bg-white/95 backdrop-blur-xl border border-rose-200 rounded-3xl p-6 shadow-2xl max-w-sm w-full text-center relative overflow-hidden ring-4 ring-rose-300/30"
      >
        <button
          onClick={onClose}
          className="absolute top-3.5 right-3.5 text-stone-400 hover:text-stone-700 p-1.5 rounded-full hover:bg-stone-100 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Sender Avatar with Heart Aura */}
        <div className="relative inline-block mb-3">
          <div className="absolute -inset-2 bg-gradient-to-r from-rose-400 to-pink-400 rounded-full blur-md opacity-70 animate-pulse" />
          <div className="relative z-10 mx-auto">
            <PartnerAvatar
              name={sender.name}
              avatar={sender.avatar}
              partnerId={sender.id}
              size="xl"
              className="border-4 border-white shadow-md mx-auto"
            />
          </div>
          <div className="absolute -bottom-1 -right-1 z-20 w-7 h-7 bg-rose-500 rounded-full flex items-center justify-center text-sm text-white shadow-sm">
            {currentVibe.emoji}
          </div>
        </div>

        <h3 className="font-serif-romantic text-xl font-bold text-stone-900">
          {sender.name} pense fort à toi !
        </h3>

        <div className="my-2.5 px-3 py-2 bg-rose-50 rounded-2xl border border-rose-100/80">
          <p className="text-sm font-medium text-rose-900 italic">
            « {lastPulse.message} »
          </p>
        </div>

        <p className="text-xs text-stone-500 mb-4">
          Onde d'amour envoyée à l'instant • {lastPulse.timestamp}
        </p>

        {/* Quick Send Back */}
        <div className="space-y-1.5 pt-2 border-t border-rose-100">
          <p className="text-xs font-semibold text-stone-700 mb-2 flex items-center justify-center gap-1">
            <MessageCircleHeart className="w-3.5 h-3.5 text-rose-500" />
            <span>Répondre à {sender.name} :</span>
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                onSendBack('hug', 'Moi aussi je t\'aime fort ! Gros câlin 🧸');
                onClose();
              }}
              className="px-2.5 py-2 text-xs font-medium bg-rose-50 hover:bg-rose-100 text-rose-800 rounded-xl transition-colors text-left flex items-center gap-1.5"
            >
              <span>🧸</span>
              <span className="truncate">Gros câlin</span>
            </button>
            <button
              onClick={() => {
                onSendBack('kiss', 'Pluie de bisous doux pour toi 💋');
                onClose();
              }}
              className="px-2.5 py-2 text-xs font-medium bg-pink-50 hover:bg-pink-100 text-pink-800 rounded-xl transition-colors text-left flex items-center gap-1.5"
            >
              <span>💋</span>
              <span className="truncate">Doux baisers</span>
            </button>
            <button
              onClick={() => {
                onSendBack('thought', 'Hâte de te retrouver ce soir ✨');
                onClose();
              }}
              className="px-2.5 py-2 text-xs font-medium bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-xl transition-colors text-left flex items-center gap-1.5"
            >
              <span>✨</span>
              <span className="truncate">Hâte de ce soir</span>
            </button>
            <button
              onClick={() => {
                onSendBack('flame', 'Mon cœur est avec toi partout ❤️');
                onClose();
              }}
              className="px-2.5 py-2 text-xs font-medium bg-purple-50 hover:bg-purple-100 text-purple-800 rounded-xl transition-colors text-left flex items-center gap-1.5"
            >
              <span>❤️</span>
              <span className="truncate">Toujours avec toi</span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
