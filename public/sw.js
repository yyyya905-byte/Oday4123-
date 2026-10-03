// KIAN CASHIER - Service Worker
// Version 1.2.0 - Offline-First POS & Safe Dev Module Strategy

const CACHE_NAME = 'kian-cashier-cache-v4';
const STATIC_ASSETS = [
  './',
  './index.html',
  './icon.svg',
  './manifest.json',
  'https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;500;600;700;800;900&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap'
];

// Install Event: Pre-cache core shell
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('[Service Worker] Asset pre-cache partial warning:', err);
      });
    })
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

// Fetch Event: Network-first for API & Vite modules, fallback to cache when offline
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // 1. Bypass Service Worker for Server-Sent Events (SSE), HMR/Vite internals, and non-GET requests
  if (
    event.request.method !== 'GET' ||
    url.pathname.startsWith('/api/devices/stream') ||
    url.pathname.startsWith('/@vite') ||
    url.pathname.startsWith('/@react-refresh') ||
    url.pathname.startsWith('/@fs') ||
    url.pathname.startsWith('/node_modules/')
  ) {
    return;
  }

  // 2. Source files & JS/TS modules -> Always Network-First to prevent duplicate React hook instances
  if (
    url.pathname.startsWith('/src/') ||
    url.pathname.endsWith('.tsx') ||
    url.pathname.endsWith('.ts') ||
    url.pathname.endsWith('.js')
  ) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
          }
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // 3. API GET requests (network first, fallback to cached response if offline)
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

  // 4. Navigation requests (HTML pages) -> Network first with cache fallback
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          return caches.match('./index.html') || caches.match('/');
        })
    );
    return;
  }

  // 5. Static assets (CSS, Fonts, Images, Icons) -> Network first with cache fallback
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
        }
        return networkResponse;
      })
      .catch(() => caches.match(event.request))
  );
});

// Background Sync Event: Triggered when device regains connectivity
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-pos-data') {
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
