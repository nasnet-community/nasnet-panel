/**
 * IPAddressList Stories
 *
 * IPAddressList is a headless + platform-presenter wrapper. It auto-selects
 * IPAddressListDesktop (DataTable) or IPAddressListMobile (card list) depending
 * on the active viewport.
 *
 * All stories pass data directly as props — no GraphQL required.
 */

import { useState } from 'react';

import type { Meta, StoryObj } from '@storybook/react';

import { IPAddressList } from './IPAddressList';
import type {
  IPAddressData,
  IPAddressFilters,
  IPAddressSortOptions,
} from './types';

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const mockAddresses: IPAddressData[] = [
  {
    id: '1',
    address: '192.168.1.1/24',
    network: '192.168.1.0',
    broadcast: '192.168.1.255',
    interface: { id: 'ether1', name: 'ether1', type: 'ethernet' },
    disabled: false,
    dynamic: false,
    invalid: false,
    comment: 'Management IP',
  },
  {
    id: '2',
    address: '10.0.0.1/8',
    network: '10.0.0.0',
    broadcast: '10.255.255.255',
    interface: { id: 'ether2', name: 'ether2', type: 'ethernet' },
    disabled: false,
    dynamic: true,
    invalid: false,
    comment: 'DHCP-assigned WAN',
  },
  {
    id: '3',
    address: '172.16.0.1/16',
    network: '172.16.0.0',
    broadcast: '172.16.255.255',
    interface: { id: 'bridge1', name: 'bridge1', type: 'bridge' },
    disabled: true,
    dynamic: false,
    invalid: false,
  },
  {
    id: '4',
    address: '192.168.88.1/24',
    network: '192.168.88.0',
    broadcast: '192.168.88.255',
    interface: { id: 'bridge1', name: 'bridge1', type: 'bridge' },
    disabled: false,
    dynamic: false,
    invalid: false,
    comment: 'Hotspot network',
  },
  {
    id: '5',
    address: '203.0.113.45/32',
    network: '203.0.113.45',
    broadcast: '203.0.113.45',
    interface: { id: 'ether1', name: 'ether1', type: 'ethernet' },
    disabled: false,
    dynamic: false,
    invalid: true,
    comment: 'Public IP (invalid config)',
  },
];

const defaultFilters: IPAddressFilters = { source: 'all', status: 'all' };
const defaultSort: IPAddressSortOptions = { field: 'address', direction: 'asc' };

// ---------------------------------------------------------------------------
// Stateful wrapper
// ---------------------------------------------------------------------------

function StatefulList({
  addresses = mockAddresses,
  loading = false,
  error,
}: {
  addresses?: IPAddressData[];
  loading?: boolean;
  error?: string;
}) {
  const [filters, setFilters] = useState<IPAddressFilters>(defaultFilters);
  const [sortOptions, setSortOptions] = useState<IPAddressSortOptions>(defaultSort);

  return (
    <div className="p-6 bg-background min-h-screen">
      <IPAddressList
        ipAddresses={addresses}
        loading={loading}
        error={error}
        filters={filters}
        sortOptions={sortOptions}
        onFiltersChange={setFilters}
        onSortChange={setSortOptions}
        onEdit={(ip) => console.log('edit', ip)}
        onDelete={(ip) => console.log('delete', ip)}
        onToggleDisabled={(ip) => console.log('toggle', ip)}
        onRefresh={() => console.log('refresh')}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Meta
// ---------------------------------------------------------------------------

const meta: Meta<typeof IPAddressList> = {
  title: 'Features/Network/IPAddressList',
  component: IPAddressList,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Displays and manages IP addresses assigned to network interfaces. Automatically selects the Desktop DataTable or Mobile card layout based on viewport. Supports filtering by source (static/dynamic), status (enabled/disabled), interface name, and free-text search. Dynamic addresses have their actions disabled.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof IPAddressList>;

// ---------------------------------------------------------------------------
// Stories
// ---------------------------------------------------------------------------

/** Full list with static, dynamic, disabled, and invalid entries. */
export const Default: Story = {
  render: () => <StatefulList />,
};

/** Skeleton rows displayed while the query is in flight. */
export const Loading: Story = {
  render: () => <StatefulList loading={true} addresses={[]} />,
};

/** Empty state when no IP addresses are configured on the router. */
export const Empty: Story = {
  render: () => <StatefulList addresses={[]} />,
};

/** Error banner when the GraphQL query fails. */
export const ErrorState: Story = {
  render: () => (
    <StatefulList
      addresses={[]}
      error="Failed to fetch IP addresses. Connection refused."
    />
  ),
};

/** Only a single IP address — useful for checking footer count and layout. */
export const SingleEntry: Story = {
  render: () => <StatefulList addresses={[mockAddresses[0]]} />,
};

/** Mobile card layout — each IP address renders as a tappable card. */
export const MobileView: Story = {
  render: () => <StatefulList />,
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
    docs: {
      description: {
        story: 'On mobile the list switches to a card-based layout with 44 px touch targets.',
      },
    },
  },
};
