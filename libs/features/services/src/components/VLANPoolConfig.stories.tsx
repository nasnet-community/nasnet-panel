/**
 * VLANPoolConfig Stories
 *
 * Storybook stories for the VLANPoolConfig component which allows
 * configuring the allocatable VLAN range (1-4094) for service instances.
 */

import { MockedProvider } from '@apollo/client/testing';

import { UPDATE_VLAN_POOL_CONFIG } from '@nasnet/api-client/queries';

import { VLANPoolConfig } from './VLANPoolConfig';

import type { Meta, StoryObj } from '@storybook/react';

// ===== GraphQL Mocks =====

const successMock = {
  request: {
    query: UPDATE_VLAN_POOL_CONFIG,
    variables: { poolStart: 100, poolEnd: 200 },
  },
  result: {
    data: {
      updateVLANPoolConfig: {
        __typename: 'VLANPoolStatus',
        routerID: 'router-1',
        totalVLANs: 101,
        allocatedVLANs: 5,
        availableVLANs: 96,
        utilization: 4.95,
        shouldWarn: false,
        poolStart: 100,
        poolEnd: 200,
      },
    },
  },
};

const networkErrorMock = {
  request: {
    query: UPDATE_VLAN_POOL_CONFIG,
    variables: { poolStart: 100, poolEnd: 200 },
  },
  error: new Error('Network error: Unable to reach the router'),
};

const meta: Meta<typeof VLANPoolConfig> = {
  title: 'Features/Services/VLANPoolConfig',
  component: VLANPoolConfig,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <MockedProvider mocks={[successMock]} addTypename={true}>
        <div className="p-6 bg-background max-w-lg">
          <Story />
        </div>
      </MockedProvider>
    ),
  ],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'VLAN pool configuration form for setting the allocatable VLAN range (1-4094). Validates that pool start is less than or equal to pool end, shows size preview, subnet template, and warns when the pool is being shrunk or when existing allocations may be affected.',
      },
    },
  },
  argTypes: {
    poolStart: {
      control: { type: 'number', min: 1, max: 4094 },
      description: 'Current pool start VLAN ID',
    },
    poolEnd: {
      control: { type: 'number', min: 1, max: 4094 },
      description: 'Current pool end VLAN ID',
    },
    allocatedCount: {
      control: { type: 'number', min: 0 },
      description: 'Number of currently allocated VLANs',
    },
    onSuccess: { action: 'onSuccess' },
  },
};

export default meta;
type Story = StoryObj<typeof VLANPoolConfig>;

/**
 * Default pool configuration with typical range (100-200) and no allocations.
 * Save and Reset buttons are disabled until the form is changed.
 */
export const Default: Story = {
  args: {
    poolStart: 100,
    poolEnd: 200,
    allocatedCount: 0,
  },
};

/**
 * Pool with several active VLAN allocations.
 * Shows the allocation count in the card description.
 */
export const WithAllocations: Story = {
  args: {
    poolStart: 100,
    poolEnd: 200,
    allocatedCount: 5,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Pool has 5 active VLAN allocations. The description shows the current count and the shrinking warning will appear if the new range reduces the pool size.',
      },
    },
  },
};

/**
 * Large pool spanning most of the valid VLAN range.
 * Represents a production setup with many services.
 */
export const LargePool: Story = {
  args: {
    poolStart: 10,
    poolEnd: 3000,
    allocatedCount: 47,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Wide pool (10-3000) supporting up to 2991 VLANs with 47 currently allocated. Typical for a fleet management deployment.',
      },
    },
  },
};

/**
 * Minimal pool with a tight VLAN range.
 * Useful for constrained environments with few services.
 */
export const MinimalPool: Story = {
  args: {
    poolStart: 100,
    poolEnd: 110,
    allocatedCount: 3,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Very small pool (100-110, 11 VLANs total) with 3 already allocated. Represents a constrained router with limited VLAN budget.',
      },
    },
  },
};

/**
 * Nearly exhausted pool showing utilization pressure.
 * Allocations are close to the pool limit.
 */
export const NearlyExhausted: Story = {
  args: {
    poolStart: 100,
    poolEnd: 110,
    allocatedCount: 10,
  },
  parameters: {
    docs: {
      description: {
        story:
          '10 out of 11 VLANs allocated. The administrator should expand the pool end or reduce allocations to avoid exhaustion.',
      },
    },
  },
};

/**
 * Network error during mutation.
 * Demonstrates the error toast when the router is unreachable.
 */
export const NetworkError: Story = {
  args: {
    poolStart: 100,
    poolEnd: 200,
    allocatedCount: 2,
  },
  decorators: [
    (Story) => (
      <MockedProvider mocks={[networkErrorMock]} addTypename={true}>
        <div className="p-6 bg-background max-w-lg">
          <Story />
        </div>
      </MockedProvider>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story:
          'When the router is unreachable, the mutation fails and a destructive toast notification is shown with the error message.',
      },
    },
  },
};

/**
 * Dark mode variant of the VLAN pool configuration form.
 */
export const DarkMode: Story = {
  args: {
    poolStart: 100,
    poolEnd: 200,
    allocatedCount: 5,
  },
  decorators: [
    (Story) => (
      <MockedProvider mocks={[successMock]} addTypename={true}>
        <div className="p-6 bg-background max-w-lg dark">
          <Story />
        </div>
      </MockedProvider>
    ),
  ],
  parameters: {
    backgrounds: { default: 'dark' },
    docs: {
      description: {
        story: 'VLANPoolConfig rendered in dark mode.',
      },
    },
  },
};
