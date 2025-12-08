/// <reference types='vitest' />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import checker from 'vite-plugin-checker';
import { resolve } from 'path';

export default defineConfig(({ mode }) => ({
  root: import.meta.dirname,
  cacheDir: '../../node_modules/.vite/apps/connect',
  resolve: {
    alias: {
      '@': resolve(import.meta.dirname, './src'),
      '@nasnet/core/types': resolve(import.meta.dirname, '../../libs/core/types/src'),
      '@nasnet/core/utils': resolve(import.meta.dirname, '../../libs/core/utils/src'),
      '@nasnet/core/constants': resolve(import.meta.dirname, '../../libs/core/constants/src'),
      '@nasnet/ui/layouts': resolve(import.meta.dirname, '../../libs/ui/layouts/src'),
      '@nasnet/ui/primitives': resolve(import.meta.dirname, '../../libs/ui/primitives/src'),
      '@nasnet/ui/patterns': resolve(import.meta.dirname, '../../libs/ui/patterns/src'),
      '@nasnet/ui/utils': resolve(import.meta.dirname, '../../libs/ui/primitives/src/lib/utils'), // Utils from primitives
      '@nasnet/ui/components': resolve(import.meta.dirname, '../../libs/ui/primitives/src'), // Alias for incorrect imports

      '@nasnet/features/router-discovery': resolve(import.meta.dirname, '../../libs/features/router-discovery/src'),
      '@nasnet/features/dashboard': resolve(import.meta.dirname, '../../libs/features/dashboard/src'),
      '@nasnet/features/wireless': resolve(import.meta.dirname, '../../libs/features/wireless/src'),
      '@nasnet/features/firewall': resolve(import.meta.dirname, '../../libs/features/firewall/src'),
      '@nasnet/features/logs': resolve(import.meta.dirname, '../../libs/features/logs/src'),
      '@nasnet/features/configuration-import': resolve(import.meta.dirname, '../../libs/features/configuration-import/src'),
      '@nasnet/api-client/core': resolve(import.meta.dirname, '../../libs/api-client/core/src'),
      '@nasnet/api-client/queries': resolve(import.meta.dirname, '../../libs/api-client/queries/src'),
      '@nasnet/state/stores': resolve(import.meta.dirname, '../../libs/state/stores/src'),
    },
  },
  server: {
    port: 5173,
    host: true,
    strictPort: true,
    open: true,
    proxy: {
      '/api': {
        target: process.env.VITE_PROXY_URL || 'http://localhost:80',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  preview: {
    port: 5173,
    host: 'localhost',
  },
  plugins: [
    react(),
    // Only run type-checker in development mode (not during production builds)
    mode !== 'production' && checker({
      typescript: true,
      overlay: {
        initialIsOpen: false,
      },
    }),
  ].filter(Boolean),
  // Uncomment this if you are using workers.
  // worker: {
  //  plugins: [],
  // },
  build: {
    outDir: '../../dist/apps/connect',
    emptyOutDir: true,
    target: 'es2020',
    minify: 'terser',
    sourcemap: mode !== 'production',
    reportCompressedSize: true,
    terserOptions: {
      compress: {
        drop_console: mode === 'production',
        drop_debugger: true,
      },
    },
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          ui: [
            '@radix-ui/react-dialog',
            '@radix-ui/react-tabs',
            '@radix-ui/react-toast',
            '@radix-ui/react-switch',
            '@radix-ui/react-select',
          ],
          query: ['@tanstack/react-query'],
        },
      },
    },
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
}));
