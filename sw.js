// Service Worker for Progressive Web App
const CACHE_NAME = 'simplesquad-v1.0.0';
const STATIC_CACHE_URLS = [
    '/',
    '/index.html',
    '/app.js',
    '/config.js',
    '/error-handler.js',
    '/firebase-service.js',
    '/styles.css',
    '/manifest.json'
];

const DYNAMIC_CACHE_NAME = 'simplesquad-dynamic-v1.0.0';

// Install event - cache static assets
self.addEventListener('install', (event) => {
    console.log('Service Worker: Installing');

    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Service Worker: Caching static files');
                return cache.addAll(STATIC_CACHE_URLS);
            })
            .then(() => {
                return self.skipWaiting();
            })
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('Service Worker: Activating');

    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME && cacheName !== DYNAMIC_CACHE_NAME) {
                        console.log('Service Worker: Deleting old cache', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            return self.clients.claim();
        })
    );
});

// Fetch event - serve cached content when offline
self.addEventListener('fetch', (event) => {
    // Skip non-GET requests
    if (event.request.method !== 'GET') {
        return;
    }

    // Skip Firebase and external requests
    if (event.request.url.includes('firebase') ||
        event.request.url.includes('google') ||
        event.request.url.includes('gstatic')) {
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then((cachedResponse) => {
                // Return cached version if available
                if (cachedResponse) {
                    return cachedResponse;
                }

                // Otherwise fetch from network
                return fetch(event.request)
                    .then((response) => {
                        // Don't cache if not a valid response
                        if (!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }

                        // Clone the response
                        const responseToCache = response.clone();

                        // Cache dynamic content
                        caches.open(DYNAMIC_CACHE_NAME)
                            .then((cache) => {
                                cache.put(event.request, responseToCache);
                            });

                        return response;
                    })
                    .catch(() => {
                        // Return offline page for navigation requests
                        if (event.request.mode === 'navigate') {
                            return caches.match('/');
                        }
                    });
            })
    );
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
    console.log('Service Worker: Background sync', event.tag);

    if (event.tag === 'background-sync') {
        event.waitUntil(syncOfflineData());
    } else if (event.tag === 'team-sync') {
        event.waitUntil(syncTeamData());
    } else if (event.tag === 'game-sync') {
        event.waitUntil(syncGameData());
    }
});

// Sync offline data when connection is restored
async function syncOfflineData() {
    try {
        console.log('Service Worker: Syncing offline data...');

        // Get offline data from IndexedDB
        const offlineData = await getOfflineData();

        if (offlineData.length > 0) {
            // Send data to server when online
            for (const item of offlineData) {
                await syncDataItem(item);
            }

            // Clear synced data from IndexedDB
            await clearSyncedData();

            // Notify app of successful sync
            self.clients.matchAll().then(clients => {
                clients.forEach(client => {
                    client.postMessage({
                        type: 'SYNC_COMPLETE',
                        data: { synced: offlineData.length }
                    });
                });
            });
        }
    } catch (error) {
        console.error('Service Worker: Sync failed', error);

        // Notify app of sync failure
        self.clients.matchAll().then(clients => {
            clients.forEach(client => {
                client.postMessage({
                    type: 'SYNC_FAILED',
                    error: error.message
                });
            });
        });
    }
}

// Sync team data specifically
async function syncTeamData() {
    console.log('Service Worker: Syncing team data...');
    // Implementation for team-specific sync
}

// Sync game data specifically
async function syncGameData() {
    console.log('Service Worker: Syncing game data...');
    // Implementation for game-specific sync
}

// Get offline data from IndexedDB
async function getOfflineData() {
    return new Promise((resolve) => {
        // Simulate getting data from IndexedDB
        // In a real implementation, this would read from IndexedDB
        resolve([]);
    });
}

// Sync individual data item
async function syncDataItem(item) {
    // Simulate API call to sync data
    console.log('Service Worker: Syncing item', item);
}

// Clear successfully synced data
async function clearSyncedData() {
    console.log('Service Worker: Clearing synced data...');
}

// Push notifications (for future use)
self.addEventListener('push', (event) => {
    console.log('Service Worker: Push received');

    const options = {
        body: event.data ? event.data.text() : 'New update available!',
        icon: '/manifest-icon-192.png',
        badge: '/manifest-icon-72.png',
        vibrate: [200, 100, 200],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: 1
        },
        actions: [
            {
                action: 'explore',
                title: 'View',
                icon: '/manifest-icon-72.png'
            },
            {
                action: 'close',
                title: 'Close',
                icon: '/manifest-icon-72.png'
            }
        ]
    };

    event.waitUntil(
        self.registration.showNotification('SimpleSquad Manager', options)
    );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
    console.log('Service Worker: Notification clicked');

    event.notification.close();

    if (event.action === 'explore') {
        event.waitUntil(
            clients.openWindow('/')
        );
    }
});