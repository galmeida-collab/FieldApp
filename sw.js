const CACHE_NAME = 'punch-field-v1.3.11';

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
      console.log('[ServiceWorker] Caching shell v1.3.11');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
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

// Fetch strategy: Ignore extensions, Network-first for Google Apps Script, Cache-first for assets
self.addEventListener('fetch', (event) => {
  // Ignore non-http requests (such as chrome-extension://)
  if (!event.request.url.startsWith('http')) return;

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
          if (event.request.method === 'GET' && response.status === 200) {
            cache.put(event.request, response.clone());
          }
          return response;
        });
      }).catch(() => {});
    })
  );
});
