/**
 * PasswordField Stories
 *
 * Storybook stories for the PasswordField component — a password input with
 * show/hide toggle for revealing the password value.
 * Used for PASSWORD type service config fields.
 */

import { Label } from '@nasnet/ui/primitives';
import { PasswordField } from './PasswordField';

import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof PasswordField> = {
  title: 'Features/Services/ServiceConfigForm/PasswordField',
  component: PasswordField,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Password input field for PASSWORD service config field types. Renders a password input with a show/hide toggle button. Automatically disables browser autocomplete and applies security best practices like monospace font rendering.',
      },
    },
  },
  argTypes: {
    disabled: {
      control: 'boolean',
      description: 'Disables both the input and toggle button',
    },
    placeholder: {
      control: 'text',
      description: 'Placeholder text shown when empty',
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
type Story = StoryObj<typeof PasswordField>;

/**
 * Default password field with standard appearance.
 */
export const Default: Story = {
  args: {
    placeholder: 'Enter password...',
  },
};

/**
 * Password field with a pre-filled value.
 * Demonstrates how the value is hidden by default.
 */
export const WithValue: Story = {
  args: {
    defaultValue: 'superSecretPassword123',
    placeholder: 'Password',
  },
  render: (args) => (
    <div className="space-y-2">
      <Label htmlFor="password-field">Service Password</Label>
      <PasswordField {...args} id="password-field" />
      <p className="text-xs text-muted-foreground">
        Click the icon to reveal/hide the password
      </p>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Pre-filled password field showing a masked password value. Click the show/hide icon to toggle visibility.',
      },
    },
  },
};

/**
 * API key field (using password field for sensitive data protection).
 * Shows how password field can be repurposed for API keys and tokens.
 */
export const APIKeyField: Story = {
  args: {
    defaultValue: 'sk_live_1234567890abcdefghijklmnop',
    placeholder: 'sk_live_...',
  },
  render: (args) => (
    <div className="space-y-2">
      <Label htmlFor="api-key-field">API Key</Label>
      <PasswordField {...args} id="api-key-field" />
      <p className="text-xs text-muted-foreground">
        Your API key is hidden for security. Reveal only when needed.
      </p>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Password field used for API key/token storage. The masking helps prevent shoulder-surfing attacks.',
      },
    },
  },
};

/**
 * Disabled state — the password value is locked and cannot be changed.
 */
export const Disabled: Story = {
  args: {
    disabled: true,
    defaultValue: '••••••••••••••••',
    placeholder: 'Password',
  },
  render: (args) => (
    <div className="space-y-2">
      <Label htmlFor="locked-password">Auth Password (locked)</Label>
      <PasswordField {...args} id="locked-password" />
      <p className="text-xs text-muted-foreground">
        Password cannot be changed while the service is running.
      </p>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Disabled password field. Used when the password value is locked and cannot be edited in the current state.',
      },
    },
  },
};

/**
 * Error state — field validation failed and should show an error message.
 */
export const WithError: Story = {
  args: {
    placeholder: 'Password (min 8 characters)',
  },
  render: (args) => (
    <div className="space-y-2">
      <Label htmlFor="error-password">Database Password</Label>
      <PasswordField {...args} id="error-password" aria-invalid={true} />
      <p className="text-xs text-destructive">
        Password must be at least 8 characters long
      </p>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Password field in error state with validation message displayed below.',
      },
    },
  },
};

/**
 * Empty field ready for new password input.
 */
export const Empty: Story = {
  args: {
    placeholder: 'Create a new password...',
  },
  render: (args) => (
    <div className="space-y-2">
      <Label htmlFor="new-password">New Service Password</Label>
      <PasswordField {...args} id="new-password" />
      <p className="text-xs text-muted-foreground">
        Requirements: 8+ characters, uppercase, number, symbol
      </p>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Empty password field for creating a new service password.',
      },
    },
  },
};
