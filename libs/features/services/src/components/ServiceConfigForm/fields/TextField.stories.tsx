/**
 * TextField Stories
 *
 * Storybook stories for the TextField component — a thin wrapper around
 * the Input primitive that handles sensitive field autocomplete suppression.
 * Used for TEXT, EMAIL, URL, IP_ADDRESS, and FILE_PATH config field types.
 */

import { Label } from '@nasnet/ui/primitives';

import { TextField } from './TextField';

import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof TextField> = {
  title: 'Features/Services/ServiceConfigForm/TextField',
  component: TextField,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Text input field for TEXT, EMAIL, URL, IP_ADDRESS, and FILE_PATH service config field types. Extends the Input primitive with a `sensitive` prop that disables browser autocomplete for fields containing secrets or private data.',
      },
    },
  },
  argTypes: {
    sensitive: {
      control: 'boolean',
      description: 'When true, sets autocomplete="off" to prevent browser from caching the value',
    },
    disabled: {
      control: 'boolean',
      description: 'Disables the input',
    },
    placeholder: {
      control: 'text',
      description: 'Placeholder text shown when empty',
    },
    type: {
      control: 'select',
      options: ['text', 'email', 'url', 'search'],
      description: 'HTML input type',
    },
  },
  decorators: [
    (Story) => (
      <div className="w-[320px] p-4">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof TextField>;

/**
 * Default plain text field with a descriptive placeholder.
 */
export const Default: Story = {
  args: {
    type: 'text',
    placeholder: 'Enter value...',
  },
};

/**
 * Field pre-filled with a value — represents an existing config entry.
 */
export const WithValue: Story = {
  args: {
    type: 'text',
    defaultValue: 'nasnet.local',
    placeholder: 'Enter hostname...',
  },
  parameters: {
    docs: {
      description: {
        story: 'Pre-filled field showing an existing configuration value.',
      },
    },
  },
};

/**
 * Sensitive field with autocomplete disabled.
 * Used for API keys, tokens, or other secret values.
 */
export const Sensitive: Story = {
  args: {
    type: 'text',
    sensitive: true,
    placeholder: 'Enter API key...',
    defaultValue: 'sk-1234567890abcdef',
  },
  render: (args) => (
    <div className="space-y-2">
      <Label htmlFor="api-key">API Key (sensitive)</Label>
      <TextField
        {...args}
        id="api-key"
      />
      <p className="text-muted-foreground text-xs">autocomplete is disabled for this field</p>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Sensitive mode sets `autocomplete="off"` so browsers do not store or suggest the value. Ideal for API keys, auth tokens, and passwords stored in plain text config fields.',
      },
    },
  },
};

/**
 * Email type field for email-type service config entries.
 */
export const EmailType: Story = {
  args: {
    type: 'email',
    placeholder: 'admin@example.com',
  },
  render: (args) => (
    <div className="space-y-2">
      <Label htmlFor="email-field">Email Address</Label>
      <TextField
        {...args}
        id="email-field"
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Email type field for service config entries expecting an email address.',
      },
    },
  },
};

/**
 * URL type field for webhook or remote endpoint configuration.
 */
export const URLType: Story = {
  args: {
    type: 'url',
    placeholder: 'https://example.com/webhook',
    defaultValue: 'https://ntfy.sh/my-topic',
  },
  render: (args) => (
    <div className="space-y-2">
      <Label htmlFor="url-field">Webhook URL</Label>
      <TextField
        {...args}
        id="url-field"
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'URL type field. The browser provides URL-specific keyboard layout on mobile and basic format hints.',
      },
    },
  },
};

/**
 * Disabled state — field is read-only in the UI, value cannot be changed.
 */
export const Disabled: Story = {
  args: {
    type: 'text',
    disabled: true,
    defaultValue: '/var/data/service-config.json',
    placeholder: 'File path...',
  },
  render: (args) => (
    <div className="space-y-2">
      <Label htmlFor="path-field">Config File Path</Label>
      <TextField
        {...args}
        id="path-field"
      />
      <p className="text-muted-foreground text-xs">
        This field cannot be changed while the service is running.
      </p>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Disabled text field. Used when the config value is locked (e.g. while the service is running or during a config apply).',
      },
    },
  },
};
