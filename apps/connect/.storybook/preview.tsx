import type { Preview } from '@storybook/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { I18nProvider } from '@nasnet/core/i18n';
import { MockApolloProvider } from '@nasnet/api-client/core';
import { PlatformProvider } from '@nasnet/ui/layouts';
import { AnimationProvider, ToastProvider } from '@nasnet/ui/patterns';
import './preview.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false, gcTime: 0, staleTime: 0 },
    mutations: { retry: false },
  },
});

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
        rules: [{ id: 'color-contrast-enhanced', enabled: true }],
      },
    },
  },

  decorators: [
    (Story, context) => {
      const isDark = context.globals.theme === 'dark';
      return (
        <MockApolloProvider>
          <QueryClientProvider client={queryClient}>
            <I18nProvider>
              <PlatformProvider>
                <AnimationProvider>
                  <ToastProvider>
                    <div
                      className={isDark ? 'dark' : ''}
                      data-theme={isDark ? 'dark' : 'light'}
                    >
                      <div className="bg-background text-foreground min-h-screen p-4">
                        <Story />
                      </div>
                    </div>
                  </ToastProvider>
                </AnimationProvider>
              </PlatformProvider>
            </I18nProvider>
          </QueryClientProvider>
        </MockApolloProvider>
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
