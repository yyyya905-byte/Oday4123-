// Bootstrapper that purges stale Service Worker caches before loading React
async function bootstrap() {
  try {
    let needsReload = false;

    if ('caches' in window) {
      const cacheNames = await caches.keys();
      const staleCaches = cacheNames.filter((name) => name !== 'kian-cashier-cache-v4');
      if (staleCaches.length > 0) {
        await Promise.all(staleCaches.map((name) => caches.delete(name)));
        needsReload = true;
      }
    }

    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      if (registrations.length > 0 && localStorage.getItem('kian_sw_purged_v4') !== 'true') {
        await Promise.all(registrations.map((reg) => reg.unregister()));
        localStorage.setItem('kian_sw_purged_v4', 'true');
        needsReload = true;
      }
    }

    if (needsReload && sessionStorage.getItem('kian_boot_reloaded_v4') !== 'true') {
      sessionStorage.setItem('kian_boot_reloaded_v4', 'true');
      window.location.reload();
      return;
    }
  } catch (err) {
    console.warn('[Bootstrap] Cache cleanup warning:', err);
  }

  await import('./main.tsx');
}

bootstrap();
