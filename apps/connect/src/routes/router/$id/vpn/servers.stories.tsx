import { VPNServersPage } from '@/app/pages/vpn';

import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof VPNServersPage> = {
  title: 'App/Router/VPN/VPNServersPage',
  component: VPNServersPage,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Route-level story for /router/$id/vpn/servers. Displays all VPN server configurations ' +
          'organized by protocol (WireGuard, OpenVPN, L2TP, PPTP, SSTP, IKEv2) with tabbed ' +
          'filtering, connected-client counts, enable/disable toggle, and edit actions.',
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
type Story = StoryObj<typeof VPNServersPage>;

export const Default: Story = {
  render: () => <VPNServersPage />,
};

export const WithRouterContext: Story = {
  render: () => {
    localStorage.setItem('currentRouterIp', '192.168.88.1');
    return <VPNServersPage />;
  },
  parameters: {
    docs: {
      description: {
        story:
          'VPN Servers page with a router IP pre-set in localStorage. ' +
          'In a live environment this triggers data fetching for all server protocol queries.',
      },
    },
  },
};

export const MobileViewport: Story = {
  render: () => <VPNServersPage />,
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
    docs: {
      description: {
        story:
          'Mobile viewport rendering. Protocol tabs wrap and server cards ' +
          'stack in a single column layout.',
      },
    },
  },
};

export const Mobile: Story = {
  render: () => <VPNServersPage />,
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
  },
};

export const Desktop: Story = {
  render: () => <VPNServersPage />,
  parameters: {
    viewport: { defaultViewport: 'desktop' },
  },
};
