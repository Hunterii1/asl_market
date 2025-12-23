// Import and configure the Firebase SDK
// These scripts are made available when the app is served or deployed on Firebase Hosting
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// Initialize the Firebase app in the service worker by passing in
// your app's Firebase config object.
// https://firebase.google.com/docs/web/setup#config-object
firebase.initializeApp({
  apiKey: "AIzaSyD1PzmVAhZ8Wnb2zkbVXSRpcohKeKO3bmw",
  authDomain: "asll-d7594.firebaseapp.com",
  projectId: "asll-d7594",
  storageBucket: "asll-d7594.firebasestorage.app",
  messagingSenderId: "484888304392",
  appId: "1:484888304392:web:5f23e95823fbf814772abd",
  measurementId: "G-3SRDNLZGGJ"
});

// Retrieve an instance of Firebase Messaging so that it can handle background
// messages.
const messaging = firebase.messaging();

// Optional: Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  
  const notificationTitle = payload.notification?.title || payload.data?.title || 'ASL Market';
  const notificationOptions = {
    body: payload.notification?.body || payload.data?.message || payload.data?.body || 'شما یک نوتیفیکیشن جدید دارید',
    icon: payload.notification?.icon || payload.data?.icon || '/pwa.png',
    badge: payload.notification?.badge || payload.data?.badge || '/pwa.png',
    tag: payload.data?.tag || 'notification',
    data: payload.data || {},
    requireInteraction: payload.data?.priority === 'high' || payload.data?.priority === 'urgent',
    vibrate: payload.data?.priority === 'urgent' ? [200, 100, 200] : [200],
    actions: payload.data?.actions || []
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click
self.addEventListener('notificationclick', function(event) {
  console.log('[firebase-messaging-sw.js] Notification clicked:', event);

  event.notification.close();

  const urlToOpen = event.notification.data?.url || event.notification.data?.click_action || '/';

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

// Handle notification close
self.addEventListener('notificationclose', function(event) {
  console.log('[firebase-messaging-sw.js] Notification closed:', event);
});

