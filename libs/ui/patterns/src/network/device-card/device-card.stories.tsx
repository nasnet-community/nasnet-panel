/**
 * Device Card Stories
 *
 * Storybook stories for the DeviceCard pattern component.
 *
 * @module @nasnet/ui/patterns/network/device-card
 * @see NAS-4A.20: Build Device Discovery Card Component
 */

import type { Meta, StoryObj } from '@storybook/react';

import { DeviceCard } from './device-card';
import { DeviceCardDesktop } from './device-card-desktop';
import { DeviceCardMobile } from './device-card-mobile';
import { DeviceCardCompact } from './device-card-compact';
import { useDeviceCard } from './use-device-card';
import type { DiscoveredDevice, DeviceType } from './device-card.types';

/**
 * Create a mock device for stories
 */
function createMockDevice(overrides: Partial<DiscoveredDevice> = {}): DiscoveredDevice {
  return {
    id: 'device-1',
    mac: 'AA:BB:CC:DD:EE:FF',
    ip: '192.168.1.100',
    hostname: 'Gaming-PC',
    vendor: 'Dell Inc.',
    deviceType: 'computer',
    deviceTypeConfidence: 95,
    connectionType: 'wired',
    online: true,
    firstSeen: new Date('2024-01-01'),
    lastSeen: new Date(),
    customName: undefined,
    staticIp: undefined,
    signalStrength: undefined,
    ...overrides,
  };
}

const meta: Meta<typeof DeviceCard> = {
  title: 'Patterns/Network/DeviceCard',
  component: DeviceCard,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
# Device Card

Displays discovered network devices with type detection, online status, vendor lookup, and interactive actions.

## Features

- **Device type detection** - Infers device type from MAC vendor lookup
- **Online status** - Real-time status with green/gray indicators
- **Interactive actions** - Rename, assign static IP, configure routing, block
- **Platform responsive** - Mobile (bottom sheet) and desktop (dropdown menu)
- **Compact mode** - Minimal variant for sidebar/widget contexts
- **Real-time updates** - GraphQL subscription support
- **WCAG AAA accessible** - Keyboard nav, ARIA labels, 7:1 contrast

## Usage

\`\`\`tsx
import { DeviceCard } from '@nasnet/ui/patterns';

<DeviceCard
  device={discoveredDevice}
  onConfigure={(d) => openConfig(d)}
  onBlock={(d) => blockDevice(d)}
  onRename={(d, name) => renameDevice(d, name)}
/>
\`\`\`
        `,
      },
    },
  },
  argTypes: {
    device: {
      description: 'The discovered device to display',
      control: false,
    },
    compact: {
      description: 'Enable compact mode for sidebar/widget usage',
      control: 'boolean',
    },
    showActions: {
      description: 'Show action buttons',
      control: 'boolean',
    },
    isSelected: {
      description: 'Whether the card is selected/active',
      control: 'boolean',
    },
    onConfigure: { action: 'configure' },
    onBlock: { action: 'block' },
    onRename: { action: 'rename' },
    onAssignStaticIp: { action: 'assignStaticIp' },
    onClick: { action: 'click' },
  },
};

export default meta;
type Story = StoryObj<typeof DeviceCard>;

// ============================================================================
// Basic Stories
// ============================================================================

/**
 * Default device card showing an online computer
 */
export const Default: Story = {
  args: {
    device: createMockDevice(),
    showActions: true,
  },
};

/**
 * Online device with all information displayed
 */
export const OnlineDevice: Story = {
  args: {
    device: createMockDevice({
      online: true,
      deviceType: 'computer',
      hostname: 'Desktop-PC',
      vendor: 'Dell Inc.',
      ip: '192.168.1.100',
    }),
    showActions: true,
  },
};

/**
 * Offline device with gray status indicator
 */
export const OfflineDevice: Story = {
  args: {
    device: createMockDevice({
      online: false,
      deviceType: 'computer',
      hostname: 'Laptop-John',
      vendor: 'Apple Inc.',
      ip: '192.168.1.101',
    }),
    showActions: true,
  },
};

// ============================================================================
// Device Type Stories
// ============================================================================

/**
 * Phone device (smartphone icon)
 */
export const PhoneDevice: Story = {
  args: {
    device: createMockDevice({
      deviceType: 'phone',
      hostname: 'iPhone-Sarah',
      vendor: 'Apple Inc.',
      connectionType: 'wireless',
      signalStrength: -65,
    }),
  },
};

