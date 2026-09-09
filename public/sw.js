/**
 * sw.js - Service Worker do NossoBolso Finance OS
 * Implementa cache offline, estratégias Network-First com fallback de cache
 * e suporte a PWA instalável.
 */

const CACHE_NAME = 'nosso-bolso-v2.0.0';

// Limite de entradas em cache para evitar crescimento descontrolado em builds sucessivos
const MAX_CACHE_ITEMS = 120;

const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.svg',
  '/icon.svg',
  '/pwa-192x192.png',
  '/pwa-512x512.png',
];

// Remove as entradas mais antigas quando o cache excede o limite estabelecido
async function trimCache() {
  const cache = await caches.open(CACHE_NAME);
  const keys = await cache.keys();
  if (keys.length > MAX_CACHE_ITEMS) {
    const toRemove = keys.length - MAX_CACHE_ITEMS;
    for (let i = 0; i < toRemove; i++) {
      await cache.delete(keys[i]);
    }
  }
}

// Ouve o comando de atualização vindo do UpdateBanner
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Instalação: Pré-carrega o shell da aplicação (permanece em waiting até o usuário atualizar)
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS);
    })
  );
});

// Ativação: Limpa versões anteriores de cache e assume controle imediato
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) {
            return caches.delete(name);
          }
        })
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// Fetch: Estratégia de Cache para SPA Offline
self.addEventListener('fetch', (event) => {
  const request = event.request;

  // Ignora requisições que não sejam GET (ex: POST, PUT, DELETE do Dexie/Supabase)
  if (request.method !== 'GET') {
    return;
  }

  // Ignora chamadas para APIs externas ou extensões do Chrome
  const url = new URL(request.url);
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // 1. Navegação (HTML da SPA): Network-First com fallback para cache do index.html
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone).then(() => trimCache());
            });
          }
          return networkResponse;
        })
        .catch(() => {
          return caches.match('/index.html') || caches.match('/');
        })
    );
    return;
  }

  // 2. Assets Estáticos (JS, CSS, Imagens, Fontes): Cache-First com revalidação
  if (
    url.pathname.startsWith('/assets/') ||
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.png') ||
    url.hostname.includes('fonts.googleapis.com') ||
    url.hostname.includes('fonts.gstatic.com')
  ) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          // Revalida em background para manter sempre atualizado
          fetch(request)
            .then((networkResponse) => {
              if (networkResponse && networkResponse.status === 200) {
                caches.open(CACHE_NAME).then((cache) => {
                  cache.put(request, networkResponse).then(() => trimCache());
                });
              }
            })
            .catch(() => {
              // Silenciosamente offline
            });
          return cachedResponse;
        }

        return fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone).then(() => trimCache());
            });
          }
          return networkResponse;
        });
      })
    );
    return;
  }

  // 3. Demais requisições: Tenta rede, fallback de cache se disponível
  event.respondWith(
    fetch(request).catch(() => {
      return caches.match(request);
    })
  );
});