/**
 * InterfaceSelectorDesktop Storybook Stories
 *
 * Desktop-specific stories for the InterfaceSelectorDesktop presenter.
 * Focuses on desktop-exclusive features: popover layout, keyboard shortcuts,
 * chip rendering for multi-select, and hookOverride-driven state control.
 *
 * The shared InterfaceSelector stories (interface-selector.stories.tsx) cover
 * the auto-detecting wrapper. These stories are scoped to the desktop presenter
 * and its unique visual states.
 *
 * @module @nasnet/ui/patterns/network-inputs/interface-selector
 */

import { useState } from 'react';

import { InterfaceSelectorDesktop } from './interface-selector-desktop';

import type { InterfaceSelectorDesktopProps, RouterInterface } from './interface-selector.types';
import type { Meta, StoryObj } from '@storybook/react';

// ============================================================================
// Mock data
// ============================================================================

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
  { id: 'wg0', name: 'wg0', type: 'vpn', status: 'up', ip: '10.100.0.1', usedBy: [] },
  { id: 'gre1', name: 'gre-tunnel1', type: 'tunnel', status: 'up', usedBy: [] },
];

/** A hookOverride that populates the selector with real-looking interface data. */
function makeLoadedOverride(
  selected: string[],
  setSelected: (ids: string[]) => void,
  multiple = false
): InterfaceSelectorDesktopProps['hookOverride'] {
  return {
    isLoading: false,
    interfaces: MOCK_INTERFACES,
    filteredInterfaces: MOCK_INTERFACES,
    selectedValues: selected,
    error: null,
    searchQuery: '',
    typeFilter: 'all',
    isOpen: false,
    setSearchQuery: () => {},
    setTypeFilter: () => {},
    setIsOpen: () => {},
    toggleSelection: (id: string) => {
      if (multiple) {
        setSelected(
          selected.includes(id) ? selected.filter((v) => v !== id) : [...selected, id]
        );
      } else {
        setSelected(selected.includes(id) ? [] : [id]);
      }
    },
    clearSelection: () => setSelected([]),
    getInterfaceById: (id: string) => MOCK_INTERFACES.find((i) => i.id === id),
    getDisplayValue: () =>
      selected.length === 0
        ? ''
        : selected.length === 1
        ? (MOCK_INTERFACES.find((i) => i.id === selected[0])?.name ?? selected[0])
        : `${selected.length} interfaces selected`,
    retry: () => {},
  };
}

// ============================================================================
// Controlled wrapper
// ============================================================================

function ControlledDesktopSelector(
  props: Omit<InterfaceSelectorDesktopProps, 'hookOverride' | 'routerId'> & {
    initialValue?: string[];
    multiple?: boolean;
  }
) {
  const { initialValue = [], multiple = false, ...rest } = props;
  const [selected, setSelected] = useState<string[]>(initialValue);

  return (
    <div className="w-[360px] space-y-4">
      <InterfaceSelectorDesktop
        {...rest}
        routerId="router-demo"
        multiple={multiple}
        value={multiple ? selected : (selected[0] ?? '')}
        onChange={(v) => setSelected(Array.isArray(v) ? v : v ? [v] : [])}
        hookOverride={makeLoadedOverride(selected, setSelected, multiple)}
      />
      <div className="p-3 rounded-md bg-muted text-xs font-mono text-muted-foreground">
        selected: {JSON.stringify(selected)}
      </div>
    </div>
  );
}

// ============================================================================
// Meta
// ============================================================================

