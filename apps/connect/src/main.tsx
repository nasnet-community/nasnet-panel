import { StrictMode } from 'react';

import { RouterProvider, createRouter } from '@tanstack/react-router';
import * as ReactDOM from 'react-dom/client';

import { routeTree } from './routeTree.gen';

// Initialize i18n before app render - must be imported early
// @see NAS-4.22: Implement Internationalization (i18n) Setup
import '@nasnet/core/i18n';

import './styles.css';

// Initialize XState Inspector in development mode
// This provides visual debugging tools for state machines
// @see NAS-4.6: Implement Complex Flows with XState
if (import.meta.env.DEV) {
  import('@statelyai/inspect').then(({ createBrowserInspector }) => {
    createBrowserInspector({
      // Opens in a new browser tab/window
      autoStart: true,
    });
  });
}

// Create the router instance
const router = createRouter({ routeTree });

// Register the router instance for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement,
);

root.render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
