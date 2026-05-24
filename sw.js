const CACHE_NAME = 'tiny-kingdom-v6';
const ASSETS = [
  './',
  './index.html',
  './game.js',
  './style.css',
  './manifest.json',
  './dragon.png.jpg',
  './icon-192.png',
  './icon-512.png',
  './icon.svg',
];

// Install: cache all game files and immediately activate
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// Activate: clean ALL old caches and take over immediately
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch: NETWORK FIRST, fallback to cache (always get fresh files when online)
self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request).then(response => {
      // Got fresh response, update cache
      if (response.status === 200) {
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
      }
      return response;
    }).catch(() => {
      // Offline: serve from cache
      return caches.match(event.request).then(cached => {
        return cached || (event.request.destination === 'document' ? caches.match('./index.html') : new Response('', { status: 404 }));
      });
    })
  );
});
