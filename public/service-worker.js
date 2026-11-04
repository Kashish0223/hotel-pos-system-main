// public/service-worker.js
self.addEventListener('push', function (event) {
    let data = {};
    try {
        data = event.data.json();
    } catch (e) {
        data = {
            title: "Notification",
            body: event.data ? event.data.text() : "New update received"
        };
    }

    const title = data.title || "New Order";
    const options = {
        body: data.body || "You have a new order.",
        icon: '/images/logo.png',
        badge: '/images/logo.png',
        data: data.orderData || data, 
        silent: false,
        requireInteraction: true,
    };

    event.waitUntil(
        self.registration.showNotification(title, options)
    );
});

// Optional: Handle click (e.g., focus app and play custom sound client-side)
self.addEventListener('notificationclick', function(event) {
    event.notification.close();
    
    const data = event.notification.data || {};
    const urlToOpen = data.url || '/orders';

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
            // Check if there is already a window open with this URL
            for (let i = 0; i < windowClients.length; i++) {
                const client = windowClients[i];
                if (client.url.includes(urlToOpen) && 'focus' in client) {
                    return client.focus();
                }
            }
            // If no window is open, open a new one
            if (clients.openWindow) {
                return clients.openWindow(urlToOpen);
            }
        })
    );
});


// // public/service-worker.js
// self.addEventListener('push', function (event) {
//     const data = event.data.json();
//     const title = data.title || "New Order";
//     const options = {
//         body: data.body || "You have a new order.",
//         icon: '/icon.png',
//         badge: '/badge.png',
//     };

//     event.waitUntil(
//         self.registration.showNotification(title, options)
//     );
// });
