/**
 * InterfaceStatusCard Storybook Stories
 *
 * Demonstrates all states and variants of the InterfaceStatusCard component.
 */

import { InterfaceStatusCard } from './InterfaceStatusCard';

import type { InterfaceGridData } from './types';
import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof InterfaceStatusCard> = {
  title: 'Dashboard/InterfaceStatusCard',
  component: InterfaceStatusCard,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof InterfaceStatusCard>;

const baseInterface: InterfaceGridData = {
  id: '1',
  name: 'ether1',
  type: 'ethernet',
  status: 'up',
  ip: '192.168.1.1',
  mac: 'AA:BB:CC:DD:EE:FF',
  mtu: 1500,
  running: true,
  txRate: 2500000, // 2.5 Mbps
  rxRate: 15200000, // 15.2 Mbps
  linkSpeed: '1Gbps',
  comment: 'WAN Connection',
  usedBy: [],
};

export const Up: Story = {
  args: {
    interface: baseInterface,
    onSelect: (iface) => console.log('Selected:', iface),
  },
};

export const Down: Story = {
  args: {
    interface: {
      ...baseInterface,
      status: 'down',
      running: false,
      txRate: 0,
      rxRate: 0,
      lastSeen: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
    },
    onSelect: (iface) => console.log('Selected:', iface),
  },
};

export const Disabled: Story = {
  args: {
    interface: {
      ...baseInterface,
      status: 'disabled',
      running: false,
      txRate: 0,
      rxRate: 0,
    },
    onSelect: (iface) => console.log('Selected:', iface),
  },
};

export const HighTraffic: Story = {
  args: {
    interface: {
      ...baseInterface,
      txRate: 1500000000, // 1.5 Gbps
      rxRate: 2300000000, // 2.3 Gbps
      linkSpeed: '10Gbps',
    },
    onSelect: (iface) => console.log('Selected:', iface),
  },
};

export const NoIP: Story = {
  args: {
    interface: {
      ...baseInterface,
      ip: undefined,
    },
    onSelect: (iface) => console.log('Selected:', iface),
  },
};

export const Wireless: Story = {
  args: {
    interface: {
      ...baseInterface,
      id: '2',
      name: 'wlan1',
      type: 'wireless',
      ip: '10.0.0.1',
      txRate: 500000, // 500 Kbps
      rxRate: 2000000, // 2 Mbps
      linkSpeed: undefined,
    },
    onSelect: (iface) => console.log('Selected:', iface),
  },
};

export const VPN: Story = {
  args: {
    interface: {
      ...baseInterface,
      id: '3',
      name: 'wg-vpn',
      type: 'vpn',
      ip: '10.8.0.1',
      txRate: 100000, // 100 Kbps
      rxRate: 500000, // 500 Kbps
      linkSpeed: undefined,
      comment: 'WireGuard VPN',
    },
    onSelect: (iface) => console.log('Selected:', iface),
  },
};

export const Bridge: Story = {
  args: {
    interface: {
      ...baseInterface,
      id: '4',
      name: 'bridge-lan',
      type: 'bridge',
      ip: '192.168.88.1',
      txRate: 5000000, // 5 Mbps
      rxRate: 10000000, // 10 Mbps
      linkSpeed: undefined,
      comment: 'LAN Bridge',
    },
    onSelect: (iface) => console.log('Selected:', iface),
  },
};
