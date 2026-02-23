import { WiFiTab } from '@/app/routes/router-panel/tabs/WiFiTab';

import type { Meta, StoryObj, StoryFn } from '@storybook/react';

const meta: Meta<typeof WiFiTab> = {
  title: 'App/Router/WiFi/WiFiTab',
  component: WiFiTab,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Route-level story for /router/$id/wifi. WiFi management dashboard with status hero, ' +
          'wireless interface list, connected clients table, and security summary. ' +
          'Requires router context for data fetching.',
      },
    },
  },
  decorators: [
    (Story: StoryFn) => (
      <div style={{ minHeight: '600px' }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof WiFiTab>;

export const Default: Story = {
  render: () => <WiFiTab />,
};

export const WithRouterContext: Story = {
  render: () => {
    localStorage.setItem('currentRouterIp', '192.168.88.1');
    return <WiFiTab />;
  },
  parameters: {
    docs: {
      description: {
        story:
          'WiFi tab with a router IP pre-set in localStorage. ' +
          'In a live environment this fetches wireless interfaces and connected clients.',
      },
    },
  },
};

export const MobileViewport: Story = {
  render: () => <WiFiTab />,
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
    docs: {
      description: {
        story:
          'Mobile viewport rendering. Stats grid stacks vertically, clients table ' +
          'becomes scrollable, and quick actions collapse.',
      },
    },
  },
};

export const Mobile: Story = {
  render: () => <WiFiTab />,
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
  },
};

export const Desktop: Story = {
  render: () => <WiFiTab />,
  parameters: {
    viewport: { defaultViewport: 'desktop' },
  },
};
