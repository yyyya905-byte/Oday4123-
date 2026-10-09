// KIAN CASHIER - Service Worker
// Version 1.3.0 - Offline-First POS & Safe Dev Module Strategy

const CACHE_NAME = 'kian-cashier-cache-v5';
const STATIC_ASSETS = [
  './',
  './index.html',
  './icon.svg',
  './manifest.json'
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
            return caches.delete(name);
          })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event: Network-first for same-origin requests, bypass cross-origin & SSE
self.addEventListener('fetch', (event) => {
  let url;
  try {
    url = new URL(event.request.url);
  } catch {
    return;
  }

  // 1. Always bypass cross-origin requests, non-GET requests, SSE streams, and Vite dev endpoints
  const acceptHeader = event.request.headers.get('accept') || '';
  if (
    url.origin !== self.location.origin ||
    event.request.method !== 'GET' ||
    acceptHeader.includes('text/event-stream') ||
    url.pathname.startsWith('/api/sync/stream') ||
    url.pathname.startsWith('/api/devices/stream') ||
    url.pathname.startsWith('/src/') ||
    url.pathname.startsWith('/@vite') ||
    url.pathname.startsWith('/@react-refresh') ||
    url.pathname.startsWith('/@fs') ||
    url.pathname.startsWith('/node_modules/')
  ) {
    return;
  }

  // 2. API GET requests (network first, fallback to cached response if offline)
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
          }
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(event.request);
          return (
            cached ||
            new Response(JSON.stringify({ offline: true }), {
              status: 200,
              headers: { 'Content-Type': 'application/json' },
            })
          );
        })
    );
    return;
  }

  // 3. Navigation requests (HTML pages) -> Network first with cache fallback
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(async () => {
        return (
          (await caches.match('./index.html')) ||
          (await caches.match('/')) ||
          new Response('Offline', { status: 503 })
        );
      })
    );
    return;
  }

  // 4. Same-origin static assets -> Network first with safe cache fallback
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
        }
        return networkResponse;
      })
      .catch(async () => {
        const cached = await caches.match(event.request);
        return cached || new Response('', { status: 504 });
      })
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
