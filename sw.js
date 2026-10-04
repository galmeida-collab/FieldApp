const CACHE_NAME = 'ae-field-v1.4.0';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './css/app.css',
  './manifest.webmanifest',
  './punch-icon.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (url.hostname === 'script.google.com') {
    return;
  }

  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request)
        .then((res) => {
          return caches.open(CACHE_NAME).then((cache) => {
            cache.put(e.request, res.clone());
            return res;
          });
        })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then((cached) => cached || fetch(e.request))
  );
});