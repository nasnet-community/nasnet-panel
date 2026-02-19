import { DHCPPoolSummary } from './DHCPPoolSummary';

import type { Meta, StoryObj } from '@storybook/react';


const meta: Meta<typeof DHCPPoolSummary> = {
  title: 'App/Network/DHCPPoolSummary',
  component: DHCPPoolSummary,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Shows DHCP pool utilization at a glance: active leases, available IPs, total pool size, and pool count. Computes utilization percentage and color-codes the progress bar (green < 70%, amber 70-89%, red >= 90%).',
      },
    },
  },
  argTypes: {
    isLoading: { control: 'boolean' },
    error: { control: false },
  },
};

export default meta;
type Story = StoryObj<typeof DHCPPoolSummary>;

// ---------------------------------------------------------------------------
// Shared mock data helpers
// ---------------------------------------------------------------------------

const makeServer = (
  id: string,
  name: string,
  iface: string,
  disabled = false,
) => ({
  id,
  name,
  interface: iface,
  addressPool: `pool-${id}`,
  leaseTime: '1d',
  disabled,
  authoritative: true,
  useRadius: false,
});

const makePool = (id: string, name: string, ranges: string[]) => ({
  id,
  name,
  ranges,
});

const makeLease = (
  id: string,
  address: string,
  server: string,
  status: 'bound' | 'waiting' | 'busy' | 'offered' = 'bound',
) => ({
  id,
  address,
  macAddress: `AA:BB:CC:DD:EE:${id.padStart(2, '0')}`,
  status,
  server,
  dynamic: true,
  blocked: false,
});

// ---------------------------------------------------------------------------
// Stories
// ---------------------------------------------------------------------------

export const Default: Story = {
  name: 'Default (Healthy ~50% utilization)',
  args: {
    servers: [
      makeServer('1', 'dhcp1', 'bridge1'),
      makeServer('2', 'dhcp2', 'ether2'),
    ],
    pools: [
      makePool('p1', 'default-pool', ['192.168.88.100-192.168.88.200']),
      makePool('p2', 'guest-pool', ['10.0.0.50-10.0.0.100']),
    ],
    leases: [
      ...Array.from({ length: 40 }, (_, i) =>
        makeLease(String(i + 1), `192.168.88.${100 + i}`, 'dhcp1'),
      ),
      ...Array.from({ length: 15 }, (_, i) =>
        makeLease(String(i + 41), `10.0.0.${50 + i}`, 'dhcp2'),
      ),
    ],
  },
};

export const LowUtilization: Story = {
  name: 'Low Utilization (< 70%) — green bar',
  args: {
    servers: [makeServer('1', 'dhcp1', 'bridge1')],
    pools: [makePool('p1', 'default-pool', ['192.168.1.10-192.168.1.254'])],
    leases: Array.from({ length: 20 }, (_, i) =>
      makeLease(String(i + 1), `192.168.1.${10 + i}`, 'dhcp1'),
    ),
  },
};

export const HighUtilization: Story = {
  name: 'High Utilization (70-89%) — amber bar',
  args: {
    servers: [makeServer('1', 'dhcp1', 'bridge1')],
    pools: [makePool('p1', 'small-pool', ['10.10.10.1-10.10.10.20'])],
    leases: Array.from({ length: 16 }, (_, i) =>
      makeLease(String(i + 1), `10.10.10.${1 + i}`, 'dhcp1'),
    ),
  },
};

export const CriticalUtilization: Story = {
  name: 'Critical Utilization (>= 90%) — red bar',
  args: {
    servers: [makeServer('1', 'dhcp1', 'bridge1')],
    pools: [makePool('p1', 'tiny-pool', ['10.10.10.1-10.10.10.10'])],
    leases: Array.from({ length: 10 }, (_, i) =>
      makeLease(String(i + 1), `10.10.10.${1 + i}`, 'dhcp1'),
    ),
  },
};

export const SomeServersDisabled: Story = {
  name: 'Some Servers Disabled',
  args: {
    servers: [
      makeServer('1', 'dhcp1', 'bridge1', false),
      makeServer('2', 'dhcp2', 'ether2', true),
      makeServer('3', 'dhcp3', 'ether3', true),
    ],
    pools: [
      makePool('p1', 'main-pool', ['192.168.1.100-192.168.1.200']),
    ],
    leases: Array.from({ length: 30 }, (_, i) =>
      makeLease(String(i + 1), `192.168.1.${100 + i}`, 'dhcp1'),
    ),
  },
};

export const LoadingState: Story = {
  name: 'Loading Skeleton',
  args: {
    servers: [],
    pools: [],
    leases: [],
    isLoading: true,
  },
};

export const ErrorState: Story = {
  name: 'Error State',
  args: {
    servers: [],
    pools: [],
    leases: [],
    error: new Error('Connection to router timed out after 30 seconds.'),
  },
};

export const Empty: Story = {
  name: 'No DHCP Servers or Pools',
  args: {
    servers: [],
    pools: [],
    leases: [],
  },
};
