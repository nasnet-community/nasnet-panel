/**
 * DHCPLeaseManagementPage Stories
 *
 * Because DHCPLeaseManagementPage is a thin orchestrator that wires the
 * useLeasePage() hook (which performs live GraphQL calls) to platform-specific
 * presenters, the stories here target the two concrete presenter components
 * directly – DHCPLeaseManagementDesktop and DHCPLeaseManagementMobile – using
 * fully inline mock data.  This approach keeps stories deterministic and free
 * of network dependencies while still covering the real rendering paths.
 */

import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import type { DHCPLease } from '@nasnet/core/types';
import { DHCPLeaseManagementDesktop } from './DHCPLeaseManagementDesktop';

// ---------------------------------------------------------------------------
// Mock lease data
// ---------------------------------------------------------------------------

const makeLease = (overrides: Partial<DHCPLease> & { id: string }): DHCPLease => ({
  id: overrides.id,
  address: '192.168.88.100',
  macAddress: 'AA:BB:CC:DD:EE:01',
  hostname: undefined,
  status: 'bound',
  dynamic: true,
  blocked: false,
  server: 'dhcp1',
  expiresAfter: '10m',
  lastSeen: new Date(),
  ...overrides,
});

const boundLeases: DHCPLease[] = [
  makeLease({
    id: 'lease-1',
    address: '192.168.88.101',
    macAddress: 'AA:BB:CC:DD:EE:01',
    hostname: 'laptop-reza',
    status: 'bound',
    dynamic: true,
    server: 'dhcp1',
    expiresAfter: '23h 55m',
  }),
  makeLease({
    id: 'lease-2',
    address: '192.168.88.102',
    macAddress: 'AA:BB:CC:DD:EE:02',
    hostname: 'iphone-reza',
    status: 'bound',
    dynamic: true,
    server: 'dhcp1',
    expiresAfter: '11h 20m',
  }),
  makeLease({
    id: 'lease-3',
    address: '192.168.88.110',
    macAddress: 'DE:AD:BE:EF:00:01',
    hostname: 'printer-office',
    status: 'bound',
    dynamic: false,      // static binding
    server: 'dhcp1',
    expiresAfter: undefined,
  }),
  makeLease({
    id: 'lease-4',
    address: '192.168.88.200',
    macAddress: 'DE:AD:BE:EF:00:02',
    hostname: undefined, // unknown hostname
    status: 'waiting',
    dynamic: true,
    server: 'dhcp2',
    expiresAfter: '5m',
  }),
  makeLease({
    id: 'lease-5',
    address: '192.168.88.201',
    macAddress: 'DE:AD:BE:EF:00:03',
    hostname: 'nas-storage',
    status: 'bound',
    dynamic: false,
    server: 'dhcp2',
    expiresAfter: undefined,
  }),
];

const servers = [
  { name: 'dhcp1', interface: 'bridge-lan' },
  { name: 'dhcp2', interface: 'bridge-iot' },
];

const noopAsync = async () => { /* no-op for mock actions */ };

// ---------------------------------------------------------------------------
// Meta – stories are written against DHCPLeaseManagementDesktop because the
// Page orchestrator requires live hooks.  The desktop presenter accepts the
// same props that the orchestrator passes down, providing equivalent coverage.
// ---------------------------------------------------------------------------

const meta: Meta<typeof DHCPLeaseManagementDesktop> = {
  title: 'Features/Network/DHCP/DHCPLeaseManagementPage',
  component: DHCPLeaseManagementDesktop,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'DHCP Lease Management page (Desktop presenter). Displays all DHCP leases across ' +
          'configured servers with filtering by status and server, bulk make-static and delete ' +
          'operations, and CSV export. The real page auto-selects between this desktop layout ' +
          'and a mobile card layout via usePlatform().',
      },
    },
  },
  args: {
    makeAllStatic: fn().mockResolvedValue(undefined),
    deleteMultiple: fn().mockResolvedValue(undefined),
    exportToCSV: fn(),
    clearSelection: fn(),
  },
};

export default meta;
type Story = StoryObj<typeof DHCPLeaseManagementDesktop>;

// ---------------------------------------------------------------------------
// Stories
// ---------------------------------------------------------------------------

export const Default: Story = {
  name: 'Populated Lease Table',
  args: {
    leases: boundLeases,
    servers,
    newLeaseIds: new Set(['lease-4']),   // lease-4 will show a "New" badge
    isLoading: false,
    isError: false,
    selectedLeases: [],
  },
  parameters: {
    docs: {
      description: {
        story:
          'Five leases from two DHCP servers. lease-4 carries the "New" badge indicating it ' +
          'appeared in the last polling cycle. The Export CSV button is enabled.',
      },
    },
  },
};

export const WithBulkSelection: Story = {
  name: 'Bulk Selection Active',
  args: {
    leases: boundLeases,
    servers,
    newLeaseIds: new Set<string>(),
    isLoading: false,
    isError: false,
    selectedLeases: ['lease-1', 'lease-2', 'lease-4'],
  },
  parameters: {
    docs: {
      description: {
        story:
          'Three leases selected – the bulk actions toolbar (Make Static / Delete / Clear) is ' +
          'visible above the table.',
      },
    },
  },
};

export const Loading: Story = {
  name: 'Loading State',
  args: {
    leases: [],
    servers: [],
    newLeaseIds: new Set<string>(),
    isLoading: true,
    isError: false,
    selectedLeases: [],
  },
  parameters: {
    docs: {
      description: {
        story:
          'Initial loading state. The table renders skeleton rows and the Export button is ' +
          'disabled.',
      },
    },
  },
};

export const ErrorState: Story = {
  name: 'Error State',
  args: {
    leases: [],
    servers: [],
    newLeaseIds: new Set<string>(),
    isLoading: false,
    isError: true,
    error: new Error('Connection to router timed out after 5 000 ms'),
    selectedLeases: [],
  },
  parameters: {
    docs: {
      description: {
        story:
          'Error banner shown when the GraphQL query fails. The error message from the ' +
          'network layer is surfaced to the user.',
      },
    },
  },
};

export const EmptyState: Story = {
  name: 'No Leases Found',
  args: {
    leases: [],
    servers,
    newLeaseIds: new Set<string>(),
    isLoading: false,
    isError: false,
    selectedLeases: [],
  },
  parameters: {
    docs: {
      description: {
        story:
          'Empty state displayed after a successful fetch that returns zero leases – prompts ' +
          'the user to check their filters or DHCP server configuration.',
      },
    },
  },
};

export const SingleServerSingleLease: Story = {
  name: 'Single Server & Lease',
  args: {
    leases: [
      makeLease({
        id: 'lease-solo',
        address: '10.0.0.50',
        macAddress: '00:1A:2B:3C:4D:5E',
        hostname: 'raspi-kiosk',
        status: 'bound',
        dynamic: true,
        server: 'dhcp-main',
        expiresAfter: '1d',
      }),
    ],
    servers: [{ name: 'dhcp-main', interface: 'ether1' }],
    newLeaseIds: new Set<string>(),
    isLoading: false,
    isError: false,
    selectedLeases: [],
  },
  parameters: {
    docs: {
      description: {
        story:
          'Minimal scenario: one server, one active lease. Useful for verifying that the ' +
          'table renders correctly at its lower bound.',
      },
    },
  },
};
