import type { BridgePort } from '@nasnet/api-client/generated';

import { StpPortTable } from './StpPortTable';

import type { Meta, StoryObj } from '@storybook/react';

// ---------------------------------------------------------------------------
// Minimal mock helpers - only the fields StpPortTable actually reads
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

const makePort = (
  overrides: Partial<BridgePort> & { interfaceName: string },
): BridgePort => {
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
// Sample port datasets
// ---------------------------------------------------------------------------

const mixedPorts: BridgePort[] = [
  makePort({ interfaceName: 'ether1', role: 'ROOT',       state: 'FORWARDING',  pathCost: 10,  edge: false }),
  makePort({ interfaceName: 'ether2', role: 'DESIGNATED', state: 'FORWARDING',  pathCost: 10,  edge: true }),
  makePort({ interfaceName: 'ether3', role: 'ALTERNATE',  state: 'BLOCKING',    pathCost: 20,  edge: false }),
  makePort({ interfaceName: 'ether4', role: 'BACKUP',     state: 'BLOCKING',    pathCost: 20,  edge: false }),
  makePort({ interfaceName: 'wlan1',  role: 'DESIGNATED', state: 'LEARNING',    pathCost: 100, edge: true }),
];

const allForwardingPorts: BridgePort[] = [
  makePort({ interfaceName: 'ether1', role: 'ROOT',       state: 'FORWARDING', pathCost: 10 }),
  makePort({ interfaceName: 'ether2', role: 'DESIGNATED', state: 'FORWARDING', pathCost: 10 }),
  makePort({ interfaceName: 'ether3', role: 'DESIGNATED', state: 'FORWARDING', pathCost: 10, edge: true }),
];

const blockingPorts: BridgePort[] = [
  makePort({ interfaceName: 'ether1', role: 'ROOT',      state: 'FORWARDING', pathCost: 10 }),
  makePort({ interfaceName: 'ether2', role: 'ALTERNATE', state: 'BLOCKING',   pathCost: 20 }),
  makePort({ interfaceName: 'ether3', role: 'ALTERNATE', state: 'LISTENING',  pathCost: 30 }),
  makePort({ interfaceName: 'ether4', role: 'DISABLED',  state: 'DISABLED',   pathCost: 0  }),
];

const singlePort: BridgePort[] = [
  makePort({ interfaceName: 'ether1', role: 'ROOT', state: 'FORWARDING', pathCost: 10, edge: true }),
];

// ---------------------------------------------------------------------------
// Meta
// ---------------------------------------------------------------------------

const meta: Meta<typeof StpPortTable> = {
  title: 'Features/Network/Bridges/StpPortTable',
  component: StpPortTable,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Displays per-port Spanning Tree Protocol (STP) status in a tabular format. ' +
          'Shows interface name, STP role (Root/Designated/Alternate/Backup/Disabled), ' +
          'STP state (Forwarding/Blocking/Listening/Learning/Disabled), path cost, ' +
          'and whether the port is an edge (PortFast) port. Badge colours convey health at a glance.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof StpPortTable>;

// ---------------------------------------------------------------------------
// Stories
// ---------------------------------------------------------------------------

export const Default: Story = {
  name: 'Mixed Roles & States',
  args: {
    ports: mixedPorts,
  },
  parameters: {
    docs: {
      description: {
        story:
          'A realistic bridge with five ports spanning all major STP roles and states.',
      },
    },
  },
};

export const AllForwarding: Story = {
  name: 'All Ports Forwarding',
  args: {
    ports: allForwardingPorts,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Healthy bridge where every port is in the Forwarding state. ' +
          'All role badges are green (Root) or blue (Designated).',
      },
    },
  },
};

export const WithBlockingPorts: Story = {
  name: 'Blocking & Disabled Ports',
  args: {
    ports: blockingPorts,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Bridge with Alternate ports in Blocking/Listening state and one Disabled port. ' +
          'Warning badges draw attention to inactive ports.',
      },
    },
  },
};

export const SinglePort: Story = {
  name: 'Single Port',
  args: {
    ports: singlePort,
  },
  parameters: {
    docs: {
      description: {
        story: 'Minimal bridge with a single edge (PortFast) root port.',
      },
    },
  },
};

export const Empty: Story = {
  name: 'No Ports Configured',
  args: {
    ports: [],
  },
  parameters: {
    docs: {
      description: {
        story:
          'Empty state shown when the bridge has no ports configured yet.',
      },
    },
  },
};
