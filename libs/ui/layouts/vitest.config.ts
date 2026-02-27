import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    alias: {
      '@nasnet/ui/primitives': new URL('../primitives/src', import.meta.url).pathname,
      '@nasnet/core/utils': new URL('../../core/utils/src', import.meta.url).pathname,
      '@nasnet/core/types': new URL('../../core/types/src', import.meta.url).pathname,
    },
    coverage: {
      reportsDirectory: '../../../coverage/libs/ui/layouts',
      provider: 'v8',
    },
  },
});
