import type { DHCPServer, DHCPPool } from '@nasnet/core/types';

import { DHCPServersSection } from './DHCPServersSection';

import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof DHCPServersSection> = {
  title: 'App/DHCP/DHCPServersSection',
  component: DHCPServersSection,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Compact DHCP server list with key metrics and status. Displays server name, interface, lease time, assigned pool, and active/disabled status.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

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

export const Default: Story = {
  args: {
    servers: mockServers,
    pools: mockPools,
    isLoading: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Two active DHCP servers with different lease times and pool assignments. Both are enabled and functioning.',
      },
    },
  },
};

export const WithDisabledServer: Story = {
  args: {
    servers: [
      ...mockServers,
      {
        id: 'server-3',
        name: 'Test Server',
        interface: 'ether3',
        disabled: true,
        addressPool: 'Main Pool',
        leaseTime: '1h',
        authoritative: false,
        useRadius: false,
      },
    ],
    pools: mockPools,
    isLoading: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Three servers including one disabled. Disabled server shows reduced opacity and DISABLED badge.',
      },
    },
  },
};

export const AuthoritativeOnly: Story = {
  args: {
    servers: [
      {
        id: 'server-1',
        name: 'Authoritative Server',
        interface: 'ether1',
        disabled: false,
        addressPool: 'Main Pool',
        leaseTime: '1d',
        authoritative: true,
        useRadius: false,
      },
    ],
    pools: mockPools,
    isLoading: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Single authoritative server. Shows AUTH badge indicating authority in DHCP domain.',
      },
    },
  },
};

export const NoServers: Story = {
  args: {
    servers: [],
    pools: mockPools,
    isLoading: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Empty state when no DHCP servers are configured.',
      },
    },
  },
};

export const Loading: Story = {
  args: {
    servers: [],
    pools: mockPools,
    isLoading: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Loading state with animated skeleton placeholders for two servers.',
      },
    },
  },
};

export const LongLeaseTime: Story = {
  args: {
    servers: [
      {
        id: 'server-1',
        name: 'Long Lease Server',
        interface: 'ether1',
        disabled: false,
        addressPool: 'Main Pool',
        leaseTime: '7d',
        authoritative: true,
        useRadius: false,
      },
    ],
    pools: mockPools,
    isLoading: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Server with extended lease time (7 days). Demonstrates formatLeaseTime utility.',
      },
    },
  },
};

export const Mobile: Story = {
  args: {
    servers: mockServers,
    pools: mockPools,
    isLoading: false,
  },
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
  },
};

export const Desktop: Story = {
  args: {
    servers: mockServers,
    pools: mockPools,
    isLoading: false,
  },
  parameters: {
    viewport: { defaultViewport: 'desktop' },
  },
};
