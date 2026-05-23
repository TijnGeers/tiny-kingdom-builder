const CACHE_NAME = 'tiny-kingdom-v2';
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

// Install: cache all game files
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: serve from cache first, fallback to network
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(cached => {
      return cached || fetch(event.request).then(response => {
        // Cache new requests dynamically
        if (response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      });
    }).catch(() => {
      // Offline fallback
      if (event.request.destination === 'document') {
        return caches.match('./index.html');
      }
    })
  );
});
