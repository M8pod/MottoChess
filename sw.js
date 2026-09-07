// Service worker: l'app resta installabile e utilizzabile offline, ma il
// codice viene preso dalla rete quando c'è connessione.
//
// Con la vecchia strategia cache-first anche per HTML/JS/CSS, un
// aggiornamento poteva restare invisibile per uno o più avvii e — quel che è
// peggio — una versione difettosa finita in cache non si sarebbe mai
// auto-corretta. Ora: codice dell'app network-first (con la cache come
// riserva offline), asset pesanti e immutabili (audio, immagini, motore
// Stockfish) cache-first.
const CACHE_NAME = 'motto-chess-v2';
const PRECACHE = ['./', './index.html', './manifest.webmanifest'];

function isAppCode(request, url) {
  if (request.mode === 'navigate') return true;
  if (url.pathname.includes('/vendor/')) return false; // librerie, mai modificate
  return /\.(js|css|html|webmanifest)$/.test(url.pathname);
}

async function networkFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const response = await fetch(request);
    if (response && response.status === 200) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    const cached = (await cache.match(request)) || (await cache.match('./index.html'));
    if (cached) return cached;
    throw err;
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response && response.status === 200) {
    cache.put(request, response.clone());
  }
  return response;
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    isAppCode(request, url) ? networkFirst(request) : cacheFirst(request)
  );
});
