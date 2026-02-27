import { fn } from 'storybook/test';

import { BridgeForm } from './bridge-form';

import type { Meta, StoryObj } from '@storybook/react';

/**
 * Bridge Form Component Stories
 * Demonstrates bridge creation and editing forms
 */

const meta: Meta<typeof BridgeForm> = {
  title: 'Features/Network/Bridges/BridgeForm',
  component: BridgeForm,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    onSubmit: { action: 'submitted' },
    onCancel: { action: 'cancelled' },
  },
};

export default meta;

type Story = StoryObj<typeof BridgeForm>;

export const CreateMode: Story = {
  args: {
    bridge: null,
    onSubmit: fn(),
    onCancel: fn(),
    isSubmitting: false,
  },
};

export const CreateModeSubmitting: Story = {
  args: {
    bridge: null,
    onSubmit: fn(),
    onCancel: fn(),
    isSubmitting: true,
  },
};

export const EditMode: Story = {
  args: {
    bridge: {
      id: 'bridge-1',
      name: 'bridge1',
      comment: 'Main LAN bridge',
      disabled: false,
      running: true,
      macAddress: '00:11:22:33:44:55',
      mtu: 1500,
      protocol: 'RSTP' as const,
      priority: 32768,
      vlanFiltering: false,
      pvid: 1,
      ports: [{ interface: 'ether2' as const } as any, { interface: 'ether3' as const } as any],
      dependentDhcpServers: [],
      dependentRoutes: [],
      ipAddresses: [],
      vlans: [],
    },
    onSubmit: fn(),
    onCancel: fn(),
    isSubmitting: false,
  },
};

export const EditModeWithVlanFiltering: Story = {
  args: {
    bridge: {
      id: 'bridge-2',
      name: 'bridge-guest',
      comment: 'Guest network with VLAN filtering',
      disabled: false,
      running: true,
      macAddress: 'AA:BB:CC:DD:EE:FF',
      mtu: 1500,
      protocol: 'RSTP' as const,
      priority: 32768,
      vlanFiltering: true,
      pvid: 100,
      ports: [{ interface: 'wlan1' as const } as any],
      dependentDhcpServers: [],
      dependentRoutes: [],
      ipAddresses: [],
      vlans: [],
    },
    onSubmit: fn(),
    onCancel: fn(),
    isSubmitting: false,
  },
};

export const EditModeNoSTP: Story = {
  args: {
    bridge: {
      id: 'bridge-3',
      name: 'bridge-iot',
      comment: 'IoT devices - no STP',
      disabled: false,
      running: true,
      macAddress: '11:22:33:44:55:66',
      mtu: 1500,
      protocol: 'NONE' as const,
      priority: 32768,
      vlanFiltering: false,
      pvid: 1,
      ports: [],
      dependentDhcpServers: [],
      dependentRoutes: [],
      ipAddresses: [],
      vlans: [],
    },
    onSubmit: fn(),
    onCancel: fn(),
    isSubmitting: false,
  },
};

export const EditModeMSTP: Story = {
  args: {
    bridge: {
      id: 'bridge-4',
      name: 'bridge-mstp',
      comment: 'Bridge with MSTP protocol',
      disabled: false,
      running: true,
      macAddress: 'FF:EE:DD:CC:BB:AA',
      mtu: 1500,
      protocol: 'MSTP' as const,
      priority: 16384,
      vlanFiltering: true,
      pvid: 10,
      ports: [],
      dependentDhcpServers: [],
      dependentRoutes: [],
      ipAddresses: [],
      vlans: [],
    },
    onSubmit: fn(),
    onCancel: fn(),
    isSubmitting: false,
  },
};

export const EditModeSubmitting: Story = {
  args: {
    bridge: {
      id: 'bridge-5',
      name: 'bridge1',
      comment: 'Main LAN bridge',
      disabled: false,
      running: true,
      macAddress: '00:11:22:33:44:55',
      mtu: 1500,
      protocol: 'RSTP' as const,
      priority: 32768,
      vlanFiltering: false,
      pvid: 1,
      ports: [],
      dependentDhcpServers: [],
      dependentRoutes: [],
      ipAddresses: [],
      vlans: [],
    },
    onSubmit: fn(),
    onCancel: fn(),
    isSubmitting: true,
  },
};

export const CustomMTU: Story = {
  args: {
    bridge: {
      id: 'bridge-6',
      name: 'bridge-jumbo',
      comment: 'Bridge with jumbo frames',
      disabled: false,
      running: true,
      macAddress: '00:AA:BB:CC:DD:EE',
      mtu: 9000,
      protocol: 'RSTP' as const,
      priority: 32768,
      vlanFiltering: false,
      pvid: 1,
      ports: [],
      dependentDhcpServers: [],
      dependentRoutes: [],
      ipAddresses: [],
      vlans: [],
    },
    onSubmit: fn(),
    onCancel: fn(),
    isSubmitting: false,
  },
};

export const HighPriority: Story = {
  args: {
    bridge: {
      id: 'bridge-7',
      name: 'bridge-root',
      comment: 'Root bridge candidate (low priority)',
      disabled: false,
      running: true,
      macAddress: '00:11:22:33:44:55',
      mtu: 1500,
      protocol: 'RSTP' as const,
      priority: 4096, // Low priority = more likely to be root
      vlanFiltering: false,
      pvid: 1,
      ports: [],
      dependentDhcpServers: [],
      dependentRoutes: [],
      ipAddresses: [],
      vlans: [],
    },
    onSubmit: fn(),
    onCancel: fn(),
    isSubmitting: false,
  },
};
