/**
 * DataTable Stories
 *
 * Storybook stories for the DataTable pattern component.
 * Demonstrates column definitions, data states, loading, empty, and clickable rows.
 */

import { Badge } from '@nasnet/ui/primitives';

import { DataTable } from './data-table';

import type { DataTableColumn } from './data-table';
import type { Meta, StoryObj } from '@storybook/react';

// ─── Mock data types ────────────────────────────────────────────────────────

interface NetworkInterface {
  id: string;
  name: string;
  type: string;
  status: string;
  ipAddress: string;
  macAddress: string;
  rxBytes: string;
  txBytes: string;
}

interface DHCPLease {
  id: string;
  hostname: string;
  ipAddress: string;
  macAddress: string;
  expiresIn: string;
  status: string;
}

interface FirewallRule {
  id: string;
  chain: string;
  action: string;
  srcAddress: string;
  dstAddress: string;
  protocol: string;
  comment: string;
}

// ─── Mock data ───────────────────────────────────────────────────────────────

const networkInterfaces: NetworkInterface[] = [
  {
    id: '1',
    name: 'ether1',
    type: 'Ethernet',
    status: 'online',
    ipAddress: '192.168.1.1/24',
    macAddress: 'DC:2C:6E:4A:1B:2F',
    rxBytes: '1.2 GB',
    txBytes: '456 MB',
  },
  {
    id: '2',
    name: 'ether2',
    type: 'Ethernet',
    status: 'online',
    ipAddress: '10.0.0.1/30',
    macAddress: 'DC:2C:6E:4A:1B:30',
    rxBytes: '320 MB',
    txBytes: '88 MB',
  },
  {
    id: '3',
    name: 'wlan1',
    type: 'Wireless',
    status: 'online',
    ipAddress: '192.168.88.1/24',
    macAddress: 'DC:2C:6E:4A:1B:31',
    rxBytes: '2.8 GB',
    txBytes: '1.1 GB',
  },
  {
    id: '4',
    name: 'wg0',
    type: 'WireGuard',
    status: 'offline',
    ipAddress: '10.10.0.1/24',
    macAddress: '-',
    rxBytes: '0 B',
    txBytes: '0 B',
  },
  {
    id: '5',
    name: 'pppoe-out1',
    type: 'PPPoE',
    status: 'online',
    ipAddress: '203.0.113.45/32',
    macAddress: 'DC:2C:6E:4A:1B:32',
    rxBytes: '14.7 GB',
    txBytes: '3.2 GB',
  },
];

const dhcpLeases: DHCPLease[] = [
  {
    id: '1',
    hostname: 'desktop-workstation',
    ipAddress: '192.168.1.10',
    macAddress: 'A4:C3:F0:12:34:56',
    expiresIn: '23h 45m',
    status: 'bound',
  },
  {
    id: '2',
    hostname: 'laptop-reza',
    ipAddress: '192.168.1.11',
    macAddress: 'B8:27:EB:AA:BB:CC',
    expiresIn: '11h 12m',
    status: 'bound',
  },
  {
    id: '3',
    hostname: 'iphone-14',
    ipAddress: '192.168.1.20',
    macAddress: 'C2:9A:14:77:DE:F1',
    expiresIn: '1h 03m',
    status: 'bound',
  },
  {
    id: '4',
    hostname: 'smart-tv',
    ipAddress: '192.168.1.50',
    macAddress: 'F0:29:29:CB:EE:A1',
    expiresIn: 'Expired',
    status: 'expired',
  },
];

const firewallRules: FirewallRule[] = [
  {
    id: '1',
    chain: 'input',
    action: 'accept',
    srcAddress: '192.168.1.0/24',
    dstAddress: '0.0.0.0/0',
    protocol: 'tcp',
    comment: 'Allow LAN to router',
  },
  {
    id: '2',
    chain: 'input',
    action: 'drop',
    srcAddress: '0.0.0.0/0',
    dstAddress: '0.0.0.0/0',
    protocol: 'any',
    comment: 'Drop all other input',
  },
  {
    id: '3',
    chain: 'forward',
    action: 'accept',
    srcAddress: '192.168.1.0/24',
    dstAddress: '0.0.0.0/0',
    protocol: 'any',
    comment: 'Allow LAN to WAN',
  },
];

// ─── Column definitions ───────────────────────────────────────────────────────

const interfaceColumns: DataTableColumn<NetworkInterface>[] = [
  {
    key: 'name',
    header: 'Interface',
    cell: (item) => (
      <span className="font-mono font-semibold text-foreground">{item.name}</span>
    ),
  },
  { key: 'type', header: 'Type' },
  {
    key: 'status',
    header: 'Status',
    cell: (item) => (
      <Badge
        variant={item.status === 'online' ? 'default' : 'secondary'}
        className={
          item.status === 'online'
            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
            : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
        }
      >
        {item.status}
      </Badge>
    ),
  },
  { key: 'ipAddress', header: 'IP Address', className: 'font-mono text-sm' },
  { key: 'macAddress', header: 'MAC Address', className: 'font-mono text-sm' },
  {
    key: 'rxBytes',
    header: 'RX',
    headerClassName: 'text-cyan-600',
    className: 'text-cyan-600 font-medium',
  },
  {
    key: 'txBytes',
    header: 'TX',
    headerClassName: 'text-purple-600',
    className: 'text-purple-600 font-medium',
  },
];

