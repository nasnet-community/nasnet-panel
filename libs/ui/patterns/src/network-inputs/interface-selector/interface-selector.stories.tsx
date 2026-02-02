/**
 * InterfaceSelector Storybook Stories
 *
 * Comprehensive stories demonstrating all features and states
 * of the InterfaceSelector component.
 *
 * @module @nasnet/ui/patterns/network-inputs/interface-selector
 */

import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';

import { InterfaceSelector } from './interface-selector';
import { InterfaceSelectorDesktop } from './interface-selector-desktop';
import { InterfaceSelectorMobile } from './interface-selector-mobile';
import type { InterfaceSelectorProps, RouterInterface } from './interface-selector.types';

/**
 * Mock interface data for stories.
 */
const MOCK_INTERFACES: RouterInterface[] = [
  { id: 'eth1', name: 'ether1', type: 'ethernet', status: 'up', ip: '192.168.1.1', usedBy: [] },
  { id: 'eth2', name: 'ether2', type: 'ethernet', status: 'up', ip: '192.168.2.1', usedBy: [] },
  { id: 'eth3', name: 'ether3', type: 'ethernet', status: 'down', usedBy: [] },
  { id: 'eth4', name: 'ether4', type: 'ethernet', status: 'disabled', usedBy: [] },
  { id: 'eth5', name: 'ether5', type: 'ethernet', status: 'up', usedBy: ['bridge-lan'] },
  { id: 'br1', name: 'bridge-lan', type: 'bridge', status: 'up', ip: '10.0.0.1', usedBy: ['DHCP Server'] },
  { id: 'wlan1', name: 'wlan1', type: 'wireless', status: 'up', ip: '192.168.88.1', usedBy: [] },
  { id: 'wlan2', name: 'wlan2', type: 'wireless', status: 'down', usedBy: [] },
  { id: 'vlan10', name: 'vlan10', type: 'vlan', status: 'up', ip: '10.10.0.1', usedBy: [] },
  { id: 'vlan20', name: 'vlan20', type: 'vlan', status: 'up', ip: '10.20.0.1', usedBy: [] },
  { id: 'ovpn1', name: 'ovpn-out1', type: 'vpn', status: 'down', usedBy: [] },
  { id: 'wg0', name: 'wg0', type: 'vpn', status: 'up', ip: '10.100.0.1', usedBy: [] },
  { id: 'l2tp1', name: 'l2tp-out1', type: 'vpn', status: 'disabled', usedBy: [] },
  { id: 'gre1', name: 'gre-tunnel1', type: 'tunnel', status: 'up', usedBy: [] },
  { id: 'lo', name: 'lo', type: 'loopback', status: 'up', ip: '127.0.0.1', usedBy: [] },
];

const meta: Meta<typeof InterfaceSelector> = {
  title: 'Patterns/Network Inputs/InterfaceSelector',
  component: InterfaceSelector,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
A specialized selector for router network interfaces with real-time status,
type filtering, usage warnings, and platform-responsive design.

## Features
- Real-time status indicators (up/down/disabled)
- Type filtering (Ethernet, Bridge, VLAN, Wireless, VPN, etc.)
- Usage warnings for already-assigned interfaces
- Multi-select mode with chips
- Search/quick filter functionality
- Platform-responsive (mobile bottom sheet, desktop popover)
- Full keyboard navigation
- WCAG AAA accessibility compliance

## Usage
\`\`\`tsx
import { InterfaceSelector } from '@nasnet/ui/patterns';

<InterfaceSelector
  routerId="router-1"
  value={selectedInterface}
  onChange={setSelectedInterface}
/>
\`\`\`
        `,
      },
    },
  },
  argTypes: {
    routerId: {
      control: 'text',
      description: 'Router ID to fetch interfaces for',
    },
    value: {
      control: 'text',
      description: 'Selected interface ID(s)',
    },
    multiple: {
      control: 'boolean',
      description: 'Enable multi-select mode',
    },
    types: {
      control: 'object',
      description: 'Restrict to specific interface types',
    },
    showStatus: {
      control: 'boolean',
      description: 'Show status indicator',
    },
    showIP: {
      control: 'boolean',
      description: 'Show IP address',
    },
    excludeUsed: {
      control: 'boolean',
      description: 'Hide interfaces already in use',
    },
    disabled: {
      control: 'boolean',
      description: 'Disable the selector',
    },
    error: {
      control: 'text',
      description: 'External error message',
    },
    placeholder: {
      control: 'text',
      description: 'Placeholder text',
    },
    label: {
      control: 'text',
      description: 'Label for the selector',
    },
  },
};

