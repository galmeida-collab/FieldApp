const CACHE_NAME = 'punch-field-v1.3.8';

const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './AESA General Name Logo 2022.png',
  './hero_saflag.jpg',
  './hero_frontline.jpg',
  './hero_outreach.jpg'
];

// Pre-cache core shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[ServiceWorker] Caching shell v1.3.8');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  // Force immediate activation without waiting for tabs/windows to close
  self.skipWaiting();
});

// Purge old versions immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[ServiceWorker] Purging old cache:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Network-First for HTML/Navigations (Guarantees freshest updates when online)
self.addEventListener('fetch', (event) => {
  // Let Google Apps Script API calls bypass the service worker
  if (event.request.url.includes('script.google.com')) {
    return;
  }

  // If navigating or loading index.html, fetch from network FIRST
  if (event.request.mode === 'navigate' || event.request.url.endsWith('index.html')) {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return networkResponse;
        })
        .catch(() => caches.match(event.request) || caches.match('./index.html'))
    );
    return;
  }

  // Cache-First for static assets (images, logos) for fast loading
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200 && event.request.method === 'GET') {
          const clone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return networkResponse;
      });
    })
  );
});