const meta: Meta<typeof InterfaceSelectorDesktop> = {
  title: 'Patterns/Network Inputs/InterfaceSelectorDesktop',
  component: InterfaceSelectorDesktop,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
Desktop presenter for the Interface Selector headless component (ADR-018).

Renders as a **popover dropdown** with:
- Search input with clear button
- Type filter dropdown
- Scrollable interface list with type icons, status indicators, and usage badges
- Multi-select chip rail beneath the trigger
- Footer showing result and selection count
- Keyboard navigation: **ArrowUp/Down** to navigate, **Enter** to select, **Escape** to close

## When to use
Use \`InterfaceSelectorDesktop\` directly when you need to:
1. Override hook state for testing (via \`hookOverride\`)
2. Guarantee the popover layout regardless of viewport width
3. Embed in a context that has already detected the platform

For automatic platform detection, use the \`InterfaceSelector\` wrapper instead.

## hookOverride API
The \`hookOverride\` prop accepts a \`Partial<UseInterfaceSelectorReturn>\` object.
Any provided keys override the corresponding values from \`useInterfaceSelector\`,
enabling fully isolated Storybook stories without a live Apollo subscription.
      `,
      },
    },
  },
  argTypes: {
    label: { control: 'text' },
    placeholder: { control: 'text' },
    disabled: { control: 'boolean' },
    error: { control: 'text' },
    multiple: { control: 'boolean' },
    showStatus: { control: 'boolean' },
    showIP: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof InterfaceSelectorDesktop>;

// ============================================================================
// Stories
// ============================================================================

/**
 * Single-select mode — selecting an interface updates the trigger label.
 */
export const SingleSelect: Story = {
  name: 'Single Select',
  render: () => (
    <ControlledDesktopSelector
      label="Interface"
      placeholder="Select interface..."
    />
  ),
};

/**
 * Multi-select mode — selected interfaces appear as removable chips below the trigger.
 */
export const MultiSelect: Story = {
  name: 'Multi Select With Chips',
  render: () => (
    <ControlledDesktopSelector
      label="Interfaces"
      placeholder="Select interfaces..."
      multiple
    />
  ),
  parameters: {
    docs: {
      description: {
        story:
          'In multi-select mode, each selected interface renders as a chip with a remove button. ' +
          'The popover stays open after each selection to allow multiple choices.',
      },
    },
  },
};

/**
 * Pre-selected value — the trigger shows the selected interface name on mount.
 */
export const WithPreselectedValue: Story = {
  name: 'Pre-selected Value',
  render: () => (
    <ControlledDesktopSelector
      label="WAN Interface"
      placeholder="Select interface..."
      initialValue={['eth1']}
    />
  ),
};

/**
 * Multi-select with several interfaces pre-selected — chip rail is visible immediately.
 */
export const WithPreselectedMultiple: Story = {
  name: 'Pre-selected Multiple',
  render: () => (
    <ControlledDesktopSelector
      label="Interfaces"
      placeholder="Select interfaces..."
      multiple
      initialValue={['eth1', 'wlan1', 'br1']}
    />
  ),
};

/**
 * Popover open — Loading state with skeleton placeholders inside the dropdown.
 */
export const PopoverLoadingState: Story = {
  name: 'Popover — Loading State',
  render: (args) => (
    <div className="w-[360px]">
      <InterfaceSelectorDesktop
        {...args}
        routerId="router-demo"
        label="Interface"
        placeholder="Select interface..."
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
  parameters: {
    docs: {
      description: {
        story:
          'When `isLoading` is true the dropdown renders 4 skeleton rows inside the ' +
          'scrollable list area while the Apollo subscription resolves.',
      },
    },
  },
};

/**
 * Popover open — Error state with retry button.
 */
export const PopoverErrorState: Story = {
  name: 'Popover — Error State',
  render: (args) => (
    <div className="w-[360px]">
      <InterfaceSelectorDesktop
        {...args}
        routerId="router-demo"
        label="Interface"
        placeholder="Select interface..."
        hookOverride={{
          isLoading: false,
          interfaces: [],
          filteredInterfaces: [],
          selectedValues: [],
          error: new Error('Unable to connect to router — check network'),
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
          retry: () => alert('Retrying subscription…'),
        }}
      />
    </div>
  ),
};

/**
 * Popover open — Empty results when no interfaces match the current filter.
 */
export const PopoverEmptyState: Story = {
  name: 'Popover — Empty State',
  render: (args) => (
    <div className="w-[360px]">
      <InterfaceSelectorDesktop
        {...args}
        routerId="router-demo"
        label="Interface"
        placeholder="Select interface..."
        hookOverride={{
          isLoading: false,
          interfaces: [],
          filteredInterfaces: [],
          selectedValues: [],
          error: null,
          searchQuery: 'vxlan',
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
  parameters: {
    docs: {
      description: {
        story:
          'When searchQuery is set but no interfaces match, the empty state shows ' +
          '"No interfaces match your search" copy.',
      },
    },
  },
};

/**
 * Disabled state — trigger is grayed out and non-interactive.
 */
export const DisabledState: Story = {
  name: 'Disabled',
  render: () => (
    <div className="w-[360px]">
      <InterfaceSelectorDesktop
        routerId="router-demo"
        label="Interface"
        placeholder="Select interface..."
        disabled
        hookOverride={{
          isLoading: false,
          interfaces: MOCK_INTERFACES,
          filteredInterfaces: MOCK_INTERFACES,
          selectedValues: [],
          error: null,
          searchQuery: '',
          typeFilter: 'all',
          isOpen: false,
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
};

/**
 * External validation error — red border on trigger, error message below.
 */
export const WithExternalError: Story = {
  name: 'External Validation Error',
  render: () => (
    <div className="w-[360px]">
      <InterfaceSelectorDesktop
        routerId="router-demo"
        label="WAN Interface"
        placeholder="Select interface..."
        error="Interface selection is required"
        hookOverride={{
          isLoading: false,
          interfaces: MOCK_INTERFACES,
          filteredInterfaces: MOCK_INTERFACES,
          selectedValues: [],
          error: null,
          searchQuery: '',
          typeFilter: 'all',
          isOpen: false,
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
  parameters: {
    docs: {
      description: {
        story:
          'When an external error prop is supplied the trigger button gets a destructive border ' +
          '(aria-invalid=true) and an error message is shown below. Use this for React Hook Form ' +
          'field-level error integration.',
      },
    },
  },
};

/**
 * Type-restricted mode — type filter hidden because types prop limits to ethernet only.
 */
export const TypeRestricted: Story = {
  name: 'Type Restricted (Ethernet Only)',
  render: () => (
    <ControlledDesktopSelector
      label="Physical Interface"
      placeholder="Select ethernet interface..."
      types={['ethernet']}
    />
  ),
  parameters: {
    docs: {
      description: {
        story:
          'When `types` prop is non-empty, the type filter dropdown inside the popover ' +
          'is hidden (`showTypeFilter = types.length === 0`). Only matching interfaces are shown.',
      },
    },
  },
};
