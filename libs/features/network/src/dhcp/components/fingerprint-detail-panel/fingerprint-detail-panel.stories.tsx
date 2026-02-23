/**
 * FingerprintDetailPanel Storybook Stories
 *
 * Story: NAS-6.13 - DHCP Fingerprinting
 *
 * Displays DHCP fingerprint details for a single lease:
 * device type, confidence, fingerprint hash, DHCP options 55/60,
 * hostname, MAC vendor, and identification source badge.
 */

import type { Meta, StoryObj } from '@storybook/react';
import { fn } from 'storybook/test';

import type { DHCPLeaseWithOptions, DeviceIdentification } from '@nasnet/core/types';

import { FingerprintDetailPanel } from './fingerprint-detail-panel';

// ─── Shared mock data ─────────────────────────────────────────────────────

const baseLease: DHCPLeaseWithOptions = {
  id: 'lease-001',
  address: '192.168.88.105',
  macAddress: 'AA:BB:CC:11:22:33',
  hostname: 'my-iphone',
  status: 'bound',
  server: 'dhcp1',
  dynamic: true,
  blocked: false,
  expiresAfter: '23h15m',
  lastSeen: new Date('2026-02-19T10:00:00Z'),
  options: {
    '55': [1, 3, 6, 15, 119, 252],
    '60': 'dhcpcd-5.5.6',
    '61': 'AA:BB:CC:11:22:33',
  },
};

const iphoneIdentification: DeviceIdentification = {
  macAddress: 'AA:BB:CC:11:22:33',
  deviceType: 'ios',
  deviceCategory: 'mobile',
  confidence: 94,
  source: 'automatic',
  fingerprintHash: 'fp_abc123def456',
  identifiedAt: '2026-02-19T08:00:00Z',
};

const meta = {
  title: 'Features/Network/DHCP/FingerprintDetailPanel',
  component: FingerprintDetailPanel,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Displays 8 fields of DHCP fingerprint detail for a lease: detected device type, confidence score, fingerprint hash, DHCP options 55 and 60, hostname, MAC vendor lookup, and identification source (automatic vs manual). Provides Edit and Copy JSON actions.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    lease: {
      description: 'DHCP lease extended with DHCP options data',
      control: 'object',
    },
    identification: {
      description: 'Device identification result from fingerprint engine',
      control: 'object',
    },
    onEdit: {
      description: 'Called when the Edit button is clicked',
      action: 'edit clicked',
    },
    onCopy: {
      description: 'Called after fingerprint JSON is copied to clipboard',
      action: 'copy clicked',
    },
  },
  args: {
    onEdit: fn(),
    onCopy: fn(),
  },
} satisfies Meta<typeof FingerprintDetailPanel>;

export default meta;
type Story = StoryObj<typeof FingerprintDetailPanel>;

// ─── Stories ──────────────────────────────────────────────────────────────

/**
 * iPhone automatically identified with high confidence.
 */
export const AutomaticIOS: Story = {
  args: {
    lease: baseLease,
    identification: iphoneIdentification,
  },
};

/**
 * Windows PC automatically identified.
 * Shows Option 55 as a comma-separated string (alternative format).
 */
export const AutomaticWindows: Story = {
  args: {
    lease: {
      ...baseLease,
      id: 'lease-002',
      address: '192.168.88.110',
      macAddress: 'DE:AD:BE:EF:00:01',
      hostname: 'DESKTOP-WIN11',
      options: {
        '55': '1,3,6,15,31,33,43,44,46,47,119,121,249,252',
        '60': 'MSFT 5.0',
      },
    },
    identification: {
      macAddress: 'DE:AD:BE:EF:00:01',
      deviceType: 'windows',
      deviceCategory: 'computer',
      confidence: 98,
      source: 'automatic',
      fingerprintHash: 'fp_win11_msft50',
      identifiedAt: '2026-02-19T09:00:00Z',
    },
  },
  parameters: {
    docs: {
      description: {
        story:
          'Windows machine identified via the well-known MSFT 5.0 vendor class (Option 60). Confidence is very high at 98%.',
      },
    },
  },
};

/**
 * Device manually identified by the administrator.
 * The source badge shows "Manual" instead of "Automatic".
 */
export const ManuallyIdentified: Story = {
  args: {
    lease: {
      ...baseLease,
      id: 'lease-003',
      address: '192.168.88.200',
      macAddress: 'FC:AA:14:88:99:00',
      hostname: 'smart-thermostat',
      options: {
        '55': [1, 3, 6],
      },
    },
    identification: {
      macAddress: 'FC:AA:14:88:99:00',
      deviceType: 'thermostat',
      deviceCategory: 'iot',
      confidence: 100,
      source: 'manual',
      identifiedAt: '2026-02-18T14:00:00Z',
    },
  },
  parameters: {
    docs: {
      description: {
        story:
          'Administrator manually overrode the device type. The source badge shows "Manual" and confidence is 100% (user-certain).',
      },
    },
  },
};

/**
 * Unknown device with low confidence. No hostname or Option 60 provided.
 */
export const UnknownDeviceLowConfidence: Story = {
  args: {
    lease: {
      ...baseLease,
      id: 'lease-004',
      address: '192.168.88.254',
      macAddress: '00:11:22:33:44:55',
      hostname: undefined,
      options: {
        '55': [1, 3],
      },
    },
    identification: {
      macAddress: '00:11:22:33:44:55',
      deviceType: 'unknown',
      deviceCategory: 'other',
      confidence: 22,
      source: 'automatic',
      fingerprintHash: 'fp_generic_0001',
      identifiedAt: '2026-02-19T07:30:00Z',
    },
  },
  parameters: {
    docs: {
      description: {
        story:
          'Device with minimal DHCP options and no hostname. Fingerprint engine returns "unknown" with low confidence.',
      },
    },
  },
};

/**
 * NAS device with all optional fields present (Option 60, hostname, NTP).
 */
export const NASDevice: Story = {
  args: {
    lease: {
      ...baseLease,
      id: 'lease-005',
      address: '192.168.88.50',
      macAddress: '00:11:32:AF:BB:CC',
      hostname: 'nas-storage',
      options: {
        '55': [1, 3, 6, 12, 15, 28, 40, 41, 42],
        '60': 'Synology DiskStation',
        '61': '00:11:32:AF:BB:CC',
      },
    },
    identification: {
      macAddress: '00:11:32:AF:BB:CC',
      deviceType: 'nas',
      deviceCategory: 'network',
      confidence: 91,
      source: 'automatic',
      fingerprintHash: 'fp_synology_ds',
      identifiedAt: '2026-02-19T06:00:00Z',
    },
  },
  parameters: {
    docs: {
      description: {
        story:
          'Synology NAS identified with high confidence. Shows both DHCP Option 55 and Option 60 (Vendor Class Identifier) populated.',
      },
    },
  },
};

/**
 * Read-only view — no Edit callback provided, only Copy JSON is available.
 */
export const ReadOnly: Story = {
  args: {
    lease: baseLease,
    identification: iphoneIdentification,
    onEdit: undefined,
  },
  parameters: {
    docs: {
      description: {
        story:
          'When no onEdit callback is supplied, the Edit button is hidden and only the Copy JSON action is available.',
      },
    },
  },
};
