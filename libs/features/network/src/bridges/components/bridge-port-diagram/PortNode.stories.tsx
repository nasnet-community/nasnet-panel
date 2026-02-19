import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import { PortNode } from './PortNode';
import type { BridgePort } from '@nasnet/api-client/generated';

// ---------------------------------------------------------------------------
// Mock data helpers
// ---------------------------------------------------------------------------

const mockInterface = (name: string) =>
  ({
    id: `iface-${name}`,
    name,
    enabled: true,
    running: true,
    status: 'UP',
    type: 'ETHERNET',
  }) as BridgePort['interface'];

const makePort = (overrides: Partial<BridgePort> & { interfaceName: string }): BridgePort => {
  const { interfaceName, ...rest } = overrides;
  return {
    id: `port-${interfaceName}`,
    interface: mockInterface(interfaceName),
    bridge: { id: 'bridge1', name: 'bridge1' } as BridgePort['bridge'],
    edge: false,
    frameTypes: 'ADMIT_ALL',
    ingressFiltering: false,
    pathCost: 10,
    pvid: 1,
    role: 'DESIGNATED',
    state: 'FORWARDING',
    taggedVlans: [],
    untaggedVlans: [],
    ...rest,
  } as BridgePort;
};

// ---------------------------------------------------------------------------
// Port fixtures
// ---------------------------------------------------------------------------

const rootPort = makePort({
  interfaceName: 'ether1',
  role: 'ROOT',
  state: 'FORWARDING',
  pathCost: 10,
  pvid: 1,
  taggedVlans: [10, 20, 30],
  untaggedVlans: [],
  edge: false,
});

const designatedEdgePort = makePort({
  interfaceName: 'ether2',
  role: 'DESIGNATED',
  state: 'FORWARDING',
  pathCost: 10,
  pvid: 100,
  taggedVlans: [],
  untaggedVlans: [100],
  edge: true,
});

const alternatePort = makePort({
  interfaceName: 'ether3',
  role: 'ALTERNATE',
  state: 'BLOCKING',
  pathCost: 20,
  pvid: 1,
  taggedVlans: [],
  untaggedVlans: [],
  edge: false,
});

const minimalPort = makePort({
  interfaceName: 'wlan1',
  pvid: 1,
  taggedVlans: [],
  untaggedVlans: [],
});

const richVlanPort = makePort({
  interfaceName: 'ether4',
  role: 'DESIGNATED',
  state: 'LEARNING',
  pathCost: 100,
  pvid: 200,
  taggedVlans: [10, 20, 30, 40, 50],
  untaggedVlans: [200],
  edge: false,
});

// ---------------------------------------------------------------------------
// Meta
// ---------------------------------------------------------------------------

const meta: Meta<typeof PortNode> = {
  title: 'Features/Network/Bridges/PortNode',
  component: PortNode,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Visualises a single bridge port in the port diagram. Shows the interface name, ' +
          'PVID, tagged/untagged VLAN memberships, STP role and state badges, and path cost. ' +
          'Hover to reveal Edit and Remove action buttons. The Edge badge indicates PortFast mode.',
      },
    },
  },
  args: {
    onRemove: fn(),
    onEdit: fn(),
  },
};

export default meta;
type Story = StoryObj<typeof PortNode>;

// ---------------------------------------------------------------------------
// Stories
// ---------------------------------------------------------------------------

export const Default: Story = {
  name: 'Root Port (Forwarding)',
  args: {
    port: rootPort,
    isRemoving: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Root port in Forwarding state with tagged VLAN memberships (10, 20, 30).',
      },
    },
  },
};

export const DesignatedEdge: Story = {
  name: 'Designated Edge Port',
  args: {
    port: designatedEdgePort,
    isRemoving: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Designated port marked as an Edge port (PortFast). The Edge badge is displayed ' +
          'next to the interface name.',
      },
    },
  },
};

export const AlternateBlocking: Story = {
  name: 'Alternate Port (Blocking)',
  args: {
    port: alternatePort,
    isRemoving: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Alternate port in Blocking state. Both the role and state badges use the warning ' +
          'colour to signal the port is not forwarding.',
      },
    },
  },
};

export const RichVlanMemberships: Story = {
  name: 'Many Tagged VLANs',
  args: {
    port: richVlanPort,
    isRemoving: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Port with five tagged VLANs and one untagged VLAN, in Learning state.',
      },
    },
  },
};

export const MinimalNoStp: Story = {
  name: 'Minimal (No STP Info)',
  args: {
    port: minimalPort,
    isRemoving: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Wireless port with no VLAN overrides or STP role/state. The STP section is hidden ' +
          'when role and state are absent.',
      },
    },
  },
};

export const Removing: Story = {
  name: 'Removing State',
  args: {
    port: rootPort,
    isRemoving: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          'While a remove operation is in flight the Remove button is disabled to prevent ' +
          'double-clicks.',
      },
    },
  },
};
