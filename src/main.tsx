import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';
import { AuthProvider } from '@/contexts/AuthContext';
import { ErrorBoundary } from '@/components/common';
import App from './App';
import './styles/index.css';
import { initSentry } from './lib/sentry';
import '@/i18n';

initSentry();

if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  // Earlier builds cached /api/ responses (incl. admin data) in this
  // runtime cache; Workbox never deletes a cache dropped from its config.
  if ('caches' in window) {
    void caches.delete('ljf-api').catch(() => {
      /* Cache Storage may be unavailable (private mode) */
    });
  }
  window.addEventListener('load', () => {
    void navigator.serviceWorker.register('/sw.js').catch(() => {
      /* PWA optional when SW fails to register */
    });
  });
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 30_000,
    },
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <HelmetProvider>
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <AuthProvider>
              <App />
            </AuthProvider>
          </BrowserRouter>
        </QueryClientProvider>
      </HelmetProvider>
    </ErrorBoundary>
  </StrictMode>,
);