/**
 * Tablet device
 */
export const TabletDevice: Story = {
  args: {
    device: createMockDevice({
      deviceType: 'tablet',
      hostname: 'iPad-Kids',
      vendor: 'Apple Inc.',
      connectionType: 'wireless',
      signalStrength: -72,
    }),
  },
};

/**
 * IoT device (router, smart device)
 */
export const IoTDevice: Story = {
  args: {
    device: createMockDevice({
      deviceType: 'iot',
      hostname: 'Smart-Thermostat',
      vendor: 'TP-Link',
      connectionType: 'wireless',
    }),
  },
};

/**
 * Printer device
 */
export const PrinterDevice: Story = {
  args: {
    device: createMockDevice({
      deviceType: 'printer',
      hostname: 'Office-Printer',
      vendor: 'HP Inc.',
      connectionType: 'wired',
    }),
  },
};

/**
 * Gaming console
 */
export const GamingDevice: Story = {
  args: {
    device: createMockDevice({
      deviceType: 'gaming',
      hostname: 'Xbox-One',
      vendor: 'Microsoft',
      connectionType: 'wireless',
    }),
  },
};

/**
 * Unknown device type
 */
export const UnknownDevice: Story = {
  args: {
    device: createMockDevice({
      deviceType: 'unknown',
      hostname: undefined,
      vendor: undefined,
      deviceTypeConfidence: 30,
    }),
  },
};

// ============================================================================
// Connection Type Stories
// ============================================================================

/**
 * Wired connection (Ethernet)
 */
export const WiredConnection: Story = {
  args: {
    device: createMockDevice({
      connectionType: 'wired',
      hostname: 'Server-01',
    }),
  },
};

/**
 * Wireless connection (WiFi)
 */
export const WirelessConnection: Story = {
  args: {
    device: createMockDevice({
      connectionType: 'wireless',
      hostname: 'MacBook-Pro',
      signalStrength: -55,
    }),
  },
};

// ============================================================================
// Confidence Indicator Stories
// ============================================================================

/**
 * High confidence detection (>= 90%)
 * No confidence indicator shown
 */
export const HighConfidence: Story = {
  args: {
    device: createMockDevice({
      deviceTypeConfidence: 95,
      vendor: 'Apple Inc.',
    }),
  },
};

/**
 * Medium confidence detection (60-89%)
 * Shows amber confidence indicator
 */
export const MediumConfidence: Story = {
  args: {
    device: createMockDevice({
      deviceTypeConfidence: 75,
      vendor: 'Unknown Vendor',
    }),
  },
};

/**
 * Low confidence detection (< 60%)
 * Shows red confidence indicator
 */
export const LowConfidence: Story = {
  args: {
    device: createMockDevice({
      deviceType: 'unknown',
      deviceTypeConfidence: 35,
      vendor: undefined,
    }),
  },
};

// ============================================================================
// Mode Stories
// ============================================================================

/**
 * Compact mode for sidebar/widget usage
 */
export const CompactMode: Story = {
  args: {
    device: createMockDevice(),
    compact: true,
  },
};

/**
 * Card with no actions (view only)
 */
export const NoActions: Story = {
  args: {
    device: createMockDevice(),
    showActions: false,
  },
};

/**
 * Selected/active card state
 */
export const SelectedCard: Story = {
  args: {
    device: createMockDevice(),
    isSelected: true,
  },
};

// ============================================================================
// Custom Name Stories
// ============================================================================

/**
 * Device with custom user-assigned name
 */
export const WithCustomName: Story = {
  args: {
    device: createMockDevice({
      customName: "John's Gaming Rig",
      hostname: 'Desktop-PC',
    }),
  },
};

/**
 * Device without hostname (shows MAC address)
 */
export const WithoutHostname: Story = {
  args: {
    device: createMockDevice({
      hostname: undefined,
      customName: undefined,
    }),
  },
};

// ============================================================================
// Platform-Specific Stories
// ============================================================================

/**
 * Desktop presenter with hover actions and dropdown menu
 */
export const DesktopPresenter: Story = {
  render: (args) => {
    const state = useDeviceCard({
      device: args.device,
      onConfigure: args.onConfigure,
      onBlock: args.onBlock,
      onRename: args.onRename,
      onAssignStaticIp: args.onAssignStaticIp,
    });

    return (
      <DeviceCardDesktop
        state={state}
        device={args.device}
        showActions={args.showActions}
        isSelected={args.isSelected}
        onClick={args.onClick ? () => args.onClick?.(args.device) : undefined}
      />
    );
  },
  args: {
    device: createMockDevice(),
    showActions: true,
  },
  parameters: {
    viewport: { defaultViewport: 'desktop' },
    docs: {
      description: {
        story: 'Desktop presenter with hover-reveal actions and dropdown menu.',
      },
    },
  },
};

