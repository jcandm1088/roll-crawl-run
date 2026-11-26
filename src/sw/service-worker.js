/* Roll, Crawl, RUN service worker.
 * Built by vite.config.ts, which injects the precache file list and cache version at build time.
 * Strategy: precache the whole app shell on install; serve same-origin GET requests cache-first
 * (navigation requests fall back to the cached index.html). Only the app's own static files are
 * cached — never user data (which lives in IndexedDB and is never touched here).
 */
const PRECACHE = __PRECACHE_LIST__;
const CACHE = __CACHE_VERSION__;

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(PRECACHE)));
  // Do not skipWaiting automatically: the page asks the user before switching versions.
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k.startsWith('rcr-') && k !== CACHE).map((k) => caches.delete(k)));
      await self.clients.claim();
    })(),
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // external links are never intercepted

  if (req.mode === 'navigate') {
    event.respondWith(
      (async () => {
        const cache = await caches.open(CACHE);
        // A navigation to a precached file (e.g. ./licenses/*.txt) gets that file;
        // every other navigation gets the app shell.
        const exact = await cache.match(req, { ignoreSearch: true, ignoreVary: true });
        if (exact) return exact;
        return (await cache.match('./', { ignoreSearch: true })) || (await cache.match('./index.html')) || fetch(req);
      })(),
    );
    return;
  }

  event.respondWith(
    (async () => {
      const cached = await caches.match(req, { ignoreSearch: true, ignoreVary: true });
      if (cached) return cached;
      return fetch(req);
    })(),
  );
});
