import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './components/App';
import ErrorBoundary from './components/ErrorBoundary';
import './index.css';
import { registerServiceWorker } from './utils/pwa';

// Clean up any stale development caches from earlier Service Worker versions
if (typeof window !== 'undefined' && 'caches' in window) {
  caches.keys().then((names) => {
    names.forEach((name) => {
      if (name !== 'fossiles-pwa-v8') {
        caches.delete(name);
      }
    });
  }).catch(() => {});
}

// Register Service Worker for offline PWA capabilities
registerServiceWorker();

const renderApp = () => {
  const rootElement = document.getElementById('root');
  if (rootElement) {
    (window as any).__APP_MOUNTED__ = true;
    createRoot(rootElement).render(
      <StrictMode>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </StrictMode>,
    );
  } else {
    console.error("Root element not found!");
  }
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', renderApp);
} else {
  renderApp();
}
