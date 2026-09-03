// Enhanced Service Worker for offline-first caching and standalone PWA experience

const CACHE_NAME = 'banban-copool-v2';
const STATIC_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon.svg'
];

// Install: Pre-cache core shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('PWA Pre-cache failed for some assets:', err);
      });
    })
  );
  self.skipWaiting();
});

// Activate: Clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Strategy: Network First with Cache Fallback for navigation and assets
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Do not intercept non-GET requests or Google Apps Script API calls
  if (request.method !== 'GET' || url.hostname.includes('script.google.com') || url.hostname.includes('api.line.me')) {
    return;
  }

  // HTML navigation requests
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
          }
          return response;
        })
        .catch(async () => {
          const cachedResponse = await caches.match(request);
          if (cachedResponse) return cachedResponse;
          return caches.match('/index.html');
        })
    );
    return;
  }

  // Static Assets (scripts, styles, icons, fonts)
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const fetchPromise = fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
          }
          return networkResponse;
        })
        .catch(() => cachedResponse);

      return cachedResponse || fetchPromise;
    })
  );
});

// Notification Click: Focus existing app window or open it
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If a window is already open, focus it
      for (const client of clientList) {
        if (client.url && 'focus' in client) {
          return client.focus();
        }
      }
      // If no window is open, open a new one
      if (self.clients.openWindow) {
        return self.clients.openWindow('./');
      }
    })
  );
});

// Push Event: Handle background push messages
self.addEventListener('push', (event) => {
  let title = '伴伴記❤️ 帳目新通知';
  let body = '您有一則新的伴侶記帳動態！';
  let data = {};

  if (event.data) {
    try {
      const payload = event.data.json();
      title = payload.title || title;
      body = payload.body || payload.desc || body;
      data = payload.data || {};
    } catch (e) {
      body = event.data.text() || body;
    }
  }

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: './icon.svg',
      badge: './icon.svg',
      vibrate: [150, 80, 150],
      data: { url: './', ...data }
    })
  );
});
