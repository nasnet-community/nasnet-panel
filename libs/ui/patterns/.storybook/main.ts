import { join, dirname } from 'path';

import type { StorybookConfig } from '@storybook/react-vite';

/**
 * This function is used to resolve the absolute path of a package.
 */
function getAbsolutePath(value: string): string {
  return dirname(require.resolve(join(value, 'package.json')));
}

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(js|jsx|ts|tsx|mdx)'],
  addons: [
    getAbsolutePath('@storybook/addon-essentials'),
    getAbsolutePath('@storybook/addon-a11y'),
    getAbsolutePath('@storybook/addon-interactions'),
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
          // Pattern library paths
          '@nasnet/ui/patterns': join(__dirname, '../src'),
          // Dependencies
          '@nasnet/ui/primitives': join(__dirname, '../../primitives/src'),
          '@nasnet/ui/layouts': join(__dirname, '../../layouts/src'),
          '@nasnet/core/types': join(__dirname, '../../../core/types/src'),
          '@nasnet/core/utils': join(__dirname, '../../../core/utils/src'),
          '@nasnet/core/forms': join(__dirname, '../../../core/forms/src'),
          '@nasnet/state/stores': join(__dirname, '../../../state/stores/src'),
          '@nasnet/api-client/core': join(__dirname, '../../../api-client/core/src'),
          '@nasnet/api-client/queries': join(__dirname, '../../../api-client/queries/src'),
          '@nasnet/api-client/generated': join(__dirname, '../../../api-client/generated'),
        },
      },
    };
  },
  docs: {
    autodocs: 'tag',
  },
};

export default config;
