/**
 * Storybook stories for ScanSummary
 *
 * Covers: quick scan with few devices, large subnet result,
 * all-static network, long-running scan, and empty network.
 */

import { ScanSummary } from './ScanSummary';

import type { DiscoveredDevice, ScanStats } from './types';
import type { Meta, StoryObj } from '@storybook/react';

// ---------------------------------------------------------------------------
// Mock data helpers
// ---------------------------------------------------------------------------

function makeDevice(
  ip: string,
  mac: string,
  vendor: string | null,
  hostname: string | null,
  iface: string,
  responseTime: number,
  hasDhcp: boolean
): DiscoveredDevice {
  return {
    ip,
    mac,
    vendor,
    hostname,
    interface: iface,
    responseTime,
    firstSeen: new Date().toISOString(),
    dhcpLease: hasDhcp
      ? {
          expires: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(),
          server: '192.168.88.1',
          status: 'bound',
        }
      : undefined,
  };
}

const smallDeviceList: DiscoveredDevice[] = [
  makeDevice('192.168.88.1', 'D4:CA:6D:AB:CD:01', 'MikroTik', 'router.lan', 'bridge1', 1, false),
  makeDevice('192.168.88.10', 'AA:BB:CC:DD:EE:FF', 'Apple', 'macbook.lan', 'bridge1', 3, true),
  makeDevice('192.168.88.11', '11:22:33:44:55:66', 'Samsung', 'galaxy-s24.lan', 'bridge1', 5, true),
];

const largeDeviceList: DiscoveredDevice[] = [
  ...Array.from({ length: 18 }, (_, i) =>
    makeDevice(
      `192.168.1.${i + 10}`,
      `AA:BB:CC:DD:EE:${String(i).padStart(2, '0')}`,
      i % 3 === 0 ? 'Apple' : i % 3 === 1 ? 'Samsung' : null,
      i % 4 === 0 ? `device-${i}.lan` : null,
      'bridge1',
      Math.floor(Math.random() * 20) + 1,
      i % 2 === 0
    )
  ),
];

const allStaticDevices: DiscoveredDevice[] = [
  makeDevice('10.0.0.1', 'D4:CA:6D:AB:CD:01', 'MikroTik', 'core-router', 'ether1', 1, false),
  makeDevice('10.0.0.2', 'AA:BB:CC:01:02:03', 'Dell', 'server-01', 'ether1', 2, false),
  makeDevice('10.0.0.3', 'BB:CC:DD:04:05:06', 'HP', 'switch-01', 'ether1', 2, false),
];

const quickStats: ScanStats = { scannedCount: 254, totalCount: 254, elapsedTime: 3200 };
const largeStats: ScanStats = { scannedCount: 254, totalCount: 254, elapsedTime: 18500 };
const longStats: ScanStats = { scannedCount: 1022, totalCount: 1022, elapsedTime: 125000 };

// ---------------------------------------------------------------------------
// Meta
// ---------------------------------------------------------------------------

const meta: Meta<typeof ScanSummary> = {
  title: 'Features/Diagnostics/ScanSummary',
  component: ScanSummary,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Displays scan statistics (total devices, duration, DHCP vs static ratio, unique vendors) ' +
          'for a completed network scan, and provides CSV/JSON export actions.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof ScanSummary>;

// ---------------------------------------------------------------------------
// Stories
// ---------------------------------------------------------------------------

export const SmallNetwork: Story = {
  name: 'Small Network — 3 Devices',
  args: {
    devices: smallDeviceList,
    stats: quickStats,
    subnet: '192.168.88.0/24',
  },
  parameters: {
    docs: {
      description: { story: 'A typical home/small-office scan completed in ~3 seconds.' },
    },
  },
};

export const LargeNetwork: Story = {
  name: 'Large Network — 18 Devices',
  args: {
    devices: largeDeviceList,
    stats: largeStats,
    subnet: '192.168.1.0/24',
  },
  parameters: {
    docs: {
      description: {
        story: 'An office network with 18 devices; mix of DHCP and static, multiple vendors.',
      },
    },
  },
};

export const AllStatic: Story = {
  name: 'All-Static Network',
  args: {
    devices: allStaticDevices,
    stats: { scannedCount: 254, totalCount: 254, elapsedTime: 4800 },
    subnet: '10.0.0.0/24',
  },
  parameters: {
    docs: {
      description: {
        story: 'Server/data-centre subnet where no DHCP leases are present — DHCP count shows 0.',
      },
    },
  },
};

export const LongRunning: Story = {
  name: 'Long-Running Scan — /22 Subnet',
  args: {
    devices: largeDeviceList,
    stats: longStats,
    subnet: '10.10.0.0/22',
  },
  parameters: {
    docs: {
      description: {
        story: 'A large /22 subnet (1022 IPs) that took over 2 minutes; duration renders as "2m 5s".',
      },
    },
  },
};

export const EmptyNetwork: Story = {
  name: 'Empty Network — No Devices',
  args: {
    devices: [],
    stats: { scannedCount: 254, totalCount: 254, elapsedTime: 2100 },
    subnet: '192.168.99.0/24',
  },
  parameters: {
    docs: {
      description: {
        story: 'No devices responded — all stat counters show 0.',
      },
    },
  },
};
