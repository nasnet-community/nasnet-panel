/**
 * VPNClientCard Storybook Stories
 *
 * Demonstrates the VPNClientCard pattern showing VPN client status,
 * configuration, and actions. Covers multiple protocols, connection states,
 * and traffic information.
 *
 * @module @nasnet/ui/patterns/vpn-client-card
 */

import { fn } from 'storybook/test';

import { VPNClientCard } from './VPNClientCard';

import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof VPNClientCard> = {
  title: 'Patterns/VPN/VPNClientCard',
  component: VPNClientCard,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
A card component for displaying VPN client information with full details, actions, and real-time stats.

## Features
- Protocol badge with icon
- Status indicator (Connected / Disconnected / Disabled)
- Remote server address and port
- Connection statistics (uptime, traffic, IP addresses)
- Toggle switch for enable/disable
- Actions menu (Connect/Disconnect, Edit, Delete)
- Loading state for toggle operations
- Full keyboard accessibility

## Usage
\`\`\`tsx
import { VPNClientCard } from '@nasnet/ui/patterns';

<VPNClientCard
  id="wg-1"
  name="Office VPN"
  protocol="wireguard"
  isDisabled={false}
  isRunning={true}
  connectTo="vpn.example.com"
  uptime="2h 15m"
  rx={524288000}
  tx={262144000}
  onToggle={(id, enabled) => handleToggle(id, enabled)}
  onEdit={(id) => handleEdit(id)}
  onConnect={(id) => handleConnect(id)}
  onDelete={(id) => handleDelete(id)}
/>
\`\`\`
        `,
      },
    },
  },
  argTypes: {
    onToggle: {
      description: 'Called when toggle switch is changed',
      action: 'toggled',
    },
    onConnect: {
      description: 'Called when connect/disconnect action is clicked',
      action: 'connect-clicked',
    },
    onEdit: {
      description: 'Called when edit action is clicked',
      action: 'edit-clicked',
    },
    onDelete: {
      description: 'Called when delete action is clicked',
      action: 'delete-clicked',
    },
    isToggling: {
      control: 'boolean',
      description: 'Loading state for toggle operation',
    },
  },
  args: {
    onToggle: fn(),
    onConnect: fn(),
    onEdit: fn(),
    onDelete: fn(),
  },
};

export default meta;
type Story = StoryObj<typeof VPNClientCard>;

// ============================================================================
// Stories
// ============================================================================

/**
 * Connected WireGuard client with full statistics.
 */
export const WireGuardConnected: Story = {
  name: 'WireGuard — Connected',
  args: {
    id: 'wg-1',
    name: 'Office VPN',
    protocol: 'wireguard',
    isDisabled: false,
    isRunning: true,
    connectTo: 'vpn.example.com',
    port: 51820,
    user: 'alice',
    uptime: '2h 15m',
    rx: 524288000,
    tx: 262144000,
    localAddress: '10.0.0.2',
    remoteAddress: '203.0.113.45',
    comment: 'Primary office connection',
  },
};

/**
 * Disconnected OpenVPN client.
 */
export const OpenVPNDisconnected: Story = {
  name: 'OpenVPN — Disconnected',
  args: {
    id: 'ovpn-1',
    name: 'Secondary VPN',
    protocol: 'openvpn',
    isDisabled: false,
    isRunning: false,
    connectTo: 'vpn2.example.com',
    port: 1194,
    user: 'bob',
  },
};

/**
 * Disabled L2TP client.
 */
export const L2TPDisabled: Story = {
  name: 'L2TP — Disabled',
  args: {
    id: 'l2tp-1',
    name: 'Legacy L2TP',
    protocol: 'l2tp',
    isDisabled: true,
    isRunning: false,
    connectTo: '192.168.1.254',
    port: 1701,
    user: 'legacy_user',
    comment: 'Deprecated — kept for compatibility',
  },
};

/**
 * Connected IKEv2 with minimal info (no traffic stats).
 */
export const IKEv2MinimalInfo: Story = {
  name: 'IKEv2 — Minimal Info',
  args: {
    id: 'ikev2-1',
    name: 'Mobile VPN',
    protocol: 'ikev2',
    isDisabled: false,
    isRunning: true,
    connectTo: 'mobile-vpn.example.com',
    user: 'mobile_user',
  },
};

/**
 * Toggle switch is in loading state.
 */
export const TogglingState: Story = {
  name: 'Toggling — Loading State',
  args: {
    id: 'sstp-1',
    name: 'SSTP Client',
    protocol: 'sstp',
    isDisabled: false,
    isRunning: true,
    connectTo: 'sstp.example.com',
    isToggling: true,
    onToggle: fn(),
  },
};

/**
 * PPTP with large traffic numbers.
 */
export const PPTPWithHighTraffic: Story = {
  name: 'PPTP — High Traffic',
  args: {
    id: 'pptp-1',
    name: 'Heavy Usage VPN',
    protocol: 'pptp',
    isDisabled: false,
    isRunning: true,
    connectTo: 'pptp.example.com',
    port: 1723,
    user: 'power_user',
    uptime: '7d 12h',
    rx: 10737418240, // 10 GB
    tx: 5368709120, // 5 GB
    localAddress: '10.0.0.10',
    remoteAddress: '203.0.113.200',
  },
};

/**
 * Connected client without actions (read-only view).
 */
export const ReadOnlyView: Story = {
  name: 'Read-Only — No Actions',
  args: {
    id: 'ro-1',
    name: 'Monitored VPN',
    protocol: 'wireguard',
    isDisabled: false,
    isRunning: true,
    connectTo: 'vpn.example.com',
    user: 'monitor',
    uptime: '30d',
    rx: 1073741824,
    tx: 536870912,
  },
};

/**
 * Client with very long name and comment (tests truncation).
 */
export const LongTextContent: Story = {
  name: 'Long Text — Truncation Test',
  args: {
    id: 'long-1',
    name: 'This is a very long VPN client name that should be truncated with ellipsis',
    protocol: 'wireguard',
    isDisabled: false,
    isRunning: true,
    connectTo: 'very-long-domain-name-that-could-be-truncated.example.com',
    port: 51820,
    user: 'user@example.com',
    comment: 'This is a very long comment that might also need to be truncated depending on the layout and available space',
  },
};
