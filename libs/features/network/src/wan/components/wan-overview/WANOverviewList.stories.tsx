/**
 * Storybook stories for WANOverviewList.
 *
 * Covers: multi-WAN grid, single WAN, empty state, loading state,
 * error state, and error banner with cached data.
 */

import { WANOverviewList } from './WANOverviewList';

import type { WANInterfaceData } from '../../types/wan.types';
import type { Meta, StoryObj } from '@storybook/react';

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const dhcpWan: WANInterfaceData = {
  id: 'wan-01',
  interfaceName: 'ether1-wan',
  connectionType: 'DHCP',
  status: 'CONNECTED',
  publicIP: '203.0.113.42',
  gateway: '203.0.113.1',
  primaryDNS: '8.8.8.8',
  secondaryDNS: '8.8.4.4',
  uptime: 86400,
  lastConnected: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  isDefaultRoute: true,
  healthStatus: 'HEALTHY',
  healthTarget: '8.8.8.8',
  healthLatency: 12,
  healthEnabled: true,
};

const pppoeWan: WANInterfaceData = {
  id: 'wan-02',
  interfaceName: 'pppoe-isp',
  connectionType: 'PPPOE',
  status: 'CONNECTED',
  publicIP: '198.51.100.10',
  gateway: '198.51.100.1',
  primaryDNS: '1.1.1.1',
  uptime: 7200,
  lastConnected: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  isDefaultRoute: false,
  healthStatus: 'DEGRADED',
  healthTarget: '1.1.1.1',
  healthLatency: 142,
  healthEnabled: true,
};

const lteWan: WANInterfaceData = {
  id: 'wan-03',
  interfaceName: 'lte1',
  connectionType: 'LTE',
  status: 'DISCONNECTED',
  isDefaultRoute: false,
  healthStatus: 'DOWN',
  healthEnabled: true,
  lastConnected: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
};

const staticWan: WANInterfaceData = {
  id: 'wan-04',
  interfaceName: 'ether2-static',
  connectionType: 'STATIC_IP',
  status: 'CONNECTED',
  publicIP: '192.0.2.50',
  gateway: '192.0.2.1',
  primaryDNS: '9.9.9.9',
  uptime: 3600,
  lastConnected: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
  isDefaultRoute: false,
  healthStatus: 'UNKNOWN',
  healthEnabled: false,
};

const connectingWan: WANInterfaceData = {
  id: 'wan-05',
  interfaceName: 'ether3-backup',
  connectionType: 'DHCP',
  status: 'CONNECTING',
  isDefaultRoute: false,
  healthStatus: 'UNKNOWN',
  healthEnabled: false,
};

// ---------------------------------------------------------------------------
// Meta
// ---------------------------------------------------------------------------

const meta: Meta<typeof WANOverviewList> = {
  title: 'Features/Network/WAN/WANOverviewList',
  component: WANOverviewList,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Responsive grid of WAN interface cards. Sorts WANs by: default route first, ' +
          'then connected before disconnected, then alphabetically. ' +
          'On mobile renders `WANCardCompact` in a single column; on tablet/desktop ' +
          'renders full `WANCard` components in a 2–3 column grid.',
      },
    },
  },
  argTypes: {
    loading: { control: 'boolean' },
    onAddWAN: { action: 'onAddWAN' },
    onConfigureWAN: { action: 'onConfigureWAN' },
    onViewDetails: { action: 'onViewDetails' },
    onRefresh: { action: 'onRefresh' },
  },
};

export default meta;
type Story = StoryObj<typeof WANOverviewList>;

// ---------------------------------------------------------------------------
// Stories
// ---------------------------------------------------------------------------

export const Default: Story = {
  name: 'Default (4 WANs – mixed status)',
  args: {
    wans: [dhcpWan, pppoeWan, lteWan, staticWan],
    loading: false,
    error: null,
  },
};

export const AllConnected: Story = {
  name: 'All Connected',
  args: {
    wans: [dhcpWan, staticWan, { ...pppoeWan, healthStatus: 'HEALTHY', healthLatency: 9 }],
    loading: false,
    error: null,
  },
};

export const WithConnecting: Story = {
  name: 'With Connecting Interface',
  args: {
    wans: [dhcpWan, connectingWan, lteWan],
    loading: false,
    error: null,
  },
};

export const SingleWAN: Story = {
  name: 'Single WAN',
  args: {
    wans: [dhcpWan],
    loading: false,
    error: null,
  },
};

export const WithActions: Story = {
  name: 'With Add / Configure / Refresh Actions',
  args: {
    wans: [dhcpWan, pppoeWan],
    loading: false,
    error: null,
    onAddWAN: () => alert('Add WAN clicked'),
    onConfigureWAN: (id) => alert(`Configure WAN: ${id}`),
    onViewDetails: (id) => alert(`View details: ${id}`),
    onRefresh: () => alert('Refresh clicked'),
  },
};

export const Loading: Story = {
  name: 'Loading State',
  args: {
    wans: [],
    loading: true,
    error: null,
  },
};

export const Empty: Story = {
  name: 'Empty State',
  args: {
    wans: [],
    loading: false,
    error: null,
    onAddWAN: () => alert('Add WAN clicked'),
  },
};

export const ErrorNoData: Story = {
  name: 'Error State (no cached data)',
  args: {
    wans: [],
    loading: false,
    error: new Error('Failed to fetch WAN interfaces: connection refused (router offline)'),
    onRefresh: () => alert('Retry clicked'),
  },
};

export const ErrorWithCachedData: Story = {
  name: 'Error Banner (stale cached data)',
  args: {
    wans: [dhcpWan, pppoeWan],
    loading: false,
    error: new Error('Refresh failed: request timeout'),
    onRefresh: () => alert('Retry clicked'),
  },
};
