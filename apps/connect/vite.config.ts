/// <reference types='vitest' />
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { TanStackRouterVite } from '@tanstack/router-plugin/vite';
import checker from 'vite-plugin-checker';
import { resolve } from 'path';
import { spawn } from 'child_process';

/**
 * Custom plugin to watch design tokens and rebuild on changes
 * Provides HMR for token updates without full page reload
 */
function designTokensHMR(): Plugin {
  let tokenWatcher: ReturnType<typeof spawn> | null = null;

  return {
    name: 'design-tokens-hmr',
    configureServer(server) {
      const tokensPath = resolve(import.meta.dirname, '../../libs/ui/tokens/src/tokens.json');
      const distPath = resolve(import.meta.dirname, '../../libs/ui/tokens/dist');

      // Watch the token source file
      server.watcher.add(tokensPath);
      server.watcher.on('change', async (path) => {
        if (path.includes('tokens.json')) {
          console.log('\n🎨 Design tokens changed, rebuilding...');
          try {
            // Run the token build script
            const buildProcess = spawn('node', ['libs/ui/tokens/build.js'], {
              cwd: resolve(import.meta.dirname, '../..'),
              stdio: 'inherit',
            });

            buildProcess.on('close', (code) => {
              if (code === 0) {
                // Trigger HMR for CSS files
                const cssModule = server.moduleGraph.getModuleById(
                  resolve(distPath, 'variables.css')
                );
                if (cssModule) {
                  server.moduleGraph.invalidateModule(cssModule);
                  server.ws.send({ type: 'full-reload' });
                }
              }
            });
          } catch (error) {
            console.error('Failed to rebuild tokens:', error);
          }
        }
      });
    },
    closeBundle() {
      if (tokenWatcher) {
        tokenWatcher.kill();
        tokenWatcher = null;
      }
    },
  };
}

export default defineConfig(({ mode }) => ({
  root: import.meta.dirname,
  cacheDir: '../../node_modules/.vite/apps/connect',
  resolve: {
    alias: {
      '@': resolve(import.meta.dirname, './src'),
      '@nasnet/core/types': resolve(import.meta.dirname, '../../libs/core/types/src'),
      '@nasnet/core/utils': resolve(import.meta.dirname, '../../libs/core/utils/src'),
      '@nasnet/core/constants': resolve(import.meta.dirname, '../../libs/core/constants/src'),
      '@nasnet/core/forms': resolve(import.meta.dirname, '../../libs/core/forms/src'),
      '@nasnet/core/i18n': resolve(import.meta.dirname, '../../libs/core/i18n/src'),
      '@nasnet/ui/layouts': resolve(import.meta.dirname, '../../libs/ui/layouts/src'),
      '@nasnet/ui/primitives': resolve(import.meta.dirname, '../../libs/ui/primitives/src'),
      '@nasnet/ui/patterns': resolve(import.meta.dirname, '../../libs/ui/patterns/src'),
      '@nasnet/ui/utils': resolve(import.meta.dirname, '../../libs/ui/primitives/src/lib/utils'), // Utils from primitives
      '@nasnet/ui/components': resolve(import.meta.dirname, '../../libs/ui/primitives/src'), // Alias for incorrect imports
      // CSS design tokens - compiled from tokens.json (MUST come before @nasnet/ui/tokens for proper resolution)
      '@nasnet/ui/tokens/variables.css': resolve(import.meta.dirname, '../../libs/ui/tokens/dist/variables.css'),
      // Animation tokens - TypeScript source files (NAS-4.18)
      '@nasnet/ui/tokens': resolve(import.meta.dirname, '../../libs/ui/tokens/src'),
      // Motion pattern components (NAS-4.18)
      '@nasnet/ui/patterns/motion': resolve(import.meta.dirname, '../../libs/ui/patterns/src/motion'),

      '@nasnet/features/router-discovery': resolve(import.meta.dirname, '../../libs/features/router-discovery/src'),
      '@nasnet/features/dashboard': resolve(import.meta.dirname, '../../libs/features/dashboard/src'),
      '@nasnet/features/wireless': resolve(import.meta.dirname, '../../libs/features/wireless/src'),
      '@nasnet/features/firewall': resolve(import.meta.dirname, '../../libs/features/firewall/src'),
      '@nasnet/features/logs': resolve(import.meta.dirname, '../../libs/features/logs/src'),
      '@nasnet/features/configuration-import': resolve(import.meta.dirname, '../../libs/features/configuration-import/src'),
      '@nasnet/api-client/core': resolve(import.meta.dirname, '../../libs/api-client/core/src'),
      '@nasnet/api-client/generated': resolve(import.meta.dirname, '../../libs/api-client/generated'),
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
    // TanStack Router file-based routing - MUST be before react()
    TanStackRouterVite(),
    react(),
    // Design token HMR - watches tokens.json and rebuilds on change
    mode !== 'production' && designTokensHMR(),
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
          // Core React - essential for app to function
          'vendor-react': ['react', 'react-dom', 'scheduler'],
          // Router - loaded immediately for navigation
          'vendor-router': ['@tanstack/react-router'],
          // GraphQL - required for data fetching
          'vendor-graphql': ['@apollo/client', 'graphql'],
          // State management - UI and complex flows
          'vendor-state': ['zustand', 'xstate', '@xstate/react'],
          // Animation library - Framer Motion
          'vendor-animation': ['framer-motion'],
          // UI primitives - Radix components
          'vendor-ui': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-tabs',
            '@radix-ui/react-toast',
            '@radix-ui/react-switch',
            '@radix-ui/react-select',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-popover',
          ],
          // Table & virtualization - lazy loaded for data-heavy pages
          'vendor-table': ['@tanstack/react-table', '@tanstack/react-virtual'],
          // Forms - React Hook Form with validation
          'vendor-forms': ['react-hook-form', '@hookform/resolvers', 'zod'],
          // Internationalization - i18next
          'vendor-i18n': ['i18next', 'react-i18next', 'i18next-http-backend', 'i18next-browser-languagedetector'],
        },
      },
    },
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
}));
