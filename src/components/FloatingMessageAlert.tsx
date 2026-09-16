import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquareHeart, X, ArrowRight } from 'lucide-react';
import { PartnerAvatar } from './PartnerAvatar';
import { PartnerId, CoupleProfile } from '../types';

export interface FloatingAlertData {
  id: string;
  senderId: PartnerId;
  senderName: string;
  senderAvatar?: string;
  content: string;
  mediaType?: 'image' | 'audio';
  timestamp: string;
}

interface FloatingMessageAlertProps {
  alert: FloatingAlertData | null;
  profile: CoupleProfile;
  onOpenChat: () => void;
  onDismiss: () => void;
}

export const FloatingMessageAlert: React.FC<FloatingMessageAlertProps> = ({
  alert,
  profile,
  onOpenChat,
  onDismiss,
}) => {
  useEffect(() => {
    if (!alert) return;
    const timer = setTimeout(() => {
      onDismiss();
    }, 7000);
    return () => clearTimeout(timer);
  }, [alert, onDismiss]);

  if (!alert) return null;

  const partner = alert.senderId === 'p1' ? profile.partner1 : profile.partner2;

  let preview = alert.content || 'Nouveau mot doux reçu';
  if (alert.mediaType === 'image') {
    preview = '📷 Vous a envoyé une photo';
  } else if (alert.mediaType === 'audio') {
    preview = '🎵 Vous a envoyé un message vocal';
  }

  return (
    <AnimatePresence>
      <div className="fixed top-3 inset-x-3 sm:inset-x-auto sm:right-6 sm:w-96 z-50 pointer-events-auto">
        <motion.div
          initial={{ opacity: 0, y: -25, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          className="bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-rose-200 p-3 sm:p-3.5 flex items-center justify-between gap-3 cursor-pointer hover:shadow-2xl transition-all group"
          onClick={onOpenChat}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative shrink-0">
              <PartnerAvatar
                name={partner.name}
                avatar={partner.avatar}
                partnerId={alert.senderId}
                size="md"
                className="border-2 border-rose-400"
              />
              <span className="absolute -bottom-1 -right-1 bg-rose-500 text-white p-0.5 rounded-full ring-2 ring-white">
                <MessageSquareHeart className="w-2.5 h-2.5" />
              </span>
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-rose-950 truncate">{partner.name}</span>
                <span className="text-[10px] text-stone-400">• À l'instant</span>
              </div>
              <p className="text-xs text-stone-700 font-medium truncate mt-0.5">{preview}</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onOpenChat();
              }}
              className="py-1 px-2.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-medium flex items-center gap-1 transition-transform active:scale-95 shadow-xs"
            >
              <span>Répondre</span>
              <ArrowRight className="w-3 h-3" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDismiss();
              }}
              className="p-1 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
