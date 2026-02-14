import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    name: 'features-services',
    root: path.resolve(__dirname),
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
  },
  resolve: {
    alias: {
      '@nasnet/ui/primitives': path.resolve(__dirname, '../../ui/primitives/src'),
      '@nasnet/ui/patterns': path.resolve(__dirname, '../../ui/patterns/src'),
      '@nasnet/ui/layouts': path.resolve(__dirname, '../../ui/layouts/src'),
      '@nasnet/ui/utils': path.resolve(__dirname, '../../ui/primitives/src/lib'),
      '@nasnet/core/utils': path.resolve(__dirname, '../../core/utils/src'),
      '@nasnet/api-client/queries': path.resolve(__dirname, '../../api-client/queries/src'),
      '@nasnet/api-client/generated': path.resolve(__dirname, '../../api-client/generated'),
      '@nasnet/state/stores': path.resolve(__dirname, '../../state/stores/src'),
    },
  },
});
