// sw.js
// ↑ Erhöhe diese Konstante bei inhaltlichen Änderungen deiner HTML/JS/CSS:
const CACHE = 'sas-v13';

const PRECACHE = [
  './style.css',
  './frame.png',
  './manifest.webmanifest',
  './favicon-32x32.png',
  './favicon-16x16.png',
  './apple-touch-icon.png',
  // HTML NICHT hier precachen -> wird network-first geladen
];

// Install
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(PRECACHE)).then(() => self.skipWaiting())
  );
});

// Activate: alte Caches löschen
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch-Strategie:
// - HTML/Navigationsanfragen: NETWORK-FIRST (immer frisch, Cache als Fallback)
// - Sonst: CACHE-FIRST (schnell + offline-freundlich)
self.addEventListener('fetch', (event) => {
  const req = event.request;
  const isHTML = req.mode === 'navigate' || (req.headers.get('accept') || '').includes('text/html');

  if (isHTML) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
          return res;
        })
        .catch(() => caches.match(req))
    );
    return;
  }

  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy));
        return res;
      });
    })
  );
});
