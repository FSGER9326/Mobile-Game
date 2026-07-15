const CACHE = 'ashen-crown-v10';
const ASSETS = [
  './',
  './index.html',
  './style.css',
  './battle-polish.css',
  './manifest.webmanifest',
  './src/game-core.js',
  './src/world-a.js',
  './src/visual-upgrade.js',
  './src/runtime-fixes.js',
  './src/world-b.js',
  './src/world-c.js',
  './src/battle-a.js',
  './src/battle-b.js',
  './src/battle-tactics.js',
  './src/battle-elements.js',
  './src/battle-stage.js',
  './src/battle-effects.js',
  './src/ui-a.js',
  './src/ui-b.js',
  './assets/icons/icon.svg'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request).then(response => {
      const clone = response.clone();
      caches.open(CACHE).then(cache => cache.put(event.request, clone));
      return response;
    }).catch(() => caches.match('./index.html')))
  );
});