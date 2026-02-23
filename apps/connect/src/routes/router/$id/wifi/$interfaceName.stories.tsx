import { WifiDetailPage } from '@/app/pages/wifi/detail';

import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof WifiDetailPage> = {
  title: 'App/Router/WiFi/WifiDetailPage',
  component: WifiDetailPage,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Route-level story for /router/$id/wifi/$interfaceName. Displays detailed configuration ' +
          'for a single wireless interface including back navigation, loading skeleton, error state, ' +
          'and the full WirelessInterfaceDetail component.',
      },
    },
  },
  decorators: [
    (Story) => (
      <div style={{ minHeight: '600px' }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof WifiDetailPage>;

export const Default: Story = {
  render: () => <WifiDetailPage />,
};

export const WithRouterContext: Story = {
  render: () => {
    localStorage.setItem('currentRouterIp', '192.168.88.1');
    return <WifiDetailPage />;
  },
  parameters: {
    docs: {
      description: {
        story:
          'WiFi detail page with a router IP pre-set in localStorage. ' +
          'In a live environment this fetches the wireless interface detail data.',
      },
    },
  },
};

export const MobileViewport: Story = {
  render: () => <WifiDetailPage />,
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
    docs: {
      description: {
        story:
          'Mobile viewport rendering. Detail cards stack vertically with ' +
          'full-width layout and touch-friendly back button.',
      },
    },
  },
};

export const Mobile: Story = {
  render: () => <WifiDetailPage />,
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
  },
};

export const Desktop: Story = {
  render: () => <WifiDetailPage />,
  parameters: {
    viewport: { defaultViewport: 'desktop' },
  },
};
