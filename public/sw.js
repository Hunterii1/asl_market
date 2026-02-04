const CACHE_NAME = 'asl-market-v3';
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
  // Skip caching for API requests (both Iran and international domains)
  if (event.request.url.includes('/api/') ||
      event.request.url.includes('asllmarket.ir/backend') ||
      event.request.url.includes('asllmarket.com/backend') ||
      event.request.url.includes('api.asllmarket.ir') ||
      event.request.url.includes('api.asllmarket.com') ||
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
        // Cache miss - fetch from network
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
  // Claim clients immediately
  return self.clients.claim();
});

// Push notification event listener (for FCM)
// FCM handles push notifications through firebase-messaging-sw.js
// This is kept for backward compatibility
self.addEventListener('push', function(event) {
  console.log('Push notification received:', event);

  let notificationData = {
    title: 'ASL Market',
    body: 'شما یک نوتیفیکیشن جدید دارید',
    icon: '/pwa.png',
    badge: '/pwa.png',
    tag: 'notification',
    data: {
      url: '/'
    }
  };

  if (event.data) {
    try {
      const data = event.data.json();
      notificationData = {
        title: data.title || notificationData.title,
        body: data.message || data.body || notificationData.body,
        icon: data.icon || notificationData.icon,
        badge: data.badge || notificationData.badge,
        tag: data.tag || notificationData.tag,
        data: data.data || notificationData.data,
        requireInteraction: data.priority === 'high' || data.priority === 'urgent',
        vibrate: data.priority === 'urgent' ? [200, 100, 200] : [200]
      };
    } catch (e) {
      console.error('Error parsing push data:', e);
    }
  }

  event.waitUntil(
    self.registration.showNotification(notificationData.title, {
      body: notificationData.body,
      icon: notificationData.icon,
      badge: notificationData.badge,
      tag: notificationData.tag,
      data: notificationData.data,
      requireInteraction: notificationData.requireInteraction,
      vibrate: notificationData.vibrate,
      actions: notificationData.actions || []
    })
  );
});

// Notification click event listener
self.addEventListener('notificationclick', function(event) {
  console.log('Notification clicked:', event);
  
  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then(function(clientList) {
      // Check if there's already a window/tab open with the target URL
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      // If not, open a new window/tab
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// Notification close event listener
self.addEventListener('notificationclose', function(event) {
  console.log('Notification closed:', event);
});