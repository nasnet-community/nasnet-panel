import { fn } from 'storybook/test';

import { BridgePortDiagram } from './BridgePortDiagram';

import type { Meta, StoryObj } from '@storybook/react';

/**
 * Bridge Port Diagram Component Stories
 * Demonstrates visual port management with drag-and-drop
 */

// Mock query hooks
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockUseBridgePorts = (ports: any[]) => ({
  ports,
  loading: false,
  error: null,
  refetch: fn(),
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockUseAvailableInterfaces = (interfaces: any[]) => ({
  interfaces,
  loading: false,
  error: null,
  refetch: fn(),
});

const mockUseMutations = () => [fn(), { loading: false }];

const mockPorts = [
  {
    uuid: 'port-1',
    interfaceName: 'ether2',
    pvid: 1,
    frameTypes: 'ADMIT_ALL',
    ingressFiltering: false,
    taggedVlans: [10, 20],
    untaggedVlans: [1],
    role: 'designated',
    state: 'forwarding',
    pathCost: 10,
    edge: false,
  },
  {
    uuid: 'port-2',
    interfaceName: 'ether3',
    pvid: 10,
    frameTypes: 'ADMIT_ALL',
    ingressFiltering: true,
    taggedVlans: [10, 20, 30],
    untaggedVlans: [10],
    role: 'root',
    state: 'forwarding',
    pathCost: 5,
    edge: true,
  },
  {
    uuid: 'port-3',
    interfaceName: 'wlan1',
    pvid: 1,
    frameTypes: 'ADMIT_ONLY_UNTAGGED_AND_PRIORITY',
    ingressFiltering: false,
    taggedVlans: [],
    untaggedVlans: [1],
    role: 'designated',
    state: 'forwarding',
    pathCost: 20,
    edge: true,
  },
];

const mockAvailableInterfaces = [
  {
    uuid: 'iface-1',
    name: 'ether4',
    type: 'ether',
    macAddress: '00:11:22:33:44:66',
  },
  {
    uuid: 'iface-2',
    name: 'ether5',
    type: 'ether',
    macAddress: 'AA:BB:CC:DD:EE:FF',
  },
  {
    uuid: 'iface-3',
    name: 'wlan2',
    type: 'wlan',
    macAddress: '11:22:33:44:55:66',
  },
];

const meta: Meta<typeof BridgePortDiagram> = {
  title: 'Features/Network/Bridges/BridgePortDiagram',
  component: BridgePortDiagram,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => {
      // Mock API hooks would go here
      // Note: In Storybook, component behavior is controlled via props and decorators

      return <Story />;
    },
  ],
};

export default meta;

type Story = StoryObj<typeof BridgePortDiagram>;

export const Default: Story = {
  args: {
    bridgeId: 'bridge-1',
    routerId: 'router-1',
  },
};

export const NoPorts: Story = {
  args: {
    bridgeId: 'bridge-1',
    routerId: 'router-1',
  },
  decorators: [
    (Story) => {
      // Mocking would go here

      return <Story />;
    },
  ],
};

export const NoAvailableInterfaces: Story = {
  args: {
    bridgeId: 'bridge-1',
    routerId: 'router-1',
  },
  decorators: [
    (Story) => {
      // Mocking would go here

      return <Story />;
    },
  ],
};

export const ManyPorts: Story = {
  args: {
    bridgeId: 'bridge-1',
    routerId: 'router-1',
  },
  decorators: [
    (Story) => {
      const manyPorts = Array.from({ length: 10 }, (_, i) => ({
        uuid: `port-${i}`,
        interfaceName: `ether${i + 1}`,
        pvid: Math.floor(Math.random() * 100) + 1,
        frameTypes: 'ADMIT_ALL',
        ingressFiltering: Math.random() > 0.5,
        taggedVlans: [10, 20, 30].slice(0, Math.floor(Math.random() * 3)),
        untaggedVlans: [1],
        role: ['root', 'designated', 'alternate'][Math.floor(Math.random() * 3)],
        state: ['forwarding', 'blocking'][Math.floor(Math.random() * 2)],
        pathCost: Math.floor(Math.random() * 50) + 1,
        edge: Math.random() > 0.5,
      }));

      // Mocking would go here

      return <Story />;
    },
  ],
};

export const Loading: Story = {
  args: {
    bridgeId: 'bridge-1',
    routerId: 'router-1',
  },
  decorators: [
    (Story) => {
      // Mocking would go here

      return <Story />;
    },
  ],
};

export const Error: Story = {
  args: {
    bridgeId: 'bridge-1',
    routerId: 'router-1',
  },
  decorators: [
    (Story) => {
      // Mocking would go here

      return <Story />;
    },
  ],
};

export const ComplexVlanConfiguration: Story = {
  args: {
    bridgeId: 'bridge-1',
    routerId: 'router-1',
  },
  decorators: [
    (Story) => {
      const complexPorts = [
        {
          uuid: 'port-1',
          interfaceName: 'ether2',
          pvid: 10,
          frameTypes: 'ADMIT_ALL',
          ingressFiltering: true,
          taggedVlans: [10, 20, 30, 40, 50],
          untaggedVlans: [10],
          role: 'designated',
          state: 'forwarding',
          pathCost: 10,
          edge: false,
        },
        {
          uuid: 'port-2',
          interfaceName: 'ether3',
          pvid: 20,
          frameTypes: 'ADMIT_ONLY_VLAN_TAGGED',
          ingressFiltering: true,
          taggedVlans: [20, 30, 40],
          untaggedVlans: [],
          role: 'root',
          state: 'forwarding',
          pathCost: 5,
          edge: false,
        },
      ];

      // Mocking would go here

      return <Story />;
    },
  ],
};

export const AllStpStates: Story = {
  args: {
    bridgeId: 'bridge-1',
    routerId: 'router-1',
  },
  decorators: [
    (Story) => {
      const stpPorts = [
        { ...mockPorts[0], role: 'root', state: 'forwarding' },
        { ...mockPorts[1], role: 'designated', state: 'forwarding' },
        { ...mockPorts[2], role: 'alternate', state: 'blocking' },
        {
          ...mockPorts[0],
          uuid: 'port-4',
          interfaceName: 'ether6',
          role: 'backup',
          state: 'blocking',
        },
        {
          ...mockPorts[0],
          uuid: 'port-5',
          interfaceName: 'ether7',
          role: 'disabled',
          state: 'disabled',
        },
      ];

      // Mocking would go here

      return <Story />;
    },
  ],
};
