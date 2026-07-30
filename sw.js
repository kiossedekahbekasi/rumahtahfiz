/**
 * Service worker minimal untuk Kios Sedekah.
 * Hanya menyimpan cadangan (cache) app-shell statis (index.html, manifest, ikon)
 * supaya halaman tetap bisa terbuka saat offline atau koneksi lambat.
 * PENTING: data (tugas/produk/pesanan/dsb) tetap selalu diambil langsung dari
 * internet (Google Apps Script) — service worker ini TIDAK meng-cache
 * permintaan ke Apps Script, supaya data yang tampil selalu yang terbaru.
 */
const CACHE_NAME = 'kios-sedekah-shell-v1';
const SHELL_FILES = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(SHELL_FILES))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  // Jangan pernah cache permintaan ke Google Apps Script (data selalu live)
  // atau permintaan non-GET.
  if (req.method !== 'GET' || req.url.indexOf('script.google.com') !== -1) return;

  event.respondWith(
    caches.match(req).then((cached) => {
      const network = fetch(req).then((res) => {
        if (res && res.status === 200 && res.type === 'basic') {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
        }
        return res;
      }).catch(() => cached);
      return cached || network;
    })
  );
});
