// Conservatoire de Fossiles - Service Worker for PWA & Offline Support
const CACHE_NAME = 'fossiles-pwa-v8';

const PRECACHE_ASSETS = [
  './',
  './manifest.webmanifest',
  './manifest.json',
  './icons/icon.svg',
  './icons/icon-48x48.png',
  './icons/icon-72x72.png',
  './icons/icon-96x96.png',
  './icons/icon-128x128.png',
  './icons/icon-144x144.png',
  './icons/icon-192x192.png',
  './icons/icon-384x384.png',
  './icons/icon-512x512.png',
  './icons/icon-maskable-192x192.png',
  './icons/icon-maskable-512x512.png',
  './icons/apple-touch-icon.png',
  './icons/favicon.png',
  './favicon.ico',
  './screenshots/screenshot-mobile.png',
  './screenshots/screenshot-desktop.png'
];

// Install: Cache essential core shell assets immediately and skip waiting
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn('[SW] Precache non-blocking error:', err);
      });
    })
  );
});

// Activate: Clean up old cache versions, purge any accidentally cached dev assets, and claim clients
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) {
            console.log('[SW] Deleting obsolete cache:', name);
            return caches.delete(name);
          }
          return Promise.resolve();
        })
      );
    }).then(() => {
      // Also purge any accidental dev or module files from the current cache
      return caches.open(CACHE_NAME).then((cache) => {
        return cache.keys().then((requests) => {
          return Promise.all(
            requests.map((req) => {
              const u = new URL(req.url);
              if (
                u.pathname.startsWith('/src/') ||
                u.pathname.startsWith('/node_modules/') ||
                u.pathname.startsWith('/@') ||
                u.pathname.endsWith('.tsx') ||
                u.pathname.endsWith('.ts') ||
                u.search.includes('v=') ||
                u.search.includes('t=')
              ) {
                console.log('[SW] Purging dev module from cache:', req.url);
                return cache.delete(req);
              }
              return Promise.resolve();
            })
          );
        });
      });
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// Fetch: Never intercept Vite dev modules or source code; handle production assets with network-first fallback
self.addEventListener('fetch', (event) => {
  const request = event.request;

  // Only handle GET requests
  if (request.method !== 'GET') {
    return;
  }

  const url = new URL(request.url);

  // CRITICAL: NEVER cache or intercept development source files, TypeScript files,
  // Vite pre-bundled dependencies, or hot module updates.
  // Intercepting these causes duplicate or mismatched React instances and breaks hooks!
  if (
    url.pathname.startsWith('/src/') ||
    url.pathname.startsWith('/node_modules/') ||
    url.pathname.startsWith('/@') ||
    url.pathname.endsWith('.tsx') ||
    url.pathname.endsWith('.ts') ||
    url.pathname.includes('hot-update') ||
    url.search.includes('v=') ||
    url.search.includes('t=') ||
    url.search.includes('import')
  ) {
    return; // Pass through directly to browser network!
  }

  // Avoid caching external non-essential analytics or chrome extension requests
  if (!url.origin.includes(self.location.origin) && !url.origin.includes('fonts.googleapis.com') && !url.origin.includes('fonts.gstatic.com')) {
    return;
  }

  // Navigation requests (HTML)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return networkResponse;
        })
        .catch(async () => {
          const cachedResponse = await caches.match(request);
          if (cachedResponse) return cachedResponse;
          return caches.match('/index.html');
        })
    );
    return;
  }

  // JSON configuration data requests: Network-First with cache fallback
  if (url.pathname.endsWith('.json') || url.pathname.includes('/data/')) {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return networkResponse;
        })
        .catch(async () => {
          const cachedResponse = await caches.match(request);
          return cachedResponse || null;
        })
    );
    return;
  }

  // Static images and fonts: Stale-While-Revalidate
  if (url.pathname.startsWith('/icons/') || url.pathname.startsWith('/images/') || url.pathname.startsWith('/screenshots/') || url.pathname.endsWith('.png') || url.pathname.endsWith('.svg') || url.pathname.endsWith('.ico') || url.pathname.endsWith('.css')) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        const fetchPromise = fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const responseClone = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(request, responseClone);
              });
            }
            return networkResponse;
          })
          .catch(() => null);

        return cachedResponse || fetchPromise;
      })
    );
    return;
  }
});

// Handle skipWaiting message
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
