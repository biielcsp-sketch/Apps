/* SUTO Produção — Service Worker (cache isolado prefixo sutoprod-) */
const CACHE_VERSION = 'v13';
const CACHE_STATIC  = 'sutoprod-static-' + CACHE_VERSION;
const CACHE_DYNAMIC = 'sutoprod-dynamic-' + CACHE_VERSION;
const ASSETS = ['./','./index.html','./manifest.json'];
self.addEventListener('install', e => { self.skipWaiting(); e.waitUntil(caches.open(CACHE_STATIC).then(c=>c.addAll(ASSETS).catch(()=>{}))); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k=>(k.startsWith('sutoprod-')||k.startsWith('ominyprod-'))&&k!==CACHE_STATIC&&k!==CACHE_DYNAMIC).map(k=>caches.delete(k)))).then(()=>self.clients.claim())); });
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  if (req.url.includes('supabase.co') || req.url.includes('cdn')) {
    e.respondWith(fetch(req).catch(()=>caches.match(req))); return;
  }
  e.respondWith(
    fetch(req).then(res => { const copy=res.clone(); caches.open(CACHE_DYNAMIC).then(c=>c.put(req,copy)); return res; })
              .catch(()=>caches.match(req).then(r=>r||caches.match('./index.html')))
  );
});
