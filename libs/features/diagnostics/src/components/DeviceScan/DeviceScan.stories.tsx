// =============================================================================
// DeviceScan Storybook Stories
// =============================================================================
// Comprehensive stories covering all states and scenarios

import { DeviceScanDesktop } from './DeviceScanDesktop';
import { DeviceScanMobile } from './DeviceScanMobile';

import type { DiscoveredDevice } from './types';
import type { Meta, StoryObj } from '@storybook/react';

// -----------------------------------------------------------------------------
// Mock Data
// -----------------------------------------------------------------------------

const mockDevices: DiscoveredDevice[] = [
  {
    ip: '192.168.88.1',
    mac: '00:0F:E2:12:34:56',
    vendor: 'MikroTik',
    hostname: 'router.local',
    interface: 'bridge1',
    responseTime: 5,
    firstSeen: '2026-02-05T12:00:00Z',
    dhcpLease: undefined,
  },
  {
    ip: '192.168.88.100',
    mac: 'AC:DE:48:AB:CD:EF',
    vendor: 'Apple Inc.',
    hostname: 'macbook-pro.local',
    interface: 'bridge1',
    responseTime: 12,
    firstSeen: '2026-02-05T12:00:05Z',
    dhcpLease: {
      expires: '2026-02-06T12:00:00Z',
      server: '192.168.88.1',
      status: 'bound',
    },
  },
  {
    ip: '192.168.88.101',
    mac: '00:1A:8A:22:33:44',
    vendor: 'Samsung Electronics',
    hostname: 'galaxy-s23',
    interface: 'bridge1',
    responseTime: 18,
    firstSeen: '2026-02-05T12:00:10Z',
    dhcpLease: {
      expires: '2026-02-06T12:00:00Z',
      server: '192.168.88.1',
      status: 'bound',
    },
  },
  {
    ip: '192.168.88.102',
    mac: 'B8:27:EB:55:66:77',
    vendor: 'Raspberry Pi Foundation',
    hostname: 'pi-homeassistant',
    interface: 'bridge1',
    responseTime: 8,
    firstSeen: '2026-02-05T12:00:15Z',
    dhcpLease: undefined,
  },
  {
    ip: '192.168.88.103',
    mac: '00:50:56:88:99:AA',
    vendor: 'VMware Inc.',
    hostname: null,
    interface: 'bridge1',
    responseTime: 25,
    firstSeen: '2026-02-05T12:00:20Z',
    dhcpLease: {
      expires: '2026-02-06T12:00:00Z',
      server: '192.168.88.1',
      status: 'bound',
    },
  },
];

// Generate large dataset for virtualization test (200+ devices)
const generateLargeDataset = (count: number): DiscoveredDevice[] => {
  return Array.from({ length: count }, (_, i) => ({
    ip: `192.168.${Math.floor(i / 254)}.${(i % 254) + 1}`,
    mac: `${(i % 256).toString(16).padStart(2, '0')}:${((i >> 8) % 256).toString(16).padStart(2, '0')}:AA:BB:CC:DD`,
    vendor:
      i % 5 === 0 ? 'MikroTik'
      : i % 3 === 0 ? 'Apple Inc.'
      : null,
    hostname: i % 2 === 0 ? `device-${i}` : null,
    interface: 'bridge1',
    responseTime: Math.floor(Math.random() * 50) + 5,
    firstSeen: new Date(Date.now() - i * 1000).toISOString(),
    dhcpLease:
      i % 3 === 0 ?
        {
          expires: new Date(Date.now() + 86400000).toISOString(),
          server: '192.168.88.1',
          status: 'bound',
        }
      : undefined,
  }));
};

// -----------------------------------------------------------------------------
// Meta Configuration
// -----------------------------------------------------------------------------

