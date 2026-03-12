const CACHE_NAME = 'usd-ves-v2'; // Actualiza la versión
const ASSETS = [
  './',
  './index.html',
  './css/styles.css',
  './js/app.js',
  'https://cdn-icons-png.flaticon.com/512/2150/2150150.png' // Cachear el ícono también
];

// Instalar y guardar en caché los archivos estáticos
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Archivos cacheados');
        return cache.addAll(ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activar y limpiar cachés viejos
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// Estrategia: Stale-while-revalidate para HTML, Network First para APIs
self.addEventListener('fetch', e => {
  // Para peticiones a APIs, intentar red primero, fallback a caché
  if (e.request.url.includes('dolarapi.com') || e.request.url.includes('criptoya.com') || e.request.url.includes('bcv-api')) {
    e.respondWith(
      fetch(e.request)
        .then(response => {
          // Si la respuesta es buena, clonarla y guardarla en caché
          if (response && response.status === 200) {
            const responseClone = response.clone();
            caches.open('api-cache-v1').then(cache => {
              cache.put(e.request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // Si falla la red, buscar en caché
          return caches.match(e.request).then(cachedResponse => {
            if (cachedResponse) {
              return cachedResponse;
            }
            // Si no hay caché, devolver un error personalizado
            return new Response(JSON.stringify({ error: 'offline' }), {
              status: 503,
              headers: { 'Content-Type': 'application/json' }
            });
          });
        })
    );
  } else {
    // Para archivos estáticos, usar caché primero
    e.respondWith(
      caches.match(e.request)
        .then(cachedResponse => cachedResponse || fetch(e.request))
    );
  }
});
