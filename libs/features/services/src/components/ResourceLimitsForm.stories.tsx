/**
 * ResourceLimitsForm Stories
 *
 * Storybook stories for the ResourceLimitsForm component which allows
 * configuring memory and CPU resource constraints for service instances.
 */

import { MockedProvider } from '@apollo/client/testing';

import { SET_RESOURCE_LIMITS } from '@nasnet/api-client/queries';
import type { ResourceLimits } from '@nasnet/api-client/queries';

import { ResourceLimitsForm } from './ResourceLimitsForm';

import type { Meta, StoryObj } from '@storybook/react';

// ===== Mock Data =====

const defaultLimits: ResourceLimits = {
  memoryMB: 64,
  cpuPercent: null,
  applied: true,
};

const limitsWithCPU: ResourceLimits = {
  memoryMB: 128,
  cpuPercent: 512,
  applied: true,
};

const limitsNotApplied: ResourceLimits = {
  memoryMB: 96,
  cpuPercent: 256,
  applied: false,
};

const highMemoryLimits: ResourceLimits = {
  memoryMB: 512,
  cpuPercent: 1000,
  applied: true,
};

// ===== GraphQL Mocks =====

const successMock = {
  request: {
    query: SET_RESOURCE_LIMITS,
    variables: {
      input: {
        routerID: 'router-1',
        instanceID: 'instance-tor-1',
        memoryMB: 64,
        cpuWeight: undefined,
      },
    },
  },
  result: {
    data: {
      setResourceLimits: {
        __typename: 'ResourceLimitsPayload',
        success: true,
        resourceLimits: {
          __typename: 'ResourceLimits',
          memoryMB: 64,
          cpuPercent: null,
          applied: true,
        },
        errors: [],
      },
    },
  },
};

const errorMock = {
  request: {
    query: SET_RESOURCE_LIMITS,
    variables: {
      input: {
        routerID: 'router-1',
        instanceID: 'instance-tor-1',
        memoryMB: 64,
        cpuWeight: undefined,
      },
    },
  },
  result: {
    data: {
      setResourceLimits: {
        __typename: 'ResourceLimitsPayload',
        success: false,
        resourceLimits: null,
        errors: [
          {
            field: 'memoryMB',
            message: 'Insufficient system memory to allocate 64 MB',
            __typename: 'MutationError',
          },
        ],
      },
    },
  },
};

const meta: Meta<typeof ResourceLimitsForm> = {
  title: 'Features/Services/ResourceLimitsForm',
  component: ResourceLimitsForm,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <MockedProvider mocks={[successMock]} addTypename={true}>
        <div className="p-6 bg-background max-w-md">
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
          'Form for editing service instance resource limits (memory and CPU weight). Uses React Hook Form + Zod validation with optimistic updates. Memory range: 16-512 MB. CPU weight range: 1-10000 (optional).',
      },
    },
  },
  argTypes: {
    routerId: {
      control: 'text',
      description: 'Router ID the service instance belongs to',
    },
    instanceId: {
      control: 'text',
      description: 'Service instance ID to update limits for',
    },
    onSuccess: { action: 'onSuccess' },
    onError: { action: 'onError' },
  },
};

export default meta;
type Story = StoryObj<typeof ResourceLimitsForm>;

/**
 * Default state with minimum memory (64 MB) and no CPU weight set.
 * The Reset and Save buttons are disabled until the form is dirty.
 */
export const Default: Story = {
  args: {
    routerId: 'router-1',
    instanceId: 'instance-tor-1',
    currentLimits: defaultLimits,
  },
};

/**
 * Form with both memory and CPU weight configured.
 * Shows the "Applied" status badge in the footer.
 */
export const WithCPUWeight: Story = {
  args: {
    routerId: 'router-1',
    instanceId: 'instance-xray-1',
    currentLimits: limitsWithCPU,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Instance with both memory limit (128 MB) and CPU weight (512) configured. Higher CPU weight values give the service more CPU scheduling priority.',
      },
    },
  },
};

/**
 * Shows the "Not applied" status when cgroups are unavailable on the router.
 */
export const CgroupsUnavailable: Story = {
  args: {
    routerId: 'router-1',
    instanceId: 'instance-singbox-1',
    currentLimits: limitsNotApplied,
  },
  parameters: {
    docs: {
      description: {
        story:
          'When the router kernel does not support cgroups, resource limits are recorded but not enforced. The footer shows a yellow "Not applied" indicator.',
      },
    },
  },
};

/**
 * Form initialized with high resource limits (512 MB RAM, CPU weight 1000).
 * Represents a resource-intensive service like AdGuard Home.
 */
export const HighResourceLimits: Story = {
  args: {
    routerId: 'router-1',
    instanceId: 'instance-adguard-1',
    currentLimits: highMemoryLimits,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Service configured at maximum memory (512 MB) and a high CPU weight of 1000. Typical for resource-intensive services like AdGuard Home.',
      },
    },
  },
};

/**
 * Form without any current limits — uses default values (64 MB, no CPU weight).
 * Suitable for a newly created service instance.
 */
export const NoCurrentLimits: Story = {
  args: {
    routerId: 'router-1',
    instanceId: 'instance-new-1',
    currentLimits: null,
  },
  parameters: {
    docs: {
      description: {
        story:
          'No current limits set (new instance). The form shows default values: 64 MB memory and blank CPU weight field.',
      },
    },
  },
};

/**
 * Server-side error response after form submission.
 * The form displays the error message inline below the fields.
 */
export const ServerError: Story = {
  args: {
    routerId: 'router-1',
    instanceId: 'instance-tor-1',
    currentLimits: defaultLimits,
  },
  decorators: [
    (Story) => (
      <MockedProvider mocks={[errorMock]} addTypename={true}>
        <div className="p-6 bg-background max-w-md">
          <Story />
        </div>
      </MockedProvider>
    ),
  ],
  play: async ({ canvasElement }) => {
    const memoryInput = canvasElement.querySelector(
      'input#memoryMB'
    ) as HTMLInputElement | null;
    if (memoryInput) {
      memoryInput.value = '65';
      memoryInput.dispatchEvent(new Event('input', { bubbles: true }));
      memoryInput.dispatchEvent(new Event('change', { bubbles: true }));
    }
    const submitButton = canvasElement.querySelector(
      'button[type="submit"]'
    ) as HTMLButtonElement | null;
    if (submitButton) {
      submitButton.click();
    }
  },
  parameters: {
    docs: {
      description: {
        story:
          'Demonstrates server-side error handling. After form submission the error message from the GraphQL mutation is displayed inline.',
      },
    },
  },
};

/**
 * Dark mode variant showing the form in a dark background context.
 */
export const DarkMode: Story = {
  args: {
    routerId: 'router-1',
    instanceId: 'instance-tor-1',
    currentLimits: limitsWithCPU,
  },
  decorators: [
    (Story) => (
      <MockedProvider mocks={[successMock]} addTypename={true}>
        <div className="p-6 bg-background max-w-md dark">
          <Story />
        </div>
      </MockedProvider>
    ),
  ],
  parameters: {
    backgrounds: { default: 'dark' },
    docs: {
      description: {
        story: 'ResourceLimitsForm rendered in dark mode.',
      },
    },
  },
};