export default meta;
type Story = StoryObj<typeof InterfaceSelector>;

/**
 * Interactive wrapper for controlled stories.
 */
function ControlledInterfaceSelector(props: InterfaceSelectorProps) {
  const [value, setValue] = useState<string | string[]>(props.value || (props.multiple ? [] : ''));

  return (
    <div className="w-[320px]">
      <InterfaceSelector
        {...props}
        value={value}
        onChange={setValue}
      />
      <div className="mt-4 p-3 rounded-md bg-muted text-xs font-mono">
        Value: {JSON.stringify(value)}
      </div>
    </div>
  );
}

/**
 * Default single-select mode with all interface types.
 */
export const Default: Story = {
  render: (args) => <ControlledInterfaceSelector {...args} />,
  args: {
    routerId: 'test-router',
    label: 'Interface',
    placeholder: 'Select interface...',
  },
};

/**
 * Multi-select mode allowing multiple interface selection.
 */
export const MultiSelect: Story = {
  render: (args) => <ControlledInterfaceSelector {...args} />,
  args: {
    routerId: 'test-router',
    label: 'Interfaces',
    placeholder: 'Select interfaces...',
    multiple: true,
  },
};

/**
 * Filtered to show only Ethernet and Bridge interfaces.
 */
export const WithTypeFilter: Story = {
  render: (args) => <ControlledInterfaceSelector {...args} />,
  args: {
    routerId: 'test-router',
    label: 'Physical Interface',
    placeholder: 'Select physical interface...',
    types: ['ethernet', 'bridge'],
  },
};

/**
 * Pre-selected value demonstration.
 */
export const WithPreselectedValue: Story = {
  render: (args) => <ControlledInterfaceSelector {...args} />,
  args: {
    routerId: 'test-router',
    label: 'Interface',
    value: 'eth1',
  },
};

/**
 * Multi-select with pre-selected values.
 */
export const WithPreselectedMultiple: Story = {
  render: (args) => <ControlledInterfaceSelector {...args} />,
  args: {
    routerId: 'test-router',
    label: 'Interfaces',
    multiple: true,
    value: ['eth1', 'wlan1', 'br1'],
  },
};

/**
 * Demonstrates usage warnings on interfaces that are already in use.
 */
export const WithUsageWarnings: Story = {
  render: (args) => <ControlledInterfaceSelector {...args} />,
  args: {
    routerId: 'test-router',
    label: 'Interface',
    placeholder: 'Select interface...',
  },
  parameters: {
    docs: {
      description: {
        story: 'Interfaces like "ether5" and "bridge-lan" show usage warnings with tooltips.',
      },
    },
  },
};

/**
 * Hide interfaces that are already in use.
 */
export const ExcludeUsedInterfaces: Story = {
  render: (args) => <ControlledInterfaceSelector {...args} />,
  args: {
    routerId: 'test-router',
    label: 'Available Interface',
    placeholder: 'Select available interface...',
    excludeUsed: true,
  },
};

/**
 * Desktop presenter with dropdown popover.
 */
export const DesktopPresenter: Story = {
  render: (args) => (
    <div className="w-[320px]">
      <InterfaceSelectorDesktop {...args} />
    </div>
  ),
  args: {
    routerId: 'test-router',
    label: 'Interface (Desktop)',
    placeholder: 'Select interface...',
  },
};

/**
 * Mobile presenter with bottom sheet.
 * Best viewed in mobile viewport.
 */
