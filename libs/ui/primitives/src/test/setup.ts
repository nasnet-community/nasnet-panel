/**
 * Vitest Setup & Configuration
 *
 * Global test setup for all primitives tests:
 * - Extends vitest with axe-core accessibility matchers
 * - Sets up automatic cleanup after each test
 * - Mocks browser APIs (matchMedia, ResizeObserver)
 * - Provides React Testing Library matchers
 *
 * This file runs before all tests in the primitives package.
 * See vitest.config.ts for setup configuration.
 *
 * @see {@link ../../../vitest.config.ts} For test configuration
 */

import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { expect, afterEach } from 'vitest';
import * as matchers from 'vitest-axe/matchers';

// Extend vitest with axe-core matchers
expect.extend(matchers);

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock matchMedia for components that use it
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => true,
  }),
});

// Mock ResizeObserver for components that use it
class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

window.ResizeObserver = ResizeObserverMock;
