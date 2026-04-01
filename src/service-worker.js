/// <reference types="@sveltejs/kit" />
/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />

const sw = /** @type {ServiceWorkerGlobalScope} */ (/** @type {unknown} */ (self));

import { build, files, version } from '$service-worker';

// Filter out the heavy Bible data from the initial installation cache
const ASSETS = [
    ...build, 
    ...files.filter(f => !f.includes('kjv-data.json')), 
    '/' // This is your SPA shell
];

const CACHE_NAME = `bible-pwa-${version}`;

sw.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(ASSETS))
            .then(() => sw.skipWaiting()) // <-- Forces waiting worker to activate immediately
    );
});

sw.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
            );
        }).then(() => {
            sw.clients.claim(); // <-- Takes control of all open pages immediately
        })
    );
});

sw.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET') return;

    event.respondWith(
        caches.match(event.request).then(async (cachedResponse) => {
            // 1. Return cached response if we have it
            if (cachedResponse) return cachedResponse;

            try {
                // 2. Otherwise, attempt to fetch from the network
                return await fetch(event.request);
            } catch (err) {
                // 3. If the network fails (e.g., offline) and we are navigating to a page
                if (event.request.mode === 'navigate') {
                    const shell = await caches.match('/');
                    if (shell) return shell;
                }
                
                // 4. Guaranteed Response fallback to satisfy TypeScript
                return Response.error();
            }
        })
    );
});