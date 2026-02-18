/**
 * MSW Browser Configuration for Storybook/Development
 *
 * This file sets up the MSW service worker for use in the browser.
 * Used primarily for Storybook and development environments.
 *
 * Usage:
 * 1. Initialize MSW in Storybook: .storybook/preview.ts
 * 2. Start the worker: worker.start()
 *
 * To use in development:
 * import { worker } from '@/mocks/browser';
 * if (import.meta.env.DEV) {
 *   worker.start();
 * }
 */

import { setupWorker } from 'msw/browser';

import { handlers } from './handlers';

// Create the MSW worker with default handlers
export const worker = setupWorker(...handlers);

// Export handlers for selective use
export { handlers };
