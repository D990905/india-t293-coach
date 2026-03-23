// ════════════════════════════════════════════════════════════
//  Coach Obs Service Worker — India T293
//  Offline-first caching strategy
// ════════════════════════════════════════════════════════════

const CACHE_NAME = 'quickobs-v1';

// Files to cache for offline use
const PRECACHE_URLS = [
  'quick_obs.html',
  'manifest_obs.json',
  'icon_obs_192.png',
  'icon_obs_512.png'
];

// ── INSTALL: Pre-cache core files ──────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] Pre-caching offline files');
        return cache.addAll(PRECACHE_URLS);
      })
      .then(() => self.skipWaiting())
      .catch(err => {
        console.warn('[SW] Pre-cache failed (some files may not exist yet):', err);
        // Don't fail installation even if some files missing
        return self.skipWaiting();
      })
  );
});

// ── ACTIVATE: Clean old caches ─────────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames
            .filter(name => name !== CACHE_NAME)
            .map(name => {
              console.log('[SW] Deleting old cache:', name);
              return caches.delete(name);
            })
        );
      })
      .then(() => self.clients.claim())
  );
});

// ── FETCH: Cache-first for app files, network-first for API ──
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Google Apps Script requests — always network (no-cors, never cache)
  if (url.hostname.includes('script.google.com')) {
    return; // Let browser handle directly
  }

  // For app shell files — cache-first
  event.respondWith(
    caches.match(event.request)
      .then(cached => {
        if (cached) return cached;

        // Not in cache — fetch from network and cache it
        return fetch(event.request)
          .then(response => {
            // Only cache successful same-origin responses
            if (
              response &&
              response.status === 200 &&
              response.type === 'basic'
            ) {
              const responseClone = response.clone();
              caches.open(CACHE_NAME).then(cache => {
                cache.put(event.request, responseClone);
              });
            }
            return response;
          })
          .catch(() => {
            // Offline fallback — return main app shell
            return caches.match('quick_obs.html');
          });
      })
  );
});

// ── MESSAGE HANDLER: Force update from UI ─────────────────
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
