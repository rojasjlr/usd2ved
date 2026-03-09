const CACHE_NAME = 'usd-ves-v1';
const ASSETS = [
  './',
  './index.html',
  './css/styles.css',
  './js/app.js'
];

// Instalar y guardar en caché los archivos estáticos
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
});

// Estrategia: Network First (Priorizar red para tasas frescas, fallback a caché)
self.addEventListener('fetch', e => {
  e.respondWith(
    fetch(e.request).catch(() => caches.match(e.request))
  );
});