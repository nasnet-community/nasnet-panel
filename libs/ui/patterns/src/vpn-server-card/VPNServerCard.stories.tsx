import type { VPNProtocol } from '@nasnet/core/types';

import { VPNServerCard } from './VPNServerCard';

import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof VPNServerCard> = {
  title: 'Patterns/VPNServerCard',
  component: VPNServerCard,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Displays a single VPN server with its status, port, connected clients, and action menu. Supports all VPN protocols with enable/disable toggle and edit/delete actions.',
      },
    },
  },
  argTypes: {
    id: { control: 'text' },
    name: { control: 'text' },
    protocol: {
      control: 'select',
      options: ['wireguard', 'openvpn', 'l2tp', 'ikev2', 'pptp', 'sstp'] as VPNProtocol[],
    },
    isDisabled: { control: 'boolean' },
    isRunning: { control: 'boolean' },
    port: { control: 'number' },
    connectedClients: { control: 'number' },
    rx: { control: 'number' },
    tx: { control: 'number' },
    comment: { control: 'text' },
    isToggling: { control: 'boolean' },
    onToggle: { action: 'toggled' },
    onEdit: { action: 'edit' },
    onDelete: { action: 'delete' },
    onViewDetails: { action: 'viewDetails' },
  },
};

export default meta;
type Story = StoryObj<typeof VPNServerCard>;

export const WireGuardServerRunning: Story = {
  args: {
    id: 'wg-server-1',
    name: 'WireGuard Main Server',
    protocol: 'wireguard',
    isDisabled: false,
    isRunning: true,
    port: 51820,
    connectedClients: 5,
    rx: 1_073_741_824,
    tx: 536_870_912,
    comment: 'Production server for remote access',
  },
};

export const OpenVPNServerStopped: Story = {
  args: {
    id: 'ovpn-server-1',
    name: 'OpenVPN Legacy',
    protocol: 'openvpn',
    isDisabled: false,
    isRunning: false,
    port: 1194,
    connectedClients: 0,
    rx: 0,
    tx: 0,
    comment: 'Legacy OpenVPN - consider upgrading to WireGuard',
  },
};

export const L2TPServerDisabled: Story = {
  args: {
    id: 'l2tp-server-1',
    name: 'L2TP Test Server',
    protocol: 'l2tp',
    isDisabled: true,
    isRunning: false,
    port: 1701,
    connectedClients: 0,
    comment: 'Disabled for testing',
  },
};

export const IKEv2ServerActive: Story = {
  args: {
    id: 'ikev2-server-1',
    name: 'IKEv2 Mobile Gateway',
    protocol: 'ikev2',
    isDisabled: false,
    isRunning: true,
    port: 500,
    connectedClients: 12,
    rx: 2_147_483_648,
    tx: 1_073_741_824,
  },
};

export const MinimalServer: Story = {
  args: {
    id: 'pptp-server-1',
    name: 'PPTP Test',
    protocol: 'pptp',
    isDisabled: false,
    isRunning: true,
  },
};

export const WithActions: Story = {
  args: {
    id: 'wg-server-2',
    name: 'WireGuard Secondary',
    protocol: 'wireguard',
    isDisabled: false,
    isRunning: true,
    port: 51821,
    connectedClients: 3,
    rx: 314_572_800,
    tx: 104_857_600,
    comment: 'Backup server',
  },
  parameters: {
    docs: {
      description: {
        story: 'Server with all action handlers connected (toggle, edit, delete, view details).',
      },
    },
  },
};

export const HighTraffic: Story = {
  args: {
    id: 'wg-server-3',
    name: 'WireGuard Heavy Load',
    protocol: 'wireguard',
    isDisabled: false,
    isRunning: true,
    port: 51822,
    connectedClients: 128,
    rx: 10_737_418_240,
    tx: 5_368_709_120,
    comment: 'High-traffic production server',
  },
  parameters: {
    docs: {
      description: {
        story: 'Server handling significant traffic volume with many connected clients.',
      },
    },
  },
};

export const Toggling: Story = {
  args: {
    id: 'wg-server-4',
    name: 'WireGuard Toggling',
    protocol: 'wireguard',
    isDisabled: false,
    isRunning: true,
    port: 51820,
    connectedClients: 5,
    isToggling: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Server in toggling state - the enable/disable switch is disabled while the operation completes.',
      },
    },
  },
};
