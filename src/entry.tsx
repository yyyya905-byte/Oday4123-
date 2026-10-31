// Bootstrapper that purges stale Service Worker caches cleanly without aborting module evaluation
if (typeof window !== 'undefined') {
  window.addEventListener(
    'error',
    (e: ErrorEvent) => {
      if (
        e.message === 'Script error.' ||
        e.message === 'Script error' ||
        (typeof e.message === 'string' && e.message.includes('ResizeObserver loop')) ||
        (!e.filename && !e.lineno && !e.colno && !e.error)
      ) {
        e.stopImmediatePropagation();
        e.preventDefault();
      }
    },
    true
  );
}

async function bootstrap() {
  try {
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      const staleCaches = cacheNames.filter((name) => name !== 'kian-cashier-cache-v5');
      if (staleCaches.length > 0) {
        await Promise.all(staleCaches.map((name) => caches.delete(name)));
      }
    }

    // Register Service Worker for offline-first caching and instant startup on slow connections
    if ('serviceWorker' in navigator && ((import.meta as any).env?.PROD || window.location.protocol === 'https:')) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('./sw.js')
          .then((reg) => {
            // Check for updates periodically
            reg.onupdatefound = () => {
              const installingWorker = reg.installing;
              if (installingWorker) {
                installingWorker.onstatechange = () => {
                  if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                    console.info('[Service Worker] New version available, pre-caching complete.');
                  }
                };
              }
            };
          })
          .catch((err) => {
            console.warn('[Service Worker] Registration skipped/restricted in iframe:', err);
          });
      });
    }
  } catch (err) {
    console.warn('[Bootstrap] Cache setup warning:', err);
  }

  await import('./main.tsx');
}

bootstrap();

