/**
 * ArrayField Stories
 *
 * Storybook stories for the ArrayField component which provides
 * a tag-style multi-value input for TEXT_ARRAY type config fields.
 */

import { useState } from 'react';

import { ArrayField } from './ArrayField';

import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof ArrayField> = {
  title: 'Features/Services/ServiceConfigForm/ArrayField',
  component: ArrayField,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Tag-style array input for TEXT_ARRAY service config fields. Allows adding items via the input field (press Enter or click Add) and removing them with the X button on each badge. Supports optional regex pattern validation per-item.',
      },
    },
  },
  argTypes: {
    placeholder: {
      control: 'text',
      description: 'Placeholder text shown in the input field',
    },
    disabled: {
      control: 'boolean',
      description: 'Disables all interactions',
    },
    pattern: {
      control: 'text',
      description: 'Optional regex pattern to validate each added item',
    },
  },
  decorators: [
    (Story) => (
      <div className="w-[400px] p-4">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof ArrayField>;

/**
 * Empty field with no pre-existing values.
 * Type a value and press Enter or click the + button to add an item.
 */
export const Default: Story = {
  args: {
    value: [],
    placeholder: 'Enter value and press Enter or click Add',
  },
};

/**
 * Field pre-populated with several DNS server addresses.
 */
export const WithExistingValues: Story = {
  args: {
    value: ['8.8.8.8', '8.8.4.4', '1.1.1.1', '1.0.0.1'],
    placeholder: 'Add DNS server address...',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Pre-populated with 4 DNS server addresses. Each badge has an X button to remove individual entries.',
      },
    },
  },
};

/**
 * Field with an IP address regex pattern validator.
 * Only valid IPv4 addresses are accepted.
 */
export const WithPatternValidation: Story = {
  args: {
    value: ['192.168.1.1'],
    placeholder: 'Enter IPv4 address (e.g. 192.168.1.1)',
    pattern: '^(\\d{1,3}\\.){3}\\d{1,3}$',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Pattern validation restricts entries to IPv4 address format. Entering an invalid value (e.g. "not-an-ip") will show an "Invalid format" error.',
      },
    },
  },
};

/**
 * Disabled state — no items can be added or removed.
 */
export const Disabled: Story = {
  args: {
    value: ['tor-exit-node-1', 'tor-exit-node-2'],
    placeholder: 'Cannot add items',
    disabled: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Disabled mode. The input, Add button, and all remove buttons are non-interactive. Used when the parent form is in read-only or processing state.',
      },
    },
  },
};

/**
 * Interactive controlled example with live state management.
 * Demonstrates the full add/remove cycle.
 */
export const Interactive: Story = {
  render: (args) => {
    function InteractiveArrayField() {
      const [items, setItems] = useState<string[]>([
        'allowed-host-1.example.com',
        'allowed-host-2.example.com',
      ]);

      return (
        <div className="space-y-3">
          <div className="text-sm font-medium">Allowed Hostnames</div>
          <ArrayField
            {...args}
            value={items}
            onChange={setItems}
            placeholder="Enter hostname..."
          />
          <div className="text-xs text-muted-foreground">
            Current values ({items.length}):{' '}
            {items.length > 0 ? items.join(', ') : 'none'}
          </div>
        </div>
      );
    }

    return <InteractiveArrayField />;
  },
  parameters: {
    docs: {
      description: {
        story:
          'Fully interactive controlled example. Add hostnames by typing and pressing Enter, remove them with the X button. The current array state is displayed below.',
      },
    },
  },
};

/**
 * Field with many existing items to demonstrate badge wrapping.
 */
export const ManyItems: Story = {
  args: {
    value: [
      '10.0.0.1',
      '10.0.0.2',
      '10.0.0.3',
      '10.0.0.4',
      '10.0.0.5',
      '10.0.0.6',
      '172.16.0.1',
      '172.16.0.2',
      '192.168.1.100',
    ],
    placeholder: 'Add IP address...',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Many items added to demonstrate how badges wrap across multiple lines.',
      },
    },
  },
};
