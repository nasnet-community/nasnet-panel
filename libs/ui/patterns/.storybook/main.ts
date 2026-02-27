// This file has been automatically migrated to valid ESM format by Storybook.
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'path';

import type { StorybookConfig } from '@storybook/react-vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const require = createRequire(import.meta.url);

/**
 * This function is used to resolve the absolute path of a package.
 */
function getAbsolutePath(value: string): string {
  return dirname(require.resolve(join(value, 'package.json')));
}

const config: StorybookConfig = {
  stories: [
    '../src/**/*.stories.@(js|jsx|ts|tsx|mdx)',
    '../../../features/*/src/**/*.stories.@(js|jsx|ts|tsx|mdx)',
    '../../layouts/src/**/*.stories.@(js|jsx|ts|tsx|mdx)',
    '../../../../apps/connect/src/**/*.stories.@(js|jsx|ts|tsx|mdx)',
  ],

  addons: [getAbsolutePath('@storybook/addon-a11y'), getAbsolutePath('@storybook/addon-docs')],

  framework: {
    name: getAbsolutePath('@storybook/react-vite') as '@storybook/react-vite',
    options: {},
  },

  viteFinal: async (config) => {
    return {
      ...config,
      base: process.env.STORYBOOK_BASE || '/',
      resolve: {
        ...config.resolve,
        alias: {
          ...config.resolve?.alias,
          // Pattern library paths
          '@nasnet/ui/patterns': join(__dirname, '../src'),
          // Dependencies
          '@nasnet/ui/primitives': join(__dirname, '../../primitives/src'),
          '@nasnet/ui/utils': join(__dirname, '../../primitives/src/lib/utils'),
          '@nasnet/ui/layouts': join(__dirname, '../../layouts/src'),
          '@nasnet/core/types': join(__dirname, '../../../core/types/src'),
          '@nasnet/core/utils': join(__dirname, '../../../core/utils/src'),
          '@nasnet/core/constants': join(__dirname, '../../../core/constants/src'),
          '@nasnet/core/i18n': join(__dirname, '../../../core/i18n/src'),
          '@nasnet/core/forms': join(__dirname, '../../../core/forms/src'),
          '@nasnet/state/stores': join(__dirname, '../../../state/stores/src'),
          '@nasnet/api-client/core': join(__dirname, '../../../api-client/core/src'),
          '@nasnet/api-client/queries': join(__dirname, '../../../api-client/queries/src'),
          '@nasnet/api-client/generated': join(__dirname, '../../../api-client/generated'),
          '@nasnet/features/dashboard': join(__dirname, '../../../features/dashboard/src'),
          '@nasnet/features/diagnostics': join(__dirname, '../../../features/diagnostics/src'),
          '@nasnet/features/network': join(__dirname, '../../../features/network/src'),
          '@nasnet/features/firewall': join(__dirname, '../../../features/firewall/src'),
          '@nasnet/features/alerts': join(__dirname, '../../../features/alerts/src'),
          '@nasnet/features/services': join(__dirname, '../../../features/services/src'),
          '@nasnet/features/wireless': join(__dirname, '../../../features/wireless/src'),
          '@nasnet/features/configuration-import': join(
            __dirname,
            '../../../features/configuration-import/src'
          ),
          '@nasnet/features/router-discovery': join(
            __dirname,
            '../../../features/router-discovery/src'
          ),
          '@nasnet/features/logs': join(__dirname, '../../../features/logs/src'),
          '@': join(__dirname, '../../../../apps/connect/src'),
        },
      },
    };
  },
};

export default config;
