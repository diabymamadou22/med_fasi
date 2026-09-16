import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, BellRing, Check, X, Sparkles, Volume2 } from 'lucide-react';
import { CoupleProfile, PartnerId } from '../types';
import {
  areNotificationsSupported,
  getNotificationPermission,
  subscribeToPushNotifications,
  isPushSubscribed,
} from '../lib/notificationService';
import { soundEffects } from '../lib/audio';

interface NotificationActivationBannerProps {
  profile: CoupleProfile;
  activePartnerId: PartnerId;
  onOpenSettingsModal?: () => void;
}

export const NotificationActivationBanner: React.FC<NotificationActivationBannerProps> = ({
  profile,
  activePartnerId,
  onOpenSettingsModal,
}) => {
  const [isDismissed, setIsDismissed] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState<boolean>(true); // assume true to prevent flash
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const otherPartner = activePartnerId === 'p1' ? profile.partner2 : profile.partner1;

  useEffect(() => {
    // Check local storage for dismissal
    const dismissedUntil = localStorage.getItem('nid_damour_notif_banner_dismissed_until');
    if (dismissedUntil && Number(dismissedUntil) > Date.now()) {
      setIsDismissed(true);
      return;
    }

    // Check actual permission & subscription
    const checkStatus = async () => {
      if (!areNotificationsSupported()) {
        setIsSubscribed(true); // Don't show if unsupported
        return;
      }
      const perm = getNotificationPermission();
      if (perm === 'granted') {
        const sub = await isPushSubscribed();
        setIsSubscribed(sub);
      } else {
        setIsSubscribed(false);
      }
    };
    checkStatus();
  }, [activePartnerId]);

  if (isDismissed || isSubscribed) return null;

  const handleQuickActivate = async () => {
    setLoading(true);
    try {
      const res = await subscribeToPushNotifications(activePartnerId);
      if (res.success) {
        soundEffects.playMessageReceived();
        setSuccess(true);
        setIsSubscribed(true);
        setTimeout(() => {
          setIsDismissed(true);
        }, 3000);
      } else {
        if (onOpenSettingsModal) {
          onOpenSettingsModal();
        }
      }
    } catch {
      if (onOpenSettingsModal) {
        onOpenSettingsModal();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = () => {
    // Dismiss for 24 hours
    localStorage.setItem(
      'nid_damour_notif_banner_dismissed_until',
      String(Date.now() + 24 * 60 * 60 * 1000)
    );
    setIsDismissed(true);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, height: 0 }}
        className="mx-3 sm:mx-6 my-2 bg-gradient-to-r from-rose-500/10 via-pink-500/10 to-amber-500/10 border border-rose-200/80 rounded-2xl p-2.5 sm:p-3 text-stone-800 shadow-xs"
      >
        <div className="flex items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-rose-500 text-white flex items-center justify-center shrink-0 shadow-xs">
              {success ? (
                <Check className="w-4 h-4 text-white" />
              ) : (
                <BellRing className="w-4 h-4 text-white animate-bounce" />
              )}
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm font-semibold text-rose-950 truncate">
                {success ? (
                  <span>✅ Alertes activées pour {otherPartner.name} !</span>
                ) : (
                  <span>Être alerté(e) quand {otherPartner.name} vous écrit</span>
                )}
              </p>
              <p className="text-[11px] text-stone-600 line-clamp-1">
                Recevez le son et la vibration même lorsque l'application ou l'écran est éteint.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {!success && (
              <button
                onClick={handleQuickActivate}
                disabled={loading}
                className="py-1.5 px-3 bg-rose-600 hover:bg-rose-700 text-white font-medium text-xs rounded-xl shadow-xs transition-transform active:scale-95 flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{loading ? 'Activation...' : 'Activer'}</span>
              </button>
            )}

            <button
              onClick={handleDismiss}
              className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-200/50 rounded-lg transition-colors"
              title="Masquer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
