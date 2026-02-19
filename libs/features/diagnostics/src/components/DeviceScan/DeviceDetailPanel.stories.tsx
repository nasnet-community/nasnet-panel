/**
 * Storybook stories for DeviceDetailPanel
 *
 * Covers: device with DHCP lease, static device (no lease), unknown vendor,
 * expiring lease, expired lease, and no router context.
 */

import { fn } from '@storybook/test';

import { DeviceDetailPanel } from './DeviceDetailPanel';

import type { DiscoveredDevice } from './types';
import type { Meta, StoryObj } from '@storybook/react';

// ---------------------------------------------------------------------------
// Mock data helpers
// ---------------------------------------------------------------------------

const NOW = new Date().toISOString();

function leaseExpiring(hoursFromNow: number) {
  return new Date(Date.now() + hoursFromNow * 60 * 60 * 1000).toISOString();
}

const dhcpDevice: DiscoveredDevice = {
  ip: '192.168.88.10',
  mac: 'AA:BB:CC:DD:EE:FF',
  vendor: 'Apple, Inc.',
  hostname: 'macbook-pro.lan',
  interface: 'bridge1',
  responseTime: 3,
  firstSeen: NOW,
  dhcpLease: {
    expires: leaseExpiring(10),
    server: '192.168.88.1',
    status: 'bound',
  },
};

const staticDevice: DiscoveredDevice = {
  ip: '192.168.88.1',
  mac: 'D4:CA:6D:AB:CD:01',
  vendor: 'MikroTik',
  hostname: 'router.lan',
  interface: 'bridge1',
  responseTime: 1,
  firstSeen: NOW,
};

const unknownDevice: DiscoveredDevice = {
  ip: '192.168.88.55',
  mac: 'DE:AD:BE:EF:CA:FE',
  vendor: null,
  hostname: null,
  interface: 'bridge1',
  responseTime: 12,
  firstSeen: NOW,
};

const expiringSoonDevice: DiscoveredDevice = {
  ...dhcpDevice,
  ip: '192.168.88.20',
  hostname: 'iphone-14.lan',
  vendor: 'Apple, Inc.',
  dhcpLease: {
    expires: leaseExpiring(0.5), // 30 minutes
    server: '192.168.88.1',
    status: 'bound',
  },
};

const expiredLeaseDevice: DiscoveredDevice = {
  ...dhcpDevice,
  ip: '192.168.88.30',
  hostname: 'old-laptop.lan',
  vendor: 'Lenovo',
  dhcpLease: {
    expires: leaseExpiring(-2), // 2 hours ago
    server: '192.168.88.1',
    status: 'expired',
  },
};

// ---------------------------------------------------------------------------
// Meta
// ---------------------------------------------------------------------------

const meta: Meta<typeof DeviceDetailPanel> = {
  title: 'Features/Diagnostics/DeviceDetailPanel',
  component: DeviceDetailPanel,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Side panel showing full details for a selected discovered device. ' +
          'Displays MAC address, vendor, interface, response time, first-seen timestamp, ' +
          'and DHCP lease information when available. ' +
          'Includes an "Add to Known Devices" action (requires a routerId).',
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="w-80">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof DeviceDetailPanel>;

// ---------------------------------------------------------------------------
// Stories
// ---------------------------------------------------------------------------

export const WithDhcpLease: Story = {
  name: 'DHCP Device',
  args: {
    device: dhcpDevice,
    onClose: fn(),
    routerId: 'router-abc-123',
  },
  parameters: {
    docs: {
      description: {
        story: 'A device with an active DHCP lease — shows expiry countdown and server address.',
      },
    },
  },
};

export const StaticDevice: Story = {
  name: 'Static Device — No Lease',
  args: {
    device: staticDevice,
    onClose: fn(),
    routerId: 'router-abc-123',
  },
  parameters: {
    docs: {
      description: {
        story: 'A statically configured device (the router itself). The DHCP lease section is hidden.',
      },
    },
  },
};

export const UnknownVendorAndHostname: Story = {
  name: 'Unknown Vendor & Hostname',
  args: {
    device: unknownDevice,
    onClose: fn(),
    routerId: 'router-abc-123',
  },
  parameters: {
    docs: {
      description: {
        story:
          'OUI lookup returned no vendor and no reverse-DNS hostname. ' +
          'Fallback text ("Unknown Device", "Unknown vendor") is rendered.',
      },
    },
  },
};

export const LeaseExpiringSoon: Story = {
  name: 'Lease Expiring Soon',
  args: {
    device: expiringSoonDevice,
    onClose: fn(),
    routerId: 'router-abc-123',
  },
  parameters: {
    docs: {
      description: {
        story: 'DHCP lease expires in ~30 minutes — the "Expires In" field shows a short countdown.',
      },
    },
  },
};

export const ExpiredLease: Story = {
  name: 'Expired DHCP Lease',
  args: {
    device: expiredLeaseDevice,
    onClose: fn(),
    routerId: 'router-abc-123',
  },
  parameters: {
    docs: {
      description: {
        story: 'Lease already expired — the expiry formatter returns "Expired".',
      },
    },
  },
};

export const NoRouterContext: Story = {
  name: 'No Router ID — Add Disabled',
  args: {
    device: dhcpDevice,
    onClose: fn(),
    routerId: null,
  },
  parameters: {
    docs: {
      description: {
        story:
          'When no routerId is provided the "Add to Known Devices" button is disabled.',
      },
    },
  },
};
