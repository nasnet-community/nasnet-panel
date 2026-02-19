/**
 * Storybook stories for InterfaceComparison
 *
 * This component depends on:
 * - useInterfaceStatsSubscription (GraphQL subscription) – mocked via args
 * - BandwidthChart (rendered only when interfaces are selected)
 * - DataTable / Card primitives
 *
 * Stories exercise the table in various data configurations.
 * Live subscriptions and chart rendering are intentionally left as stubs so
 * stories load instantly without a real backend.
 */

import { InterfaceComparison } from './interface-comparison';

import type { InterfaceInfo } from './interface-comparison';
import type { Meta, StoryObj } from '@storybook/react';

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const allOnline: InterfaceInfo[] = [
  { id: 'ether1', name: 'ether1 - WAN', status: 'online' },
  { id: 'ether2', name: 'ether2 - LAN', status: 'online' },
  { id: 'ether3', name: 'ether3 - DMZ', status: 'online' },
  { id: 'wlan1', name: 'wlan1 - AP', status: 'online' },
];

const mixedStatus: InterfaceInfo[] = [
  { id: 'ether1', name: 'ether1 - WAN', status: 'online' },
  { id: 'ether2', name: 'ether2 - LAN', status: 'degraded' },
  { id: 'ether3', name: 'ether3 - Backup WAN', status: 'offline' },
  { id: 'wlan1', name: 'wlan1 - Guest WiFi', status: 'online' },
  { id: 'bridge1', name: 'bridge1 - Internal', status: 'degraded' },
];

const singleInterface: InterfaceInfo[] = [
  { id: 'ether1', name: 'ether1 - WAN', status: 'online' },
];

const largeFleet: InterfaceInfo[] = [
  { id: 'ether1', name: 'ether1 - WAN', status: 'online' },
  { id: 'ether2', name: 'ether2 - LAN', status: 'online' },
  { id: 'ether3', name: 'ether3 - DMZ', status: 'online' },
  { id: 'ether4', name: 'ether4 - Backup', status: 'offline' },
  { id: 'ether5', name: 'ether5 - Management', status: 'online' },
  { id: 'wlan1', name: 'wlan1 - 2.4 GHz', status: 'online' },
  { id: 'wlan2', name: 'wlan2 - 5 GHz', status: 'degraded' },
  { id: 'bridge1', name: 'bridge1 - Internal Bridge', status: 'online' },
];

// ---------------------------------------------------------------------------
// Meta
// ---------------------------------------------------------------------------

const meta: Meta<typeof InterfaceComparison> = {
  title: 'Features/Network/InterfaceStats/InterfaceComparison',
  component: InterfaceComparison,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
**InterfaceComparison** displays a sortable table of all interfaces with
live TX/RX rates, error counts and status badges.

Key features:
- Select up to **3 interfaces** via checkboxes for side-by-side bandwidth chart comparison
- Top-3 busiest interfaces are automatically labelled as **Hotspot**
- All columns are sortable
- Supports \`timeRange\` and \`interval\` props to control subscription granularity

> Note: In Storybook, live GraphQL subscriptions are not active, so TX/RX rates
> will show as zero. The table structure, sorting, and selection mechanics are
> fully demonstrable.
        `,
      },
    },
  },
  argTypes: {
    timeRange: {
      control: 'select',
      options: ['1h', '6h', '24h', '7d', '30d'],
      description: 'Time window for bandwidth history charts',
    },
    interval: {
      control: 'select',
      options: ['1s', '5s', '10s', '30s'],
      description: 'Subscription polling interval',
    },
  },
};

export default meta;
type Story = StoryObj<typeof InterfaceComparison>;

// ---------------------------------------------------------------------------
// Stories
// ---------------------------------------------------------------------------

/**
 * All interfaces online – the most common production state.
 * Top 3 rows will be marked as Hotspot (all show 0 B/s since there is no
 * live subscription in Storybook).
 */
export const Default: Story = {
  args: {
    routerId: 'router-demo-01',
    interfaces: allOnline,
    timeRange: '24h',
    interval: '5s',
  },
};

/**
 * Mixed statuses (online / degraded / offline) showing all three badge
 * variants simultaneously.
 */
export const MixedStatus: Story = {
  args: {
    routerId: 'router-demo-01',
    interfaces: mixedStatus,
    timeRange: '6h',
    interval: '10s',
  },
};

/**
 * Only a single interface available – minimal table, no charts selectable
 * until the checkbox is ticked.
 */
export const SingleInterface: Story = {
  args: {
    routerId: 'router-demo-01',
    interfaces: singleInterface,
    timeRange: '1h',
    interval: '5s',
  },
};

/**
 * Empty interface list – should render the DataTable empty-state message.
 */
export const NoInterfaces: Story = {
  args: {
    routerId: 'router-demo-01',
    interfaces: [],
    timeRange: '24h',
    interval: '5s',
  },
};

/**
 * Eight interfaces representing a larger fleet. Demonstrates how the table
 * handles more rows and confirms Hotspot labelling on only the top 3.
 */
export const LargeFleet: Story = {
  args: {
    routerId: 'router-prod-01',
    interfaces: largeFleet,
    timeRange: '7d',
    interval: '30s',
  },
};

/**
 * Short 1-hour time range with real-time 1-second polling – as would be
 * used during active incident investigation.
 */
export const RealTimeShortRange: Story = {
  args: {
    routerId: 'router-demo-01',
    interfaces: allOnline,
    timeRange: '1h',
    interval: '1s',
  },
};
