import { WiFiTab } from './WiFiTab';

import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof WiFiTab> = {
  title: 'App/RouterPanel/WiFiTab',
  component: WiFiTab,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div style={{ minHeight: '400px', padding: '16px' }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default WiFiTab showing status hero, interfaces, clients, and security summary
 */
export const Default: Story = {
  render: () => <WiFiTab />,
};

/**
 * WiFiTab in loading state while fetching wireless data
 */
export const Loading: Story = {
  render: () => <WiFiTab />,
  parameters: {
    docs: {
      description: {
        story: 'WiFiTab displays loading skeleton while fetching wireless interfaces and connected clients.',
      },
    },
  },
};

/**
 * WiFiTab showing error state when data fetch fails
 */
export const ErrorState: Story = {
  render: () => <WiFiTab />,
  parameters: {
    docs: {
      description: {
        story: 'WiFiTab displays error message when wireless interface query fails with retry button.',
      },
    },
  },
};

/**
 * WiFiTab in compact mobile view
 */
export const MobileView: Story = {
  render: () => <WiFiTab />,
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
    docs: {
      description: {
        story: 'Responsive WiFi management view optimized for mobile devices with stacked layout.',
      },
    },
  },
};

/**
 * WiFiTab on desktop with full-width layout
 */
export const Desktop: Story = {
  render: () => <WiFiTab />,
  parameters: {
    viewport: {
      defaultViewport: 'desktop',
    },
  },
};
