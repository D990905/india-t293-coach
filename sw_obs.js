// ════════════════════════════════════════════════════════════
//  Coach Obs Service Worker — India T293
//  Network-first caching strategy (always get latest)
// ════════════════════════════════════════════════════════════

const CACHE_NAME = 'quickobs-v2';

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
        console.warn('[SW] Pre-cache failed:', err);
        return self.skipWaiting();
      })
  );
});

// ── ACTIVATE: Clean ALL old caches ─────────────────────────
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

// ── FETCH: Network-first (always try fresh, fallback to cache) ──
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Google Apps Script — let browser handle directly
  if (url.hostname.includes('script.google.com')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Got network response — cache it and return
        if (response && response.status === 200 && response.type === 'basic') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, clone);
          });
        }
        return response;
      })
      .catch(() => {
        // Network failed — fallback to cache (offline mode)
        return caches.match(event.request)
          .then(cached => cached || caches.match('quick_obs.html'));
      })
  );
});

// ── MESSAGE HANDLER: Force update from UI ─────────────────
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
