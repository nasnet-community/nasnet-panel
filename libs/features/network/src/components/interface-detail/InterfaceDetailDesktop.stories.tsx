/**
 * InterfaceDetailDesktop Stories
 *
 * InterfaceDetailDesktop renders a right-side Sheet panel for a single
 * network interface. It accepts pre-fetched data directly as props so these
 * stories require no GraphQL mocking.
 *
 * Three display modes are exercised:
 *  - Loading (skeleton placeholders)
 *  - Error (query failure message)
 *  - Loaded (Status / Traffic / Configuration tabs)
 */

import type { Meta, StoryObj } from '@storybook/react';
import { InterfaceDetailDesktop } from './InterfaceDetailDesktop';

// ---------------------------------------------------------------------------
// Shared mock interface objects
// ---------------------------------------------------------------------------

const etherUp = {
  id: 'ether1',
  name: 'ether1',
  type: 'ether',
  status: 'UP',
  enabled: true,
  running: true,
  macAddress: 'D4:CA:6D:AA:BB:CC',
  linkSpeed: '1Gbps',
  linkPartner: 'Cisco SG110',
  mtu: 1500,
  comment: 'Uplink to ISP',
  ip: ['192.168.1.1/24', '203.0.113.1/32'],
  usedBy: ['gateway', 'masquerade'],
  txRate: 1_250_000,
  rxRate: 3_800_000,
  txBytes: 4_831_838_208,
  rxBytes: 14_680_064_000,
};

const bridgeLan = {
  id: 'bridge1',
  name: 'bridge-lan',
  type: 'bridge',
  status: 'UP',
  enabled: true,
  running: true,
  macAddress: 'D4:CA:6D:00:11:22',
  linkSpeed: null,
  linkPartner: null,
  mtu: 1500,
  comment: 'LAN bridge',
  ip: ['10.0.0.1/8'],
  usedBy: ['dhcp-server'],
  txRate: 85_000,
  rxRate: 210_000,
  txBytes: 10_485_760,
  rxBytes: 52_428_800,
};

const vlanDown = {
  id: 'vlan10',
  name: 'vlan10',
  type: 'vlan',
  status: 'DOWN',
  enabled: false,
  running: false,
  macAddress: null,
  linkSpeed: null,
  linkPartner: null,
  mtu: 1500,
  comment: 'Guest VLAN (disabled)',
  ip: [],
  usedBy: [],
  txRate: 0,
  rxRate: 0,
  txBytes: 0,
  rxBytes: 0,
};

const wirelessUp = {
  id: 'wlan1',
  name: 'wlan1',
  type: 'wlan',
  status: 'UP',
  enabled: true,
  running: true,
  macAddress: 'AA:BB:CC:DD:EE:FF',
  linkSpeed: '300Mbps',
  linkPartner: null,
  mtu: 1500,
  comment: '',
  ip: ['192.168.88.1/24'],
  usedBy: [],
  txRate: 2_000_000,
  rxRate: 750_000,
  txBytes: 1_073_741_824,
  rxBytes: 268_435_456,
};

// ---------------------------------------------------------------------------
// Meta
// ---------------------------------------------------------------------------

const meta: Meta<typeof InterfaceDetailDesktop> = {
  title: 'Features/Network/InterfaceDetail/Desktop',
  component: InterfaceDetailDesktop,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Right-side Sheet panel for desktop that displays a single network interface in detail. ' +
          'Three tabs are available: Status (link state, MAC, speed), Traffic (TX/RX rates and totals), ' +
          'and Configuration (MTU, IPs, edit button). Accepts pre-fetched data — no GraphQL required.',
      },
    },
  },
  args: {
    open: true,
    routerId: 'router-001',
    onClose: () => console.log('close'),
  },
};

export default meta;
type Story = StoryObj<typeof InterfaceDetailDesktop>;

// ---------------------------------------------------------------------------
// Stories
// ---------------------------------------------------------------------------

/** Ethernet WAN interface — UP, enabled, with IPs, traffic rates and "Used By" badges. */
export const EthernetWAN: Story = {
  args: {
    interface: etherUp,
    loading: false,
    error: null,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Active WAN uplink with two IP addresses, 1 Gbps link speed, ' +
          'high traffic rates, and "gateway" / "masquerade" usage badges.',
      },
    },
  },
};

/** LAN bridge interface — UP, DHCP server consumer, low traffic. */
export const BridgeLAN: Story = {
  args: {
    interface: bridgeLan,
    loading: false,
    error: null,
  },
  parameters: {
    docs: {
      description: {
        story: 'Bridge interface serving the LAN segment with a DHCP server attached.',
      },
    },
  },
};

/** Disabled VLAN — DOWN status, no traffic, no IPs. */
export const DisabledVLAN: Story = {
  args: {
    interface: vlanDown,
    loading: false,
    error: null,
  },
  parameters: {
    docs: {
      description: {
        story:
          'VLAN interface in disabled / DOWN state. All traffic counters are zero ' +
          'and no IP addresses are configured.',
      },
    },
  },
};

/** Wireless interface — active with MAC, link speed and TX/RX rates. */
export const WirelessInterface: Story = {
  args: {
    interface: wirelessUp,
    loading: false,
    error: null,
  },
  parameters: {
    docs: {
      description: {
        story: 'Wireless interface with 300 Mbps link speed and comment field left empty.',
      },
    },
  },
};

/** Loading state — skeletons are shown while the query is in flight. */
export const Loading: Story = {
  args: {
    interface: null,
    loading: true,
    error: null,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Skeleton placeholders are displayed while the interface detail query is in flight.',
      },
    },
  },
};

/** Error state — query failed, destructive message is displayed. */
export const ErrorState: Story = {
  args: {
    interface: null,
    loading: false,
    error: { message: 'Connection refused: could not reach router at 192.168.88.1:8728' },
  },
  parameters: {
    docs: {
      description: {
        story:
          'When the detail query fails the panel shows a destructive error message ' +
          'instead of skeleton or content.',
      },
    },
  },
};
