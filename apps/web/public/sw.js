/* BrewLite service worker.
 * Installability only. Ordering still requires the network.
 * Do not cache API calls or order pages.
 */
self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/api')) return;

  // A fetch listener is required for the install prompt.
  // The response still comes from the network.
  event.respondWith(fetch(request));
});
