const CACHE = 'sollycoinverse-v1';

const PRECACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/icon-180.png',
  '/css/main.css',
  '/src/Constants.js',
  '/src/ChapterPrices.js',
  '/src/ErrorHandler.js',
  '/src/SecurityManager.js',
  '/src/EventBus.js',
  '/src/Logger.js',
  '/src/StorageAdapter.js',
  '/src/DatabaseManager.js',
  '/src/GameManager.js',
  '/src/ChapterManager.js',
  '/src/Level2Manager.js',
  '/src/UserInterface.js',
  '/src/SollyCore.js',
  '/src/CollisionManager.js',
  '/src/galaxy.js',
  '/src/portal.js',
  '/src/animation.js',
  '/src/chapter2.js',
  '/src/chapter3.js',
  '/src/chapter4.js',
  '/src/chapter5.js',
  '/src/RedTakeover.js',
  '/src/GameEnding.js',
  '/src/GameEndingCinematic.js',
  '/src/GameIntro.js',
  '/src/AudioManager.js',
  '/src/main.js',
  '/images/parallax/layer1.png',
  '/images/parallax/layer2.png',
  '/images/parallax/layer3.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(PRECACHE)).then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (e) => {
  // Alleen GET requests cachen, externe CDN requests network-first
  if (e.request.method !== 'GET') return;

  const url = new URL(e.request.url);
  const isExternal = url.origin !== self.location.origin;

  if (isExternal) {
    // CDN libs: network first, cache als fallback
    e.respondWith(
      fetch(e.request)
        .then((res) => {
          const clone = res.clone();
          caches.open(CACHE).then((c) => c.put(e.request, clone));
          return res;
        })
        .catch(() => caches.match(e.request)),
    );
    return;
  }

  // Lokale bestanden: cache first, network als fallback
  e.respondWith(
    caches.match(e.request).then((cached) => {
      if (cached) return cached;
      return fetch(e.request).then((res) => {
        if (res.ok) {
          const clone = res.clone();
          caches.open(CACHE).then((c) => c.put(e.request, clone));
        }
        return res;
      });
    }),
  );
});