export const MobilePresenter: Story = {
  render: (args) => (
    <div className="w-full max-w-[375px]">
      <InterfaceSelectorMobile {...args} />
    </div>
  ),
  args: {
    routerId: 'test-router',
    label: 'Interface (Mobile)',
    placeholder: 'Select interface...',
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};

/**
 * Loading state with skeleton placeholders.
 */
export const LoadingState: Story = {
  render: (args) => (
    <div className="w-[320px]">
      <InterfaceSelectorDesktop
        {...args}
        hookOverride={{
          isLoading: true,
          interfaces: [],
          filteredInterfaces: [],
          selectedValues: [],
          error: null,
          searchQuery: '',
          typeFilter: 'all',
          isOpen: true,
          setSearchQuery: () => {},
          setTypeFilter: () => {},
          setIsOpen: () => {},
          toggleSelection: () => {},
          clearSelection: () => {},
          getInterfaceById: () => undefined,
          getDisplayValue: () => '',
          retry: () => {},
        }}
      />
    </div>
  ),
  args: {
    routerId: 'test-router',
    label: 'Interface',
  },
};

/**
 * Error state with retry button.
 */
export const ErrorState: Story = {
  render: (args) => (
    <div className="w-[320px]">
      <InterfaceSelectorDesktop
        {...args}
        hookOverride={{
          isLoading: false,
          interfaces: [],
          filteredInterfaces: [],
          selectedValues: [],
          error: new Error('Network error: Unable to connect to router'),
          searchQuery: '',
          typeFilter: 'all',
          isOpen: true,
          setSearchQuery: () => {},
          setTypeFilter: () => {},
          setIsOpen: () => {},
          toggleSelection: () => {},
          clearSelection: () => {},
          getInterfaceById: () => undefined,
          getDisplayValue: () => '',
          retry: () => alert('Retrying...'),
        }}
      />
    </div>
  ),
  args: {
    routerId: 'test-router',
    label: 'Interface',
  },
};

/**
 * Empty state when no interfaces are available.
 */
export const EmptyState: Story = {
  render: (args) => (
    <div className="w-[320px]">
      <InterfaceSelectorDesktop
        {...args}
        hookOverride={{
          isLoading: false,
          interfaces: [],
          filteredInterfaces: [],
          selectedValues: [],
          error: null,
          searchQuery: '',
          typeFilter: 'all',
          isOpen: true,
          setSearchQuery: () => {},
          setTypeFilter: () => {},
          setIsOpen: () => {},
          toggleSelection: () => {},
          clearSelection: () => {},
          getInterfaceById: () => undefined,
          getDisplayValue: () => '',
          retry: () => {},
        }}
      />
    </div>
  ),
  args: {
    routerId: 'test-router',
    label: 'Interface',
  },
};

/**
 * Disabled state.
 */
export const Disabled: Story = {
  render: (args) => <ControlledInterfaceSelector {...args} />,
  args: {
    routerId: 'test-router',
    label: 'Interface',
    placeholder: 'Select interface...',
    disabled: true,
  },
};

/**
 * With external error message.
 */
export const WithError: Story = {
  render: (args) => <ControlledInterfaceSelector {...args} />,
  args: {
    routerId: 'test-router',
    label: 'Interface',
    placeholder: 'Select interface...',
    error: 'Interface is required',
  },
};

/**
 * Accessibility demonstration with proper ARIA attributes.
 */
export const Accessibility: Story = {
  render: (args) => (
    <div className="w-[320px] space-y-4">
      <p className="text-sm text-muted-foreground">
        This story demonstrates accessibility features:
      </p>
      <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
        <li>role="combobox" on trigger button</li>
        <li>aria-expanded for dropdown state</li>
        <li>role="listbox" and role="option" for list</li>
        <li>aria-selected for selected items</li>
        <li>Keyboard navigation (Arrow, Enter, Escape)</li>
        <li>Focus indicators (3px ring)</li>
        <li>44px touch targets on mobile</li>
      </ul>
      <ControlledInterfaceSelector {...args} />
    </div>
  ),
  args: {
    routerId: 'test-router',
    label: 'Interface',
    placeholder: 'Select interface...',
    id: 'interface-selector',
    'aria-describedby': 'interface-help',
  },
  parameters: {
    a11y: {
      // Enable a11y addon checks
      element: '#storybook-root',
      config: {
        rules: [
          {
            // Disable color contrast check for demo badges
            id: 'color-contrast',
            enabled: true,
          },
        ],
      },
    },
  },
};

/**
 * VPN interfaces only.
 */
export const VPNInterfacesOnly: Story = {
  render: (args) => <ControlledInterfaceSelector {...args} />,
  args: {
    routerId: 'test-router',
    label: 'VPN Interface',
    placeholder: 'Select VPN interface...',
    types: ['vpn'],
  },
};

/**
 * Wireless interfaces only.
 */
export const WirelessInterfacesOnly: Story = {
  render: (args) => <ControlledInterfaceSelector {...args} />,
  args: {
    routerId: 'test-router',
    label: 'Wireless Interface',
    placeholder: 'Select wireless interface...',
    types: ['wireless'],
  },
};
