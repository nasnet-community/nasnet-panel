import type { DHCPServer, DHCPLease, DHCPPool, DHCPClient } from '@nasnet/core/types';

import { DHCPStatusHero } from './DHCPStatusHero';

import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof DHCPStatusHero> = {
  title: 'App/DHCP/DHCPStatusHero',
  component: DHCPStatusHero,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Dashboard Pro style stats grid showing DHCP overview metrics. Displays active leases, pool utilization, available IPs, active servers, and WAN client status.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof DHCPStatusHero>;

const mockServers: DHCPServer[] = [
  {
    id: 'server-1',
    name: 'LAN Server',
    interface: 'ether1',
    disabled: false,
    addressPool: 'Main Pool',
    leaseTime: '1d',
    authoritative: true,
    useRadius: false,
  },
  {
    id: 'server-2',
    name: 'Guest Server',
    interface: 'ether2',
    disabled: false,
    addressPool: 'Guest Pool',
    leaseTime: '1h',
    authoritative: false,
    useRadius: false,
  },
];

const mockPools: DHCPPool[] = [
  {
    id: 'pool-1',
    name: 'Main Pool',
    ranges: ['192.168.1.100-192.168.1.200'],
  },
  {
    id: 'pool-2',
    name: 'Guest Pool',
    ranges: ['10.0.0.100-10.0.0.150'],
  },
];

const mockLeases: DHCPLease[] = Array.from({ length: 45 }, (_, i) => ({
  id: `lease-${i}`,
  address: `192.168.1.${100 + (i % 100)}`,
  macAddress: `00:11:22:33:44:${String(i).padStart(2, '0')}`,
  status: 'bound' as const,
  hostname: `device-${i}`,
  server: 'dhcp1',
  dynamic: true,
  blocked: false,
}));

const mockClients: DHCPClient[] = [
  {
    id: 'client-1',
    interface: 'ether3',
    status: 'bound' as const,
    address: '10.0.0.1',
    disabled: false,
  },
  {
    id: 'client-2',
    interface: 'ether4',
    status: 'bound' as const,
    address: '10.0.0.2',
    disabled: false,
  },
];

export const Default: Story = {
  args: {
    servers: mockServers,
    leases: mockLeases,
    pools: mockPools,
    clients: mockClients,
    isLoading: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'DHCP overview with healthy metrics. 45 active leases out of 151 total pool size (30% utilization), 2 active servers, all WAN clients connected.',
      },
    },
  },
};

export const HighUtilization: Story = {
  args: {
    servers: mockServers,
    leases: Array.from({ length: 130 }, (_, i) => ({
      id: `lease-${i}`,
      address: `192.168.1.${100 + (i % 100)}`,
      macAddress: `00:11:22:33:44:${String(i).padStart(2, '0')}`,
      status: 'bound' as const,
      hostname: `device-${i}`,
      server: 'dhcp1',
      dynamic: true,
      blocked: false,
    })),
    pools: mockPools,
    clients: mockClients,
    isLoading: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'High pool utilization (86%). Warning color indicates pool is nearly full.',
      },
    },
  },
};

export const PartialWANConnectivity: Story = {
  args: {
    servers: mockServers,
    leases: mockLeases,
    pools: mockPools,
    clients: [
      {
        id: 'client-1',
        interface: 'ether3',
        status: 'bound' as const,
        address: '10.0.0.1',
        disabled: false,
      },
      {
        id: 'client-2',
        interface: 'ether4',
        status: 'searching' as const,
        address: undefined,
        disabled: false,
      },
    ],
    isLoading: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'One of two WAN DHCP clients is not connected. Shows "Partial" status in amber.',
      },
    },
  },
};

export const NoServers: Story = {
  args: {
    servers: [],
    leases: [],
    pools: [],
    clients: [],
    isLoading: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'All metrics at zero. No servers, pools, leases, or clients configured.',
      },
    },
  },
};

export const Loading: Story = {
  args: {
    servers: [],
    leases: [],
    pools: [],
    clients: [],
    isLoading: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Loading state with animated skeleton placeholders.',
      },
    },
  },
};

export const Mobile: Story = {
  args: {
    servers: mockServers,
    leases: mockLeases,
    pools: mockPools,
    clients: mockClients,
    isLoading: false,
  },
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
  },
};

export const Desktop: Story = {
  args: {
    servers: mockServers,
    leases: mockLeases,
    pools: mockPools,
    clients: mockClients,
    isLoading: false,
  },
  parameters: {
    viewport: { defaultViewport: 'desktop' },
  },
};
