const CACHE_NAME = 'ae-field-v1.3.1';

// Core assets required for offline-first operation
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './index-v1.3.html',
  './manifest.json',
  './AESA General Name Logo 2022.png',
  './hero_saflag.jpg',
  './hero_frontline.jpg',
  './hero_outreach.jpg'
];

// Install Event: Pre-caches shell assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[ServiceWorker] Pre-caching offline shell v1.3');
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

// Activate Event: Clears out old version caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[ServiceWorker] Removing obsolete cache:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event: Cache-first for local static shell, network fallback
self.addEventListener('fetch', (event) => {
  // Never intercept Google Apps Script or external POST/GET sync traffic
  if (event.request.url.includes('script.google.com')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then((networkResponse) => {
        // Cache dynamically retrieved assets (like fonts or fallback images)
        if (networkResponse && networkResponse.status === 200 && event.request.method === 'GET') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      });
    }).catch(() => {
      // Offline fallback for navigation requests
      if (event.request.mode === 'navigate') {
        return caches.match('./index-v1.3.html') || caches.match('./index.html');
      }
    })
  );
});
