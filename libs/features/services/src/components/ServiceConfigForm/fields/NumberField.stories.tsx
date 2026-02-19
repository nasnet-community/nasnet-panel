/**
 * NumberField Stories
 *
 * Storybook stories for the NumberField component — a thin wrapper around
 * the Input primitive that enforces numeric input with optional min/max bounds.
 * Used for NUMBER and PORT type service config fields.
 */

import { Label } from '@nasnet/ui/primitives';

import { NumberField } from './NumberField';

import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof NumberField> = {
  title: 'Features/Services/ServiceConfigForm/NumberField',
  component: NumberField,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Number input field for NUMBER and PORT service config field types. Always renders `type="number"` with `step="1"` for integer values. Accepts optional `min` and `max` bounds which map to the corresponding HTML attributes for browser-native range enforcement.',
      },
    },
  },
  argTypes: {
    min: {
      control: { type: 'number' },
      description: 'Minimum allowed value (inclusive)',
    },
    max: {
      control: { type: 'number' },
      description: 'Maximum allowed value (inclusive)',
    },
    disabled: {
      control: 'boolean',
      description: 'Disables the input',
    },
    placeholder: {
      control: 'text',
      description: 'Placeholder text shown when empty',
    },
  },
  decorators: [
    (Story) => (
      <div className="w-[280px] p-4">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof NumberField>;

/**
 * Default numeric field with no bounds constraints.
 */
export const Default: Story = {
  args: {
    placeholder: 'Enter number...',
  },
};

/**
 * Port number field bounded to the valid TCP/UDP port range (1-65535).
 */
export const PortNumber: Story = {
  args: {
    min: 1,
    max: 65535,
    defaultValue: 8080,
    placeholder: '1–65535',
  },
  render: (args) => (
    <div className="space-y-2">
      <Label htmlFor="port-field">Listen Port</Label>
      <NumberField {...args} id="port-field" />
      <p className="text-xs text-muted-foreground">Valid range: 1–65535</p>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Bounded port field. The HTML `min` and `max` attributes prevent the browser spinner from going out of range. Used for PORT type service config entries.',
      },
    },
  },
};

/**
 * Connection limit field with a small bounded range (1-1000).
 */
export const ConnectionLimit: Story = {
  args: {
    min: 1,
    max: 1000,
    defaultValue: 50,
    placeholder: '1–1000',
  },
  render: (args) => (
    <div className="space-y-2">
      <Label htmlFor="conn-limit">Max Connections</Label>
      <NumberField {...args} id="conn-limit" />
      <p className="text-xs text-muted-foreground">
        Maximum concurrent connections (1–1000)
      </p>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Bounded number field with a practical range for connection limits.',
      },
    },
  },
};

/**
 * Timeout value field in seconds, unbounded on the high end.
 */
export const TimeoutSeconds: Story = {
  args: {
    min: 0,
    placeholder: 'Seconds (0 = disabled)',
    defaultValue: 30,
  },
  render: (args) => (
    <div className="space-y-2">
      <Label htmlFor="timeout-field">Connection Timeout (seconds)</Label>
      <NumberField {...args} id="timeout-field" />
      <p className="text-xs text-muted-foreground">Set 0 to disable timeout</p>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Timeout field with minimum 0 and no upper bound. Setting 0 disables the timeout for services that support it.',
      },
    },
  },
};

/**
 * Disabled state — the value is locked and cannot be edited.
 */
export const Disabled: Story = {
  args: {
    min: 1,
    max: 65535,
    disabled: true,
    defaultValue: 9090,
  },
  render: (args) => (
    <div className="space-y-2">
      <Label htmlFor="locked-port">Management Port (locked)</Label>
      <NumberField {...args} id="locked-port" />
      <p className="text-xs text-muted-foreground">
        Port is fixed while the service is running.
      </p>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Disabled number field. Used when the numeric value cannot be changed in the current state (e.g. the service is running and the port is in use).',
      },
    },
  },
};

/**
 * MTU field showing a network-specific range (576-9000).
 */
export const MTUField: Story = {
  args: {
    min: 576,
    max: 9000,
    defaultValue: 1500,
    placeholder: '576–9000',
  },
  render: (args) => (
    <div className="space-y-2">
      <Label htmlFor="mtu-field">MTU Size (bytes)</Label>
      <NumberField {...args} id="mtu-field" />
      <p className="text-xs text-muted-foreground">
        Standard Ethernet: 1500 · Jumbo frames: up to 9000
      </p>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'MTU configuration field bounded to 576-9000 bytes. Standard Ethernet is 1500 bytes; jumbo frames go up to 9000 bytes for high-throughput links.',
      },
    },
  },
};
