import * as React from 'react';

import { PlatformProvider } from '@nasnet/ui/layouts';

import './preview.css';

import type { Preview } from '@storybook/react';

const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: '^on[A-Z].*' },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: {
      options: {
        light: { name: 'light', value: '#F1F5F9' },
        dark: { name: 'dark', value: '#0F172A' }
      }
    },
    viewport: {
      options: {
        mobile: {
          name: 'Mobile',
          styles: { width: '375px', height: '667px' },
        },
        tablet: {
          name: 'Tablet',
          styles: { width: '768px', height: '1024px' },
        },
        desktop: {
          name: 'Desktop',
          styles: { width: '1280px', height: '800px' },
        },
      },
    },
    // Enable accessibility addon
    a11y: {
      config: {
        rules: [
          // Require 7:1 contrast (WCAG AAA)
          { id: 'color-contrast-enhanced', enabled: true },
        ],
      },
    },
  },

  decorators: [
    // Platform provider for responsive presenters
    (Story, context) => {
      // Allow manual platform override via story parameters
      const platform = context.parameters?.platform;

      return (
        <PlatformProvider initialPlatform={platform}>
          <Story />
        </PlatformProvider>
      );
    },
    // Theme decorator
    (Story, context) => {
      const isDark = context.globals.theme === 'dark';

      return (
        <div className={isDark ? 'dark' : ''} data-theme={isDark ? 'dark' : 'light'}>
          <div className="p-4 min-h-screen bg-background text-foreground">
            <Story />
          </div>
        </div>
      );
    },
  ],

  globalTypes: {
    theme: {
      name: 'Theme',
      description: 'Global theme for components',
      defaultValue: 'light',
      toolbar: {
        icon: 'circlehollow',
        items: [
          { value: 'light', icon: 'sun', title: 'Light' },
          { value: 'dark', icon: 'moon', title: 'Dark' },
        ],
      },
    },
    platform: {
      name: 'Platform',
      description: 'Platform override for responsive testing',
      defaultValue: 'auto',
      toolbar: {
        icon: 'mobile',
        items: [
          { value: 'auto', title: 'Auto-detect' },
          { value: 'mobile', title: 'Mobile' },
          { value: 'tablet', title: 'Tablet' },
          { value: 'desktop', title: 'Desktop' },
        ],
      },
    },
  },

  initialGlobals: {
    backgrounds: {
      value: 'light'
    }
  }
};

export default preview;
