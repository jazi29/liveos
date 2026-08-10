/* ==========================================================
   service-worker.js вЂ” РѕС„Р»Р°Р№РЅ-РєСЌС€ С„Р°Р№Р»РѕРІ РїСЂРёР»РѕР¶РµРЅРёСЏ.
   Р”Р°РЅРЅС‹Рµ РїРѕР»СЊР·РѕРІР°С‚РµР»СЏ Р»РµР¶Р°С‚ РІ localStorage, Р° РЅРµ РІ РєСЌС€Рµ вЂ”
   Р·РґРµСЃСЊ РєСЌС€РёСЂСѓСЋС‚СЃСЏ С‚РѕР»СЊРєРѕ СЃС‚Р°С‚РёС‡РµСЃРєРёРµ С„Р°Р№Р»С‹.
   ========================================================== */

const CACHE_NAME = 'lifeos-cache-v4';
const APP_SHELL = [
  './',
  './index.html',
  './css/style.css',
  './js/storage.js',
  './js/dashboard.js',
  './js/tasks.js',
  './js/habits.js',
  './js/calendar.js',
  './js/statistics.js',
  './js/app.js',
  './manifest.json',
  './images/wallpaper.jpg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if(event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then(cached => {
      if(cached) return cached;
      return fetch(event.request)
        .then(res => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          return res;
        })
        .catch(() => cached);
    })
  );
});
