import { createRoot } from 'react-dom/client';
import { App } from './App';
import { store } from './api';
import type { Router } from '@nasnet/mocks';

declare global {
  interface Window {
    __MOCKS__?: typeof store;
    __SEED_EMPTY__?: boolean;
    __PENDING_SEEDS__?: Array<Partial<Router> & { id: string }>;
  }
}

if (typeof window !== 'undefined') {
  if (process.env.NODE_ENV !== 'production') {
    window.__MOCKS__ = store;
  }
  const persisted = (() => {
    try {
      return Boolean(window.localStorage?.getItem('nasnet-panel.mock-store.v3'));
    } catch {
      return false;
    }
  })();
  if (!persisted) {
    if (window.__SEED_EMPTY__) {
      store.seedEmpty();
    }
    if (Array.isArray(window.__PENDING_SEEDS__)) {
      for (const seed of window.__PENDING_SEEDS__) {
        store.seedRouter(seed);
      }
    }
  }
}

const container = document.getElementById('root');
if (!container) throw new Error('Missing #root element');

createRoot(container).render(<App />);