const dhcpColumns: DataTableColumn<DHCPLease>[] = [
  { key: 'hostname', header: 'Hostname', cell: (item) => (
    <span className="font-mono">{item.hostname}</span>
  )},
  { key: 'ipAddress', header: 'IP Address', className: 'font-mono text-sm' },
  { key: 'macAddress', header: 'MAC Address', className: 'font-mono text-sm' },
  { key: 'expiresIn', header: 'Expires In' },
  {
    key: 'status',
    header: 'Status',
    cell: (item) => (
      <Badge
        className={
          item.status === 'bound'
            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
            : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
        }
      >
        {item.status}
      </Badge>
    ),
  },
];

const firewallColumns: DataTableColumn<FirewallRule>[] = [
  { key: 'chain', header: 'Chain', cell: (item) => (
    <Badge variant="outline">{item.chain}</Badge>
  )},
  {
    key: 'action',
    header: 'Action',
    cell: (item) => (
      <span
        className={
          item.action === 'accept'
            ? 'text-green-600 font-semibold'
            : 'text-red-600 font-semibold'
        }
      >
        {item.action.toUpperCase()}
      </span>
    ),
  },
  { key: 'srcAddress', header: 'Src Address', className: 'font-mono text-sm' },
  { key: 'dstAddress', header: 'Dst Address', className: 'font-mono text-sm' },
  { key: 'protocol', header: 'Protocol' },
  { key: 'comment', header: 'Comment', className: 'text-muted-foreground' },
];

// ─── Meta ─────────────────────────────────────────────────────────────────────

const meta: Meta<typeof DataTable> = {
  title: 'Patterns/DataDisplay/DataTable',
  component: DataTable,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
Generic data table component with typed column definitions and row rendering.

Supports custom cell renderers, loading skeletons, empty states, and row click handlers.
Wraps the primitive \`Table\` component with a reusable column-based API.

## Usage

\`\`\`tsx
import { DataTable } from '@nasnet/ui/patterns';

const columns: DataTableColumn<MyRow>[] = [
  { key: 'name', header: 'Name' },
  { key: 'status', header: 'Status', cell: (row) => <StatusBadge status={row.status} /> },
];

<DataTable columns={columns} data={rows} keyExtractor={(row) => row.id} />
\`\`\`
        `,
      },
    },
  },
  argTypes: {
    isLoading: {
      description: 'Display loading skeleton row',
      control: 'boolean',
    },
    emptyMessage: {
      description: 'Text shown when data array is empty',
      control: 'text',
    },
    className: {
      description: 'Additional CSS classes',
      control: 'text',
    },
  },
};

export default meta;
type Story = StoryObj<typeof DataTable>;

// ─── Stories ──────────────────────────────────────────────────────────────────

/**
 * Default table rendering network interfaces with custom cell renderers
 * including badge status and monospaced values.
 */
export const NetworkInterfaces: Story = {
  args: {
    columns: interfaceColumns as DataTableColumn<Record<string, unknown>>[],
    data: networkInterfaces as unknown as Record<string, unknown>[],
    keyExtractor: (item) => (item as NetworkInterface).id,
  },
};

/**
 * DHCP lease table with conditional row highlighting via custom cell renderers.
 */
export const DHCPLeases: Story = {
  args: {
    columns: dhcpColumns as DataTableColumn<Record<string, unknown>>[],
    data: dhcpLeases as unknown as Record<string, unknown>[],
    keyExtractor: (item) => (item as DHCPLease).id,
  },
};

/**
 * Firewall rules table with action-coloured cells and chain badges.
 */
export const FirewallRules: Story = {
  args: {
    columns: firewallColumns as DataTableColumn<Record<string, unknown>>[],
    data: firewallRules as unknown as Record<string, unknown>[],
    keyExtractor: (item) => (item as FirewallRule).id,
  },
};

/**
 * Loading state: a single full-width row with "Loading..." text.
 */
export const Loading: Story = {
  args: {
    columns: interfaceColumns as DataTableColumn<Record<string, unknown>>[],
    data: [],
    isLoading: true,
  },
};

/**
 * Empty state rendered when data array has no items.
 */
export const Empty: Story = {
  args: {
    columns: interfaceColumns as DataTableColumn<Record<string, unknown>>[],
    data: [],
    emptyMessage: 'No interfaces found. Add an interface to get started.',
  },
};

/**
 * Clickable rows: each row acts as a navigation trigger.
 */
export const ClickableRows: Story = {
  args: {
    columns: dhcpColumns as DataTableColumn<Record<string, unknown>>[],
    data: dhcpLeases as unknown as Record<string, unknown>[],
    keyExtractor: (item) => (item as DHCPLease).id,
    onRowClick: (item) =>
      alert(`Selected: ${(item as unknown as DHCPLease).hostname}`),
  },
  parameters: {
    docs: {
      description: {
        story: 'When `onRowClick` is provided rows gain a pointer cursor and trigger the callback on click.',
      },
    },
  },
};
