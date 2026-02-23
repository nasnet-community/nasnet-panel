import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { join, dirname, resolve } from 'path';

import type { StorybookConfig } from '@storybook/react-vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const require = createRequire(import.meta.url);

function getAbsolutePath(value: string): string {
  return dirname(require.resolve(join(value, 'package.json')));
}

const root = resolve(__dirname, '../../..');

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(js|jsx|ts|tsx|mdx)'],

  addons: [
    getAbsolutePath('@storybook/addon-a11y'),
    getAbsolutePath('@storybook/addon-docs'),
  ],

  framework: {
    name: getAbsolutePath('@storybook/react-vite') as '@storybook/react-vite',
    options: {},
  },

  viteFinal: async (config) => {
    return {
      ...config,
      resolve: {
        ...config.resolve,
        alias: {
          ...config.resolve?.alias,
          '@': resolve(__dirname, '../src'),
          '@nasnet/core/types': resolve(root, 'libs/core/types/src'),
          '@nasnet/core/utils': resolve(root, 'libs/core/utils/src'),
          '@nasnet/core/constants': resolve(root, 'libs/core/constants/src'),
          '@nasnet/core/forms': resolve(root, 'libs/core/forms/src'),
          '@nasnet/core/i18n': resolve(root, 'libs/core/i18n/src'),
          '@nasnet/ui/layouts': resolve(root, 'libs/ui/layouts/src'),
          '@nasnet/ui/primitives': resolve(root, 'libs/ui/primitives/src'),
          '@nasnet/ui/patterns': resolve(root, 'libs/ui/patterns/src'),
          '@nasnet/ui/utils': resolve(root, 'libs/ui/primitives/src/lib/utils'),
          '@nasnet/ui/components': resolve(root, 'libs/ui/primitives/src'),
          '@nasnet/ui/tokens/variables.css': resolve(root, 'libs/ui/tokens/dist/variables.css'),
          '@nasnet/ui/tokens': resolve(root, 'libs/ui/tokens/src'),
          '@nasnet/ui/patterns/motion': resolve(root, 'libs/ui/patterns/src/motion'),
          '@nasnet/features/router-discovery': resolve(root, 'libs/features/router-discovery/src'),
          '@nasnet/features/dashboard': resolve(root, 'libs/features/dashboard/src'),
          '@nasnet/features/wireless': resolve(root, 'libs/features/wireless/src'),
          '@nasnet/features/firewall': resolve(root, 'libs/features/firewall/src'),
          '@nasnet/features/logs': resolve(root, 'libs/features/logs/src'),
          '@nasnet/features/configuration-import': resolve(root, 'libs/features/configuration-import/src'),
          '@nasnet/features/network': resolve(root, 'libs/features/network/src'),
          '@nasnet/features/alerts': resolve(root, 'libs/features/alerts/src'),
          '@nasnet/features/diagnostics': resolve(root, 'libs/features/diagnostics/src'),
          '@nasnet/features/services': resolve(root, 'libs/features/services/src'),
          '@nasnet/api-client/core': resolve(root, 'libs/api-client/core/src'),
          '@nasnet/api-client/generated': resolve(root, 'libs/api-client/generated'),
          '@nasnet/api-client/queries': resolve(root, 'libs/api-client/queries/src'),
          '@nasnet/state/stores': resolve(root, 'libs/state/stores/src'),
        },
      },
    };
  },
};

export default config;
