import { defineWorkspace } from 'vitest/config';

/**
 * Vitest Workspace Configuration
 *
 * This configuration enables running tests across the monorepo with a single command.
 * Each project can have its own vitest.config.ts for project-specific settings.
 *
 * Coverage thresholds (per ADR-015 Testing Trophy):
 * - 80% line coverage
 * - 75% branch coverage
 *
 * Run tests:
 * - npm run test           - Run all tests
 * - npm run test:watch     - Watch mode for connect app
 * - npm run test:coverage  - Run with coverage reports
 * - npm run test:ui        - Open Vitest UI
 */
export default defineWorkspace([
  // Main React application
  'apps/connect/vitest.config.ts',

  // Library projects with explicit configs
  'libs/api-client/core/vitest.config.ts',
  'libs/state/stores/vitest.config.ts',

  // Auto-discovered test files in libs that don't have explicit configs
  {
    test: {
      name: 'libs-core-utils',
      root: './libs/core/utils',
      include: ['src/**/*.{test,spec}.{ts,tsx}'],
      environment: 'node',
      globals: true,
    },
  },
  {
    test: {
      name: 'libs-core-i18n',
      root: './libs/core/i18n',
      include: ['src/**/*.{test,spec}.{ts,tsx}'],
      environment: 'jsdom',
      globals: true,
    },
  },
  {
    test: {
      name: 'libs-ros-cmd-generator',
      root: './libs/ros-cmd-generator',
      include: ['src/**/*.{test,spec}.{ts,tsx}'],
      environment: 'node',
      globals: true,
    },
  },
  // Core types library
  'libs/core/types/vitest.config.ts',

  // API client queries library
  'libs/api-client/queries/vitest.config.ts',

  // UI layouts library
  'libs/ui/layouts/vitest.config.ts',

  // UI patterns library (WCAG AAA accessibility testing)
  'libs/ui/patterns/vitest.config.ts',

  // Features alerts library
  'libs/features/alerts/vitest.config.ts',

  // Features services library
  'libs/features/services/vitest.config.ts',
]);
