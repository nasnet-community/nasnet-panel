/**
 * Storybook stories for NetworkDetailSection
 * Labelled key-value panel for structured network configuration details.
 */

import { NetworkDetailSection, type NetworkDetailItem } from './NetworkDetailSection';

import type { Meta, StoryObj } from '@storybook/react';


// ---------------------------------------------------------------------------
// Mock data helpers
// ---------------------------------------------------------------------------

const IP_CONFIG_ITEMS: NetworkDetailItem[] = [
  { label: 'IP Address', value: '192.168.1.1/24', mono: true },
  { label: 'Gateway', value: '192.168.1.254', mono: true },
  { label: 'DNS Primary', value: '8.8.8.8', mono: true },
  { label: 'DNS Secondary', value: '8.8.4.4', mono: true },
  { label: 'DHCP', value: 'Enabled', badge: 'success' },
  { label: 'MTU', value: '1500', mono: true },
];

const WAN_STATUS_ITEMS: NetworkDetailItem[] = [
  { label: 'Interface', value: 'ether1', mono: true },
  { label: 'Type', value: 'PPPoE' },
  { label: 'Status', value: 'Connected', badge: 'success' },
  { label: 'IP Address', value: '100.64.0.42/32', mono: true },
  { label: 'Uptime', value: '3d 4h 25m', mono: true },
  { label: 'TX Rate', value: '12.4 Mbps', mono: true },
  { label: 'RX Rate', value: '94.1 Mbps', mono: true },
];

const VLAN_ITEMS: NetworkDetailItem[] = [
  { label: 'VLAN ID', value: '100', mono: true },
  { label: 'Name', value: 'IoT-Network' },
  { label: 'Parent Interface', value: 'bridge1', mono: true },
  { label: 'IP Range', value: '10.10.100.0/24', mono: true },
  { label: 'Isolation', value: 'Enabled', badge: 'info' },
];

const DEGRADED_ITEMS: NetworkDetailItem[] = [
  { label: 'Interface', value: 'ether2', mono: true },
  { label: 'Link', value: 'Down', badge: 'error' },
  { label: 'Last Seen', value: '2h 14m ago' },
  { label: 'Errors', value: '1,452', mono: true },
  { label: 'Auto-Negotiate', value: 'Failed', badge: 'warning' },
];

// ---------------------------------------------------------------------------
// Meta
// ---------------------------------------------------------------------------

const meta: Meta<typeof NetworkDetailSection> = {
  title: 'App/Network/NetworkDetailSection',
  component: NetworkDetailSection,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A structured key-value panel for displaying network configuration details. ' +
          'Renders a titled section with an optional description, followed by rows of ' +
          'label-value pairs. Values can be displayed as plain text, monospace (for IPs, ' +
          'MACs, ports), or colour-coded semantic badges (success / warning / error / info / neutral). ' +
          'Includes an animated skeleton loading state.',
      },
    },
  },
  decorators: [
    (Story) => (
      <div style={{ width: 340 }}>
        <Story />
      </div>
    ),
  ],
  argTypes: {
    isLoading: {
      control: 'boolean',
    },
  },
};

export default meta;
type Story = StoryObj<typeof NetworkDetailSection>;

// ---------------------------------------------------------------------------
// Stories
// ---------------------------------------------------------------------------

export const IPConfiguration: Story = {
  name: 'IP Configuration',
  args: {
    title: 'IP Configuration',
    description: 'LAN interface addressing and DNS settings',
    items: IP_CONFIG_ITEMS,
    isLoading: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Typical LAN detail panel — IP, gateway, DNS, and MTU shown in monospace, ' +
          'with the DHCP row rendered as a green success badge.',
      },
    },
  },
};

export const WANStatus: Story = {
  name: 'WAN Status',
  args: {
    title: 'WAN Status',
    description: 'Upstream PPPoE connection details',
    items: WAN_STATUS_ITEMS,
    isLoading: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'WAN interface panel with connection status badge, traffic rates, and uptime. ' +
          'All IP and rate values use the monospace display.',
      },
    },
  },
};

export const VLANDetails: Story = {
  name: 'VLAN Details',
  args: {
    title: 'VLAN 100 — IoT Network',
    items: VLAN_ITEMS,
    isLoading: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'VLAN configuration detail panel. The "Isolation" row uses an info badge. ' +
          'No description prop is passed — the section renders only the title.',
      },
    },
  },
};

export const DegradedInterface: Story = {
  name: 'Degraded Interface',
  args: {
    title: 'ether2 — WAN Backup',
    description: 'Secondary upstream interface',
    items: DEGRADED_ITEMS,
    isLoading: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'An interface that is currently down, with error and warning badges drawing ' +
          'attention to the problematic rows (Link Down, Auto-Negotiate Failed).',
      },
    },
  },
};

export const Loading: Story = {
  name: 'Loading State',
  args: {
    title: 'IP Configuration',
    items: [],
    isLoading: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          'While data is being fetched the component renders an animated pulse skeleton ' +
          'with four placeholder rows, matching the expected height of a typical detail panel.',
      },
    },
  },
};

export const EmptyItems: Story = {
  name: 'Empty — No Details Available',
  args: {
    title: 'Tunnel Details',
    description: 'WireGuard peer information',
    items: [],
    isLoading: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'When `items` is an empty array the component renders a friendly fallback message ' +
          '"No details available." instead of an empty list.',
      },
    },
  },
};
