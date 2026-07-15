const CACHE = 'ashen-crown-v13-protagonist-identity';
const ASSETS = [
  './',
  './index.html',
  './style.css',
  './battle-polish.css',
  './creator.css',
  './manifest.webmanifest',
  './src/game-core.js',
  './src/world-a.js',
  './src/visual-upgrade.js',
  './src/runtime-fixes.js',
  './src/world-art-v2.js',
  './src/world-b.js',
  './src/world-c.js',
  './src/battle-a.js',
  './src/battle-b.js',
  './src/battle-tactics.js',
  './src/battle-ai.js',
  './src/battle-elements.js',
  './src/battle-stage.js',
  './src/battle-effects.js',
  './src/ui-a.js',
  './src/character-creator.js',
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
  const requestUrl = new URL(event.request.url);
  const isNavigation = event.request.mode === 'navigate' || requestUrl.pathname.endsWith('/index.html');

  if (isNavigation) {
    event.respondWith(
      fetch(event.request).then(response => {
        const copy = response.clone();
        caches.open(CACHE).then(cache => cache.put('./index.html', copy));
        return response;
      }).catch(() => caches.match('./index.html'))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cached => {
      const network = fetch(event.request).then(response => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE).then(cache => cache.put(event.request, copy));
        }
        return response;
      }).catch(() => cached);
      return cached || network;
    })
  );
});