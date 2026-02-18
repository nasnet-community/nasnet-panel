import path from 'path';

import { defineConfig } from 'vitest/config';

/**
 * Vitest Configuration for Patterns Library
 *
 * Configured for:
 * - JSDOM environment for React component testing
 * - axe-core integration for WCAG AAA accessibility testing
 * - Proper alias resolution for monorepo imports
 */
export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    coverage: {
      reportsDirectory: '../../../coverage/libs/ui/patterns',
      provider: 'v8',
      // Coverage thresholds per NAS-4A.24 requirements
      // Hooks and utilities require 90%+, components require 80%+
      thresholds: {
        lines: 80,
        branches: 75,
        functions: 75,
        statements: 80,
      },
      // Include all source files for coverage
      include: ['src/**/*.{ts,tsx}'],
      // Exclude test files and fixtures from coverage
      exclude: [
        'src/**/*.test.{ts,tsx}',
        'src/**/*.spec.{ts,tsx}',
        'src/test/**',
        'src/**/__tests__/**',
        'src/**/__fixtures__/**',
        'src/**/index.ts', // Re-export files
      ],
    },
  },
  resolve: {
    alias: {
      '@nasnet/ui/primitives': path.resolve(__dirname, '../primitives/src'),
      '@nasnet/ui/layouts': path.resolve(__dirname, '../layouts/src'),
      '@nasnet/ui/tokens': path.resolve(__dirname, '../tokens/dist'),
      '@nasnet/core/types': path.resolve(__dirname, '../../core/types/src'),
      '@nasnet/core/utils': path.resolve(__dirname, '../../core/utils/src'),
      '@nasnet/core/constants': path.resolve(
        __dirname,
        '../../core/constants/src'
      ),
      '@nasnet/core/i18n': path.resolve(__dirname, '../../core/i18n/src'),
      '@nasnet/core/forms': path.resolve(__dirname, '../../core/forms/src'),
      '@nasnet/state/stores': path.resolve(
        __dirname,
        '../../state/stores/src'
      ),
      '@nasnet/api-client/core': path.resolve(
        __dirname,
        '../../api-client/core/src'
      ),
      '@nasnet/api-client/queries': path.resolve(
        __dirname,
        '../../api-client/queries/src'
      ),
      '@nasnet/api-client/generated': path.resolve(
        __dirname,
        '../../api-client/generated'
      ),
      '@nasnet/features/router-discovery': path.resolve(
        __dirname,
        '../../features/router-discovery/src'
      ),
      '@nasnet/features/dashboard': path.resolve(
        __dirname,
        '../../features/dashboard/src'
      ),
      '@nasnet/features/firewall': path.resolve(
        __dirname,
        '../../features/firewall/src'
      ),
      '@nasnet/features/logs': path.resolve(
        __dirname,
        '../../features/logs/src'
      ),
      '@nasnet/features/wireless': path.resolve(
        __dirname,
        '../../features/wireless/src'
      ),
      '@nasnet/features/configuration-import': path.resolve(
        __dirname,
        '../../features/configuration-import/src'
      ),
    },
  },
});
