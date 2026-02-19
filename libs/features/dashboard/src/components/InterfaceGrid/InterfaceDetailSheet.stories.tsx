/**
 * Storybook stories for InterfaceDetailSheet
 *
 * Displays expanded interface details in a sheet (mobile/tablet)
 * or dialog (desktop), showing MAC, IP, MTU, link speed, running
 * status, comment, link partner, and last-seen timestamp.
 */

import { fn } from '@storybook/test';

import { InterfaceDetailSheet } from './InterfaceDetailSheet';

import type { InterfaceGridData } from './types';
import type { Meta, StoryObj } from '@storybook/react';

// ---------------------------------------------------------------------------
// Shared mock data
// ---------------------------------------------------------------------------

const ethernetInterface: InterfaceGridData = {
  id: 'iface-ether1',
  name: 'ether1',
  type: 'ethernet',
  status: 'up',
  ip: '192.168.1.1/24',
  mac: 'AA:BB:CC:DD:EE:01',
  txRate: 12_500_000,
  rxRate: 45_000_000,
  linkSpeed: '1Gbps',
  mtu: 1500,
  running: true,
  linkPartner: 'Cisco Switch (port Gi0/1)',
  comment: 'Primary WAN uplink',
  usedBy: ['DHCP Server', 'NAT Masquerade'],
};

const bridgeInterface: InterfaceGridData = {
  id: 'iface-bridge-lan',
  name: 'bridge-lan',
  type: 'bridge',
  status: 'up',
  ip: '10.0.0.1/16',
  mac: 'AA:BB:CC:DD:EE:02',
  txRate: 5_000_000,
  rxRate: 3_200_000,
  linkSpeed: undefined,
  mtu: 1500,
  running: true,
  comment: 'Internal LAN bridge',
};

const vpnInterface: InterfaceGridData = {
  id: 'iface-wireguard0',
  name: 'wireguard0',
  type: 'vpn',
  status: 'up',
  ip: '10.10.0.1/24',
  mac: undefined,
  txRate: 800_000,
  rxRate: 1_200_000,
  mtu: 1420,
  running: true,
  comment: 'WireGuard peer tunnel',
};

const downInterface: InterfaceGridData = {
  id: 'iface-ether4',
  name: 'ether4',
  type: 'ethernet',
  status: 'down',
  ip: undefined,
  mac: 'AA:BB:CC:DD:EE:04',
  txRate: 0,
  rxRate: 0,
  linkSpeed: undefined,
  mtu: 1500,
  running: false,
  lastSeen: '2025-11-10T08:42:00.000Z',
};

const disabledInterface: InterfaceGridData = {
  id: 'iface-ether5',
  name: 'ether5',
  type: 'ethernet',
  status: 'disabled',
  ip: undefined,
  mac: 'AA:BB:CC:DD:EE:05',
  txRate: 0,
  rxRate: 0,
  mtu: 1500,
  running: false,
  comment: 'Reserved for future use',
};

// ---------------------------------------------------------------------------
// Meta
// ---------------------------------------------------------------------------

const meta: Meta<typeof InterfaceDetailSheet> = {
  title: 'Features/Dashboard/InterfaceDetailSheet',
  component: InterfaceDetailSheet,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A detail panel that shows expanded network interface information. ' +
          'Renders as a Dialog on desktop and a bottom Sheet on mobile/tablet. ' +
          'Displays MAC address, IP, MTU, link speed, running status, comment, ' +
          'link partner, and last-seen timestamp (for down interfaces). ' +
          'Includes a navigation link to the full Network section.',
      },
    },
  },
  argTypes: {
    open: { control: 'boolean' },
    onOpenChange: { action: 'onOpenChange' },
  },
};

export default meta;
type Story = StoryObj<typeof InterfaceDetailSheet>;

// ---------------------------------------------------------------------------
// Stories
// ---------------------------------------------------------------------------

/** Fully connected Ethernet interface with all optional fields populated. */
export const EthernetUp: Story = {
  args: {
    interface: ethernetInterface,
    open: true,
    onOpenChange: fn(),
  },
};

/** Bridge interface: no MAC, no link speed, shows IP on the LAN side. */
export const BridgeInterface: Story = {
  args: {
    interface: bridgeInterface,
    open: true,
    onOpenChange: fn(),
  },
};

/** VPN / WireGuard tunnel with no MAC address and a custom MTU. */
export const VpnTunnel: Story = {
  args: {
    interface: vpnInterface,
    open: true,
    onOpenChange: fn(),
  },
};

/**
 * Down interface: shows "Last Seen" timestamp because status is 'down'.
 * No IP or link speed is available.
 */
export const InterfaceDown: Story = {
  args: {
    interface: downInterface,
    open: true,
    onOpenChange: fn(),
  },
};

/** Administratively disabled interface with a comment but no traffic data. */
export const InterfaceDisabled: Story = {
  args: {
    interface: disabledInterface,
    open: true,
    onOpenChange: fn(),
  },
};

/** Sheet is closed — nothing should be visible. */
export const Closed: Story = {
  args: {
    interface: ethernetInterface,
    open: false,
    onOpenChange: fn(),
  },
};
