import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import './index.css';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { registerServiceWorker } from './servicos/serviceWorkerRegistration';

// Captura global de exceções não tratadas
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    console.error('Unhandled runtime error:', event.error || event.message);
  });
  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
  });

  // Captura global persistente do evento nativo de instalação PWA
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    (window as unknown as { deferredPrompt?: Event }).deferredPrompt = e;
    window.dispatchEvent(new CustomEvent('nossobolso:pwa-installable'));
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);

// Ativa o Service Worker para cache offline e comportamento PWA
registerServiceWorker();
