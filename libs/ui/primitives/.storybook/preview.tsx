import type { Preview } from '@storybook/react';

// Import styles from the connect app - this provides the design tokens and base styles
// Note: In production, Storybook would use its own CSS import
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
    // Enable accessibility addon with WCAG AAA contrast rule
    a11y: {
      config: {
        rules: [
          { id: 'color-contrast-enhanced', enabled: true }, // WCAG AAA 7:1 contrast
        ],
      },
    },
  },

  decorators: [
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
  },

  initialGlobals: {
    backgrounds: {
      value: 'light'
    }
  }
};

export default preview;
