/**
 * InterfaceDetail Stories
 *
 * The InterfaceDetail component is a headless + platform presenter wrapper that
 * fetches interface data via GraphQL and delegates rendering to
 * InterfaceDetailDesktop (Sheet panel) or InterfaceDetailMobile (full-screen dialog).
 *
 * Because it depends on Apollo and platform detection, stories target the desktop
 * presenter directly with inline mock data so every state is immediately visible
 * without network or hook setup.
 */

import { InterfaceDetailDesktop } from './InterfaceDetailDesktop';

import type { Meta, StoryObj } from '@storybook/react';

// ---------------------------------------------------------------------------
// Shared mock data
// ---------------------------------------------------------------------------

const ethernetInterface = {
  id: '*1',
  name: 'ether1',
  type: 'Ethernet',
  status: 'UP',
  enabled: true,
  running: true,
  macAddress: '00:11:22:33:44:55',
  mtu: 1500,
  linkSpeed: '1Gbps',
  linkPartner: 'switch-core-01',
  comment: 'WAN uplink to ISP',
  ip: ['192.168.1.1/24', '10.0.0.1/30'],
  txBytes: 1_073_741_824,
  rxBytes: 2_147_483_648,
  txRate: 1_500_000,
  rxRate: 2_500_000,
  usedBy: ['gateway', 'masquerade'],
};

const bridgeInterface = {
  id: '*3',
  name: 'bridge1',
  type: 'Bridge',
  status: 'UP',
  enabled: true,
  running: true,
  macAddress: '00:11:22:33:44:77',
  mtu: 1500,
  linkSpeed: null,
  linkPartner: null,
  comment: 'Local LAN bridge',
  ip: ['192.168.88.1/24'],
  txBytes: 524_288_000,
  rxBytes: 1_048_576_000,
  txRate: 512_000,
  rxRate: 1_024_000,
  usedBy: ['dhcp-server'],
};

const disabledInterface = {
  id: '*4',
  name: 'ether3',
  type: 'Ethernet',
  status: 'DOWN',
  enabled: false,
  running: false,
  macAddress: '00:11:22:33:44:88',
  mtu: 1500,
  linkSpeed: null,
  linkPartner: null,
  comment: null,
  ip: [],
  txBytes: 0,
  rxBytes: 0,
  txRate: 0,
  rxRate: 0,
  usedBy: [],
};

// ---------------------------------------------------------------------------
// Meta
// ---------------------------------------------------------------------------

const meta: Meta<typeof InterfaceDetailDesktop> = {
  title: 'Features/Network/InterfaceDetail',
  component: InterfaceDetailDesktop,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Displays detailed information for a single network interface inside a right-side Sheet panel (desktop) or full-screen dialog (mobile). Tabs expose Status, Traffic, and Configuration sections.',
      },
    },
  },
  args: {
    open: true,
    loading: false,
    error: null,
    routerId: 'router-1',
    onClose: () => {},
  },
};

export default meta;
type Story = StoryObj<typeof InterfaceDetailDesktop>;

// ---------------------------------------------------------------------------
// Stories
// ---------------------------------------------------------------------------

/** Active ethernet interface with full traffic data and IP addresses. */
export const EthernetInterface: Story = {
  args: {
    interface: ethernetInterface,
  },
};

/** Bridge interface used by DHCP server — no link-speed or partner info. */
export const BridgeInterface: Story = {
  args: {
    interface: bridgeInterface,
  },
};

/** Disabled interface that is administratively down. */
export const DisabledInterface: Story = {
  args: {
    interface: disabledInterface,
  },
};

/** Skeleton loading state while the GraphQL query is in flight. */
export const Loading: Story = {
  args: {
    interface: null,
    loading: true,
  },
};

/** Error state when the interface query fails (e.g. connection refused). */
export const ErrorState: Story = {
  args: {
    interface: null,
    loading: false,
    error: { message: 'Failed to load interface details. Connection refused.' },
  },
};

/** Panel closed — the Sheet should not be visible. */
export const Closed: Story = {
  args: {
    interface: ethernetInterface,
    open: false,
  },
};
