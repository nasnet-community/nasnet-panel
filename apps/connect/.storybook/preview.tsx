import type { Preview } from '@storybook/react';
import { I18nProvider } from '@nasnet/core/i18n';
import './preview.css';

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
        dark: { name: 'dark', value: '#0F172A' },
      },
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
    a11y: {
      config: {
        rules: [
          { id: 'color-contrast-enhanced', enabled: true },
        ],
      },
    },
  },

  decorators: [
    (Story, context) => {
      const isDark = context.globals.theme === 'dark';
      return (
        <I18nProvider>
          <div className={isDark ? 'dark' : ''} data-theme={isDark ? 'dark' : 'light'}>
            <div className="p-4 min-h-screen bg-background text-foreground">
              <Story />
            </div>
          </div>
        </I18nProvider>
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
  },

  initialGlobals: {
    backgrounds: { value: 'light' },
  },
};

export default preview;
