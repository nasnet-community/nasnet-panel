/**
 * Storybook stories for DeviceDiscoveryTable
 *
 * Covers: empty state, small list, selected row, mixed vendors/hostnames,
 * and a single-device result.
 */

import { fn } from 'storybook/test';

import { DeviceDiscoveryTable } from './DeviceDiscoveryTable';

import type { DiscoveredDevice } from './types';
import type { Meta, StoryObj } from '@storybook/react';

// ---------------------------------------------------------------------------
// Mock data
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
    dhcpLease:
      hasDhcp ?
        {
          expires: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
          server: '192.168.88.1',
          status: 'bound',
        }
      : undefined,
  };
}

const sampleDevices: DiscoveredDevice[] = [
  makeDevice('192.168.88.1', 'D4:CA:6D:AB:CD:01', 'MikroTik', 'router.lan', 'bridge1', 1, false),
  makeDevice('192.168.88.10', 'AA:BB:CC:DD:EE:01', 'Apple', 'macbook-pro.lan', 'bridge1', 3, true),
  makeDevice('192.168.88.11', '11:22:33:44:55:01', 'Samsung', null, 'bridge1', 5, true),
  makeDevice('192.168.88.12', 'DE:AD:BE:EF:00:01', null, null, 'bridge1', 7, false),
  makeDevice(
    '192.168.88.13',
    'CA:FE:BA:BE:00:01',
    'Dell',
    'workstation-01.lan',
    'bridge1',
    2,
    true
  ),
  makeDevice(
    '192.168.88.14',
    '00:1A:2B:3C:4D:01',
    'Raspberry Pi',
    'pi-hole.lan',
    'bridge1',
    4,
    true
  ),
  makeDevice(
    '192.168.88.15',
    'FE:DC:BA:98:76:01',
    'Ubiquiti',
    'ap-living-room.lan',
    'bridge1',
    6,
    false
  ),
];

const selectedDevice = sampleDevices[1]; // macbook-pro

// ---------------------------------------------------------------------------
// Meta
// ---------------------------------------------------------------------------

const meta: Meta<typeof DeviceDiscoveryTable> = {
  title: 'Features/Diagnostics/DeviceDiscoveryTable',
  component: DeviceDiscoveryTable,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Sortable results table for devices discovered during a network scan. ' +
          'Supports row selection to trigger the detail panel, and automatically ' +
          'switches to a virtualized renderer for large datasets (>50 devices).',
      },
    },
  },
  argTypes: {
    onSelectDevice: { action: 'device selected' },
  },
};

export default meta;
type Story = StoryObj<typeof DeviceDiscoveryTable>;

// ---------------------------------------------------------------------------
// Stories
// ---------------------------------------------------------------------------

export const Empty: Story = {
  name: 'Empty State',
  args: {
    devices: [],
    onSelectDevice: fn(),
    selectedDevice: null,
  },
  parameters: {
    docs: {
      description: {
        story: 'No devices discovered yet — the table renders with a "0 devices found" footer.',
      },
    },
  },
};

export const SingleDevice: Story = {
  name: 'Single Device',
  args: {
    devices: [sampleDevices[0]],
    onSelectDevice: fn(),
    selectedDevice: null,
  },
  parameters: {
    docs: {
      description: { story: 'Only one device found — typically the gateway/router itself.' },
    },
  },
};

export const MultipleDevices: Story = {
  name: 'Multiple Devices — No Selection',
  args: {
    devices: sampleDevices,
    onSelectDevice: fn(),
    selectedDevice: null,
  },
  parameters: {
    docs: {
      description: {
        story: '7 devices listed; DHCP badges and vendor names rendered. Click a row to select it.',
      },
    },
  },
};

export const WithSelectedRow: Story = {
  name: 'With Selected Row',
  args: {
    devices: sampleDevices,
    onSelectDevice: fn(),
    selectedDevice: selectedDevice,
  },
  parameters: {
    docs: {
      description: {
        story:
          'The "macbook-pro.lan" row is highlighted (muted background). ' +
          'Clicking the same row again deselects it.',
      },
    },
  },
};

export const UnknownVendors: Story = {
  name: 'Unknown Vendors and Hostnames',
  args: {
    devices: sampleDevices.map((d) => ({ ...d, vendor: null, hostname: null })),
    onSelectDevice: fn(),
    selectedDevice: null,
  },
  parameters: {
    docs: {
      description: {
        story:
          'All vendor and hostname fields are null — the table renders the appropriate fallback placeholders.',
      },
    },
  },
};
