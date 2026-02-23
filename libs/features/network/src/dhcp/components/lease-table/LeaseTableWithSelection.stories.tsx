/**
 * Storybook stories for LeaseTableWithSelection
 *
 * Desktop table for DHCP leases with sortable columns, bulk checkbox
 * selection, inline search, and expandable row detail panels.
 */

import * as React from 'react';

import { fn } from 'storybook/test';

import { LeaseTableWithSelection } from './LeaseTableWithSelection';

import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof LeaseTableWithSelection> = {
  title: 'Features/Network/DHCP/LeaseTableWithSelection',
  component: LeaseTableWithSelection,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Desktop DHCP lease table with bulk checkbox selection, sortable columns ' +
          '(IP, MAC, hostname, expiration), inline search, and expandable row detail panels. ' +
          'New leases are highlighted with a pulse animation and a "New" badge.',
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="p-6">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof LeaseTableWithSelection>;

// ─── Shared mock leases ───────────────────────────────────────────────────────

const mockLeases = [
  {
    id: 'lease-001',
    address: '192.168.88.101',
    macAddress: 'dc:a6:32:1b:4c:8f',
    hostname: 'reza-macbook',
    status: 'bound' as const,
    expiresAfter: '22h30m',
    lastSeen: new Date('2026-02-19T10:00:00Z'),
    server: 'dhcp1',
    dynamic: true,
    blocked: false,
  },
  {
    id: 'lease-002',
    address: '192.168.88.10',
    macAddress: 'b8:27:eb:45:3c:12',
    hostname: 'pi-hole',
    status: 'bound' as const,
    expiresAfter: undefined,
    lastSeen: new Date('2026-02-19T09:55:00Z'),
    server: 'dhcp1',
    dynamic: false,
    blocked: false,
  },
  {
    id: 'lease-003',
    address: '192.168.88.175',
    macAddress: 'a4:c3:f0:78:2d:99',
    hostname: 'android-phone',
    status: 'offered' as const,
    expiresAfter: '59m50s',
    lastSeen: new Date('2026-02-19T10:14:00Z'),
    server: 'dhcp2',
    dynamic: true,
    blocked: false,
  },
  {
    id: 'lease-004',
    address: '192.168.88.200',
    macAddress: '00:11:22:33:44:55',
    hostname: 'unknown-device',
    status: 'bound' as const,
    expiresAfter: '11h45m',
    lastSeen: new Date('2026-02-19T08:00:00Z'),
    server: 'dhcp1',
    dynamic: true,
    blocked: true,
  },
  {
    id: 'lease-005',
    address: '192.168.88.250',
    macAddress: '4c:5e:0c:90:ab:21',
    hostname: undefined,
    status: 'waiting' as const,
    expiresAfter: '5m12s',
    lastSeen: undefined,
    server: 'dhcp1',
    dynamic: true,
    blocked: false,
  },
];

// ─── Controlled wrapper ───────────────────────────────────────────────────────

function ControlledTable(
  props: Omit<
    React.ComponentProps<typeof LeaseTableWithSelection>,
    'selectedIds' | 'onSelectionChange'
  >
) {
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());
  return (
    <LeaseTableWithSelection
      {...props}
      selectedIds={selectedIds}
      onSelectionChange={setSelectedIds}
    />
  );
}

// ─── Stories ──────────────────────────────────────────────────────────────────

/**
 * Default populated table with 5 leases.
 * All interactions (sort, select, expand) work interactively.
 */
export const Default: Story = {
  render: (args) => <ControlledTable {...args} />,
  args: {
    leases: mockLeases,
    newLeaseIds: new Set(),
  },
};

/**
 * Table with the first two leases highlighted as "New".
 * They show a pulsing background and a gold sparkle badge.
 */
export const WithNewLeases: Story = {
  render: (args) => <ControlledTable {...args} />,
  args: {
    leases: mockLeases,
    newLeaseIds: new Set(['lease-001', 'lease-003']),
  },
};

/**
 * Skeleton loading state shown while leases are being fetched.
 */
export const Loading: Story = {
  args: {
    leases: [],
    isLoading: true,
    selectedIds: new Set(),
    onSelectionChange: fn(),
    newLeaseIds: new Set(),
  },
};

/**
 * Empty state when the router has no DHCP leases.
 */
export const Empty: Story = {
  args: {
    leases: [],
    isLoading: false,
    selectedIds: new Set(),
    onSelectionChange: fn(),
    newLeaseIds: new Set(),
  },
};

/**
 * Table with a large set of pre-selected rows to demonstrate
 * the indeterminate and full-selection checkbox states.
 */
export const WithPreselectedRows: Story = {
  render: (args) => <ControlledTable {...args} />,
  args: {
    leases: mockLeases,
    newLeaseIds: new Set(),
  },
};
