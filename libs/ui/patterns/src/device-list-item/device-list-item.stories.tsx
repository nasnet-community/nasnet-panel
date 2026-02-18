/**
 * DeviceListItem Storybook Stories
 * Epic 5 - Story 5.4: DHCP Leases and Active Connections Display
 */

import type { ConnectedDeviceEnriched } from '@nasnet/core/types';
import { DeviceType } from '@nasnet/core/types';

import { DeviceListItem } from './device-list-item';

import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof DeviceListItem> = {
  title: 'Patterns/Domain/DeviceListItem',
  component: DeviceListItem,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof DeviceListItem>;

// Mock device data
const createMockDevice = (overrides?: Partial<ConnectedDeviceEnriched>): ConnectedDeviceEnriched => ({
  id: '1',
  ipAddress: '192.168.88.105',
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
    address: '192.168.88.105',
    macAddress: 'A4:83:E7:12:34:56',
    hostname: 'Johns-iPhone',
    status: 'bound',
    server: 'dhcp1',
    dynamic: true,
    blocked: false,
  },
  ...overrides,
});

/**
 * Story 1: Default - Standard device with hostname
 */
export const Default: Story = {
  args: {
    device: createMockDevice(),
  },
};

/**
 * Story 2: New Device - With "New" badge and pulse animation
 */
export const NewDevice: Story = {
  args: {
    device: createMockDevice({
      isNew: true,
      connectionDuration: '30s',
      firstSeen: new Date(Date.now() - 30000), // 30 seconds ago
    }),
  },
};

/**
 * Story 3: No Hostname - Fallback to IP display
 */
export const NoHostname: Story = {
  args: {
    device: createMockDevice({
      hostname: 'Unknown',
      vendor: null,
    }),
  },
};

/**
 * Story 4: Long Hostname - Truncation with tooltip
 */
export const LongHostname: Story = {
  args: {
    device: createMockDevice({
      hostname: 'Johns-Super-Long-MacBook-Pro-16-inch-2023-Model',
    }),
  },
};

/**
 * Story 5: Privacy Mode - Masked hostname (Device-XXXX)
 */
export const PrivacyMode: Story = {
  args: {
    device: createMockDevice(),
    showHostname: false,
  },
};

/**
 * Story 6: Static Lease - Shows static badge
 */
export const StaticLease: Story = {
  args: {
    device: createMockDevice({
      isStatic: true,
      expiration: 'Never',
    }),
  },
};

/**
 * Story 7: All Device Types - Grid showing all 10 device types
 */
export const AllDeviceTypes: Story = {
  render: () => (
    <div className="space-y-2">
      <DeviceListItem
        device={createMockDevice({
          hostname: 'Johns-iPhone',
          deviceType: DeviceType.SMARTPHONE,
          vendor: 'Apple, Inc.',
        })}
      />
      <DeviceListItem
        device={createMockDevice({
          hostname: 'Marys-iPad',
          deviceType: DeviceType.TABLET,
          vendor: 'Apple, Inc.',
          macAddress: '00:1D:4F:12:34:56',
        })}
      />
      <DeviceListItem
        device={createMockDevice({
          hostname: 'Work-MacBook-Pro',
          deviceType: DeviceType.LAPTOP,
          vendor: 'Apple, Inc.',
          macAddress: 'AC:87:A3:12:34:56',
        })}
      />
      <DeviceListItem
        device={createMockDevice({
          hostname: 'Desktop-PC',
          deviceType: DeviceType.DESKTOP,
          vendor: 'Dell Inc.',
          macAddress: '00:14:22:12:34:56',
        })}
      />
      <DeviceListItem
        device={createMockDevice({
          hostname: 'MikroTik-Router',
          deviceType: DeviceType.ROUTER,
          vendor: 'MikroTik',
          macAddress: '4C:5E:0C:12:34:56',
        })}
      />
      <DeviceListItem
        device={createMockDevice({
          hostname: 'ESP32-Sensor',
          deviceType: DeviceType.IOT,
          vendor: 'Espressif Inc.',
          macAddress: '24:0A:C4:12:34:56',
        })}
      />
      <DeviceListItem
        device={createMockDevice({
          hostname: 'HP-LaserJet',
          deviceType: DeviceType.PRINTER,
          vendor: 'Hewlett Packard',
          macAddress: '00:1E:0B:12:34:56',
        })}
      />
      <DeviceListItem
        device={createMockDevice({
          hostname: 'Samsung-TV',
          deviceType: DeviceType.TV,
          vendor: 'Samsung Electronics',
          macAddress: '00:26:5D:12:34:56',
        })}
      />
      <DeviceListItem
        device={createMockDevice({
          hostname: 'PlayStation-5',
          deviceType: DeviceType.GAMING_CONSOLE,
          vendor: 'Sony',
          macAddress: 'B8:B8:8D:12:34:56',
        })}
      />
      <DeviceListItem
        device={createMockDevice({
          hostname: 'Unknown-Device',
          deviceType: DeviceType.UNKNOWN,
          vendor: null,
          macAddress: 'FF:FF:FF:12:34:56',
        })}
      />
    </div>
  ),
};

/**
 * Story 8: Long Duration - Device connected for days
 */
export const LongDuration: Story = {
  args: {
    device: createMockDevice({
      connectionDuration: '72h 15m',
      firstSeen: new Date(Date.now() - 72 * 60 * 60 * 1000), // 3 days ago
    }),
  },
};
