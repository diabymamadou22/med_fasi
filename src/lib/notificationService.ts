/**
 * Web Push & System Notification Service for Nid d'Amour
 * Handles system alert notifications, sound/vibration alerts,
 * and PWA App Icon Badging (navigator.setAppBadge).
 */

export interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  tab?: 'chat' | 'journal' | 'timeline' | 'gallery';
  silent?: boolean;
}

const NOTIFICATIONS_ENABLED_KEY = 'nid_damour_notifications_enabled';

/**
 * Check if the current browser / device supports Web Notifications
 */
export function areNotificationsSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

/**
 * Check if the current browser supports the App Badging API (PWA on home screen)
 */
export function isBadgingSupported(): boolean {
  return typeof navigator !== 'undefined' && 'setAppBadge' in navigator;
}

/**
 * Get current notification permission state
 */
export function getNotificationPermission(): NotificationPermission {
  if (!areNotificationsSupported()) return 'denied';
  return Notification.permission;
}

/**
 * Check if user has opted into notifications in the app settings
 */
export function areNotificationsUserEnabled(): boolean {
  if (!areNotificationsSupported()) return false;
  if (Notification.permission !== 'granted') return false;
  const saved = localStorage.getItem(NOTIFICATIONS_ENABLED_KEY);
  return saved === null ? true : saved === 'true';
}

/**
 * Save user opt-in / opt-out setting
 */
export function setNotificationsUserEnabled(enabled: boolean): void {
  localStorage.setItem(NOTIFICATIONS_ENABLED_KEY, enabled ? 'true' : 'false');
}

/**
 * Request permission from the user for notifications
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!areNotificationsSupported()) {
    console.warn('Notifications non supportées sur ce navigateur');
    return 'denied';
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      setNotificationsUserEnabled(true);
      // Send a sweet welcome notification
      sendWelcomeNotification();
    }
    return permission;
  } catch (err) {
    console.error('Erreur demande permission notifications:', err);
    return 'denied';
  }
}

/**
 * Send an initial confirmation notification
 */
function sendWelcomeNotification(): void {
  sendSystemNotification({
    title: "Nid d'Amour connecté ❤️",
    body: 'Les alertes d’amour sont actives ! Vous recevrez désormais vos messages même l’application fermée.',
    icon: '/app-icon.png',
    tag: 'welcome-notification',
  });
}

/**
 * Trigger mobile vibration pattern if supported
 */
export function triggerVibration(pattern: number | number[] = [150, 80, 150]): void {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate(pattern);
    } catch {
      // Ignore if device disallows
    }
  }
}

/**
 * Update the App Badge on the smartphone home screen icon (PWA)
 * and update the browser tab title with unread count
 */
export function updateAppBadge(unreadCount: number): void {
  // 1. Update native smartphone PWA icon badge
  if (isBadgingSupported()) {
    try {
      if (unreadCount > 0) {
        (navigator as any).setAppBadge(unreadCount).catch(() => {});
      } else {
        (navigator as any).clearAppBadge().catch(() => {});
      }
    } catch {
      // Ignore unsupported platforms
    }
  }

  // 2. Update document title for background browser tabs
  if (typeof document !== 'undefined') {
    const baseTitle = "Nid d'Amour - Espace Couple & Souvenirs";
    if (unreadCount > 0) {
      document.title = `(${unreadCount}) ${baseTitle}`;
    } else {
      document.title = baseTitle;
    }
  }
}

/**
 * Send a native system notification to the smartphone / desktop
 */
export async function sendSystemNotification(payload: NotificationPayload): Promise<boolean> {
  if (!areNotificationsSupported()) return false;
  if (Notification.permission !== 'granted') return false;
  if (!areNotificationsUserEnabled()) return false;

  const defaultIcon = payload.icon || '/pwa-192x192.png';
  const defaultBadge = payload.badge || '/favicon.png';

  // Vibrate phone
  triggerVibration([200, 100, 200]);

  // Try via Service Worker first (best for mobile and background)
  if ('serviceWorker' in navigator) {
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg && reg.active) {
        await reg.showNotification(payload.title, {
          body: payload.body,
          icon: defaultIcon,
          badge: defaultBadge,
          tag: payload.tag || 'nid-damour-alert',
          renotify: true,
          data: {
            url: '/',
            tab: payload.tab || 'chat',
          },
          vibrate: [200, 100, 200, 100, 200],
        } as NotificationOptions);
        return true;
      }
    } catch (err) {
      console.warn('SW notification fallback to window Notification:', err);
    }
  }

  // Fallback to standard Window Notification
  try {
    const n = new Notification(payload.title, {
      body: payload.body,
      icon: defaultIcon,
      badge: defaultBadge,
      tag: payload.tag || 'nid-damour-alert',
    });

    n.onclick = () => {
      window.focus();
      n.close();
    };
    return true;
  } catch (err) {
    console.error('Erreur affichage notification:', err);
    return false;
  }
}
