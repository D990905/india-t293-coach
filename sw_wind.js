const CACHE='wind-v5';
const URLS=['./wind_dashboard_v5.html','./icon_wind_192.png','./icon_wind_512.png','./manifest_wind.json'];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(URLS)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{e.respondWith(fetch(e.request).then(r=>{if(r&&r.status===200){const c=r.clone();caches.open(CACHE).then(cache=>cache.put(e.request,c))}return r}).catch(()=>caches.match(e.request)))});
