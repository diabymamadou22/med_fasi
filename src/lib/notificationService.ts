/**
 * Web Push & System Notification Service for NID
 * Handles system alert notifications, sound/vibration alerts,
 * Web Push background notifications (when app is closed),
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
 * Utility to convert base64 VAPID public key to Uint8Array for PushManager
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Check if the current browser / device supports Web Notifications
 */
export function areNotificationsSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

/**
 * Check if Web Push via Service Worker is supported
 */
export function isPushSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
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
 * Check if push subscription is locally known
 */
export async function isPushSubscribed(): Promise<boolean> {
  if (!isPushSupported()) return false;
  try {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    return sub !== null;
  } catch {
    return false;
  }
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
    }
    return permission;
  } catch (err) {
    console.error('Erreur demande permission notifications:', err);
    return 'denied';
  }
}

/**
 * Subscribe browser to Web Push notifications even when the app is closed
 */
export async function subscribeToPushNotifications(
  partnerId: 'p1' | 'p2'
): Promise<{ success: boolean; error?: string; subscription?: PushSubscription }> {
  if (!isPushSupported()) {
    return {
      success: false,
      error:
        "Les notifications push ne sont pas supportées par ce navigateur (sur iPhone, ajoutez l'app à l'écran d'accueil).",
    };
  }

  try {
    // 1. Demande de permission
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      return {
        success: false,
        error: "L'autorisation des notifications a été refusée dans les paramètres de votre navigateur.",
      };
    }
    setNotificationsUserEnabled(true);

    // 2. Attendre que le Service Worker soit actif
    const registration = await navigator.serviceWorker.ready;

    // 3. Récupérer la clé publique VAPID depuis le serveur
    const keyRes = await fetch('/api/push/vapid-public-key');
    if (!keyRes.ok) {
      throw new Error("Impossible de récupérer la clé de chiffrement push du serveur");
    }
    const { publicKey } = await keyRes.json();
    const applicationServerKey = urlBase64ToUint8Array(publicKey);

    // 4. Souscription via le PushManager du navigateur
    let subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey,
      });
    }

    // 5. Envoi au serveur pour persistance
    const subJson = subscription.toJSON();
    const saveRes = await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        partnerId,
        subscription: subJson,
        userAgent: navigator.userAgent,
      }),
    });

    if (!saveRes.ok) {
      throw new Error("Échec de l'enregistrement de l'appareil sur le serveur");
    }

    localStorage.setItem('nid_damour_push_subscribed', 'true');
    localStorage.setItem('nid_damour_push_partner', partnerId);

    // Envoyer une confirmation
    sendWelcomeNotification();

    return { success: true, subscription };
  } catch (err: any) {
    console.error('Erreur souscription push:', err);
    return { success: false, error: err.message || 'Erreur lors de la souscription' };
  }
}

/**
 * Unsubscribe current device from push
 */
export async function unsubscribeFromPushNotifications(): Promise<boolean> {
  if (!isPushSupported()) return false;
  try {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (sub) {
      const endpoint = sub.endpoint;
      await sub.unsubscribe();
      await fetch('/api/push/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint }),
      }).catch(() => {});
    }
    localStorage.removeItem('nid_damour_push_subscribed');
    return true;
  } catch (err) {
    console.error('Erreur désinscription push:', err);
    return false;
  }
}

/**
 * Notify the partner via Web Push through the server
 * Works even if the partner's app or phone screen is closed!
 */
export async function notifyPartnerViaPush(payload: {
  senderId: string;
  senderName: string;
  content: string;
  mediaType?: string;
  targetPartnerId?: string;
}): Promise<boolean> {
  try {
    const res = await fetch('/api/push/notify-partner', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) return false;
    const data = await res.json();
    return !!data.success;
  } catch (err) {
    console.warn('Alerte push non envoyée (hors-ligne ou réseau):', err);
    return false;
  }
}

/**
 * Send a real test push notification to verify sound, badge and alert
 */
export async function sendTestPushNotification(
  partnerId: string,
  partnerName: string
): Promise<{ success: boolean; message?: string }> {
  try {
    triggerVibration([250, 100, 250, 100, 250]);

    const res = await fetch('/api/push/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ partnerId, partnerName }),
    });
    const data = await res.json();
    return data;
  } catch (err: any) {
    return { success: false, message: err?.message };
  }
}

/**
 * Fetch push server status and subscriber count
 */
export async function getPushStatus(
  partnerId?: string
): Promise<{ total: number; partnerSubscriptions: { p1: number; p2: number }; activePartnerSubs: number }> {
  try {
    const url = partnerId ? `/api/push/status?partnerId=${partnerId}` : '/api/push/status';
    const res = await fetch(url);
    if (!res.ok) throw new Error('Status push non disponible');
    return await res.json();
  } catch {
    return { total: 0, partnerSubscriptions: { p1: 0, p2: 0 }, activePartnerSubs: 0 };
  }
}

/**
 * Send an initial confirmation notification
 */
function sendWelcomeNotification(): void {
  sendSystemNotification({
    title: "NID connecté ❤️",
    body: 'Les alertes sont actives ! Vous recevrez vos messages même l’application ou l’écran éteint.',
    icon: '/pwa-192x192.png',
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
 * Flashes browser tab title when a new message arrives while tab is in background
 */
let titleFlashInterval: any = null;
export function startTabMessageAlert(senderName: string, _messagePreview?: string): void {
  if (typeof document === 'undefined') return;
  if (titleFlashInterval) clearInterval(titleFlashInterval);

  let state = false;
  titleFlashInterval = setInterval(() => {
    state = !state;
    document.title = state
      ? `💌 Nouveau message de ${senderName} !`
      : `❤️ NID`;
  }, 1200);

  const onTabFocus = () => {
    if (titleFlashInterval) {
      clearInterval(titleFlashInterval);
      titleFlashInterval = null;
    }
    document.title = "NID";
    window.removeEventListener('focus', onTabFocus);
  };
  window.addEventListener('focus', onTabFocus);
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
    const baseTitle = "NID";
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
  triggerVibration([250, 100, 250, 100, 250]);

  // Try via Service Worker first (best for mobile and background)
  if ('serviceWorker' in navigator) {
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg && reg.active) {
        await reg.showNotification(payload.title, {
          body: payload.body,
          icon: defaultIcon,
          badge: defaultBadge,
          tag: payload.tag || `nid-damour-alert-${Date.now()}`,
          renotify: true,
          requireInteraction: true,
          data: {
            url: '/',
            tab: payload.tab || 'chat',
          },
          vibrate: [250, 100, 250, 100, 250],
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
      tag: payload.tag || `nid-damour-alert-${Date.now()}`,
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

