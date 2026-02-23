/**
 * Storybook stories for InterfaceCompactList component
 *
 * InterfaceCompactList renders an InterfaceListItem per interface.
 * Each item calls:
 *   - useConnectionStore  → @nasnet/state/stores  (currentRouterIp)
 *   - useInterfaceTraffic → @nasnet/api-client/queries (traffic bytes)
 *
 * Stories render correctly when Apollo + Zustand providers are configured
 * in .storybook/preview.tsx. Traffic data will show as absent/loading
 * in isolated Storybook environments — the loading state and status labels
 * still render correctly.
 */


import { type NetworkInterface } from '@nasnet/core/types';

import { InterfaceCompactList } from './InterfaceCompactList';

import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof InterfaceCompactList> = {
  title: 'App/Network/InterfaceCompactList',
  component: InterfaceCompactList,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Compact dashboard widget listing network interfaces with live RX/TX traffic bytes per row. Each row shows a coloured status dot (green = running + link up, amber = running + no link, grey = disabled), an interface-type icon, the interface name, and — when traffic data is available — a monospace RX/TX byte counter. Shows a "View All" link when the list is truncated by maxItems.',
      },
    },
  },
  argTypes: {
    maxItems: {
      control: { type: 'number', min: 1, max: 20 },
      description: 'Maximum interfaces shown before truncation',
    },
    isLoading: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof InterfaceCompactList>;

// ---------------------------------------------------------------------------
// Mock data helpers
// ---------------------------------------------------------------------------

const makeInterface = (
  id: string,
  name: string,
  type: NetworkInterface['type'],
  status: NetworkInterface['status'],
  linkStatus: NetworkInterface['linkStatus'],
): NetworkInterface => ({
  id,
  name,
  type,
  status,
  linkStatus,
  macAddress: `D4:CA:6D:AA:${id.padStart(2, '0')}:FF`,
  mtu: 1500,
});

const runningInterfaces: NetworkInterface[] = [
  makeInterface('1', 'ether1', 'ether', 'running', 'up'),
  makeInterface('2', 'ether2', 'ether', 'running', 'up'),
  makeInterface('3', 'bridge1', 'bridge', 'running', 'up'),
  makeInterface('4', 'wlan1', 'wireless', 'running', 'up'),
  makeInterface('5', 'pppoe-out1', 'pppoe', 'running', 'up'),
];

const mixedInterfaces: NetworkInterface[] = [
  makeInterface('1', 'ether1', 'ether', 'running', 'up'),
  makeInterface('2', 'ether2', 'ether', 'running', 'down'),
  makeInterface('3', 'wlan1', 'wireless', 'running', 'up'),
  makeInterface('4', 'vlan10', 'vlan', 'disabled', 'down'),
  makeInterface('5', 'wg0', 'wireguard', 'running', 'up'),
  makeInterface('6', 'lte1', 'lte', 'disabled', 'down'),
];

const largeList: NetworkInterface[] = [
  makeInterface('1', 'ether1', 'ether', 'running', 'up'),
  makeInterface('2', 'ether2', 'ether', 'running', 'up'),
  makeInterface('3', 'ether3', 'ether', 'running', 'up'),
  makeInterface('4', 'bridge1', 'bridge', 'running', 'up'),
  makeInterface('5', 'bridge2', 'bridge', 'running', 'up'),
  makeInterface('6', 'wlan1', 'wireless', 'running', 'up'),
  makeInterface('7', 'wlan2', 'wireless', 'running', 'up'),
  makeInterface('8', 'vlan10', 'vlan', 'running', 'up'),
  makeInterface('9', 'pppoe-out1', 'pppoe', 'running', 'up'),
  makeInterface('10', 'wg0', 'wireguard', 'running', 'up'),
];

// ---------------------------------------------------------------------------
// Stories
// ---------------------------------------------------------------------------

export const Default: Story = {
  name: 'Default (5 running interfaces)',
  args: {
    interfaces: runningInterfaces,
    maxItems: 5,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Five healthy running interfaces; all status dots are green. Traffic bytes are fetched live and may show as absent in isolated environments.',
      },
    },
  },
};

export const MixedStatus: Story = {
  name: 'Mixed Status (running, no-link, disabled)',
  args: {
    interfaces: mixedInterfaces,
    maxItems: 6,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Green dots for running+link-up, amber dots for running+no-link, grey dots for disabled interfaces. Status labels ("No link", "Disabled") appear instead of traffic counts for non-active rows.',
      },
    },
  },
};

export const TruncatedWithViewAll: Story = {
  name: 'Truncated — "View All" visible',
  args: {
    interfaces: largeList,
    maxItems: 5,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Ten interfaces truncated to 5 via maxItems. A "View All ›" link appears in the header when the list is truncated.',
      },
    },
  },
};

export const EmptyState: Story = {
  name: 'Empty State',
  args: {
    interfaces: [],
    maxItems: 5,
  },
  parameters: {
    docs: {
      description: {
        story: 'When interfaces is empty the component renders a "No interfaces found" placeholder.',
      },
    },
  },
};

export const LoadingState: Story = {
  name: 'Loading Skeleton',
  args: {
    interfaces: [],
    isLoading: true,
    maxItems: 5,
  },
  parameters: {
    docs: {
      description: {
        story: 'Pulse-animated skeleton rows shown while interface data is being fetched.',
      },
    },
  },
};

export const AllInterfaceTypes: Story = {
  name: 'All Interface Types',
  args: {
    interfaces: [
      makeInterface('e', 'ether1', 'ether', 'running', 'up'),
      makeInterface('b', 'bridge1', 'bridge', 'running', 'up'),
      makeInterface('v', 'vlan10', 'vlan', 'running', 'up'),
      makeInterface('w', 'wlan1', 'wireless', 'running', 'up'),
      makeInterface('p', 'pppoe-out1', 'pppoe', 'running', 'up'),
      makeInterface('wg', 'wg0', 'wireguard', 'running', 'up'),
      makeInterface('lt', 'lte1', 'lte', 'running', 'up'),
      makeInterface('lo', 'lo', 'loopback', 'running', 'up'),
    ],
    maxItems: 10,
  },
  parameters: {
    docs: {
      description: {
        story:
          'One row for every supported interface type to verify that the correct InterfaceTypeIcon is rendered in the compact row.',
      },
    },
  },
};

export const Mobile: Story = {
  ...Default,
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
  },
};

export const Desktop: Story = {
  ...Default,
  parameters: {
    viewport: { defaultViewport: 'desktop' },
  },
};
