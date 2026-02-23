import { VPNClientsPage } from '@/app/pages/vpn';

import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof VPNClientsPage> = {
  title: 'App/Router/VPN/VPNClientsPage',
  component: VPNClientsPage,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Route-level story for /router/$id/vpn/clients. Displays all outgoing VPN client ' +
          'connections organized by protocol (WireGuard, OpenVPN, L2TP, PPTP, SSTP, IKEv2) ' +
          'with tabbed filtering, enable/disable toggle, edit, and delete actions.',
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
type Story = StoryObj<typeof VPNClientsPage>;

export const Default: Story = {
  render: () => <VPNClientsPage />,
};

export const WithRouterContext: Story = {
  render: () => {
    localStorage.setItem('currentRouterIp', '192.168.88.1');
    return <VPNClientsPage />;
  },
  parameters: {
    docs: {
      description: {
        story:
          'VPN Clients page with a router IP pre-set in localStorage. ' +
          'In a live environment this triggers data fetching for all protocol queries.',
      },
    },
  },
};

export const MobileViewport: Story = {
  render: () => <VPNClientsPage />,
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
    docs: {
      description: {
        story:
          'Mobile viewport rendering. Protocol tabs wrap to multiple lines and cards ' +
          'stack in a single column layout.',
      },
    },
  },
};

export const Mobile: Story = {
  render: () => <VPNClientsPage />,
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
  },
};

export const Desktop: Story = {
  render: () => <VPNClientsPage />,
  parameters: {
    viewport: { defaultViewport: 'desktop' },
  },
};
