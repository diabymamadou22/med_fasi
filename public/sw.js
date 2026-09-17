// Service Worker for Nid d'Amour PWA
// Offline caching, background push notifications & home screen badging

const CACHE_NAME = 'nid-damour-cache-v4';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.png',
  '/app-icon.png',
  '/apple-touch-icon.png',
  '/pwa-192x192.png',
  '/pwa-512x512.png',
  '/pwa-maskable-512x512.png',
];

// Install: Cache essential shell assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('SW pre-cache non-fatal warning:', err);
      });
    })
  );
  self.skipWaiting();
});

// Activate: Clean up all old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch: Stale-While-Revalidate & Cache-First for static assets
self.addEventListener('fetch', (event) => {
  const request = event.request;

  // Only handle GET requests
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // ALWAYS bypass Vite, node_modules, dev tools, and APIs
  if (
    url.hostname.includes('firestore.googleapis.com') ||
    url.hostname.includes('firebase') ||
    url.hostname.includes('generativelanguage') ||
    url.pathname.startsWith('/api/') ||
    url.protocol.startsWith('chrome-extension') ||
    url.pathname.includes('/@vite/') ||
    url.pathname.includes('/@fs/') ||
    url.pathname.includes('/@id/') ||
    url.pathname.includes('/node_modules/') ||
    url.pathname.startsWith('/src/') ||
    url.search.includes('?v=') ||
    url.search.includes('&v=')
  ) {
    return;
  }

  // Static assets (images, fonts, audio): Cache-first with network fallback
  if (
    request.destination === 'image' ||
    request.destination === 'font' ||
    request.destination === 'audio' ||
    url.pathname.match(/\.(png|jpg|jpeg|svg|webp|woff2|woff|ttf|mp3)$/)
  ) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) return cachedResponse;
        return fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const clone = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
            }
            return networkResponse;
          })
          .catch(() => cachedResponse);
      })
    );
    return;
  }

  // HTML Navigation: Network-first with cache fallback for offline readiness
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          const clone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return networkResponse;
        })
        .catch(() => {
          return caches.match('/index.html').then((cachedIndex) => {
            return cachedIndex || caches.match('/');
          });
        })
    );
    return;
  }

  // Default scripts & styles: Stale-While-Revalidate
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const fetchPromise = fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return networkResponse;
        })
        .catch(() => cachedResponse);

      return cachedResponse || fetchPromise;
    })
  );
});

// Handle push notifications when app is closed / in background
self.addEventListener('push', (event) => {
  let data = {
    title: "Nid d'Amour ❤️",
    body: 'Nouveau message de votre amour !',
    icon: '/pwa-192x192.png',
    badge: '/favicon.png',
    tag: `nid-damour-chat-${Date.now()}`,
  };

  if (event.data) {
    try {
      data = event.data.json();
    } catch {
      data.body = event.data.text();
    }
  }

  const targetTab = data.data?.tab || data.tab || 'chat';
  const targetUrl = data.data?.url || data.url || '/?tab=' + targetTab;

  const options = {
    body: data.body,
    icon: data.icon || '/pwa-192x192.png',
    badge: data.badge || '/favicon.png',
    vibrate: [250, 100, 250, 100, 250],
    tag: data.tag || `chat-alert-${Date.now()}`,
    renotify: true,
    requireInteraction: true,
    data: {
      url: targetUrl,
      tab: targetTab,
      senderId: data.data?.senderId || data.senderId,
    },
    actions: [
      { action: 'open_chat', title: '💬 Ouvrir la discussion' },
      { action: 'dismiss', title: 'Fermer' },
    ],
  };

  // Update App Badge on device icon if supported
  if ('setAppBadge' in navigator && typeof navigator.setAppBadge === 'function') {
    navigator.setAppBadge().catch(() => {});
  }

  event.waitUntil(self.registration.showNotification(data.title, options));
});

// Handle notification clicks: Focus or open window and route to Chat
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') return;

  const targetTab = event.notification.data?.tab || 'chat';
  const targetUrl = event.notification.data?.url || `/?tab=${targetTab}`;

  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // If an open window exists, focus it and notify app to switch tab
        for (const client of clientList) {
          if ('focus' in client) {
            client.postMessage({
              type: 'NAVIGATE_TAB',
              tab: targetTab,
            });
            return client.focus();
          }
        }
        // Otherwise open a new window
        if (self.clients.openWindow) {
          return self.clients.openWindow(targetUrl);
        }
      })
  );
});
