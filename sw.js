/* =====================================================================
   SUTO PRODUÇÃO — Service Worker
   Cache isolado do sistema (prefixo sutoprod-)
   ===================================================================== */
const CACHE_VERSION = 'v2';
const CACHE_STATIC  = 'sutoprod-static-' + CACHE_VERSION;
const CACHE_DYNAMIC = 'sutoprod-dynamic-' + CACHE_VERSION;

const STATIC_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  'https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap',
  'https://cdn.jsdelivr.net/npm/chart.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_STATIC).then(cache =>
      Promise.allSettled(STATIC_ASSETS.map(url => cache.add(url)))
    ).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => (k.startsWith('sutoprod-') || k.startsWith('ominyprod-')) && k !== CACHE_STATIC && k !== CACHE_DYNAMIC)
            .map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Nunca cachear chamadas ao Supabase (dados sempre frescos)
  if (url.hostname.endsWith('supabase.co')) {
    event.respondWith(fetch(req).catch(() => new Response('{"error":"offline"}', {headers:{'Content-Type':'application/json'}})));
    return;
  }

  // HTML: network-first
  if (req.mode === 'navigate' || (req.headers.get('accept')||'').includes('text/html')) {
    event.respondWith(
      fetch(req).then(res => {
        const copy = res.clone();
        caches.open(CACHE_DYNAMIC).then(c => c.put(req, copy));
        return res;
      }).catch(() => caches.match(req).then(r => r || caches.match('./index.html')))
    );
    return;
  }

  // Demais assets: cache-first com atualização em background
  event.respondWith(
    caches.match(req).then(cached => {
      const fetchPromise = fetch(req).then(res => {
        const copy = res.clone();
        caches.open(CACHE_DYNAMIC).then(c => c.put(req, copy));
        return res;
      }).catch(() => cached);
      return cached || fetchPromise;
    })
  );
});
