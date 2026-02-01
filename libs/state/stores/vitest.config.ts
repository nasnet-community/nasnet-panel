import { defineConfig } from 'vite';
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';
import path from 'path';

export default defineConfig({
  plugins: [nxViteTsPaths()],
  resolve: {
    alias: {
      '@nasnet/api-client/core': path.resolve(__dirname, '../../../libs/api-client/core/src'),
      '@nasnet/api-client/queries': path.resolve(__dirname, '../../../libs/api-client/queries/src'),
      '@nasnet/state/stores': path.resolve(__dirname, './src'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['src/test-setup.ts'],
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    coverage: {
      reportsDirectory: '../../../coverage/libs/state/stores',
      provider: 'v8',
    },
  },
});
