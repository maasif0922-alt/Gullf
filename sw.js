const CACHE_NAME = 'gulf-oil-v1';
const STATIC_ASSETS = [
    './',
    './index.html',
    './app.js',
    './style.css',
    './manifest.json'
];

// Install Event - Cache static assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('[Service Worker] Caching static assets');
            return cache.addAll(STATIC_ASSETS);
        })
    );
    self.skipWaiting();
});

// Activate Event - Clean up old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('[Service Worker] Deleting old cache', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

// Fetch Event - Stale While Revalidate for CDNs and Cache First for static
self.addEventListener('fetch', (event) => {
    // Skip non-GET requests (e.g. Firebase API POSTs)
    if (event.request.method !== 'GET') return;

    // For Firebase CDN or fonts, use Stale-While-Revalidate
    if (event.request.url.includes('gstatic.com') || event.request.url.includes('googleapis.com')) {
        event.respondWith(
            caches.match(event.request).then((cachedResponse) => {
                const fetchPromise = fetch(event.request).then((networkResponse) => {
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, networkResponse.clone());
                    });
                    return networkResponse;
                }).catch(() => {
                    // Ignore fetch errors if offline
                });
                return cachedResponse || fetchPromise;
            })
        );
        return;
    }

    // Default Cache-First strategy for static assets
    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
                return cachedResponse;
            }
            return fetch(event.request).then((networkResponse) => {
                // Cache dynamically fetched static assets
                if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
                    const responseToCache = networkResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseToCache);
                    });
                }
                return networkResponse;
            });
        })
    );
});
