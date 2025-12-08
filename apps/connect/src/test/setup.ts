/**
 * Vitest setup file for @testing-library/jest-dom matchers
 * and common test utilities
 */

import '@testing-library/jest-dom';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// Cleanup after each test
afterEach(() => {
  cleanup();
});
