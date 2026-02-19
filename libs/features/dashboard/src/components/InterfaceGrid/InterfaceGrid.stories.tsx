/**
 * InterfaceGrid Storybook Stories
 *
 * Demonstrates all states and layouts of the InterfaceGrid component.
 */

import { MockedProvider } from '@apollo/client/testing';

import { InterfaceGrid } from './InterfaceGrid';
import { GET_INTERFACES } from './queries';

import type { InterfaceGridData } from './types';
import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof InterfaceGrid> = {
  title: 'Dashboard/InterfaceGrid',
  component: InterfaceGrid,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof InterfaceGrid>;

const mockInterfaces: InterfaceGridData[] = [
  {
    id: '1',
    name: 'ether1',
    type: 'ethernet',
    status: 'up',
    ip: '192.168.1.1',
    mac: 'AA:BB:CC:DD:EE:FF',
    mtu: 1500,
    running: true,
    txRate: 2500000,
    rxRate: 15200000,
    linkSpeed: '1Gbps',
    comment: 'WAN',
    usedBy: [],
  },
  {
    id: '2',
    name: 'ether2',
    type: 'ethernet',
    status: 'up',
    ip: '192.168.88.1',
    mac: '11:22:33:44:55:66',
    mtu: 1500,
    running: true,
    txRate: 5000000,
    rxRate: 10000000,
    linkSpeed: '1Gbps',
    usedBy: [],
  },
  {
    id: '3',
    name: 'wlan1',
    type: 'wireless',
    status: 'up',
    ip: '10.0.0.1',
    mac: '22:33:44:55:66:77',
    mtu: 1500,
    running: true,
    txRate: 500000,
    rxRate: 2000000,
    usedBy: [],
  },
  {
    id: '4',
    name: 'bridge-lan',
    type: 'bridge',
    status: 'up',
    ip: '192.168.100.1',
    mac: '33:44:55:66:77:88',
    mtu: 1500,
    running: true,
    txRate: 3000000,
    rxRate: 8000000,
    usedBy: [],
  },
];

const manyInterfaces: InterfaceGridData[] = [
  ...mockInterfaces,
  ...Array.from({ length: 8 }, (_, i) => ({
    id: `${i + 5}`,
    name: `ether${i + 3}`,
    type: 'ethernet' as const,
    status: 'up' as const,
    ip: `192.168.${i + 10}.1`,
    mac: `AA:BB:CC:DD:${i}${i}:${i}${i}`,
    mtu: 1500,
    running: true,
    txRate: Math.random() * 10000000,
    rxRate: Math.random() * 20000000,
    linkSpeed: '1Gbps',
    usedBy: [],
  })),
];

export const Default: Story = {
  args: {
    deviceId: 'router-1',
  },
  decorators: [
    (Story) => (
      <MockedProvider
        mocks={[
          {
            request: {
              query: GET_INTERFACES,
              variables: { deviceId: 'router-1' },
            },
            result: {
              data: {
                device: {
                  id: 'router-1',
                  interfaces: mockInterfaces,
                },
              },
            },
          },
        ]}
        addTypename={false}
      >
        <Story />
      </MockedProvider>
    ),
  ],
};

export const OneDown: Story = {
  args: {
    deviceId: 'router-1',
  },
  decorators: [
    (Story) => (
      <MockedProvider
        mocks={[
          {
            request: {
              query: GET_INTERFACES,
              variables: { deviceId: 'router-1' },
            },
            result: {
              data: {
                device: {
                  id: 'router-1',
                  interfaces: [
                    ...mockInterfaces.slice(0, 2),
                    {
                      ...mockInterfaces[2],
                      status: 'down',
                      running: false,
                      txRate: 0,
                      rxRate: 0,
                      lastSeen: new Date(Date.now() - 3600000).toISOString(),
                    },
                    mockInterfaces[3],
                  ],
                },
              },
            },
          },
        ]}
        addTypename={false}
      >
        <Story />
      </MockedProvider>
    ),
  ],
};

export const ManyInterfaces: Story = {
  args: {
    deviceId: 'router-1',
  },
  decorators: [
    (Story) => (
      <MockedProvider
        mocks={[
          {
            request: {
              query: GET_INTERFACES,
              variables: { deviceId: 'router-1' },
            },
            result: {
              data: {
                device: {
                  id: 'router-1',
                  interfaces: manyInterfaces,
                },
              },
            },
          },
        ]}
        addTypename={false}
      >
        <Story />
      </MockedProvider>
    ),
  ],
};

export const Loading: Story = {
  args: {
    deviceId: 'router-1',
  },
  decorators: [
    (Story) => (
      <MockedProvider mocks={[]} addTypename={false}>
        <Story />
      </MockedProvider>
    ),
  ],
};

export const Error: Story = {
  args: {
    deviceId: 'router-1',
  },
  decorators: [
    (Story) => (
      <MockedProvider
        mocks={[
          {
            request: {
              query: GET_INTERFACES,
              variables: { deviceId: 'router-1' },
            },
            error: new Error('Failed to connect to router'),
          },
        ]}
        addTypename={false}
      >
        <Story />
      </MockedProvider>
    ),
  ],
};

export const Empty: Story = {
  args: {
    deviceId: 'router-1',
  },
  decorators: [
    (Story) => (
      <MockedProvider
        mocks={[
          {
            request: {
              query: GET_INTERFACES,
              variables: { deviceId: 'router-1' },
            },
            result: {
              data: {
                device: {
                  id: 'router-1',
                  interfaces: [],
                },
              },
            },
          },
        ]}
        addTypename={false}
      >
        <Story />
      </MockedProvider>
    ),
  ],
};
