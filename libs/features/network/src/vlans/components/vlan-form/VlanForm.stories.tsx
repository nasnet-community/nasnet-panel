/**
 * Storybook Stories for VlanForm Component
 *
 * Demonstrates VLAN form in create and edit modes with validation.
 */

import { MockedProvider } from '@apollo/client/testing';
import { fn } from '@storybook/test';

import { CHECK_VLAN_ID_AVAILABLE } from '@nasnet/api-client/queries';

import { VlanForm } from './VlanForm';

import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof VlanForm> = {
  title: 'Features/Network/VlanForm',
  component: VlanForm,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'VLAN creation and editing form with real-time validation and duplicate detection. Includes VLAN ID range validation (1-4094), duplicate checking, and warning messages.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    mode: {
      control: 'radio',
      options: ['create', 'edit'],
      description: 'Form mode',
    },
  },
};

export default meta;
type Story = StoryObj<typeof VlanForm>;

// Mock availability check - VLAN ID is available
const mockAvailable = [
  {
    request: {
      query: CHECK_VLAN_ID_AVAILABLE,
      variables: {
        routerId: 'router-1',
        vlanId: 10,
        parentInterfaceId: 'bridge1',
        excludeId: undefined,
      },
    },
    result: {
      data: {
        checkVlanIdAvailable: true,
      },
    },
  },
];

// Mock availability check - VLAN ID is taken
const mockTaken = [
  {
    request: {
      query: CHECK_VLAN_ID_AVAILABLE,
      variables: {
        routerId: 'router-1',
        vlanId: 10,
        parentInterfaceId: 'bridge1',
        excludeId: undefined,
      },
    },
    result: {
      data: {
        checkVlanIdAvailable: false,
      },
    },
  },
];

/**
 * Create mode - empty form
 */
export const CreateMode: Story = {
  args: {
    routerId: 'router-1',
    mode: 'create',
    onSubmit: fn(),
    onCancel: fn(),
    loading: false,
  },
  decorators: [
    (Story) => (
      <MockedProvider mocks={mockAvailable} addTypename={false}>
        <div className="min-h-screen flex items-center justify-center p-6">
          <Story />
        </div>
      </MockedProvider>
    ),
  ],
};

/**
 * Edit mode - pre-filled form
 */
export const EditMode: Story = {
  args: {
    routerId: 'router-1',
    mode: 'edit',
    currentVlanId: 'vlan-1',
    initialValues: {
      name: 'vlan-guest',
      vlanId: 10,
      interface: 'bridge1',
      mtu: 1500,
      comment: 'Guest network VLAN',
      disabled: false,
    },
    onSubmit: fn(),
    onCancel: fn(),
    loading: false,
  },
  decorators: [
    (Story) => (
      <MockedProvider mocks={mockAvailable} addTypename={false}>
        <div className="min-h-screen flex items-center justify-center p-6">
          <Story />
        </div>
      </MockedProvider>
    ),
  ],
};

/**
 * Loading state - form submission in progress
 */
export const Loading: Story = {
  args: {
    routerId: 'router-1',
    mode: 'create',
    onSubmit: fn(),
    onCancel: fn(),
    loading: true,
  },
  decorators: [
    (Story) => (
      <MockedProvider mocks={mockAvailable} addTypename={false}>
        <div className="min-h-screen flex items-center justify-center p-6">
          <Story />
        </div>
      </MockedProvider>
    ),
  ],
};

/**
 * Duplicate VLAN ID error
 */
export const DuplicateVlanId: Story = {
  args: {
    routerId: 'router-1',
    mode: 'create',
    initialValues: {
      name: 'vlan-test',
      vlanId: 10,
      interface: 'bridge1',
    },
    onSubmit: fn(),
    onCancel: fn(),
    loading: false,
  },
  decorators: [
    (Story) => (
      <MockedProvider mocks={mockTaken} addTypename={false}>
        <div className="min-h-screen flex items-center justify-center p-6">
          <Story />
        </div>
      </MockedProvider>
    ),
  ],
};

/**
 * VLAN 1 warning (default VLAN)
 */
export const Vlan1Warning: Story = {
  args: {
    routerId: 'router-1',
    mode: 'create',
    initialValues: {
      name: 'vlan-default',
      vlanId: 1,
      interface: 'bridge1',
    },
    onSubmit: fn(),
    onCancel: fn(),
    loading: false,
  },
  decorators: [
    (Story) => (
      <MockedProvider mocks={mockAvailable} addTypename={false}>
        <div className="min-h-screen flex items-center justify-center p-6">
          <Story />
        </div>
      </MockedProvider>
    ),
  ],
};

/**
 * VLAN 4095 warning (reserved)
 */
export const Vlan4095Warning: Story = {
  args: {
    routerId: 'router-1',
    mode: 'create',
    initialValues: {
      name: 'vlan-reserved',
      vlanId: 4095,
      interface: 'bridge1',
    },
    onSubmit: fn(),
    onCancel: fn(),
    loading: false,
  },
  decorators: [
    (Story) => (
      <MockedProvider mocks={mockAvailable} addTypename={false}>
        <div className="min-h-screen flex items-center justify-center p-6">
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
    mode: 'create',
    onSubmit: fn(),
    onCancel: fn(),
    loading: false,
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
  decorators: [
    (Story) => (
      <MockedProvider mocks={mockAvailable} addTypename={false}>
        <div className="min-h-screen p-4">
          <Story />
        </div>
      </MockedProvider>
    ),
  ],
};

/**
 * Jumbo frames MTU
 */
export const JumboFrames: Story = {
  args: {
    routerId: 'router-1',
    mode: 'create',
    initialValues: {
      name: 'vlan-storage',
      vlanId: 50,
      interface: 'bridge1',
      mtu: 9000,
      comment: 'Storage network with jumbo frames',
    },
    onSubmit: fn(),
    onCancel: fn(),
    loading: false,
  },
  decorators: [
    (Story) => (
      <MockedProvider mocks={mockAvailable} addTypename={false}>
        <div className="min-h-screen flex items-center justify-center p-6">
          <Story />
        </div>
      </MockedProvider>
    ),
  ],
};
