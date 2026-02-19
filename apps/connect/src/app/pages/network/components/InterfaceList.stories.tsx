/**
 * Storybook stories for InterfaceList component
 * Covers: empty state, small list, mixed running/disabled, all interface types, collapsed default, large list (>6 items, "View All" trigger)
 *
 * InterfaceList composes InterfaceCard which fetches live data via hooks.
 * Stories render correctly in environments that have the required providers
 * (Apollo + Zustand) configured in .storybook/preview.tsx.
 */


import { type NetworkInterface } from '@nasnet/core/types';

import { InterfaceList } from './InterfaceList';

import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof InterfaceList> = {
  title: 'App/Network/InterfaceList',
  component: InterfaceList,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Collapsible section that renders a responsive grid of InterfaceCard components. Shows total interface count and active count in the section header. When more than 6 interfaces exist a "View All" action appears. Falls back to a Network icon empty state when the list is empty.',
      },
    },
  },
  argTypes: {
    defaultCollapsed: {
      control: 'boolean',
      description: 'Whether the list section starts collapsed',
    },
  },
};

export default meta;
type Story = StoryObj<typeof InterfaceList>;

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const makeInterface = (
  id: string,
  name: string,
  type: NetworkInterface['type'],
  status: NetworkInterface['status'],
  linkStatus: NetworkInterface['linkStatus'],
  macAddress: string,
  mtu = 1500,
  comment?: string,
): NetworkInterface => ({
  id,
  name,
  type,
  status,
  linkStatus,
  macAddress,
  mtu,
  comment,
});

const allRunningInterfaces: NetworkInterface[] = [
  makeInterface('ether1', 'ether1', 'ether', 'running', 'up', 'D4:CA:6D:AA:11:22'),
  makeInterface('ether2', 'ether2', 'ether', 'running', 'up', 'D4:CA:6D:AA:11:23'),
  makeInterface('bridge1', 'bridge1', 'bridge', 'running', 'up', 'AA:BB:CC:00:11:22', 1500, 'LAN bridge'),
];

const mixedInterfaces: NetworkInterface[] = [
  makeInterface('ether1', 'ether1', 'ether', 'running', 'up', 'D4:CA:6D:AA:11:22'),
  makeInterface('ether2', 'ether2', 'ether', 'disabled', 'down', 'D4:CA:6D:AA:11:23'),
  makeInterface('wlan1', 'wlan1', 'wireless', 'running', 'up', 'B8:27:EB:11:22:33', 1500, '2.4 GHz AP'),
  makeInterface('bridge1', 'bridge1', 'bridge', 'running', 'up', 'AA:BB:CC:00:11:22'),
  makeInterface('pppoe-out1', 'pppoe-out1', 'pppoe', 'running', 'up', '', 1480, 'WAN PPPoE'),
  makeInterface('vlan10', 'vlan10', 'vlan', 'disabled', 'down', 'D4:CA:6D:AA:11:24'),
];

const allTypesInterfaces: NetworkInterface[] = [
  makeInterface('ether1', 'ether1', 'ether', 'running', 'up', 'D4:CA:6D:00:00:01'),
  makeInterface('bridge1', 'bridge1', 'bridge', 'running', 'up', 'D4:CA:6D:00:00:02'),
  makeInterface('vlan10', 'vlan10', 'vlan', 'running', 'up', 'D4:CA:6D:00:00:03'),
  makeInterface('wlan1', 'wlan1', 'wireless', 'running', 'up', 'D4:CA:6D:00:00:04'),
  makeInterface('pppoe-out1', 'pppoe-out1', 'pppoe', 'running', 'up', '', 1480),
  makeInterface('wg0', 'wg0', 'wireguard', 'running', 'up', 'D4:CA:6D:00:00:05'),
  makeInterface('lte1', 'lte1', 'lte', 'running', 'up', 'D4:CA:6D:00:00:06'),
  makeInterface('lo0', 'lo0', 'loopback', 'running', 'up', '00:00:00:00:00:00', 65535),
];

// More than 6 items — triggers "View All" action in the header
const largeInterfaceList: NetworkInterface[] = [
  ...allTypesInterfaces,
  makeInterface('ether3', 'ether3', 'ether', 'running', 'up', 'D4:CA:6D:00:00:07'),
  makeInterface('ether4', 'ether4', 'ether', 'disabled', 'down', 'D4:CA:6D:00:00:08'),
  makeInterface('vlan20', 'vlan20', 'vlan', 'running', 'up', 'D4:CA:6D:00:00:09'),
];

// ---------------------------------------------------------------------------
// Stories
// ---------------------------------------------------------------------------

export const Default: Story = {
  args: {
    interfaces: allRunningInterfaces,
    defaultCollapsed: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Three running interfaces displayed in a responsive grid.',
      },
    },
  },
};

export const EmptyState: Story = {
  args: {
    interfaces: [],
    defaultCollapsed: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'When interfaces is an empty array the component renders a centred Network icon placeholder instead of a section header.',
      },
    },
  },
};

export const MixedStatus: Story = {
  args: {
    interfaces: mixedInterfaces,
    defaultCollapsed: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Mix of running and disabled interfaces. The section header subtitle shows the active count ("X active").',
      },
    },
  },
};

export const AllInterfaceTypes: Story = {
  args: {
    interfaces: allTypesInterfaces,
    defaultCollapsed: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'One card for each supported interface type (ether, bridge, vlan, wireless, pppoe, wireguard, lte, loopback) to verify icon rendering.',
      },
    },
  },
};

export const DefaultCollapsed: Story = {
  args: {
    interfaces: mixedInterfaces,
    defaultCollapsed: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          'List starts collapsed — section header shows count but the card grid is hidden until the user toggles.',
      },
    },
  },
};

export const LargeListWithViewAll: Story = {
  args: {
    interfaces: largeInterfaceList,
    defaultCollapsed: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'When more than 6 interfaces are present the first 6 are shown and a "View All (N)" button appears in the section header. Clicking it expands the full list.',
      },
    },
  },
};
