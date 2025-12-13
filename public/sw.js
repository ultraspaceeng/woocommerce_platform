// Service Worker for Push Notifications
// Place this file in public/sw.js

self.addEventListener('push', function (event) {
    const data = event.data ? event.data.json() : {};

    const options = {
        body: data.body || 'You have a new notification',
        icon: data.icon || '/icons/icon-192x192.png',
        badge: data.badge || '/icons/badge-72x72.png',
        vibrate: [100, 50, 100],
        data: {
            url: data.data?.url || '/',
            dateOfArrival: Date.now(),
        },
        actions: [
            {
                action: 'open',
                title: 'Open',
                icon: '/icons/checkmark.png'
            },
            {
                action: 'close',
                title: 'Close',
                icon: '/icons/xmark.png'
            }
        ],
        tag: data.tag || 'default',
        renotify: true,
    };

    event.waitUntil(
        self.registration.showNotification(data.title || 'Royal Commerce', options)
    );
});

self.addEventListener('notificationclick', function (event) {
    event.notification.close();

    if (event.action === 'close') {
        return;
    }

    const url = event.notification.data?.url || '/';

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
            // Check if there's already a window/tab open
            for (let i = 0; i < clientList.length; i++) {
                const client = clientList[i];
                if (client.url === url && 'focus' in client) {
                    return client.focus();
                }
            }
            // If no window is open, open a new one
            if (clients.openWindow) {
                return clients.openWindow(url);
            }
        })
    );
});

// Handle push subscription change
self.addEventListener('pushsubscriptionchange', function (event) {
    event.waitUntil(
        self.registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: self.VAPID_PUBLIC_KEY
        }).then(function (subscription) {
            // Re-subscribe and update the server
            return fetch('/api/push/subscribe', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId: 'current-user', // This would come from your auth system
                    subscription: subscription.toJSON(),
                }),
            });
        })
    );
});
