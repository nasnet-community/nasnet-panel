/**
 * Storybook stories for ConnectedDevicesCard
 * ARP/DHCP device summary card with status breakdown and device list
 */


import type { ARPEntry } from '@nasnet/core/types';

import { ConnectedDevicesCard } from './ConnectedDevicesCard';

import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof ConnectedDevicesCard> = {
  title: 'App/Network/ConnectedDevicesCard',
  component: ConnectedDevicesCard,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Displays a summary of connected devices from the ARP table, including status breakdown (complete / incomplete / failed) and a compact list of the 5 most recent entries. Supports loading and error states.',
      },
    },
  },
  decorators: [
    (Story) => (
      <div style={{ width: 360 }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof ConnectedDevicesCard>;

// ---------------------------------------------------------------------------
// Shared mock data
// ---------------------------------------------------------------------------

const completeEntry = (id: string, ip: string, mac: string, iface: string): ARPEntry => ({
  id,
  ipAddress: ip,
  macAddress: mac,
  interface: iface,
  status: 'complete',
  isDynamic: true,
});

const incompleteEntry = (id: string, ip: string, mac: string, iface: string): ARPEntry => ({
  id,
  ipAddress: ip,
  macAddress: mac,
  interface: iface,
  status: 'incomplete',
  isDynamic: true,
});

const failedEntry = (id: string, ip: string, mac: string, iface: string): ARPEntry => ({
  id,
  ipAddress: ip,
  macAddress: mac,
  interface: iface,
  status: 'failed',
  isDynamic: false,
});

const STANDARD_ENTRIES: ARPEntry[] = [
  completeEntry('1', '192.168.1.10', 'AA:BB:CC:DD:EE:01', 'ether1'),
  completeEntry('2', '192.168.1.11', 'AA:BB:CC:DD:EE:02', 'ether1'),
  completeEntry('3', '192.168.1.20', 'AA:BB:CC:DD:EE:03', 'bridge1'),
  incompleteEntry('4', '192.168.1.50', 'AA:BB:CC:DD:EE:04', 'ether2'),
  completeEntry('5', '192.168.1.100', 'AA:BB:CC:DD:EE:05', 'wlan1'),
];

// ---------------------------------------------------------------------------
// Stories
// ---------------------------------------------------------------------------

export const Default: Story = {
  name: 'Default (5 devices)',
  args: {
    entries: STANDARD_ENTRIES,
    isLoading: false,
    error: null,
  },
  parameters: {
    docs: {
      description: { story: 'Standard view with 5 ARP entries: 4 complete and 1 incomplete.' },
    },
  },
};

export const ManyDevices: Story = {
  name: 'Many Devices (overflow)',
  args: {
    entries: [
      ...STANDARD_ENTRIES,
      completeEntry('6', '192.168.1.101', 'AA:BB:CC:DD:EE:06', 'ether1'),
      completeEntry('7', '192.168.1.102', 'AA:BB:CC:DD:EE:07', 'ether1'),
      failedEntry('8', '192.168.1.200', 'AA:BB:CC:DD:EE:08', 'ether2'),
    ],
    isLoading: false,
    error: null,
  },
  parameters: {
    docs: {
      description: {
        story:
          'When more than 5 devices are present the "View all N devices" button appears at the bottom.',
      },
    },
  },
};

export const WithFailedEntries: Story = {
  name: 'With Failed Entries',
  args: {
    entries: [
      completeEntry('1', '10.0.0.1', 'DE:AD:BE:EF:00:01', 'bridge1'),
      failedEntry('2', '10.0.0.50', 'DE:AD:BE:EF:00:02', 'ether1'),
      failedEntry('3', '10.0.0.51', 'DE:AD:BE:EF:00:03', 'ether1'),
      incompleteEntry('4', '10.0.0.99', 'DE:AD:BE:EF:00:04', 'wlan1'),
    ],
    isLoading: false,
    error: null,
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows all three status indicators when incomplete and failed entries are present.',
      },
    },
  },
};

export const Empty: Story = {
  name: 'Empty State',
  args: {
    entries: [],
    isLoading: false,
    error: null,
  },
  parameters: {
    docs: {
      description: { story: 'No ARP entries found — renders the empty placeholder message.' },
    },
  },
};

export const Loading: Story = {
  name: 'Loading',
  args: {
    entries: [],
    isLoading: true,
    error: null,
  },
  parameters: {
    docs: {
      description: { story: 'Skeleton pulse shown while ARP data is being fetched.' },
    },
  },
};

export const ErrorState: Story = {
  name: 'Error State',
  args: {
    entries: [],
    isLoading: false,
    error: new Error('Connection to router timed out'),
  },
  parameters: {
    docs: {
      description: { story: 'Error banner displayed when the ARP table query fails.' },
    },
  },
};

export const Mobile: Story = {
  ...Default,
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
  },
};

export const Desktop: Story = {
  ...Default,
  parameters: {
    viewport: { defaultViewport: 'desktop' },
  },
};
