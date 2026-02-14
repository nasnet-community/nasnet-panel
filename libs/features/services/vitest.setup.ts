/**
 * Vitest Setup File for Services Feature
 *
 * Imports custom matchers from @testing-library/jest-dom
 * for enhanced assertions in component tests.
 *
 * Includes comprehensive mocks for:
 * - window.matchMedia (JSDOM compatibility)
 * - IntersectionObserver (for virtualization)
 * - ResizeObserver (for responsive components)
 */

import '@testing-library/jest-dom/vitest';

// Mock window.matchMedia (not available in JSDOM)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {}, // deprecated
    removeListener: () => {}, // deprecated
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => true,
  }),
});

// Mock IntersectionObserver (not available in JSDOM)
class MockIntersectionObserver implements IntersectionObserver {
  readonly root: Element | null = null;
  readonly rootMargin: string = '';
  readonly thresholds: ReadonlyArray<number> = [];

  constructor(
    public callback: IntersectionObserverCallback,
    public options?: IntersectionObserverInit
  ) {}

  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
}

(global as any).IntersectionObserver = MockIntersectionObserver;

// Mock ResizeObserver (not available in JSDOM)
class MockResizeObserver implements ResizeObserver {
  constructor(public callback: ResizeObserverCallback) {}

  observe() {}
  unobserve() {}
  disconnect() {}
}

(global as any).ResizeObserver = MockResizeObserver;

// Suppress console warnings from libraries during tests
const originalConsoleWarn = console.warn;
const originalConsoleError = console.error;

console.warn = (...args: any[]) => {
  const msg = args[0]?.toString?.() || '';
  // Suppress Zustand devtools warning
  if (msg.includes('devtools middleware')) return;
  // Suppress Apollo Client connectToDevTools deprecation
  if (msg.includes('connectToDevTools')) return;
  // Suppress i18next warnings
  if (msg.includes('i18next')) return;
  originalConsoleWarn.apply(console, args);
};

console.error = (...args: any[]) => {
  const msg = args[0]?.toString?.() || '';
  // Suppress invariant errors during tests
  if (msg.includes('invariant')) return;
  originalConsoleError.apply(console, args);
};