const meta: Meta<typeof DeviceScanDesktop> = {
  title: 'Features/Diagnostics/DeviceScan',
  component: DeviceScanDesktop,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof DeviceScanDesktop>;

// -----------------------------------------------------------------------------
// Desktop Stories
// -----------------------------------------------------------------------------

export const DesktopIdle: Story = {
  name: '1. Desktop - Idle State',
  args: {
    status: 'idle',
    progress: 0,
    devices: [],
    error: null,
    stats: {
      scannedCount: 0,
      totalCount: 0,
      elapsedTime: 0,
    },
    isScanning: false,
    isComplete: false,
    isCancelled: false,
    isIdle: true,
    hasError: false,
    routerId: 'router-123',
    startScan: async () => console.log('Start scan'),
    stopScan: async () => console.log('Stop scan'),
    reset: () => console.log('Reset'),
  },
};

export const DesktopScanning30Percent: Story = {
  name: '2. Desktop - Scanning (30%)',
  args: {
    status: 'scanning',
    progress: 30,
    devices: mockDevices.slice(0, 3),
    error: null,
    stats: {
      scannedCount: 76,
      totalCount: 254,
      elapsedTime: 15000,
    },
    isScanning: true,
    isComplete: false,
    isCancelled: false,
    isIdle: false,
    hasError: false,
    routerId: 'router-123',
    startScan: async () => console.log('Start scan'),
    stopScan: async () => console.log('Stop scan'),
    reset: () => console.log('Reset'),
  },
};

export const DesktopScanComplete: Story = {
  name: '3. Desktop - Scan Complete (15 devices)',
  args: {
    status: 'completed',
    progress: 100,
    devices: [
      ...mockDevices,
      ...mockDevices.map((d, i) => ({
        ...d,
        ip: `192.168.88.${110 + i}`,
        mac: `${(i + 10).toString(16).padStart(2, '0')}:${d.mac.slice(3)}`,
      })),
    ],
    error: null,
    stats: {
      scannedCount: 254,
      totalCount: 254,
      elapsedTime: 30000,
    },
    isScanning: false,
    isComplete: true,
    isCancelled: false,
    isIdle: false,
    hasError: false,
    routerId: 'router-123',
    startScan: async () => console.log('Start scan'),
    stopScan: async () => console.log('Stop scan'),
    reset: () => console.log('Reset'),
  },
};

export const DesktopLargeSubnet: Story = {
  name: '4. Desktop - Large Subnet (200+ devices, virtualized)',
  args: {
    status: 'completed',
    progress: 100,
    devices: generateLargeDataset(250),
    error: null,
    stats: {
      scannedCount: 254,
      totalCount: 254,
      elapsedTime: 45000,
    },
    isScanning: false,
    isComplete: true,
    isCancelled: false,
    isIdle: false,
    hasError: false,
    routerId: 'router-123',
    startScan: async () => console.log('Start scan'),
    stopScan: async () => console.log('Stop scan'),
    reset: () => console.log('Reset'),
  },
};

export const DesktopEmptyResults: Story = {
  name: '5. Desktop - Empty Results',
  args: {
    status: 'completed',
    progress: 100,
    devices: [],
    error: null,
    stats: {
      scannedCount: 254,
      totalCount: 254,
      elapsedTime: 30000,
    },
    isScanning: false,
    isComplete: true,
    isCancelled: false,
    isIdle: false,
    hasError: false,
    routerId: 'router-123',
    startScan: async () => console.log('Start scan'),
    stopScan: async () => console.log('Stop scan'),
    reset: () => console.log('Reset'),
  },
};

export const DesktopErrorState: Story = {
  name: '6. Desktop - Error State (Permission Denied)',
  args: {
    status: 'error',
    progress: 0,
    devices: [],
    error: 'Permission denied: Scan requires admin privileges',
    stats: {
      scannedCount: 0,
      totalCount: 254,
      elapsedTime: 1000,
    },
    isScanning: false,
    isComplete: false,
    isCancelled: false,
    isIdle: false,
    hasError: true,
    routerId: 'router-123',
    startScan: async () => console.log('Start scan'),
    stopScan: async () => console.log('Stop scan'),
    reset: () => console.log('Reset'),
  },
};

// -----------------------------------------------------------------------------
// Mobile Stories
// -----------------------------------------------------------------------------

export const MobileIdle: Story = {
  name: '7. Mobile - Idle State',
  render: (args) => <DeviceScanMobile {...args} />,
  args: {
    status: 'idle',
    progress: 0,
    devices: [],
    error: null,
    stats: {
      scannedCount: 0,
      totalCount: 0,
      elapsedTime: 0,
    },
    isScanning: false,
    isComplete: false,
    isCancelled: false,
    isIdle: true,
    hasError: false,
    routerId: 'router-123',
    startScan: async () => console.log('Start scan'),
    stopScan: async () => console.log('Stop scan'),
    reset: () => console.log('Reset'),
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};

export const MobileScanning: Story = {
  name: '8. Mobile - Scanning (50%)',
  render: (args) => <DeviceScanMobile {...args} />,
  args: {
    status: 'scanning',
    progress: 50,
    devices: mockDevices.slice(0, 4),
    error: null,
    stats: {
      scannedCount: 127,
      totalCount: 254,
      elapsedTime: 20000,
    },
    isScanning: true,
    isComplete: false,
    isCancelled: false,
    isIdle: false,
    hasError: false,
    routerId: 'router-123',
    startScan: async () => console.log('Start scan'),
    stopScan: async () => console.log('Stop scan'),
    reset: () => console.log('Reset'),
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};

export const MobileComplete: Story = {
  name: '9. Mobile - Scan Complete',
  render: (args) => <DeviceScanMobile {...args} />,
  args: {
    status: 'completed',
    progress: 100,
    devices: mockDevices,
    error: null,
    stats: {
      scannedCount: 254,
      totalCount: 254,
      elapsedTime: 30000,
    },
    isScanning: false,
    isComplete: true,
    isCancelled: false,
    isIdle: false,
    hasError: false,
    routerId: 'router-123',
    startScan: async () => console.log('Start scan'),
    stopScan: async () => console.log('Stop scan'),
    reset: () => console.log('Reset'),
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};

export const MobileError: Story = {
  name: '10. Mobile - Error State',
  render: (args) => <DeviceScanMobile {...args} />,
  args: {
    status: 'error',
    progress: 0,
    devices: [],
    error: 'Network timeout: Unable to reach router',
    stats: {
      scannedCount: 0,
      totalCount: 254,
      elapsedTime: 5000,
    },
    isScanning: false,
    isComplete: false,
    isCancelled: false,
    isIdle: false,
    hasError: true,
    routerId: 'router-123',
    startScan: async () => console.log('Start scan'),
    stopScan: async () => console.log('Stop scan'),
    reset: () => console.log('Reset'),
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};
