/**
 * Storybook stories for NetworkQuickStats
 * At-a-glance tile grid for key network metrics.
 */

import { Activity, Globe, Network, Shield, Users, Wifi, Server, AlertTriangle } from 'lucide-react';

import { NetworkQuickStats, type QuickStat } from './NetworkQuickStats';

import type { Meta, StoryObj } from '@storybook/react';

// ---------------------------------------------------------------------------
// Mock stat sets
// ---------------------------------------------------------------------------

const STANDARD_STATS: QuickStat[] = [
  {
    label: 'Total Interfaces',
    value: 8,
    subLabel: '6 active',
    icon: Network,
    variant: 'cyan',
  },
  {
    label: 'Connected Devices',
    value: 24,
    subLabel: 'via ARP / DHCP',
    icon: Users,
    variant: 'emerald',
  },
  {
    label: 'IP Addresses',
    value: 12,
    subLabel: 'assigned',
    icon: Globe,
    variant: 'blue',
  },
  {
    label: 'Firewall Rules',
    value: 47,
    subLabel: 'active rules',
    icon: Shield,
    variant: 'purple',
  },
];

const WIRELESS_STATS: QuickStat[] = [
  {
    label: 'AP Interfaces',
    value: 3,
    subLabel: '2.4 GHz + 5 GHz + 6 GHz',
    icon: Wifi,
    variant: 'cyan',
  },
  {
    label: 'Associated Clients',
    value: 18,
    subLabel: 'across all bands',
    icon: Users,
    variant: 'emerald',
  },
  {
    label: 'TX Throughput',
    value: '154 Mbps',
    icon: Activity,
    variant: 'amber',
  },
  {
    label: 'Signal (avg)',
    value: '-58 dBm',
    subLabel: 'Good',
    icon: Wifi,
    variant: 'blue',
  },
];

const DEGRADED_STATS: QuickStat[] = [
  {
    label: 'Total Interfaces',
    value: 8,
    subLabel: '2 active',
    icon: Network,
    variant: 'red',
  },
  {
    label: 'Connected Devices',
    value: 3,
    subLabel: 'of 24 normal',
    icon: Users,
    variant: 'amber',
  },
  {
    label: 'Packet Loss',
    value: '14%',
    subLabel: 'on WAN',
    icon: AlertTriangle,
    variant: 'red',
  },
  {
    label: 'Latency',
    value: '220 ms',
    subLabel: 'elevated',
    icon: Activity,
    variant: 'amber',
  },
];

const VPN_STATS: QuickStat[] = [
  {
    label: 'VPN Peers',
    value: 6,
    subLabel: '5 connected',
    icon: Shield,
    variant: 'purple',
  },
  {
    label: 'TX Bytes',
    value: '4.2 GB',
    icon: Activity,
    variant: 'cyan',
  },
  {
    label: 'RX Bytes',
    value: '19.8 GB',
    icon: Activity,
    variant: 'emerald',
  },
  {
    label: 'Tunnels Up',
    value: 5,
    subLabel: '1 reconnecting',
    icon: Server,
    variant: 'blue',
  },
];

// ---------------------------------------------------------------------------
// Meta
// ---------------------------------------------------------------------------

const meta: Meta<typeof NetworkQuickStats> = {
  title: 'App/Network/NetworkQuickStats',
  component: NetworkQuickStats,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'A responsive 2×N / 4×N grid of compact stat tiles for at-a-glance network metrics. ' +
          'Each tile shows a coloured icon, a large numeric or string value, a short label, ' +
          'and an optional sub-label (unit, trend, or context). ' +
          'On small screens the grid collapses to 2 columns; on sm+ it expands to 4. ' +
          'An animated skeleton is rendered while `isLoading` is true.',
      },
    },
  },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 700 }}>
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
type Story = StoryObj<typeof NetworkQuickStats>;

// ---------------------------------------------------------------------------
// Stories
// ---------------------------------------------------------------------------

export const Default: Story = {
  name: 'Default — Network Overview',
  args: {
    stats: STANDARD_STATS,
    isLoading: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Standard 4-tile summary for the main Network dashboard page: ' +
          'total interfaces, connected devices, IP addresses, and firewall rule count.',
      },
    },
  },
};

export const WirelessView: Story = {
  name: 'Wireless View',
  args: {
    stats: WIRELESS_STATS,
    isLoading: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Stats tailored to the wireless/WiFi sub-page: AP count, associated clients, ' +
          'throughput, and average signal strength.',
      },
    },
  },
};

export const DegradedNetwork: Story = {
  name: 'Degraded Network',
  args: {
    stats: DEGRADED_STATS,
    isLoading: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Degraded state where most metrics use red or amber icon variants to signal problems ' +
          '(high packet loss, elevated latency, few active interfaces).',
      },
    },
  },
};

export const VPNOverview: Story = {
  name: 'VPN Overview',
  args: {
    stats: VPN_STATS,
    isLoading: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Alternative stat set for a VPN summary — peer count, byte counters, and tunnel status.',
      },
    },
  },
};

export const Loading: Story = {
  name: 'Loading State',
  args: {
    stats: [],
    isLoading: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          'While data is being fetched the grid renders four animated skeleton tiles, ' +
          'preserving the layout height to prevent content shift.',
      },
    },
  },
};

export const TwoStats: Story = {
  name: 'Two Stat Tiles',
  args: {
    stats: [
      {
        label: 'Active Interfaces',
        value: 6,
        subLabel: 'of 8 total',
        icon: Network,
        variant: 'cyan',
      },
      {
        label: 'Connected Devices',
        value: 24,
        subLabel: 'ARP / DHCP',
        icon: Users,
        variant: 'emerald',
      },
    ] satisfies QuickStat[],
    isLoading: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Minimal two-tile layout — useful for sidebar widgets or narrow panels where ' +
          'only the most important metrics need to be surfaced.',
      },
    },
  },
};
