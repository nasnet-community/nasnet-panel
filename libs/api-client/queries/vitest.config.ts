import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    name: '@nasnet/api-client-queries',
    globals: true,
    environment: 'jsdom',
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    setupFiles: ['./test-setup.ts'],
  },
  resolve: {
    alias: {
      '@nasnet/api-client/core': path.resolve(__dirname, '../core/src'),
      '@nasnet/api-client/queries': path.resolve(__dirname, './src'),
      '@nasnet/core/types': path.resolve(__dirname, '../../core/types/src'),
    },
  },
  esbuild: {
    jsx: 'automatic',
  },
});
