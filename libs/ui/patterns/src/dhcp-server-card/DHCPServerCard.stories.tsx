import type { DHCPServer, DHCPPool } from '@nasnet/core/types';

import { DHCPServerCard } from './DHCPServerCard';

import type { Meta, StoryObj } from '@storybook/react';

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const defaultServer: DHCPServer = {
  id: 'dhcp-1',
  name: 'dhcp1',
  interface: 'bridge-lan',
  addressPool: 'default-pool',
  leaseTime: '10m',
  disabled: false,
  authoritative: true,
  useRadius: false,
};

const defaultPool: DHCPPool = {
  id: 'pool-1',
  name: 'default-pool',
  ranges: ['192.168.88.100-192.168.88.200'],
};

const longLeaseServer: DHCPServer = {
  id: 'dhcp-2',
  name: 'office-dhcp',
  interface: 'ether-office',
  addressPool: 'office-pool',
  leaseTime: '1d',
  disabled: false,
  authoritative: false,
  useRadius: false,
};

const officePool: DHCPPool = {
  id: 'pool-2',
  name: 'office-pool',
  ranges: ['10.0.1.50-10.0.1.250'],
};

const disabledServer: DHCPServer = {
  id: 'dhcp-3',
  name: 'legacy-dhcp',
  interface: 'vlan10',
  addressPool: 'legacy-pool',
  leaseTime: '30m',
  disabled: true,
  authoritative: false,
  useRadius: false,
};

const multiRangePool: DHCPPool = {
  id: 'pool-3',
  name: 'multi-pool',
  ranges: ['10.10.0.10-10.10.0.100', '10.10.1.10-10.10.1.100'],
};

const multiRangeServer: DHCPServer = {
  id: 'dhcp-4',
  name: 'multi-pool-server',
  interface: 'bridge-guest',
  addressPool: 'multi-pool',
  leaseTime: '1h',
  disabled: false,
  authoritative: true,
  useRadius: false,
};

// ---------------------------------------------------------------------------
// Meta
// ---------------------------------------------------------------------------

const meta: Meta<typeof DHCPServerCard> = {
  title: 'Patterns/DHCPServerCard',
  component: DHCPServerCard,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Displays a DHCP server configuration card including the interface/bridge binding, the resolved address-pool range, a human-readable lease time, an "Authoritative" badge when enabled, and a "Server Disabled" indicator when the server is turned off.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof DHCPServerCard>;

// ---------------------------------------------------------------------------
// Stories
// ---------------------------------------------------------------------------

export const AuthoritativeServer: Story = {
  args: {
    server: defaultServer,
    pool: defaultPool,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Default authoritative DHCP server with a single pool range and a 10-minute lease time.',
      },
    },
  },
};

export const NonAuthoritativeServer: Story = {
  args: {
    server: longLeaseServer,
    pool: officePool,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Non-authoritative server on an office interface with a 1-day lease — the "Authoritative" badge is absent.',
      },
    },
  },
};

export const DisabledServer: Story = {
  args: {
    server: disabledServer,
    pool: {
      id: 'legacy-pool',
      name: 'legacy-pool',
      ranges: ['172.16.0.100-172.16.0.200'],
    },
  },
  parameters: {
    docs: {
      description: {
        story:
          'Server with `disabled: true` — the "Server Disabled" pill is shown at the bottom of the card.',
      },
    },
  },
};

export const MultiRangePool: Story = {
  args: {
    server: multiRangeServer,
    pool: multiRangePool,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Pool with two IP ranges — both ranges are joined by a comma and displayed in the Pool Range row.',
      },
    },
  },
};

export const PoolNotConfigured: Story = {
  args: {
    server: defaultServer,
    pool: undefined,
  },
  parameters: {
    docs: {
      description: {
        story:
          'When no pool is resolved (e.g. pool deleted externally), the Pool Range row shows "Not configured".',
      },
    },
  },
};

export const MultipleCards: Story = {
  render: () => (
    <div className="grid w-[360px] grid-cols-1 gap-4">
      <DHCPServerCard
        server={defaultServer}
        pool={defaultPool}
      />
      <DHCPServerCard
        server={longLeaseServer}
        pool={officePool}
      />
      <DHCPServerCard server={disabledServer} />
    </div>
  ),
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        story: 'A realistic list view of multiple DHCP servers across different interfaces.',
      },
    },
  },
};
