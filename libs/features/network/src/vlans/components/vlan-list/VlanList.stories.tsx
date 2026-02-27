/**
 * Storybook Stories for VlanList Component
 *
 * Demonstrates VLAN list in various states and configurations.
 */

import type { Meta, StoryObj } from '@storybook/react';
import { MockedProvider } from '@apollo/client/testing';
import { GET_VLANS } from '@nasnet/api-client/queries';
import { VlanList } from './VlanList';

type Story = StoryObj<typeof VlanList>;

const meta: Meta<typeof VlanList> = {
  title: 'Features/Network/VlanList',
  component: VlanList,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'VLAN list component with filtering, sorting, and CRUD operations. Automatically adapts to mobile/desktop layouts.',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;

// Mock VLAN data
const mockVlans = [
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
    name: 'vlan-management',
    vlanId: 99,
    interface: { id: 'ether1', name: 'ether1', type: 'ethernet' },
    mtu: null,
    comment: 'Management VLAN',
    disabled: false,
    running: true,
  },
  {
    id: 'vlan-4',
    name: 'vlan-test',
    vlanId: 100,
    interface: { id: 'bridge1', name: 'bridge1', type: 'bridge' },
    mtu: 9000,
    comment: 'Testing VLAN with jumbo frames',
    disabled: true,
    running: false,
  },
];

// Mock GraphQL responses
const mockSuccess = [
  {
    request: {
      query: GET_VLANS,
      variables: { routerId: 'router-1', filter: undefined },
    },
    result: {
      data: {
        vlans: mockVlans,
      },
    },
  },
];

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

const mockErrorResponse = [
  {
    request: {
      query: GET_VLANS,
      variables: { routerId: 'router-1', filter: undefined },
    },
    error: new Error('Failed to fetch VLANs'),
  },
];

/**
 * Default state with multiple VLANs
 */
export const Default: Story = {
  args: {
    routerId: 'router-1',
  },
  decorators: [
    (Story) => (
      <MockedProvider mocks={mockSuccess} addTypename={false}>
        <div className="p-component-lg">
          <Story />
        </div>
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
  },
  decorators: [
    (Story) => (
      <MockedProvider mocks={mockEmpty} addTypename={false}>
        <div className="p-component-lg">
          <Story />
        </div>
      </MockedProvider>
    ),
  ],
};

/**
 * Error state - failed to load VLANs
 */
export const ErrorState: Story = {
  args: {
    routerId: 'router-1',
  },
  decorators: [
    (Story) => (
      <MockedProvider mocks={mockErrorResponse} addTypename={false}>
        <div className="p-component-lg">
          <Story />
        </div>
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
  },
  decorators: [
    (Story) => (
      <MockedProvider mocks={[]} addTypename={false}>
        <div className="p-component-lg">
          <Story />
        </div>
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
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
  decorators: [
    (Story) => (
      <MockedProvider mocks={mockSuccess} addTypename={false}>
        <div className="p-component-sm">
          <Story />
        </div>
      </MockedProvider>
    ),
  ],
};

/**
 * With many VLANs (performance test)
 */
export const ManyVlans: Story = {
  args: {
    routerId: 'router-1',
  },
  decorators: [
    (Story) => {
      const manyVlans = Array.from({ length: 50 }, (_, i) => ({
        id: `vlan-${i}`,
        name: `vlan-${i + 1}`,
        vlanId: i + 1,
        interface: {
          id: i % 2 === 0 ? 'bridge1' : 'ether1',
          name: i % 2 === 0 ? 'bridge1' : 'ether1',
          type: i % 2 === 0 ? 'bridge' : 'ethernet',
        },
        mtu: 1500,
        comment: `VLAN ${i + 1}`,
        disabled: i % 5 === 0,
        running: i % 5 !== 0,
      }));

      const mocks = [
        {
          request: {
            query: GET_VLANS,
            variables: { routerId: 'router-1', filter: undefined },
          },
          result: {
            data: {
              vlans: manyVlans,
            },
          },
        },
      ];

      return (
        <MockedProvider mocks={mocks} addTypename={false}>
          <div className="p-component-lg">
            <Story />
          </div>
        </MockedProvider>
      );
    },
  ],
};
