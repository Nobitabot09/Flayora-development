const CACHE = 'flayora-shell-v1';
const SHELL = ['/', '/manifest.webmanifest', '/icons/flayora.svg'];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;
  if (request.url.includes('/api/') || request.url.includes('flayora-catalog')) return;
  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).catch(() => caches.match('/')));
    return;
  }
  if (request.url.endsWith('/manifest.webmanifest') || request.url.endsWith('/icons/flayora.svg')) {
    event.respondWith(caches.match(request).then(cached => cached || fetch(request)));
  }
});