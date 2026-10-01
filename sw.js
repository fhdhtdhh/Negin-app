const V = 'negin-v2';
const CORE = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(V)
      .then(cache => cache.addAll(CORE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(key => key !== V).map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  const sameOrigin = url.origin === self.location.origin;
  const allowedExternal = /(^|\\.)fonts\\.(googleapis|gstatic)\\.com$/.test(url.hostname);
  if (!sameOrigin && !allowedExternal) return;

  event.respondWith((async () => {
    const cached = await caches.match(request);

    try {
      const response = await fetch(request);
      if (response && (response.ok || response.type === 'opaque')) {
        const copy = response.clone();
        const cache = await caches.open(V);
        await cache.put(request, copy);
      }
      return response;
    } catch (error) {
      if (cached) return cached;
      if (request.mode === 'navigate') {
        return caches.match('./index.html');
      }
      return new Response('', { status: 503, statusText: 'Offline' });
    }
  })());
});
