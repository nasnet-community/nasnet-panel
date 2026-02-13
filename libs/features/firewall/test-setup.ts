/**
 * Vitest test setup for firewall feature
 */

import '@testing-library/jest-dom/vitest';
import { toHaveNoViolations } from 'jest-axe';

// Add jest-axe matchers
expect.extend(toHaveNoViolations);

// Mock ResizeObserver (not available in JSDOM)
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};
