import type { Meta, StoryObj } from '@storybook/react';
import { VirtualizedTable, createTextColumn, createSelectionColumn } from './VirtualizedTable';
import type { ColumnDef } from '@tanstack/react-table';
import React, { useState, useMemo } from 'react';

/**
 * VirtualizedTable combines TanStack Table with TanStack Virtual for
 * high-performance data tables. It supports sorting, filtering, selection,
 * and row virtualization.
 *
 * Key Features:
 * - Row virtualization for 1000+ rows
 * - Integrated sorting with <100ms response
 * - Row selection with keyboard support
 * - Sticky header during scroll
 * - Configurable row heights
 *
 * Performance Targets:
 * - Sort 1000 rows in <100ms
 * - Maintain 60fps scroll
 * - Memory efficient rendering
 */
const meta: Meta<typeof VirtualizedTable> = {
  title: 'Performance/VirtualizedTable',
  component: VirtualizedTable,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'High-performance virtualized table for rendering large datasets with sorting and selection.',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof VirtualizedTable>;

// Mock data interfaces
interface FirewallRule {
  id: number;
  chain: string;
  action: string;
  srcAddress: string;
  dstAddress: string;
  protocol: string;
  dstPort: string;
  comment: string;
  disabled: boolean;
}

interface DHCPLease {
  id: number;
  address: string;
  macAddress: string;
  clientId: string;
  hostname: string;
  status: 'bound' | 'waiting' | 'offered';
  expiresAfter: string;
  server: string;
}

// Data generators
function generateFirewallRules(count: number): FirewallRule[] {
  const chains = ['input', 'forward', 'output'];
  const actions = ['accept', 'drop', 'reject', 'jump'];
  const protocols = ['tcp', 'udp', 'icmp', 'any'];

  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    chain: chains[i % chains.length],
    action: actions[i % actions.length],
    srcAddress: `192.168.${Math.floor(i / 256)}.${i % 256}/24`,
    dstAddress: i % 5 === 0 ? '0.0.0.0/0' : `10.0.${Math.floor(i / 256)}.${i % 256}`,
    protocol: protocols[i % protocols.length],
    dstPort: i % 3 === 0 ? '80,443' : i % 3 === 1 ? '22' : '',
    comment: i % 4 === 0 ? `Rule ${i + 1} - Auto generated` : '',
    disabled: i % 10 === 0,
  }));
}

function generateDHCPLeases(count: number): DHCPLease[] {
  const statuses: Array<'bound' | 'waiting' | 'offered'> = ['bound', 'waiting', 'offered'];

  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    address: `192.168.1.${(i % 254) + 1}`,
    macAddress: `00:1A:2B:${i.toString(16).padStart(2, '0').toUpperCase()}:${((i * 3) % 256).toString(16).padStart(2, '0').toUpperCase()}:${((i * 7) % 256).toString(16).padStart(2, '0').toUpperCase()}`,
    clientId: `client-${i + 1}`,
    hostname: i % 3 === 0 ? `device-${i + 1}` : i % 3 === 1 ? `laptop-${i + 1}` : `phone-${i + 1}`,
    status: statuses[i % statuses.length],
    expiresAfter: `${Math.floor(Math.random() * 24)}h ${Math.floor(Math.random() * 60)}m`,
    server: i % 2 === 0 ? 'dhcp1' : 'dhcp2',
  }));
}

// Column definitions
const firewallColumns: ColumnDef<FirewallRule, unknown>[] = [
  createTextColumn('id', '#', { size: 60 }),
  createTextColumn('chain', 'Chain'),
  createTextColumn('action', 'Action'),
  createTextColumn('srcAddress', 'Source'),
  createTextColumn('dstAddress', 'Destination'),
  createTextColumn('protocol', 'Protocol'),
  createTextColumn('dstPort', 'Port'),
  createTextColumn('comment', 'Comment'),
];

const dhcpColumns: ColumnDef<DHCPLease, unknown>[] = [
  createTextColumn('address', 'IP Address'),
  createTextColumn('macAddress', 'MAC Address'),
  createTextColumn('hostname', 'Hostname'),
  createTextColumn('status', 'Status'),
  createTextColumn('expiresAfter', 'Expires'),
  createTextColumn('server', 'Server'),
];

