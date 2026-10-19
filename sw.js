// Funziona anche senza internet dopo la prima visita
const CACHE = 'regno-magico-v2';
const FILES = ['./', 'index.html', 'css/style.css', 'manifest.json', 'icon.svg', 'icon-192.png', 'icon-512.png',
  'js/core.js', 'js/unicorn.js', 'js/fly.js', 'js/bubbles.js', 'js/memory.js', 'js/dress.js',
  'js/draw.js', 'js/pet.js', 'js/piano.js', 'js/album.js', 'js/main.js'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE && k.startsWith('regno-magico-v')).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  // rete prima (così gli aggiornamenti arrivano subito), cache se offline
  e.respondWith(fetch(e.request).then(r => {
    const copy = r.clone();
    if (r.ok || r.type === 'opaque') caches.open(CACHE).then(c => c.put(e.request, copy));
    return r;
  }).catch(() => caches.match(e.request).then(m => m || caches.match('index.html'))));
});
