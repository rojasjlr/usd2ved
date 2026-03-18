const CACHE_NAME = 'usd-ves-v3'; // Versión actualizada
const API_CACHE = 'api-data-v1';

const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './css/styles.css',
  './js/app.js',
  './manifest.json',
  './assets/icon-512.png' // Icono local optimizado
];

// Instalación: Cachear activos estáticos inmediatamente
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('📦 Guardando activos locales en caché...');
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

// Activación: Limpiar cachés viejos
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME && key !== API_CACHE) {
            console.log('🧹 Eliminando caché antiguo:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Intercepción de peticiones (Fetch)
self.addEventListener('fetch', event => {
  const url = event.request.url;

  // Lógica para APIs (DolarApi, CriptoYa, etc.)
  // Estrategia: Network First con fallback a Caché
  if (url.includes('dolarapi.com') || url.includes('criptoya.com') || url.includes('bcv-api')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const responseClone = response.clone();
          caches.open(API_CACHE).then(cache => {
            cache.put(event.request, responseClone);
          });
          return response;
        })
        .catch(() => {
          return caches.match(event.request).then(cachedResponse => {
            return cachedResponse || new Response(JSON.stringify({ error: 'offline' }), {
              status: 503,
              headers: { 'Content-Type': 'application/json' }
            });
          });
        })
    );
  } else {
    // Lógica para archivos estáticos (HTML, CSS, JS, Imágenes)
    // Estrategia: Cache First para velocidad máxima
    event.respondWith(
      caches.match(event.request).then(response => {
        return response || fetch(event.request);
      })
    );
  }
});