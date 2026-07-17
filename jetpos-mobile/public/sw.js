// Service Worker (PWA) — NETWORK-FIRST.
//
// Eski sürüm cache-first idi ve sabit CACHE_NAME (v1) kullanıyordu: kurulumda
// '/' ve '/dashboard' HTML'ini cache'leyip her istekte önce cache'ten veriyordu.
// Yeni deploy'da Next içerik-hash'li yeni JS chunk'ları üretince, cache'teki ESKİ
// HTML ölü chunk'lara (404) işaret ediyor → JS yüklenemiyor → BEYAZ EKRAN.
//
// Çözüm: network-first (her zaman taze HTML/chunk), cache yalnızca offline yedeği.
// Versiyon bump + skipWaiting + clients.claim → bozuk eski SW anında değişir.

const CACHE_NAME = 'jetpos-mobile-v2';
const OFFLINE_URLS = ['/', '/dashboard'];

self.addEventListener('install', (event) => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(OFFLINE_URLS).catch(() => {}))
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys()
            .then((names) => Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n))))
            .then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    const req = event.request;
    if (req.method !== 'GET') return;

    let url;
    try { url = new URL(req.url); } catch { return; }

    // Sadece kendi origin'imiz. API ve Supabase/dış istekler cache'lenmez.
    if (url.origin !== self.location.origin) return;
    if (url.pathname.startsWith('/api/')) return;

    // NETWORK-FIRST: her zaman taze içerik; ağ yoksa cache'e düş.
    event.respondWith(
        fetch(req)
            .then((res) => {
                if (res && res.status === 200 && res.type === 'basic') {
                    const copy = res.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(req, copy)).catch(() => {});
                }
                return res;
            })
            .catch(() => caches.match(req).then((cached) => cached || caches.match('/')))
    );
});
