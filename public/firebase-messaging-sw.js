// This file is intentionally left blank.
// It's required for Firebase messaging to work in the background.
// We can add custom background message handling logic here later if needed.
self.addEventListener('push', (event) => {
    const data = event.data.json();
    const title = data.title || 'Campus Connect';
    const options = {
        body: data.body,
        icon: '/icon-192x192.png',
        badge: '/badge-72x72.png',
    };
    event.waitUntil(self.registration.showNotification(title, options));
});
