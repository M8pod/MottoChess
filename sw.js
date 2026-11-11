// Service worker: l'app resta installabile e utilizzabile offline, ma il
// codice viene preso dalla rete quando c'è connessione.
//
// Strategie:
//  - codice dell'app (HTML/JS/CSS/manifest): network-first, con la cache
//    come riserva offline. Un aggiornamento si vede al primo avvio online.
//  - immagini e suoni (assets/): stale-while-revalidate. Si risponde subito
//    con la copia in cache (veloce, funziona offline) e intanto si scarica la
//    versione aggiornata per la volta successiva. Prima erano cache-first
//    per sempre: sostituire un file mantenendo lo stesso nome (es. un
//    disegno rifatto, o la sigla di chiusura definitiva al posto del
//    segnaposto) non sarebbe mai arrivato a chi aveva già l'app.
//  - librerie (src/vendor/, compreso il motore Stockfish da alcuni MB):
//    cache-first, non cambiano mai senza cambiare anche il nome della cache.
//
// Quando si aggiorna una libreria in vendor/, incrementare CACHE_NAME.
const CACHE_NAME = 'motto-chess-v3';
const PRECACHE = ['./', './index.html', './manifest.webmanifest'];

function strategyFor(request, url) {
  if (request.mode === 'navigate') return 'network-first';
  if (url.pathname.includes('/vendor/')) return 'cache-first';
  if (url.pathname.includes('/assets/')) return 'stale-while-revalidate';
  if (/\.(js|css|html|webmanifest)$/.test(url.pathname)) return 'network-first';
  return 'stale-while-revalidate';
}

function isCacheable(response) {
  return response && response.status === 200 && response.type === 'basic';
}

async function networkFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const response = await fetch(request);
    if (isCacheable(response)) cache.put(request, response.clone());
    return response;
  } catch (err) {
    const cached = await cache.match(request);
    if (cached) return cached;
    // La pagina index.html come riserva vale SOLO per la navigazione: prima
    // veniva restituita anche al posto di un file JavaScript o CSS mancante,
    // e il browser provava a eseguire HTML come codice (app bloccata).
    if (request.mode === 'navigate') {
      const shell = await cache.match('./index.html');
      if (shell) return shell;
    }
    throw err;
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (isCacheable(response)) cache.put(request, response.clone());
  return response;
}

async function staleWhileRevalidate(event) {
  const { request } = event;
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  const refresh = fetch(request)
    .then((response) => {
      if (isCacheable(response)) cache.put(request, response.clone());
      return response;
    })
    .catch(() => null);
  if (cached) {
    event.waitUntil(refresh);
    return cached;
  }
  const fresh = await refresh;
  if (fresh) return fresh;
  return Response.error();
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
  // Le richieste parziali (Range) arrivano dagli elementi <audio> in
  // streaming: le lasciamo alla rete/cache HTTP del browser, perché una
  // risposta 206 non si può mettere in cache e una 200 intera al posto di
  // una 206 confonde Safari.
  if (request.headers.has('range')) return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  const strategy = strategyFor(request, url);
  if (strategy === 'network-first') {
    event.respondWith(networkFirst(request));
  } else if (strategy === 'cache-first') {
    event.respondWith(cacheFirst(request));
  } else {
    event.respondWith(staleWhileRevalidate(event));
  }
});
