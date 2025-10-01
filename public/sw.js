const CACHE_NAME = 'asl-market-v2';
const urlsToCache = [
  '/',
  '/LOGO.png',
  '/logo-192.png',
  '/logo-512.png',
  '/apple-touch-icon.png',
  '/manifest.json',
  '/favicon.ico',
  '/favicon.png'
];

self.addEventListener('install', function(event) {
  // Perform install steps
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        console.log('Opened cache');
        return cache.addAll(urlsToCache).catch(function(error) {
          console.log('Cache addAll failed:', error);
          // Continue with installation even if some files fail to cache
          return Promise.resolve();
        });
      })
  );
});

self.addEventListener('fetch', function(event) {
  // Skip caching for API requests
  if (event.request.url.includes('/api/') || 
      event.request.url.includes('api.asllmarket.com') ||
      event.request.url.includes('asllmarket.com/backend') ||
      event.request.url.includes('localhost:8080')) {
    return; // Let the browser handle API requests normally
  }

  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
        // Cache hit - return response
        if (response) {
          return response;
        }
        return fetch(event.request)
          .catch(function() {
            // If fetch fails, return cached offline page or fallback
            return caches.match('/');
          });
      })
  );
});

self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
}); 