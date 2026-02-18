/**
 * Kill Switch Toggle Storybook Stories
 *
 * Demonstrates all states and variants of the Kill Switch Toggle component.
 */

import { KillSwitchToggle, KillSwitchToggleDesktop, KillSwitchToggleMobile } from './index';

import type { VirtualInterfaceOption } from './types';
import type { Meta, StoryObj } from '@storybook/react';

// Mock available interfaces
const mockInterfaces: VirtualInterfaceOption[] = [
  { id: 'vif-tor-backup', label: 'Tor Backup', instanceName: 'Tor Backup Node' },
  { id: 'vif-xray', label: 'Xray Proxy', instanceName: 'Xray VLESS' },
  { id: 'vif-sing', label: 'sing-box', instanceName: 'sing-box Reality' },
];

const meta: Meta<typeof KillSwitchToggle> = {
  title: 'Patterns/Kill Switch Toggle',
  component: KillSwitchToggle,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Adaptive kill switch toggle component with platform-specific presenters. Automatically blocks traffic when service becomes unhealthy.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    routerId: {
      control: 'text',
      description: 'Router ID',
    },
    deviceId: {
      control: 'text',
      description: 'Device ID whose routing has kill switch',
    },
    deviceName: {
      control: 'text',
      description: 'Device name for display',
    },
    availableInterfaces: {
      control: 'object',
      description: 'Available virtual interfaces for fallback',
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the component is disabled',
    },
  },
};

export default meta;
type Story = StoryObj<typeof KillSwitchToggle>;

// Adaptive (auto-detects platform)
export const Default: Story = {
  args: {
    routerId: 'router-1',
    deviceId: 'device-123',
    deviceName: 'iPhone 15 Pro',
    availableInterfaces: mockInterfaces,
  },
};

export const WithoutDeviceName: Story = {
  args: {
    routerId: 'router-1',
    deviceId: 'device-123',
    availableInterfaces: mockInterfaces,
  },
};

export const NoFallbackInterfaces: Story = {
  args: {
    routerId: 'router-1',
    deviceId: 'device-123',
    deviceName: 'MacBook Pro',
    availableInterfaces: [],
  },
};

export const Disabled: Story = {
  args: {
    routerId: 'router-1',
    deviceId: 'device-123',
    deviceName: 'iPad Air',
    availableInterfaces: mockInterfaces,
    disabled: true,
  },
};

// Desktop variants
export const DesktopEnabled: Story = {
  render: (args) => <KillSwitchToggleDesktop {...args} />,
  args: {
    routerId: 'router-1',
    deviceId: 'device-123',
    deviceName: 'iPhone 15 Pro',
    availableInterfaces: mockInterfaces,
  },
  parameters: {
    viewport: {
      defaultViewport: 'desktop',
    },
  },
};

export const DesktopDisabled: Story = {
  render: (args) => <KillSwitchToggleDesktop {...args} />,
  args: {
    routerId: 'router-1',
    deviceId: 'device-123',
    deviceName: 'iPhone 15 Pro',
    availableInterfaces: mockInterfaces,
    disabled: true,
  },
  parameters: {
    viewport: {
      defaultViewport: 'desktop',
    },
  },
};

// Mobile variants
export const MobileEnabled: Story = {
  render: (args) => <KillSwitchToggleMobile {...args} />,
  args: {
    routerId: 'router-1',
    deviceId: 'device-123',
    deviceName: 'iPhone 15 Pro',
    availableInterfaces: mockInterfaces,
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};

export const MobileDisabled: Story = {
  render: (args) => <KillSwitchToggleMobile {...args} />,
  args: {
    routerId: 'router-1',
    deviceId: 'device-123',
    deviceName: 'iPhone 15 Pro',
    availableInterfaces: mockInterfaces,
    disabled: true,
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};

export const MobileNoFallback: Story = {
  render: (args) => <KillSwitchToggleMobile {...args} />,
  args: {
    routerId: 'router-1',
    deviceId: 'device-123',
    deviceName: 'iPhone 15 Pro',
    availableInterfaces: [],
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};

// Playground for interactive testing
export const Playground: Story = {
  args: {
    routerId: 'router-1',
    deviceId: 'device-123',
    deviceName: 'iPhone 15 Pro',
    availableInterfaces: mockInterfaces,
  },
  parameters: {
    docs: {
      description: {
        story: 'Interactive playground to test all component features',
      },
    },
  },
};
