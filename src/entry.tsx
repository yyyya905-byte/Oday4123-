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

    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      if (registrations.length > 0 && localStorage.getItem('kian_sw_purged_v5') !== 'true') {
        await Promise.all(registrations.map((reg) => reg.unregister()));
        localStorage.setItem('kian_sw_purged_v5', 'true');
      }
    }
  } catch (err) {
    console.warn('[Bootstrap] Cache cleanup warning:', err);
  }

  await import('./main.tsx');
}

bootstrap();

