const CACHE_NAME = 'bible-pwa-v2';
const ASSETS =[
  '/',
  '/index.html',
  '/manifest.json',
  '/kjv-data.json'
];

self.addEventListener('install', (e) => {
  self.skipWaiting(); // Forces the new service worker to activate immediately
  e.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)));
});

self.addEventListener('activate', (e) => {
  // Clean up old caches if the version name changes
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      // 1. If we have the exact file cached (like CSS, JS, or kjv-data.json), return it
      if (cachedResponse) {
        return cachedResponse;
      }

      // 2. If it's a "navigate" request (the user typed a URL or refreshed the page), 
      // serve the cached index.html SPA shell.
      if (e.request.mode === 'navigate') {
        return caches.match('/index.html');
      }

      // 3. Otherwise, try the network (for things we didn't cache)
      return fetch(e.request);
    }).catch(() => {
      // 4. Final fallback for offline navigation requests
      if (e.request.mode === 'navigate') {
        return caches.match('/index.html');
      }
    })
  );
});