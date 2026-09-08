import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import './index.css';
import { registerServiceWorker } from './servicos/serviceWorkerRegistration';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Ativa o Service Worker para cache offline e comportamento PWA
registerServiceWorker();
