// Service Worker for PWA offline support

const CACHE_NAME = 'crm-cache-v2';
const urlsToCache = [
  '/',
  '/dashboard',
  '/activities',
  '/customers',
  '/products',
  '/leads',
  '/static/css/main.css',
  '/static/js/main.js'
];

// Install event - cache resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
  self.skipWaiting();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  // Never intercept API or websocket calls — they must reach the server untouched
  // and must never be cached. Cache-API rejects POST/PUT/DELETE which can also
  // cause body-stream errors in callers.
  const url = new URL(event.request.url);
  if (
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/ws/') ||
    event.request.method !== 'GET'
  ) {
    return; // let the browser handle it normally
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache hit - return response
        if (response) {
          return response;
        }

        // Clone the request
        const fetchRequest = event.request.clone();

        return fetch(fetchRequest).then((response) => {
          // Check if valid response
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // Clone the response
          const responseToCache = response.clone();

          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache);
            });

          return response;
        }).catch(() => {
          // Offline fallback
          return caches.match('/offline.html');
        });
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Background sync for offline data
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-locations') {
    event.waitUntil(syncOfflineData());
  }
});

async function syncOfflineData() {
  // This will be triggered when device comes back online
  console.log('Syncing offline data...');
  // The actual sync logic is in locationTracking.js
}
