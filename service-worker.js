// =============================================
//  Service Worker — Astéro-Hache vs Arachnides
//  Cache-first strategy for full offline play
// =============================================

const CACHE_NAME = 'asterohache-v1';

// Liste tous les fichiers de ton jeu ici
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-72.png',
  '/icons/icon-96.png',
  '/icons/icon-128.png',
  '/icons/icon-192.png',
  '/icons/icon-512.png'
  // Ajoute ici tes fichiers JS/CSS séparés si tu en as :
  // '/game.js',
  // '/style.css',
];

// ── Installation : mise en cache des assets ──
self.addEventListener('install', event => {
  console.log('[SW] Installation...');
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('[SW] Mise en cache des fichiers du jeu');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  // Prend le contrôle immédiatement sans attendre le rechargement
  self.skipWaiting();
});

// ── Activation : nettoyage des anciens caches ──
self.addEventListener('activate', event => {
  console.log('[SW] Activation...');
  event.waitUntil(
    caches.keys().then(cacheNames =>
      Promise.all(
        cacheNames
          .filter(name => name !== CACHE_NAME)
          .map(name => {
            console.log('[SW] Suppression ancien cache :', name);
            return caches.delete(name);
          })
      )
    )
  );
  // Prend le contrôle de tous les clients immédiatement
  self.clients.claim();
});

// ── Fetch : cache-first, réseau en fallback ──
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      if (cachedResponse) {
        return cachedResponse; // Servi depuis le cache (offline OK)
      }
      // Pas en cache → réseau
      return fetch(event.request).then(networkResponse => {
        // Met en cache les nouvelles ressources dynamiquement
        if (
          networkResponse &&
          networkResponse.status === 200 &&
          networkResponse.type === 'basic'
        ) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      }).catch(() => {
        // Réseau indisponible et ressource absente du cache
        console.warn('[SW] Ressource non disponible offline :', event.request.url);
      });
    })
  );
});
