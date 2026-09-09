/**
 * serviceWorkerRegistration.ts
 * Gerenciador de registro e ciclo de vida do Service Worker no NossoBolso.
 */

interface ServiceWorkerConfig {
  onSuccess?: (registration: ServiceWorkerRegistration) => void;
  onUpdate?: (registration: ServiceWorkerRegistration) => void;
}

let refreshing = false;

export function applyUpdate(registration: ServiceWorkerRegistration): void {
  if (registration.waiting) {
    registration.waiting.postMessage({ type: 'SKIP_WAITING' });
  }
}

export function registerServiceWorker(config?: ServiceWorkerConfig): void {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }

  // Recarrega a página de forma fluida quando o novo Service Worker assume o controle
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!refreshing) {
      refreshing = true;
      window.location.reload();
    }
  });

  window.addEventListener('load', () => {
    const swUrl = '/sw.js';

    navigator.serviceWorker
      .register(swUrl)
      .then((registration) => {
        // Se já existe um worker em waiting ao carregar
        if (registration.waiting && navigator.serviceWorker.controller) {
          if (config?.onUpdate) {
            config.onUpdate(registration);
          }
          window.dispatchEvent(
            new CustomEvent('nossobolso:update-available', { detail: { registration } })
          );
        }

        registration.onupdatefound = () => {
          const installingWorker = registration.installing;
          if (installingWorker == null) {
            return;
          }

          installingWorker.onstatechange = () => {
            if (installingWorker.state === 'installed') {
              if (navigator.serviceWorker.controller) {
                // Novo conteúdo disponível
                if (config?.onUpdate) {
                  config.onUpdate(registration);
                }
                window.dispatchEvent(
                  new CustomEvent('nossobolso:update-available', { detail: { registration } })
                );
              } else {
                // Conteúdo armazenado em cache para uso offline
                if (config?.onSuccess) {
                  config.onSuccess(registration);
                }
              }
            }
          };
        };
      })
      .catch((error: unknown) => {
        console.warn('Falha no registro do Service Worker:', error);
      });
  });
}

export function unregisterServiceWorker(): void {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then((registration) => {
        registration.unregister().catch((error: unknown) => {
          console.warn('Falha ao desregistrar Service Worker:', error);
        });
      })
      .catch((error: unknown) => {
        console.warn('Erro ao obter registro do Service Worker:', error);
      });
  }
}