/**
 * Firewall rules table with 1000 rows. Try sorting by clicking column headers.
 */
export const FirewallRules: Story = {
  args: {
    data: generateFirewallRules(1000),
    columns: firewallColumns,
    height: 500,
    enableSorting: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          '1000 firewall rules with sorting. Click column headers to sort - should complete in <100ms.',
      },
    },
  },
};

/**
 * DHCP leases table with row selection support.
 */
export const DHCPLeases: Story = {
  args: {
    data: generateDHCPLeases(500),
    columns: [createSelectionColumn<DHCPLease>(), ...dhcpColumns],
    height: 500,
    enableSorting: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'DHCP leases with selection checkboxes. Select rows using checkboxes or click.',
      },
    },
  },
};

/**
 * Large dataset with 10,000 rows to test performance limits.
 */
export const LargeDataset: Story = {
  args: {
    data: generateFirewallRules(10000),
    columns: firewallColumns,
    height: 600,
    enableSorting: true,
    forceVirtualization: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          '10,000 rows demonstrating virtualization at scale. Scroll and sort performance should remain smooth.',
      },
    },
  },
};

/**
 * Compact row size for dense data display.
 */
export const CompactRows: Story = {
  args: {
    data: generateFirewallRules(500),
    columns: firewallColumns,
    height: 500,
    enableSorting: true,
    rowSize: 'compact',
  },
  parameters: {
    docs: {
      description: {
        story: 'Compact row height (32px) for denser data display.',
      },
    },
  },
};

/**
 * Comfortable row size for better readability.
 */
export const ComfortableRows: Story = {
  args: {
    data: generateDHCPLeases(200),
    columns: dhcpColumns,
    height: 500,
    enableSorting: true,
    rowSize: 'comfortable',
  },
  parameters: {
    docs: {
      description: {
        story: 'Comfortable row height (56px) for better readability.',
      },
    },
  },
};

/**
 * Interactive example with live filtering.
 */
export const WithFiltering: Story = {
  render: () => {
    const [filter, setFilter] = useState('');
    const allData = useMemo(() => generateDHCPLeases(1000), []);
    const filteredData = useMemo(
      () =>
        filter
          ? allData.filter(
              (lease) =>
                lease.address.includes(filter) ||
                lease.hostname.toLowerCase().includes(filter.toLowerCase()) ||
                lease.macAddress.toLowerCase().includes(filter.toLowerCase())
            )
          : allData,
      [allData, filter]
    );

    return (
      <div className="space-y-4">
        <input
          type="text"
          placeholder="Filter by IP, hostname, or MAC..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="w-full px-4 py-2 border rounded-lg"
        />
        <div className="text-sm text-gray-500">
          Showing {filteredData.length} of {allData.length} leases
        </div>
        <VirtualizedTable
          data={filteredData}
          columns={dhcpColumns}
          height={400}
          enableSorting
        />
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          'Live filtering example. The table efficiently re-renders as you type.',
      },
    },
  },
};

/**
 * Small dataset that renders normally without virtualization.
 */
export const SmallDataset: Story = {
  args: {
    data: generateDHCPLeases(20),
    columns: dhcpColumns,
    height: 400,
    enableSorting: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Datasets below 50 rows render without virtualization for simpler DOM structure.',
      },
    },
  },
};

/**
 * Empty state when no data is available.
 */
export const EmptyState: Story = {
  args: {
    data: [],
    columns: dhcpColumns,
    height: 400,
    enableSorting: true,
    emptyMessage: 'No DHCP leases found',
  },
  parameters: {
    docs: {
      description: {
        story: 'Empty state with custom message when no data is available.',
      },
    },
  },
};

/**
 * Loading state while fetching data.
 */
export const LoadingState: Story = {
  args: {
    data: [],
    columns: dhcpColumns,
    height: 400,
    isLoading: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Loading skeleton while data is being fetched.',
      },
    },
  },
};
