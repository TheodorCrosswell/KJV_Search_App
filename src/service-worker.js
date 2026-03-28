import { build, files, version } from '$service-worker';

// Filter out the heavy Bible data from the initial installation cache
const ASSETS = [
    ...build, 
    ...files.filter(f => !f.includes('kjv-data.json')), 
    '/' // This is your SPA shell
];

// FIXED: Use backticks for template literals
const CACHE_NAME = `bible-pwa-${version}`;

self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
    );
});

self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
            );
        })
    );
});

self.addEventListener('fetch', (e) => {
    if (e.request.method !== 'GET') return;

    e.respondWith(
        caches.match(e.request).then((cachedResponse) => {
            if (cachedResponse) return cachedResponse;

            // If we are offline and navigating to a page (like /read/John/1)
            // return the root shell ('/') which we cached during install.
            if (e.request.mode === 'navigate') {
                return caches.match('/');
            }

            return fetch(e.request);
        })
    );
});