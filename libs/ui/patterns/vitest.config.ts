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
    alias: {
      '@nasnet/ui/primitives': new URL('../primitives/src', import.meta.url)
        .pathname,
      '@nasnet/ui/layouts': new URL('../layouts/src', import.meta.url).pathname,
      '@nasnet/core/types': new URL('../../core/types/src', import.meta.url)
        .pathname,
      '@nasnet/state/stores': new URL(
        '../../state/stores/src',
        import.meta.url
      ).pathname,
    },
    coverage: {
      reportsDirectory: '../../../coverage/libs/ui/patterns',
      provider: 'v8',
    },
  },
});
