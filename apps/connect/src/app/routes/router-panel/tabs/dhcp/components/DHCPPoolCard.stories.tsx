import type { DHCPPool, DHCPLease } from '@nasnet/core/types';

import { DHCPPoolCard } from './DHCPPoolCard';

import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof DHCPPoolCard> = {
  title: 'App/DHCP/DHCPPoolCard',
  component: DHCPPoolCard,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Displays individual DHCP pool information with utilization visualization. Shows assigned/available/total IP counts and IP ranges.',
      },
    },
  },
  decorators: [
    (Story) => (
      <div style={{ width: '400px' }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

const mockPool: DHCPPool = {
  id: 'pool-1',
  name: 'Main Pool',
  ranges: ['192.168.1.100-192.168.1.200'],
};

const mockPoolMultiRange: DHCPPool = {
  id: 'pool-2',
  name: 'Extended Pool',
  ranges: ['10.0.0.100-10.0.0.150', '10.0.0.200-10.0.0.250'],
};

const mockLeases: DHCPLease[] = [
  {
    id: 'lease-1',
    address: '192.168.1.100',
    macAddress: '00:11:22:33:44:55',
    status: 'bound',
    hostname: 'device-1',
    server: 'dhcp1',
    dynamic: true,
    blocked: false,
  },
  {
    id: 'lease-2',
    address: '192.168.1.101',
    macAddress: '00:11:22:33:44:56',
    status: 'bound',
    hostname: 'device-2',
    server: 'dhcp1',
    dynamic: true,
    blocked: false,
  },
  {
    id: 'lease-3',
    address: '192.168.1.102',
    macAddress: '00:11:22:33:44:57',
    status: 'bound',
    hostname: 'device-3',
    server: 'dhcp1',
    dynamic: true,
    blocked: false,
  },
];

export const Default: Story = {
  args: {
    pool: mockPool,
    leases: mockLeases,
  },
  parameters: {
    docs: {
      description: {
        story: 'DHCP pool with moderate utilization (30%). Shows 3 assigned IPs out of 101 total.',
      },
    },
  },
};

export const HighUtilization: Story = {
  args: {
    pool: mockPool,
    leases: Array.from({ length: 85 }, (_, i) => ({
      id: `lease-${i}`,
      address: `192.168.1.${100 + (i % 101)}`,
      macAddress: `00:11:22:33:44:${String(i).padStart(2, '0')}`,
      status: 'bound' as const,
      hostname: `device-${i}`,
      server: 'dhcp1',
      dynamic: true,
      blocked: false,
    })),
  },
  parameters: {
    docs: {
      description: {
        story:
          'Pool with 85% utilization. Demonstrates high occupancy state with warning-level color.',
      },
    },
  },
};

export const MultipleRanges: Story = {
  args: {
    pool: mockPoolMultiRange,
    leases: [],
  },
  parameters: {
    docs: {
      description: {
        story: 'Pool with multiple IP ranges. Shows 0% utilization with two configured ranges.',
      },
    },
  },
};

export const Empty: Story = {
  args: {
    pool: {
      id: 'pool-empty',
      name: 'Empty Pool',
      ranges: [],
    },
    leases: [],
  },
  parameters: {
    docs: {
      description: {
        story: 'Pool with no configured ranges. Displays "No ranges configured" message.',
      },
    },
  },
};

export const Full: Story = {
  args: {
    pool: {
      id: 'pool-full',
      name: 'Full Pool',
      ranges: ['172.16.0.1-172.16.0.10'],
    },
    leases: Array.from({ length: 10 }, (_, i) => ({
      id: `lease-${i}`,
      address: `172.16.0.${1 + i}`,
      macAddress: `00:11:22:33:44:${String(i).padStart(2, '0')}`,
      status: 'bound' as const,
      hostname: `Device ${i}`,
      server: 'dhcp1',
      dynamic: true,
      blocked: false,
    })),
  },
  parameters: {
    docs: {
      description: {
        story: 'Pool at 100% capacity. All 10 available addresses are assigned.',
      },
    },
  },
};

export const Mobile: Story = {
  args: {
    pool: mockPool,
    leases: mockLeases,
  },
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
  },
};

export const Desktop: Story = {
  args: {
    pool: mockPool,
    leases: mockLeases,
  },
  parameters: {
    viewport: { defaultViewport: 'desktop' },
  },
};
