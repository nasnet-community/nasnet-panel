/// <reference types="vitest" />
import path from 'path';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react() as any],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['@testing-library/jest-dom/vitest', './src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['node_modules/', 'dist/', 'e2e/'],
    // Coverage configuration per Story 1.6 requirements
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage',
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/types/**',
        '**/__mocks__/**',
        '**/__fixtures__/**',
      ],
      // Coverage thresholds: 80% line, 75% branch (enforced)
      thresholds: {
        lines: 80,
        branches: 75,
        functions: 75,
        statements: 80,
      },
    },
    // Performance optimization
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
    // Watch mode configuration
    watch: true,
    watchExclude: ['node_modules/**', 'dist/**'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@nasnet/core/types': path.resolve(__dirname, '../../libs/core/types/src'),
      '@nasnet/core/utils': path.resolve(__dirname, '../../libs/core/utils/src'),
      '@nasnet/core/constants': path.resolve(__dirname, '../../libs/core/constants/src'),
      '@nasnet/core/forms': path.resolve(__dirname, '../../libs/core/forms/src'),
      '@nasnet/core/i18n': path.resolve(__dirname, '../../libs/core/i18n/src'),
      '@nasnet/ui/layouts': path.resolve(__dirname, '../../libs/ui/layouts/src'),
      '@nasnet/ui/primitives': path.resolve(__dirname, '../../libs/ui/primitives/src'),
      '@nasnet/ui/patterns': path.resolve(__dirname, '../../libs/ui/patterns/src'),
      '@nasnet/ui/tokens': path.resolve(__dirname, '../../libs/ui/tokens/src'),
      '@nasnet/state/stores': path.resolve(__dirname, '../../libs/state/stores/src'),
      '@nasnet/api-client/core': path.resolve(__dirname, '../../libs/api-client/core/src'),
      '@nasnet/api-client/generated': path.resolve(__dirname, '../../libs/api-client/generated'),
      '@nasnet/api-client/queries': path.resolve(__dirname, '../../libs/api-client/queries/src'),
    },
  },
});
