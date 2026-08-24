import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './components/App';
import ErrorBoundary from './components/ErrorBoundary';
import './index.css';

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
