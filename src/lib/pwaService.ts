/**
 * PWA Service Worker Registration & Lifecycle Management
 */

type NavigateListener = (tab: string, draftText?: string) => void;
const navigateListeners: Set<NavigateListener> = new Set();

export function onPwaNavigate(callback: NavigateListener): () => void {
  navigateListeners.add(callback);
  return () => {
    navigateListeners.delete(callback);
  };
}

export function registerServiceWorker(): void {
  if (typeof window === 'undefined') {
    return;
  }

  // In development, unregister any existing service worker and purge caches
  // to prevent stale chunk caching from breaking Vite and React hooks.
  if (import.meta.env.DEV) {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (const registration of registrations) {
          registration.unregister();
        }
      });
    }
    if ('caches' in window) {
      caches.keys().then((keys) => {
        for (const key of keys) {
          caches.delete(key);
        }
      });
    }
    return;
  }

  if (!('serviceWorker' in navigator)) {
    return;
  }

  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then((registration) => {
        // Auto-check for updates
        registration.onupdatefound = () => {
          const installingWorker = registration.installing;
          if (installingWorker) {
            installingWorker.onstatechange = () => {
              if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                console.log("Nouvelle version de NID prête.");
              }
            };
          }
        };
      })
      .catch((error) => {
        console.warn('Enregistrement Service Worker non bloquant:', error);
      });

    // Listen for notification clicks that postMessage back to client
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'NAVIGATE_TAB' && event.data.tab) {
        navigateListeners.forEach((listener) => {
          try {
            listener(event.data.tab, event.data.replyDraft);
          } catch (err) {
            console.error(err);
          }
        });
      }
    });
  });
}
