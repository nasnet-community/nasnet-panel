import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  test: {
    name: 'features-firewall',
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./test-setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/**/*.{test,spec}.{ts,tsx}', 'src/**/*.stories.tsx'],
      thresholds: {
        lines: 80,
        branches: 75,
        functions: 80,
        statements: 80,
      },
    },
  },
  resolve: {
    alias: {
      '@nasnet/ui/primitives': path.resolve(__dirname, '../../ui/primitives/src'),
      '@nasnet/ui/patterns': path.resolve(__dirname, '../../ui/patterns/src'),
      '@nasnet/state/stores': path.resolve(__dirname, '../../state/stores/src'),
      '@nasnet/core/types': path.resolve(__dirname, '../../core/types/src'),
      '@nasnet/api-client/queries': path.resolve(__dirname, '../../api-client/queries/src'),
    },
    // Enable node_modules resolution from monorepo root
    preserveSymlinks: false,
  },
});
