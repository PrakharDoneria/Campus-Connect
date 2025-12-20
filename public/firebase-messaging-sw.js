
// This file must be in the public folder.

self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push event received.');
  
  let data;
  try {
    const text = event.data.text();
    console.log('[Service Worker] Push data:', text);
    data = JSON.parse(text);
  } catch (error) {
    console.error('[Service Worker] Failed to parse push data:', error);
    data = { title: 'Campus Connect', body: 'You have a new notification.' };
  }
  
  const title = data.title || 'Campus Connect';
  const options = {
    body: data.body || 'You have a new notification.',
    icon: '/icon-192x192.png', // Make sure you have this icon
    badge: '/badge-72x72.png', // Optional: for the notification bar
    data: {
        url: data.data?.url || '/'
    }
  };

  console.log('[Service Worker] Showing notification:', title);
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification click Received.');

  event.notification.close();

  const urlToOpen = event.notification.data.url || '/';

  event.waitUntil(
    clients.matchAll({
      type: 'window',
    }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
