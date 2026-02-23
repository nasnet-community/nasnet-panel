import { resolve } from 'path';

import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.test.ts', 'src/**/*.spec.ts', 'src/index.ts'],
    },
    setupFiles: ['./src/test-setup.ts'],
  },
  resolve: {
    alias: {
      '@nasnet/state/stores': resolve(__dirname, '../stores/src'),
      '@nasnet/core/types': resolve(__dirname, '../../core/types/src'),
      '@nasnet/core/utils': resolve(__dirname, '../../core/utils/src'),
    },
  },
});
