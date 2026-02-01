/**
 * Test Setup for Patterns Library
 *
 * Configures jest-dom and vitest-axe for accessibility testing.
 */

import '@testing-library/jest-dom/vitest';
import { expect } from 'vitest';
import * as matchers from 'vitest-axe/matchers';

// Extend Vitest's expect with axe matchers
expect.extend(matchers);
