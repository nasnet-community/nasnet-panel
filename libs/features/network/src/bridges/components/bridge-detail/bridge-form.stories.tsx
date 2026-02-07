import type { Meta, StoryObj } from '@storybook/react';
import { BridgeForm } from './bridge-form';
import { action } from '@storybook/addon-actions';

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
    onSubmit: action('onSubmit'),
    onCancel: action('onCancel'),
    isSubmitting: false,
  },
};

export const CreateModeSubmitting: Story = {
  args: {
    bridge: null,
    onSubmit: action('onSubmit'),
    onCancel: action('onCancel'),
    isSubmitting: true,
  },
};

export const EditMode: Story = {
  args: {
    bridge: {
      uuid: 'bridge-1',
      name: 'bridge1',
      comment: 'Main LAN bridge',
      disabled: false,
      running: true,
      macAddress: '00:11:22:33:44:55',
      mtu: 1500,
      protocol: 'rstp',
      priority: 32768,
      vlanFiltering: false,
      pvid: 1,
      ports: [
        { uuid: 'p1', interfaceName: 'ether2' },
        { uuid: 'p2', interfaceName: 'ether3' },
      ],
    },
    onSubmit: action('onSubmit'),
    onCancel: action('onCancel'),
    isSubmitting: false,
  },
};

export const EditModeWithVlanFiltering: Story = {
  args: {
    bridge: {
      uuid: 'bridge-2',
      name: 'bridge-guest',
      comment: 'Guest network with VLAN filtering',
      disabled: false,
      running: true,
      macAddress: 'AA:BB:CC:DD:EE:FF',
      mtu: 1500,
      protocol: 'rstp',
      priority: 32768,
      vlanFiltering: true,
      pvid: 100,
      ports: [
        { uuid: 'p3', interfaceName: 'wlan1' },
      ],
    },
    onSubmit: action('onSubmit'),
    onCancel: action('onCancel'),
    isSubmitting: false,
  },
};

export const EditModeNoSTP: Story = {
  args: {
    bridge: {
      uuid: 'bridge-3',
      name: 'bridge-iot',
      comment: 'IoT devices - no STP',
      disabled: false,
      running: true,
      macAddress: '11:22:33:44:55:66',
      mtu: 1500,
      protocol: 'none',
      priority: 32768,
      vlanFiltering: false,
      pvid: 1,
      ports: [],
    },
    onSubmit: action('onSubmit'),
    onCancel: action('onCancel'),
    isSubmitting: false,
  },
};

export const EditModeMSTP: Story = {
  args: {
    bridge: {
      uuid: 'bridge-4',
      name: 'bridge-mstp',
      comment: 'Bridge with MSTP protocol',
      disabled: false,
      running: true,
      macAddress: 'FF:EE:DD:CC:BB:AA',
      mtu: 1500,
      protocol: 'mstp',
      priority: 16384,
      vlanFiltering: true,
      pvid: 10,
      ports: [],
    },
    onSubmit: action('onSubmit'),
    onCancel: action('onCancel'),
    isSubmitting: false,
  },
};

export const EditModeSubmitting: Story = {
  args: {
    bridge: {
      uuid: 'bridge-1',
      name: 'bridge1',
      comment: 'Main LAN bridge',
      disabled: false,
      running: true,
      macAddress: '00:11:22:33:44:55',
      mtu: 1500,
      protocol: 'rstp',
      priority: 32768,
      vlanFiltering: false,
      pvid: 1,
      ports: [],
    },
    onSubmit: action('onSubmit'),
    onCancel: action('onCancel'),
    isSubmitting: true,
  },
};

export const CustomMTU: Story = {
  args: {
    bridge: {
      uuid: 'bridge-5',
      name: 'bridge-jumbo',
      comment: 'Bridge with jumbo frames',
      disabled: false,
      running: true,
      macAddress: '00:AA:BB:CC:DD:EE',
      mtu: 9000,
      protocol: 'rstp',
      priority: 32768,
      vlanFiltering: false,
      pvid: 1,
      ports: [],
    },
    onSubmit: action('onSubmit'),
    onCancel: action('onCancel'),
    isSubmitting: false,
  },
};

export const HighPriority: Story = {
  args: {
    bridge: {
      uuid: 'bridge-6',
      name: 'bridge-root',
      comment: 'Root bridge candidate (low priority)',
      disabled: false,
      running: true,
      macAddress: '00:11:22:33:44:55',
      mtu: 1500,
      protocol: 'rstp',
      priority: 4096, // Low priority = more likely to be root
      vlanFiltering: false,
      pvid: 1,
      ports: [],
    },
    onSubmit: action('onSubmit'),
    onCancel: action('onCancel'),
    isSubmitting: false,
  },
};
