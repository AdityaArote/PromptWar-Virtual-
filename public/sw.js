// FlowZone Service Worker for Push Notifications
const CACHE_NAME = 'flowzone-v1';

// Handle push events from the server
self.addEventListener('push', (event) => {
  if (!event.data) return;

  let data;
  try {
    data = event.data.json();
  } catch {
    data = {
      title: 'FlowZone Alert',
      body: event.data.text(),
      icon: '/icon-light-32x32.png',
    };
  }

  const options = {
    body: data.body || 'Zone status has changed',
    icon: data.icon || '/icon-light-32x32.png',
    badge: '/icon-light-32x32.png',
    vibrate: [100, 50, 100],
    tag: data.tag || 'flowzone-alert',
    renotify: true,
    data: {
      url: data.url || '/',
      zone_id: data.zone_id,
      type: data.type || 'zone_alert',
    },
    actions: [
      { action: 'view', title: 'View Zone' },
      { action: 'dismiss', title: 'Dismiss' },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'FlowZone', options)
  );
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const { url, zone_id } = event.notification.data || {};

  if (event.action === 'dismiss') return;

  const targetUrl = zone_id ? `/map?zone=${zone_id}` : url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Focus existing window if available
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      // Open new window
      return self.clients.openWindow(targetUrl);
    })
  );
});

// Service worker activate
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    )
  );
});

self.addEventListener('install', () => {
  self.skipWaiting();
});
