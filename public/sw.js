// KIAN CASHIER - Service Worker
// Version 1.1.0 - Offline-First POS & Caching Strategy

const CACHE_NAME = 'kian-cashier-cache-v2';
const STATIC_ASSETS = [
  './',
  './index.html',
  './favicon.ico',
  './manifest.json',
  'https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;500;600;700;800;900&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap'
];

// Install Event: Pre-cache core shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Pre-caching offline shell and assets');
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('[Service Worker] Asset pre-cache partial warning:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// Activate Event: Cleanup outdated caches and claim clients immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => {
            console.log('[Service Worker] Deleting obsolete cache:', name);
            return caches.delete(name);
          })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event: Network-first for API, Stale-While-Revalidate for app assets
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // 1. Bypass Service Worker for Server-Sent Events (SSE) and server API write requests
  if (url.pathname.startsWith('/api/devices/stream') || (url.pathname.startsWith('/api/') && event.request.method !== 'GET')) {
    return;
  }

  // 2. API GET requests (network first, fallback to cached response if offline)
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
          }
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // 3. Navigation requests (HTML pages) -> Network first with cache fallback
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          return caches.match('./index.html') || caches.match('/');
        })
    );
    return;
  }

  // 4. Static assets (JS, CSS, Fonts, Images) -> Cache first, fallback to network and update cache
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Return cached and fetch in background to update cache
        fetch(event.request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              caches.open(CACHE_NAME).then((cache) => cache.put(event.request, networkResponse));
            }
          })
          .catch(() => {});
        return cachedResponse;
      }

      return fetch(event.request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }
        const responseClone = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
        return networkResponse;
      }).catch((err) => {
        // Silent catch for offline image/asset failure
        console.warn('[Service Worker] Fetch failed while offline:', event.request.url);
      });
    })
  );
});

// Background Sync Event: Triggered when device regains connectivity
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-pos-data') {
    console.log('[Service Worker] Background sync event triggered: sync-pos-data');
    event.waitUntil(
      self.clients.matchAll().then((clients) => {
        clients.forEach((client) => {
          client.postMessage({
            type: 'TRIGGER_OFFLINE_SYNC',
            timestamp: new Date().toISOString()
          });
        });
      })
    );
  }
});