/**
 * Mobile presenter with tap-to-open bottom sheet
 */
export const MobilePresenter: Story = {
  render: (args) => {
    const state = useDeviceCard({
      device: args.device,
      onConfigure: args.onConfigure,
      onBlock: args.onBlock,
      onRename: args.onRename,
      onAssignStaticIp: args.onAssignStaticIp,
    });

    return (
      <DeviceCardMobile
        state={state}
        device={args.device}
        showActions={args.showActions}
        isSelected={args.isSelected}
        onClick={args.onClick ? () => args.onClick?.(args.device) : undefined}
      />
    );
  },
  args: {
    device: createMockDevice(),
    showActions: true,
  },
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
    docs: {
      description: {
        story: 'Mobile presenter with tap-to-open bottom sheet for details and actions.',
      },
    },
  },
};

/**
 * Compact presenter for sidebar usage
 */
export const CompactPresenter: Story = {
  render: (args) => {
    const state = useDeviceCard({
      device: args.device,
      onConfigure: args.onConfigure,
      onBlock: args.onBlock,
      onRename: args.onRename,
    });

    return (
      <DeviceCardCompact
        state={state}
        device={args.device}
        isSelected={args.isSelected}
        onClick={args.onClick ? () => args.onClick?.(args.device) : undefined}
      />
    );
  },
  args: {
    device: createMockDevice(),
  },
  parameters: {
    docs: {
      description: {
        story: 'Compact presenter showing only icon, name, and status dot.',
      },
    },
  },
};

// ============================================================================
// Theme Stories
// ============================================================================

/**
 * Device card in dark theme
 */
export const DarkTheme: Story = {
  args: {
    device: createMockDevice(),
    showActions: true,
  },
  parameters: {
    backgrounds: { default: 'dark' },
    themes: { default: 'dark' },
  },
};

// ============================================================================
// List/Grid Stories
// ============================================================================

/**
 * Multiple device cards in a list
 */
export const DeviceList: Story = {
  render: () => {
    const devices: DiscoveredDevice[] = [
      createMockDevice({
        id: '1',
        hostname: 'Gaming-PC',
        deviceType: 'computer',
        online: true,
        connectionType: 'wired',
      }),
      createMockDevice({
        id: '2',
        hostname: 'iPhone-Sarah',
        deviceType: 'phone',
        online: true,
        connectionType: 'wireless',
        vendor: 'Apple Inc.',
        signalStrength: -65,
      }),
      createMockDevice({
        id: '3',
        hostname: 'Smart-TV',
        deviceType: 'iot',
        online: false,
        connectionType: 'wireless',
        vendor: 'Samsung',
      }),
      createMockDevice({
        id: '4',
        mac: 'FF:EE:DD:CC:BB:AA',
        hostname: undefined,
        deviceType: 'unknown',
        online: true,
        deviceTypeConfidence: 40,
      }),
    ];

    return (
      <div className="space-y-4">
        {devices.map((device) => (
          <DeviceCard
            key={device.id}
            device={device}
            showActions
          />
        ))}
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Multiple device cards displayed as a list.',
      },
    },
  },
};

/**
 * Compact device cards in sidebar
 */
export const CompactList: Story = {
  render: () => {
    const devices: DiscoveredDevice[] = [
      createMockDevice({ id: '1', hostname: 'PC-1', online: true }),
      createMockDevice({ id: '2', hostname: 'Phone-1', online: true, deviceType: 'phone' }),
      createMockDevice({ id: '3', hostname: 'Tablet-1', online: false, deviceType: 'tablet' }),
      createMockDevice({ id: '4', hostname: 'IoT-1', online: true, deviceType: 'iot' }),
    ];

    return (
      <div className="w-64 space-y-2 p-4 bg-muted/30 rounded-lg">
        <h3 className="text-sm font-medium text-muted-foreground mb-3">
          Active Devices
        </h3>
        {devices.map((device) => (
          <DeviceCard
            key={device.id}
            device={device}
            compact
          />
        ))}
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Compact cards in a sidebar widget context.',
      },
    },
  },
};
