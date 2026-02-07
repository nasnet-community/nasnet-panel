/**
 * ConnectedDevices Storybook Stories
 * Epic 5 - Story 5.4: DHCP Leases and Active Connections Display
 */

import type { Meta, StoryObj } from '@storybook/react';
import { ConnectedDevices } from './ConnectedDevices';
import { DeviceType } from '@nasnet/core/types';
import type { ConnectedDeviceEnriched } from '@nasnet/core/types';

const meta: Meta<typeof ConnectedDevices> = {
  title: 'Features/Dashboard/ConnectedDevices',
  component: ConnectedDevices,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="max-w-4xl">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof ConnectedDevices>;

// Mock device factory
const createMockDevice = (
  overrides?: Partial<ConnectedDeviceEnriched>
): ConnectedDeviceEnriched => ({
  id: Math.random().toString(36).substring(7),
  ipAddress: '192.168.88.100',
  macAddress: 'A4:83:E7:12:34:56',
  hostname: 'Johns-iPhone',
  status: 'bound',
  statusLabel: 'Connected',
  expiration: 'in 23h',
  isStatic: false,
  vendor: 'Apple, Inc.',
  deviceType: DeviceType.SMARTPHONE,
  isNew: false,
  connectionDuration: '2h 15m',
  firstSeen: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
  _lease: {
    id: '1',
    address: '192.168.88.100',
    macAddress: 'A4:83:E7:12:34:56',
    hostname: 'Johns-iPhone',
    status: 'bound',
    server: 'dhcp1',
    dynamic: true,
    blocked: false,
  },
  ...overrides,
});

// Generate N devices with variety
const generateDevices = (count: number): ConnectedDeviceEnriched[] => {
  const deviceTemplates = [
    { hostname: 'Johns-iPhone', deviceType: DeviceType.SMARTPHONE, vendor: 'Apple, Inc.', mac: 'A4:83:E7' },
    { hostname: 'Marys-iPad', deviceType: DeviceType.TABLET, vendor: 'Apple, Inc.', mac: '00:1D:4F' },
    { hostname: 'Work-MacBook-Pro', deviceType: DeviceType.LAPTOP, vendor: 'Apple, Inc.', mac: 'AC:87:A3' },
    { hostname: 'Desktop-PC', deviceType: DeviceType.DESKTOP, vendor: 'Dell Inc.', mac: '00:14:22' },
    { hostname: 'Galaxy-S23', deviceType: DeviceType.SMARTPHONE, vendor: 'Samsung', mac: '00:00:F0' },
    { hostname: 'MikroTik-Router', deviceType: DeviceType.ROUTER, vendor: 'MikroTik', mac: '4C:5E:0C' },
    { hostname: 'ESP32-Sensor', deviceType: DeviceType.IOT, vendor: 'Espressif Inc.', mac: '24:0A:C4' },
    { hostname: 'HP-LaserJet', deviceType: DeviceType.PRINTER, vendor: 'Hewlett Packard', mac: '00:1E:0B' },
    { hostname: 'Samsung-TV', deviceType: DeviceType.TV, vendor: 'Samsung Electronics', mac: '00:26:5D' },
    { hostname: 'PlayStation-5', deviceType: DeviceType.GAMING_CONSOLE, vendor: 'Sony', mac: 'B8:B8:8D' },
  ];

  return Array.from({ length: count }, (_, i) => {
    const template = deviceTemplates[i % deviceTemplates.length];
    const ipLast = 100 + i;
    const macLast = i.toString(16).padStart(2, '0').toUpperCase();
    const hours = Math.floor(Math.random() * 72);
    const minutes = Math.floor(Math.random() * 60);

    return createMockDevice({
      id: `device-${i}`,
      ipAddress: `192.168.88.${ipLast}`,
      macAddress: `${template.mac}:12:34:${macLast}`,
      hostname: `${template.hostname}-${i > 9 ? i : ''}`,
      deviceType: template.deviceType,
      vendor: template.vendor,
      connectionDuration: `${hours}h ${minutes}m`,
      firstSeen: new Date(Date.now() - (hours * 60 * 60 * 1000 + minutes * 60 * 1000)),
    });
  });
};

/**
 * Story 1: Default - 5-10 devices with mixed types
 */
export const Default: Story = {
  args: {
    routerIp: '192.168.88.1',
    sortBy: 'recent',
  },
  parameters: {
    mockData: {
      devices: generateDevices(8),
      isLoading: false,
      error: null,
      isDhcpEnabled: true,
      isEmpty: false,
      lastUpdated: new Date(),
    },
  },
};

/**
 * Story 2: Empty - No devices connected
 */
export const Empty: Story = {
  args: {
    routerIp: '192.168.88.1',
  },
  parameters: {
    mockData: {
      devices: [],
      isLoading: false,
      error: null,
      isDhcpEnabled: true,
      isEmpty: true,
      lastUpdated: new Date(),
    },
  },
};

/**
 * Story 3: Loading - Skeleton placeholders
 */
export const Loading: Story = {
  args: {
    routerIp: '192.168.88.1',
  },
  parameters: {
    mockData: {
      devices: [],
      isLoading: true,
      error: null,
      isDhcpEnabled: true,
      isEmpty: false,
      lastUpdated: null,
    },
  },
};

/**
 * Story 4: DHCP Disabled - Warning alert
 */
export const DhcpDisabled: Story = {
  args: {
    routerIp: '192.168.88.1',
  },
  parameters: {
    mockData: {
      devices: [],
      isLoading: false,
      error: null,
      isDhcpEnabled: false,
      isEmpty: true,
      lastUpdated: null,
    },
  },
};

/**
 * Story 5: Error - Failed to load
 */
export const Error: Story = {
  args: {
    routerIp: '192.168.88.1',
  },
  parameters: {
    mockData: {
      devices: [],
      isLoading: false,
      error: new Error('Failed to connect to router: Connection timeout'),
      isDhcpEnabled: true,
      isEmpty: true,
      lastUpdated: null,
    },
  },
};

/**
 * Story 6: Stale/Offline - Data is over 2 minutes old
 */
export const Offline: Story = {
  args: {
    routerIp: '192.168.88.1',
  },
  parameters: {
    mockData: {
      devices: generateDevices(6),
      isLoading: false,
      error: null,
      isDhcpEnabled: true,
      isEmpty: false,
      lastUpdated: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago (stale)
    },
  },
};

/**
 * Story 7: Many Devices - 50+ devices
 */
export const ManyDevices: Story = {
  args: {
    routerIp: '192.168.88.1',
    sortBy: 'hostname',
  },
  parameters: {
    mockData: {
      devices: generateDevices(52),
      isLoading: false,
      error: null,
      isDhcpEnabled: true,
      isEmpty: false,
      lastUpdated: new Date(),
    },
  },
};

/**
 * Story 8: New Device Appearing - Shows "New" badge with pulse
 */
export const NewDeviceAppearing: Story = {
  args: {
    routerIp: '192.168.88.1',
    sortBy: 'recent',
  },
  parameters: {
    mockData: {
      devices: [
        createMockDevice({
          id: 'new-1',
          hostname: 'New-iPhone-15',
          macAddress: 'F8:FF:C2:12:34:56',
          ipAddress: '192.168.88.201',
          deviceType: DeviceType.SMARTPHONE,
          vendor: 'Apple, Inc.',
          isNew: true,
          connectionDuration: '15s',
          firstSeen: new Date(Date.now() - 15000), // 15 seconds ago
        }),
        ...generateDevices(5),
      ],
      isLoading: false,
      error: null,
      isDhcpEnabled: true,
      isEmpty: false,
      lastUpdated: new Date(),
    },
  },
};

/**
 * Story 9: Privacy Mode - Hostnames hidden
 * Note: Requires manual toggle in Storybook UI to demonstrate
 */
export const PrivacyMode: Story = {
  args: {
    routerIp: '192.168.88.1',
    sortBy: 'recent',
  },
  parameters: {
    mockData: {
      devices: generateDevices(10),
      isLoading: false,
      error: null,
      isDhcpEnabled: true,
      isEmpty: false,
      lastUpdated: new Date(),
    },
    // This story demonstrates the privacy toggle in the dropdown menu
    // Users should click the menu and toggle "Hide Hostnames"
  },
};

/**
 * Story 10: Mixed States - New devices + Long durations + Static leases
 */
export const MixedStates: Story = {
  args: {
    routerIp: '192.168.88.1',
    sortBy: 'recent',
  },
  parameters: {
    mockData: {
      devices: [
        createMockDevice({
          id: 'new-phone',
          hostname: 'New-Phone',
          isNew: true,
          connectionDuration: '30s',
          firstSeen: new Date(Date.now() - 30000),
        }),
        createMockDevice({
          id: 'static-server',
          hostname: 'NAS-Server',
          deviceType: DeviceType.DESKTOP,
          isStatic: true,
          expiration: 'Never',
          connectionDuration: '720h 0m',
          firstSeen: new Date(Date.now() - 720 * 60 * 60 * 1000), // 30 days
        }),
        createMockDevice({
          id: 'unknown',
          hostname: 'Unknown',
          deviceType: DeviceType.UNKNOWN,
          vendor: null,
          connectionDuration: '5m',
        }),
        ...generateDevices(5),
      ],
      isLoading: false,
      error: null,
      isDhcpEnabled: true,
      isEmpty: false,
      lastUpdated: new Date(),
    },
  },
};
