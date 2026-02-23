import { BridgeStpStatus } from './BridgeStpStatus';

import type { Meta, StoryObj } from '@storybook/react';


/**
 * Bridge STP Status Component Stories
 * Demonstrates real-time spanning tree monitoring
 */

const mockBridgeDetail = (isRoot: boolean, protocol: string = 'rstp') => ({
  bridge: {
    uuid: 'bridge-1',
    name: 'bridge1',
    protocol,
    ports: [
      {
        uuid: 'port-1',
        interfaceName: 'ether2',
        role: 'designated',
        state: 'forwarding',
        pathCost: 10,
        edge: false,
      },
      {
        uuid: 'port-2',
        interfaceName: 'ether3',
        role: isRoot ? 'designated' : 'root',
        state: 'forwarding',
        pathCost: 5,
        edge: true,
      },
      {
        uuid: 'port-3',
        interfaceName: 'wlan1',
        role: 'alternate',
        state: 'blocking',
        pathCost: 20,
        edge: false,
      },
    ],
    stpStatus: {
      rootBridge: isRoot,
      rootBridgeId: '0x8000.001122334455',
      rootPort: isRoot ? null : 'ether3',
      rootPathCost: isRoot ? 0 : 5,
      topologyChangeCount: 3,
      lastTopologyChange: new Date('2024-01-15T10:30:00Z'),
    },
  },
  loading: false,
  error: null,
});

const meta: Meta<typeof BridgeStpStatus> = {
  title: 'Features/Network/Bridges/BridgeStpStatus',
  component: BridgeStpStatus,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof BridgeStpStatus>;

export const RootBridge: Story = {
  args: {
    bridgeId: 'bridge-1',
  },
  decorators: [
    (Story) => {
      // Mocking would go here

      return <Story />;
    },
  ],
};

export const NonRootBridge: Story = {
  args: {
    bridgeId: 'bridge-1',
  },
  decorators: [
    (Story) => {
      // Mocking would go here

      return <Story />;
    },
  ],
};

export const NoSTP: Story = {
  args: {
    bridgeId: 'bridge-1',
  },
  decorators: [
    (Story) => {
      // Mocking would go here

      return <Story />;
    },
  ],
};

export const MSTP: Story = {
  args: {
    bridgeId: 'bridge-1',
  },
  decorators: [
    (Story) => {
      // Mocking would go here

      return <Story />;
    },
  ],
};

export const HighTopologyChanges: Story = {
  args: {
    bridgeId: 'bridge-1',
  },
  decorators: [
    (Story) => {
      const data = mockBridgeDetail(false);
      data.bridge.stpStatus.topologyChangeCount = 42;
      data.bridge.stpStatus.lastTopologyChange = new Date();

      // Mocking would go here

      return <Story />;
    },
  ],
};

export const ManyPorts: Story = {
  args: {
    bridgeId: 'bridge-1',
  },
  decorators: [
    (Story) => {
      const data = mockBridgeDetail(true);
      data.bridge.ports = Array.from({ length: 12 }, (_, i) => ({
        uuid: `port-${i}`,
        interfaceName: `ether${i + 1}`,
        role: ['designated', 'root', 'alternate'][i % 3],
        state: ['forwarding', 'blocking', 'learning'][i % 3],
        pathCost: Math.floor(Math.random() * 50) + 1,
        edge: Math.random() > 0.5,
      }));

      // Mocking would go here

      return <Story />;
    },
  ],
};

export const AllStates: Story = {
  args: {
    bridgeId: 'bridge-1',
  },
  decorators: [
    (Story) => {
      const data = mockBridgeDetail(true);
      data.bridge.ports = [
        {
          uuid: 'port-1',
          interfaceName: 'ether2',
          role: 'designated',
          state: 'forwarding',
          pathCost: 10,
          edge: false,
        },
        {
          uuid: 'port-2',
          interfaceName: 'ether3',
          role: 'root',
          state: 'forwarding',
          pathCost: 5,
          edge: true,
        },
        {
          uuid: 'port-3',
          interfaceName: 'ether4',
          role: 'alternate',
          state: 'blocking',
          pathCost: 20,
          edge: false,
        },
        {
          uuid: 'port-4',
          interfaceName: 'ether5',
          role: 'backup',
          state: 'blocking',
          pathCost: 15,
          edge: false,
        },
        {
          uuid: 'port-5',
          interfaceName: 'ether6',
          role: 'designated',
          state: 'listening',
          pathCost: 12,
          edge: false,
        },
        {
          uuid: 'port-6',
          interfaceName: 'ether7',
          role: 'designated',
          state: 'learning',
          pathCost: 10,
          edge: false,
        },
        {
          uuid: 'port-7',
          interfaceName: 'ether8',
          role: 'disabled',
          state: 'disabled',
          pathCost: 0,
          edge: false,
        },
      ];

      // Mocking would go here

      return <Story />;
    },
  ],
};

export const Loading: Story = {
  args: {
    bridgeId: 'bridge-1',
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
  },
  decorators: [
    (Story) => {
      // Mocking would go here

      return <Story />;
    },
  ],
};

export const RecentTopologyChange: Story = {
  args: {
    bridgeId: 'bridge-1',
  },
  decorators: [
    (Story) => {
      const data = mockBridgeDetail(false);
      data.bridge.stpStatus.lastTopologyChange = new Date(Date.now() - 30000); // 30 seconds ago

      // Mocking would go here

      return <Story />;
    },
  ],
};
