const CACHE_NAME = 'punch-field-v1.3.9';

const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './punch-icon.png',
  './hero_saflag.jpg',
  './hero_frontline.jpg',
  './hero_outreach.jpg'
];

// Pre-cache core shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[ServiceWorker] Caching shell v1.3.9');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  // Force immediate activation without waiting for tabs/windows to close
  self.skipWaiting();
});

// Clean up old caches on activation
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[ServiceWorker] Removing old cache', key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch strategy: Cache-first with network fallback
self.addEventListener('fetch', (event) => {
  // Bypass caching for Google Apps Script live API calls
  if (event.request.url.includes('script.google.com')) {
    event.respondWith(fetch(event.request));
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then((response) => {
        return caches.open(CACHE_NAME).then((cache) => {
          // Cache fetched static files dynamically
          if (event.request.method === 'GET' && response.status === 200) {
            cache.put(event.request, response.clone());
          }
          return response;
        });
      }).catch(() => {
        // Fallback or offline behavior if needed
      });
    })
  );
});
