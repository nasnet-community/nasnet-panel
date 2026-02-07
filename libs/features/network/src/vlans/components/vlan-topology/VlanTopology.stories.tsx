/**
 * Storybook Stories for VlanTopology Component
 *
 * Demonstrates VLAN topology visualization.
 */

import type { Meta, StoryObj } from '@storybook/react';
import { VlanTopology } from './VlanTopology';
import { MockedProvider } from '@apollo/client/testing';
import { GET_VLANS } from '@nasnet/api-client/queries';
import { fn } from '@storybook/test';

const meta: Meta<typeof VlanTopology> = {
  title: 'Features/Network/VlanTopology',
  component: VlanTopology,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Hierarchical visualization of VLAN topology showing parent interfaces and their VLANs. Interactive with expandable/collapsible sections.',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof VlanTopology>;

// Simple topology with few VLANs
const mockSimple = [
  {
    request: {
      query: GET_VLANS,
      variables: { routerId: 'router-1', filter: undefined },
    },
    result: {
      data: {
        vlans: [
          {
            id: 'vlan-1',
            name: 'vlan-guest',
            vlanId: 10,
            interface: { id: 'bridge1', name: 'bridge1', type: 'bridge' },
            mtu: 1500,
            comment: 'Guest network',
            disabled: false,
            running: true,
          },
          {
            id: 'vlan-2',
            name: 'vlan-iot',
            vlanId: 20,
            interface: { id: 'bridge1', name: 'bridge1', type: 'bridge' },
            mtu: 1500,
            comment: 'IoT devices',
            disabled: false,
            running: true,
          },
        ],
      },
    },
  },
];

// Complex topology with multiple interfaces
const mockComplex = [
  {
    request: {
      query: GET_VLANS,
      variables: { routerId: 'router-1', filter: undefined },
    },
    result: {
      data: {
        vlans: [
          // Bridge1 VLANs
          {
            id: 'vlan-1',
            name: 'vlan-guest',
            vlanId: 10,
            interface: { id: 'bridge1', name: 'bridge1', type: 'bridge' },
            mtu: 1500,
            comment: 'Guest network VLAN',
            disabled: false,
            running: true,
          },
          {
            id: 'vlan-2',
            name: 'vlan-iot',
            vlanId: 20,
            interface: { id: 'bridge1', name: 'bridge1', type: 'bridge' },
            mtu: 1500,
            comment: 'IoT devices',
            disabled: false,
            running: true,
          },
          {
            id: 'vlan-3',
            name: 'vlan-camera',
            vlanId: 30,
            interface: { id: 'bridge1', name: 'bridge1', type: 'bridge' },
            mtu: 9000,
            comment: 'Security cameras with jumbo frames',
            disabled: false,
            running: true,
          },
          {
            id: 'vlan-4',
            name: 'vlan-test',
            vlanId: 99,
            interface: { id: 'bridge1', name: 'bridge1', type: 'bridge' },
            mtu: null,
            comment: 'Testing VLAN',
            disabled: true,
            running: false,
          },
          // Ether1 VLANs
          {
            id: 'vlan-5',
            name: 'vlan-wan-backup',
            vlanId: 100,
            interface: { id: 'ether1', name: 'ether1', type: 'ethernet' },
            mtu: null,
            comment: 'Backup WAN connection',
            disabled: false,
            running: true,
          },
          // Ether5 VLANs
          {
            id: 'vlan-6',
            name: 'vlan-management',
            vlanId: 1,
            interface: { id: 'ether5', name: 'ether5', type: 'ethernet' },
            mtu: null,
            comment: 'Management interface',
            disabled: false,
            running: true,
          },
          {
            id: 'vlan-7',
            name: 'vlan-storage',
            vlanId: 50,
            interface: { id: 'ether5', name: 'ether5', type: 'ethernet' },
            mtu: 9000,
            comment: 'Storage network',
            disabled: false,
            running: false,
          },
        ],
      },
    },
  },
];

// Empty topology
const mockEmpty = [
  {
    request: {
      query: GET_VLANS,
      variables: { routerId: 'router-1', filter: undefined },
    },
    result: {
      data: {
        vlans: [],
      },
    },
  },
];

/**
 * Simple topology with one interface
 */
export const Simple: Story = {
  args: {
    routerId: 'router-1',
    onVlanSelect: fn(),
  },
  decorators: [
    (Story) => (
      <MockedProvider mocks={mockSimple} addTypename={false}>
        <Story />
      </MockedProvider>
    ),
  ],
};

/**
 * Complex topology with multiple interfaces
 */
export const Complex: Story = {
  args: {
    routerId: 'router-1',
    onVlanSelect: fn(),
  },
  decorators: [
    (Story) => (
      <MockedProvider mocks={mockComplex} addTypename={false}>
        <Story />
      </MockedProvider>
    ),
  ],
};

/**
 * Empty state - no VLANs configured
 */
export const Empty: Story = {
  args: {
    routerId: 'router-1',
    onVlanSelect: fn(),
  },
  decorators: [
    (Story) => (
      <MockedProvider mocks={mockEmpty} addTypename={false}>
        <Story />
      </MockedProvider>
    ),
  ],
};

/**
 * Loading state
 */
export const Loading: Story = {
  args: {
    routerId: 'router-1',
    onVlanSelect: fn(),
  },
  decorators: [
    (Story) => (
      <MockedProvider mocks={[]} addTypename={false}>
        <Story />
      </MockedProvider>
    ),
  ],
};

/**
 * Mobile viewport
 */
export const Mobile: Story = {
  args: {
    routerId: 'router-1',
    onVlanSelect: fn(),
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
  decorators: [
    (Story) => (
      <MockedProvider mocks={mockComplex} addTypename={false}>
        <Story />
      </MockedProvider>
    ),
  ],
};

/**
 * Large topology (50 VLANs across 5 interfaces)
 */
export const Large: Story = {
  args: {
    routerId: 'router-1',
    onVlanSelect: fn(),
  },
  decorators: [
    (Story) => {
      const interfaces = ['bridge1', 'bridge2', 'ether1', 'ether5', 'ether10'];
      const largeVlans = Array.from({ length: 50 }, (_, i) => ({
        id: `vlan-${i}`,
        name: `vlan-${i + 1}`,
        vlanId: i + 1,
        interface: {
          id: interfaces[i % interfaces.length],
          name: interfaces[i % interfaces.length],
          type: i % 2 === 0 ? 'bridge' : 'ethernet',
        },
        mtu: i % 3 === 0 ? 9000 : 1500,
        comment: `VLAN ${i + 1} description`,
        disabled: i % 7 === 0,
        running: i % 7 !== 0,
      }));

      const mocks = [
        {
          request: {
            query: GET_VLANS,
            variables: { routerId: 'router-1', filter: undefined },
          },
          result: {
            data: {
              vlans: largeVlans,
            },
          },
        },
      ];

      return (
        <MockedProvider mocks={mocks} addTypename={false}>
          <Story />
        </MockedProvider>
      );
    },
  ],
};
