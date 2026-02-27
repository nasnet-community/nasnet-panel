/**
 * Storybook Stories for VlanPortConfig Component
 *
 * Demonstrates trunk and access port configuration.
 */

import { MockedProvider } from '@apollo/client/testing';
import { fn } from 'storybook/test';

import { CONFIGURE_VLAN_PORT } from '@nasnet/api-client/queries';

import { VlanPortConfig } from './VlanPortConfig';

import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof VlanPortConfig> = {
  title: 'Features/Network/VlanPortConfig',
  component: VlanPortConfig,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'VLAN port configuration for bridge ports. Supports access mode (single untagged VLAN) and trunk mode (multiple tagged VLANs). Shows RouterOS command preview.',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof VlanPortConfig>;

const mockMutation = [
  {
    request: {
      query: CONFIGURE_VLAN_PORT,
      variables: {
        routerId: 'router-1',
        portId: 'ether2',
        config: { mode: 'access', pvid: 10 },
      },
    },
    result: {
      data: {
        configureVlanPort: {
          success: true,
          message: 'Port configured successfully',
          errors: null,
        },
      },
    },
  },
];

/**
 * Access mode - default state
 */
export const AccessMode: Story = {
  args: {
    routerId: 'router-1',
    portId: 'ether2',
    portName: 'ether2',
    initialValues: {
      mode: 'access',
      pvid: 10,
    },
    onSuccess: fn(),
    onCancel: fn(),
  },
  decorators: [
    (Story) => (
      <MockedProvider
        mocks={mockMutation}
        addTypename={false}
      >
        <div className="p-component-lg flex min-h-screen items-center justify-center">
          <Story />
        </div>
      </MockedProvider>
    ),
  ],
};

/**
 * Trunk mode - multiple tagged VLANs
 */
export const TrunkMode: Story = {
  args: {
    routerId: 'router-1',
    portId: 'ether3',
    portName: 'ether3',
    initialValues: {
      mode: 'trunk',
      pvid: 1,
      taggedVlanIds: [10, 20, 30, 40, 50],
    },
    onSuccess: fn(),
    onCancel: fn(),
  },
  decorators: [
    (Story) => (
      <MockedProvider
        mocks={mockMutation}
        addTypename={false}
      >
        <div className="p-component-lg flex min-h-screen items-center justify-center">
          <Story />
        </div>
      </MockedProvider>
    ),
  ],
};

/**
 * Trunk mode - no native VLAN
 */
export const TrunkModeNoNative: Story = {
  args: {
    routerId: 'router-1',
    portId: 'ether4',
    portName: 'ether4',
    initialValues: {
      mode: 'trunk',
      taggedVlanIds: [100, 200, 300],
    },
    onSuccess: fn(),
    onCancel: fn(),
  },
  decorators: [
    (Story) => (
      <MockedProvider
        mocks={mockMutation}
        addTypename={false}
      >
        <div className="p-component-lg flex min-h-screen items-center justify-center">
          <Story />
        </div>
      </MockedProvider>
    ),
  ],
};

/**
 * Empty configuration
 */
export const Empty: Story = {
  args: {
    routerId: 'router-1',
    portId: 'ether5',
    portName: 'ether5',
    onSuccess: fn(),
    onCancel: fn(),
  },
  decorators: [
    (Story) => (
      <MockedProvider
        mocks={mockMutation}
        addTypename={false}
      >
        <div className="p-component-lg flex min-h-screen items-center justify-center">
          <Story />
        </div>
      </MockedProvider>
    ),
  ],
};

/**
 * With command preview visible
 */
export const WithPreview: Story = {
  args: {
    routerId: 'router-1',
    portId: 'ether2',
    portName: 'ether2',
    initialValues: {
      mode: 'access',
      pvid: 10,
    },
    onSuccess: fn(),
    onCancel: fn(),
  },
  play: async ({ canvasElement }) => {
    // Auto-click "Show Preview" button
    const showPreviewButton = canvasElement.querySelector(
      'button:has-text("Show Preview")'
    ) as HTMLButtonElement;
    if (showPreviewButton) {
      showPreviewButton.click();
    }
  },
  decorators: [
    (Story) => (
      <MockedProvider
        mocks={mockMutation}
        addTypename={false}
      >
        <div className="p-component-lg flex min-h-screen items-center justify-center">
          <Story />
        </div>
      </MockedProvider>
    ),
  ],
};

/**
 * Many VLANs in trunk mode
 */
export const ManyVlans: Story = {
  args: {
    routerId: 'router-1',
    portId: 'ether10',
    portName: 'ether10 (Uplink)',
    initialValues: {
      mode: 'trunk',
      pvid: 1,
      taggedVlanIds: [10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120, 130, 140, 150],
    },
    onSuccess: fn(),
    onCancel: fn(),
  },
  decorators: [
    (Story) => (
      <MockedProvider
        mocks={mockMutation}
        addTypename={false}
      >
        <div className="p-component-lg flex min-h-screen items-center justify-center">
          <Story />
        </div>
      </MockedProvider>
    ),
  ],
};
