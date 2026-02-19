/**
 * Storybook stories for ConnectionHistoryTable.
 *
 * Covers: populated table, empty state, error state, loading state,
 * large dataset (pagination), and single-event view.
 */

import type { Meta, StoryObj } from '@storybook/react';
import { ConnectionHistoryTable } from './ConnectionHistoryTable';
import type { ConnectionEventData } from '../../types/wan.types';

// ---------------------------------------------------------------------------
// Mock data helpers
// ---------------------------------------------------------------------------

function makeEvent(
  overrides: Partial<ConnectionEventData> & Pick<ConnectionEventData, 'id' | 'eventType'>
): ConnectionEventData {
  return {
    wanInterfaceId: 'ether1-wan',
    timestamp: new Date(Date.now() - Math.random() * 48 * 60 * 60 * 1000).toISOString(),
    ...overrides,
  };
}

const sampleEvents: ConnectionEventData[] = [
  makeEvent({
    id: 'evt-001',
    eventType: 'CONNECTED',
    timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    publicIP: '203.0.113.42',
    gateway: '203.0.113.1',
    wanInterfaceId: 'ether1-wan',
  }),
  makeEvent({
    id: 'evt-002',
    eventType: 'IP_CHANGED',
    timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    publicIP: '198.51.100.88',
    gateway: '198.51.100.1',
    reason: 'DHCP lease renewed with new address',
    wanInterfaceId: 'ether1-wan',
  }),
  makeEvent({
    id: 'evt-003',
    eventType: 'RECONNECTING',
    timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    reason: 'Signal lost; attempting reconnect (attempt 2/5)',
    wanInterfaceId: 'lte1',
  }),
  makeEvent({
    id: 'evt-004',
    eventType: 'DISCONNECTED',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    reason: 'Physical link down (carrier lost)',
    duration: 7200,
    wanInterfaceId: 'ether1-wan',
  }),
  makeEvent({
    id: 'evt-005',
    eventType: 'AUTH_FAILED',
    timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    reason: 'CHAP authentication rejected by ISP server',
    wanInterfaceId: 'pppoe-isp',
  }),
  makeEvent({
    id: 'evt-006',
    eventType: 'CONNECTED',
    timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    publicIP: '203.0.113.10',
    gateway: '203.0.113.1',
    wanInterfaceId: 'ether1-wan',
  }),
];

// Generate 25 events for the pagination story
const manyEvents: ConnectionEventData[] = Array.from({ length: 25 }, (_, i) => {
  const types = ['CONNECTED', 'DISCONNECTED', 'RECONNECTING', 'IP_CHANGED', 'AUTH_FAILED'];
  const eventType = types[i % types.length];
  return makeEvent({
    id: `evt-page-${i}`,
    eventType,
    timestamp: new Date(Date.now() - i * 20 * 60 * 1000).toISOString(),
    publicIP: eventType === 'CONNECTED' || eventType === 'IP_CHANGED' ? `203.0.113.${i + 1}` : undefined,
    wanInterfaceId: i % 3 === 0 ? 'lte1' : 'ether1-wan',
  });
});

// ---------------------------------------------------------------------------
// Meta
// ---------------------------------------------------------------------------

const meta: Meta<typeof ConnectionHistoryTable> = {
  title: 'Features/Network/WAN/ConnectionHistoryTable',
  component: ConnectionHistoryTable,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Filterable, paginated timeline of WAN connection events. Supports text search ' +
          '(by IP, interface, or reason), event-type filtering, and page-size control. ' +
          'Adapts between full-width timeline cards (desktop) and compact cards (mobile) ' +
          'based on the active platform context.',
      },
    },
  },
  argTypes: {
    pageSize: {
      control: { type: 'select' },
      options: [5, 10, 20, 50],
      description: 'Number of events shown per page',
    },
    loading: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof ConnectionHistoryTable>;

// ---------------------------------------------------------------------------
// Stories
// ---------------------------------------------------------------------------

export const Default: Story = {
  name: 'Default (populated)',
  args: {
    events: sampleEvents,
    loading: false,
    error: null,
    pageSize: 20,
  },
};

export const SmallPageSize: Story = {
  name: 'Pagination (page size 3)',
  args: {
    events: manyEvents,
    loading: false,
    error: null,
    pageSize: 3,
  },
};

export const LargeDataset: Story = {
  name: 'Large Dataset (25 events, page 10)',
  args: {
    events: manyEvents,
    loading: false,
    error: null,
    pageSize: 10,
  },
};

export const Loading: Story = {
  name: 'Loading State',
  args: {
    events: [],
    loading: true,
    error: null,
    pageSize: 20,
  },
};

export const Empty: Story = {
  name: 'Empty State',
  args: {
    events: [],
    loading: false,
    error: null,
    pageSize: 20,
  },
};

export const WithError: Story = {
  name: 'Error State (no cached data)',
  args: {
    events: [],
    loading: false,
    error: new Error('Connection timed out while fetching history from router'),
    pageSize: 20,
  },
};

export const ErrorWithCachedData: Story = {
  name: 'Error Banner (stale cached data)',
  args: {
    events: sampleEvents,
    loading: false,
    error: new Error('Failed to refresh: router unreachable'),
    pageSize: 20,
  },
};

export const WithRefreshHandler: Story = {
  name: 'With Refresh Button',
  args: {
    events: sampleEvents,
    loading: false,
    error: null,
    pageSize: 20,
    onRefresh: () => alert('Refresh triggered'),
  },
};
