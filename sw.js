const CACHE_NAME = 'ae-field-v1.5.3';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './css/app.css',
  './manifest.webmanifest',
  './punch-icon.png',
  './ae-logo.png',
  './hero.jpg',
  './hero_saflag.jpg',
  './hero_frontline.jpg',
  './hero_outreach.jpg',
  './fonts/plus-jakarta-sans-latin-400-normal.woff2',
  './fonts/plus-jakarta-sans-latin-500-normal.woff2',
  './fonts/plus-jakarta-sans-latin-600-normal.woff2',
  './fonts/plus-jakarta-sans-latin-700-normal.woff2',
  './fonts/plus-jakarta-sans-latin-800-normal.woff2',
  './fonts/plus-jakarta-sans-latin-ext-400-normal.woff2',
  './fonts/plus-jakarta-sans-latin-ext-500-normal.woff2',
  './fonts/plus-jakarta-sans-latin-ext-600-normal.woff2',
  './fonts/plus-jakarta-sans-latin-ext-700-normal.woff2',
  './fonts/plus-jakarta-sans-latin-ext-800-normal.woff2'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (url.hostname === 'script.google.com' || url.hostname === 'script.googleusercontent.com') {
    return;
  }
  if (event.request.method !== 'GET') return;

  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put('./index.html', copy));
          return response;
        })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        if (url.origin === self.location.origin && response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        }
        return response;
      });
    })
  );
});
