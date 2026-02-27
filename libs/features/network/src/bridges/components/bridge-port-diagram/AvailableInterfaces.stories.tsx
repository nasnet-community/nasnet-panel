import { DndContext } from '@dnd-kit/core';

import type { Interface } from '@nasnet/api-client/generated';

import { AvailableInterfaces } from './AvailableInterfaces';

import type { Meta, StoryObj, Decorator } from '@storybook/react';

// ---------------------------------------------------------------------------
// DnD context decorator
// AvailableInterfaces renders DraggableInterface children which call
// useDraggable(), requiring a DndContext ancestor.
// ---------------------------------------------------------------------------

const withDndContext: Decorator = (Story) => (
  <DndContext>
    <Story />
  </DndContext>
);

// ---------------------------------------------------------------------------
// Mock interface helpers
// ---------------------------------------------------------------------------

const makeInterface = (
  overrides: Partial<Interface> & { name: string; type: Interface['type'] }
): Interface =>
  ({
    id: `iface-${overrides.name}`,
    enabled: true,
    running: true,
    status: 'UP',
    macAddress: undefined,
    ...overrides,
  }) as Interface;

// ---------------------------------------------------------------------------
// Interface fixtures
// ---------------------------------------------------------------------------

const ethernetInterfaces: Interface[] = [
  makeInterface({ name: 'ether1', type: 'ETHERNET', macAddress: 'D4:CA:6D:A1:B2:C3' }),
  makeInterface({ name: 'ether2', type: 'ETHERNET', macAddress: 'D4:CA:6D:A1:B2:C4' }),
  makeInterface({ name: 'ether3', type: 'ETHERNET', macAddress: 'D4:CA:6D:A1:B2:C5' }),
];

const mixedInterfaces: Interface[] = [
  makeInterface({ name: 'ether4', type: 'ETHERNET', macAddress: 'D4:CA:6D:A1:B2:C6' }),
  makeInterface({ name: 'wlan1', type: 'WIRELESS', macAddress: '00:11:22:33:44:55' }),
  makeInterface({ name: 'wlan2', type: 'WIRELESS', macAddress: '00:11:22:33:44:66' }),
  makeInterface({ name: 'vlan10', type: 'VLAN' }),
  makeInterface({ name: 'tunnel1', type: 'TUNNEL' }),
];

const singleInterface: Interface[] = [
  makeInterface({ name: 'ether5', type: 'ETHERNET', macAddress: 'AA:BB:CC:DD:EE:FF' }),
];

// ---------------------------------------------------------------------------
// Meta
// ---------------------------------------------------------------------------

const meta: Meta<typeof AvailableInterfaces> = {
  title: 'Features/Network/Bridges/AvailableInterfaces',
  component: AvailableInterfaces,
  tags: ['autodocs'],
  decorators: [withDndContext],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Displays all network interfaces that are available (not yet assigned to a bridge) ' +
          'as draggable cards. The user drags an interface card onto the bridge drop zone to add ' +
          'it as a port. Interfaces show their name, type badge, and optional MAC address. ' +
          'While loading, skeleton placeholders are shown.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof AvailableInterfaces>;

// ---------------------------------------------------------------------------
// Stories
// ---------------------------------------------------------------------------

export const Default: Story = {
  name: 'Ethernet Interfaces',
  args: {
    interfaces: ethernetInterfaces,
    loading: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Three Ethernet interfaces available to drag onto a bridge. Each card shows ' +
          'the interface name, type badge, and MAC address.',
      },
    },
  },
};

export const MixedTypes: Story = {
  name: 'Mixed Interface Types',
  args: {
    interfaces: mixedInterfaces,
    loading: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'A mix of Ethernet, Wireless, VLAN, and Tunnel interfaces. Badge colour ' +
          'changes with interface type (Ethernet = default, Wireless = secondary, others = outline).',
      },
    },
  },
};

export const SingleInterface: Story = {
  name: 'Single Interface',
  args: {
    interfaces: singleInterface,
    loading: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Only one interface remains unassigned.',
      },
    },
  },
};

export const Loading: Story = {
  name: 'Loading State',
  args: {
    interfaces: [],
    loading: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          'While interface data is being fetched three animated skeleton rows are shown in ' +
          'place of the actual cards.',
      },
    },
  },
};

export const Empty: Story = {
  name: 'No Available Interfaces',
  args: {
    interfaces: [],
    loading: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Empty state displayed when every interface is already assigned to a bridge, ' +
          'leaving nothing to drag.',
      },
    },
  },
};
