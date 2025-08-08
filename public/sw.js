const CACHE_NAME = 'werewolf-pwa-v1';
const urlsToCache = [
  '/',
  '/characters/werewolf.png',
  '/characters/doctor.png',
  '/characters/drunk.png',
  '/characters/seer.png',
  '/characters/villager.png',
  '/characters/witch.png',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        return response || fetch(event.request);
      })
  );
});
