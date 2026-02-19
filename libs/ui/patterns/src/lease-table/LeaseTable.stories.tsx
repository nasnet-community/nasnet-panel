import type { DHCPLease } from '@nasnet/core/types';

import { LeaseTable } from './LeaseTable';

import type { Meta, StoryObj } from '@storybook/react';


// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const sampleLeases: DHCPLease[] = [
  {
    id: 'lease-1',
    address: '192.168.88.101',
    macAddress: 'AA:BB:CC:DD:EE:01',
    hostname: 'macbook-reza',
    status: 'bound',
    expiresAfter: '9h52m30s',
    lastSeen: new Date(),
    server: 'dhcp1',
    dynamic: true,
    blocked: false,
  },
  {
    id: 'lease-2',
    address: '192.168.88.102',
    macAddress: 'AA:BB:CC:DD:EE:02',
    hostname: 'iphone-ali',
    status: 'bound',
    expiresAfter: '5m10s',
    lastSeen: new Date(),
    server: 'dhcp1',
    dynamic: true,
    blocked: false,
  },
  {
    id: 'lease-3',
    address: '192.168.88.110',
    macAddress: 'AA:BB:CC:DD:EE:03',
    hostname: undefined,
    status: 'bound',
    expiresAfter: '23h59m59s',
    lastSeen: new Date(),
    server: 'dhcp1',
    dynamic: true,
    blocked: false,
  },
  {
    id: 'lease-4',
    address: '192.168.88.120',
    macAddress: 'AA:BB:CC:DD:EE:04',
    hostname: 'nas-storage',
    status: 'bound',
    // static lease — no expiry
    server: 'dhcp1',
    dynamic: false,
    blocked: false,
  },
  {
    id: 'lease-5',
    address: '192.168.88.130',
    macAddress: 'AA:BB:CC:DD:EE:05',
    hostname: 'unknown-device',
    status: 'waiting',
    expiresAfter: '1m30s',
    server: 'dhcp1',
    dynamic: true,
    blocked: false,
  },
  {
    id: 'lease-6',
    address: '192.168.88.140',
    macAddress: 'AA:BB:CC:DD:EE:06',
    hostname: 'rogue-device',
    status: 'bound',
    expiresAfter: '8h00m00s',
    lastSeen: new Date(),
    server: 'dhcp1',
    dynamic: true,
    blocked: true,
  },
  {
    id: 'lease-7',
    address: '192.168.88.150',
    macAddress: 'AA:BB:CC:DD:EE:07',
    hostname: 'raspberry-pi',
    status: 'offered',
    expiresAfter: '30s',
    server: 'dhcp1',
    dynamic: true,
    blocked: false,
  },
  {
    id: 'lease-8',
    address: '192.168.88.200',
    macAddress: 'AA:BB:CC:DD:EE:08',
    hostname: 'printer-hp',
    status: 'bound',
    server: 'dhcp1',
    dynamic: false,
    blocked: false,
  },
];

// ---------------------------------------------------------------------------
// Meta
// ---------------------------------------------------------------------------

const meta: Meta<typeof LeaseTable> = {
  title: 'Patterns/LeaseTable',
  component: LeaseTable,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Displays a list of DHCP leases with client-side search (by IP, MAC, or hostname) and multi-column sorting (IP address, MAC address, hostname, expiration). Blocked leases are rendered with a grey background and strikethrough text. Static leases show a "Static" badge alongside the status badge.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof LeaseTable>;

// ---------------------------------------------------------------------------
// Stories
// ---------------------------------------------------------------------------

export const Default: Story = {
  args: {
    leases: sampleLeases,
    isLoading: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Full lease list with mixed statuses, static leases, and a blocked device. Try clicking column headers to sort, or type in the search box.',
      },
    },
  },
};

export const Loading: Story = {
  args: {
    leases: [],
    isLoading: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Loading skeleton shown while lease data is being fetched — five rows of Skeleton cells replace the real table body.',
      },
    },
  },
};

export const Empty: Story = {
  args: {
    leases: [],
    isLoading: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Empty state when no leases exist on the DHCP server. Displays a centred "No DHCP leases found" message.',
      },
    },
  },
};

export const SingleLease: Story = {
  args: {
    leases: [sampleLeases[0]],
    isLoading: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Table with a single active (bound, dynamic) lease entry.',
      },
    },
  },
};

export const BlockedLeases: Story = {
  args: {
    leases: sampleLeases.filter((l) => l.blocked || l.address === '192.168.88.101'),
    isLoading: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Mix of a normal lease and a blocked lease — the blocked row gets a muted background and strikethrough on IP, MAC, and hostname.',
      },
    },
  },
};

export const StaticLeases: Story = {
  args: {
    leases: sampleLeases.filter((l) => !l.dynamic),
    isLoading: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Only static leases — they display a "Static" badge in addition to the status badge, and the Expires column shows no expiry value.',
      },
    },
  },
};
