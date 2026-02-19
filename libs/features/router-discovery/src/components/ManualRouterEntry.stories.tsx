import type { Meta, StoryObj } from '@storybook/react';
import { ManualRouterEntry } from './ManualRouterEntry';

const meta: Meta<typeof ManualRouterEntry> = {
  title: 'Features/RouterDiscovery/ManualRouterEntry',
  component: ManualRouterEntry,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A form that lets users add a MikroTik router by IP address when auto-discovery is unavailable. Provides real-time IPv4 validation, an optional friendly name field, quick-fill preset buttons for common MikroTik IPs, and Submit/Cancel actions.',
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="w-full max-w-md">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof ManualRouterEntry>;

// ─── Stories ─────────────────────────────────────────────────────────────────

/**
 * Default empty form — the user has not yet entered any data.
 */
export const Default: Story = {
  args: {
    onSubmit: (data) => console.log('Router submitted:', data),
    onCancel: () => console.log('Cancelled'),
  },
};

/**
 * With cancel button hidden — used when there is no previous step to return to.
 */
export const NoCancel: Story = {
  args: {
    onSubmit: (data) => console.log('Router submitted:', data),
  },
  parameters: {
    docs: {
      description: {
        story:
          'When onCancel is not provided the Cancel button is not rendered, giving the user a single focused action.',
      },
    },
  },
};

/**
 * Simulates a submit with just an IP address (no optional name).
 */
export const SubmitIpOnly: Story = {
  args: {
    onSubmit: (data) => {
      console.log('Submitted with IP only:', data);
      // data = { ipAddress: '192.168.88.1' }
    },
    onCancel: () => console.log('Cancelled'),
  },
  parameters: {
    docs: {
      description: {
        story:
          'Demonstrates the minimum valid submission — IP address only, with no friendly name. Use the 192.168.88.1 preset button to autofill the IP.',
      },
    },
  },
};

/**
 * Demonstrates the full submission with both IP and a friendly name.
 */
export const SubmitWithName: Story = {
  args: {
    onSubmit: (data) => {
      console.log('Submitted with name:', data);
      // data = { ipAddress: '10.0.0.1', name: 'Office Core Router' }
    },
    onCancel: () => console.log('Cancelled'),
  },
  parameters: {
    docs: {
      description: {
        story:
          'When a user types both an IP and a name the submission payload includes both fields. Type any valid IP and fill in a router name to trigger this path.',
      },
    },
  },
};

/**
 * Validation error state — trigger by leaving IP empty and clicking Add Router,
 * or by entering an invalid IP like "999.0.0.1".
 */
export const ValidationError: Story = {
  args: {
    onSubmit: (data) => console.log('Submitted (should not reach here):', data),
    onCancel: () => console.log('Cancelled'),
  },
  parameters: {
    docs: {
      description: {
        story:
          'Click "Add Router" without entering an IP, or type an invalid address like "256.1.1.1", to see the inline validation error and red border.',
      },
    },
  },
};

/**
 * Narrow mobile-width container — verifies layout at 375px (iPhone SE).
 */
export const MobileWidth: Story = {
  args: {
    onSubmit: (data) => console.log('Submitted:', data),
    onCancel: () => console.log('Cancelled'),
  },
  decorators: [
    (Story) => (
      <div style={{ width: 375 }}>
        <Story />
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story:
          'Renders at 375px width to verify the form layout remains usable on small mobile screens, with 44px touch targets on all interactive elements.',
      },
    },
  },
};
