/**
 * QuickIPOverview Stories
 *
 * Compact collapsible IP-address browser grouped by interface.
 * Supports light and dark themes, loading skeleton, and error state.
 * Prop-driven — no stores or routing required.
 */


import type { IPAddress } from '@nasnet/core/types';

import { QuickIPOverview } from './QuickIPOverview';

import type { Meta, StoryObj } from '@storybook/react';

// ---------------------------------------------------------------------------
// Shared mock data
// ---------------------------------------------------------------------------

const singleInterface: IPAddress[] = [
  {
    id: 'ip1',
    address: '192.168.1.1/24',
    network: '192.168.1.0',
    interface: 'ether1',
    dynamic: false,
    disabled: false,
  },
];

const multipleInterfaces: IPAddress[] = [
  {
    id: 'ip1',
    address: '192.168.1.1/24',
    network: '192.168.1.0',
    interface: 'ether1',
    dynamic: false,
    disabled: false,
  },
  {
    id: 'ip2',
    address: '10.0.0.1/8',
    network: '10.0.0.0',
    interface: 'ether1',
    dynamic: true,
    disabled: false,
  },
  {
    id: 'ip3',
    address: '172.16.0.1/16',
    network: '172.16.0.0',
    interface: 'bridge1',
    dynamic: false,
    disabled: false,
  },
  {
    id: 'ip4',
    address: '10.100.0.1/24',
    network: '10.100.0.0',
    interface: 'wlan1',
    dynamic: true,
    disabled: false,
  },
  {
    id: 'ip5',
    address: '192.168.88.1/24',
    network: '192.168.88.0',
    interface: 'wlan1',
    dynamic: false,
    disabled: false,
  },
];

const mixedTypes: IPAddress[] = [
  {
    id: 'ip1',
    address: '203.0.113.50/30',
    network: '203.0.113.48',
    interface: 'ether1-wan',
    dynamic: true,
    disabled: false,
  },
  {
    id: 'ip2',
    address: '192.168.10.1/24',
    network: '192.168.10.0',
    interface: 'bridge-lan',
    dynamic: false,
    disabled: false,
  },
  {
    id: 'ip3',
    address: '10.8.0.1/24',
    network: '10.8.0.0',
    interface: 'wireguard0',
    dynamic: false,
    disabled: false,
  },
];

// ---------------------------------------------------------------------------
// Meta
// ---------------------------------------------------------------------------

const meta: Meta<typeof QuickIPOverview> = {
  title: 'App/Network/QuickIPOverview',
  component: QuickIPOverview,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Collapsible IP address browser grouped by interface. ' +
          'Each interface row shows the interface name, a count badge, and the first IP as a preview. ' +
          'Clicking a row expands it to reveal all assigned IPs, each tagged as Dynamic or Static. ' +
          'Handles loading skeleton, fetch error, and empty-state gracefully. ' +
          'Supports light and dark themes via Tailwind dark-mode classes.',
      },
    },
  },
  argTypes: {
    isLoading: { control: 'boolean' },
  },
  decorators: [
    (Story) => (
      <div style={{ width: 360 }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof QuickIPOverview>;

// ---------------------------------------------------------------------------
// Stories
// ---------------------------------------------------------------------------

export const SingleInterface: Story = {
  args: {
    ipAddresses: singleInterface,
    isLoading: false,
    error: null,
  },
  parameters: {
    docs: {
      description: {
        story:
          'One interface with a single static IP. Clicking the row expands it to show the full address and "Static" badge.',
      },
    },
  },
};

export const MultipleInterfaces: Story = {
  args: {
    ipAddresses: multipleInterfaces,
    isLoading: false,
    error: null,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Multiple interfaces (ether1, bridge1, wlan1) with a mix of static and dynamic IPs. ' +
          'Each row is independently collapsible.',
      },
    },
  },
};

export const MixedAddressTypes: Story = {
  args: {
    ipAddresses: mixedTypes,
    isLoading: false,
    error: null,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Typical home-router setup: WAN (dynamic public IP), LAN bridge (static private), ' +
          'and WireGuard tunnel (static VPN). Verifies badge colour differentiation.',
      },
    },
  },
};

export const Empty: Story = {
  args: {
    ipAddresses: [],
    isLoading: false,
    error: null,
  },
  parameters: {
    docs: {
      description: {
        story:
          'No IP addresses are configured. Renders the empty-state placeholder message.',
      },
    },
  },
};

export const Loading: Story = {
  args: {
    ipAddresses: [],
    isLoading: true,
    error: null,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Skeleton/pulse loading state displayed while IP data is being fetched from the router.',
      },
    },
  },
};

export const ErrorState: Story = {
  args: {
    ipAddresses: [],
    isLoading: false,
    error: new Error('Connection timed out while fetching IP addresses'),
  },
  parameters: {
    docs: {
      description: {
        story:
          'Failed data fetch. Red error card with the exception message displayed beneath the title.',
      },
    },
  },
};
