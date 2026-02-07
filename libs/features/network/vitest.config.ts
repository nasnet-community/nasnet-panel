import { defineConfig } from 'vitest/config';
import path from 'path';

/**
 * Vitest Configuration for Network Feature
 *
 * Configured for:
 * - JSDOM environment for React component testing
 * - Proper alias resolution for monorepo imports
 * - 90% coverage target for components and hooks
 */
export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      thresholds: {
        lines: 90,
        branches: 85,
        functions: 90,
        statements: 90,
      },
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.test.{ts,tsx}',
        'src/**/*.spec.{ts,tsx}',
        'src/**/*.stories.{ts,tsx}',
        'src/**/index.ts',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@nasnet/ui/primitives': path.resolve(__dirname, '../../ui/primitives/src'),
      '@nasnet/ui/patterns': path.resolve(__dirname, '../../ui/patterns/src'),
      '@nasnet/ui/layouts': path.resolve(__dirname, '../../ui/layouts/src'),
      '@nasnet/ui/utils': path.resolve(__dirname, '../../ui/primitives/src/lib/utils.ts'),
      '@nasnet/ui/tokens': path.resolve(__dirname, '../../ui/tokens/dist'),
      '@nasnet/core/types': path.resolve(__dirname, '../../core/types/src'),
      '@nasnet/core/utils': path.resolve(__dirname, '../../core/utils/src'),
      '@nasnet/core/constants': path.resolve(__dirname, '../../core/constants/src'),
      '@nasnet/core/i18n': path.resolve(__dirname, '../../core/i18n/src'),
      '@nasnet/state/stores': path.resolve(__dirname, '../../state/stores/src'),
      '@nasnet/api-client/core': path.resolve(__dirname, '../../api-client/core/src'),
      '@nasnet/api-client/queries': path.resolve(__dirname, '../../api-client/queries/src'),
      '@nasnet/api-client/generated': path.resolve(__dirname, '../../api-client/generated'),
      '@nasnet/features/network': path.resolve(__dirname, './src'),
    },
  },
});
