/**
 * Storybook stories for CopyButton component
 * @see NAS-4.23 - Implement Clipboard Integration
 */

import { CopyButton } from './CopyButton';

import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof CopyButton> = {
  title: 'Patterns/Clipboard/CopyButton',
  component: CopyButton,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
A button for copying values to clipboard with visual feedback.

## Features
- Two variants: inline (icon-only) and button (with text)
- Visual feedback with checkmark icon on success
- Tooltip support
- Keyboard accessible (Tab, Enter, Space)
- Screen reader support with aria-label
- Optional toast notifications

## Usage
\`\`\`tsx
import { CopyButton } from '@nasnet/ui/patterns';

// Inline icon variant
<CopyButton value="192.168.1.1" variant="inline" aria-label="Copy IP address" />

// Button with text variant
<CopyButton value={publicKey} variant="button" />

// With toast notifications
<CopyButton value={serialNumber} showToast toastTitle="Serial number copied" />
\`\`\`
        `,
      },
    },
  },
  argTypes: {
    variant: {
      control: 'radio',
      options: ['inline', 'button'],
      description: 'Visual variant of the button',
    },
    showTooltip: {
      control: 'boolean',
      description: 'Show tooltip on hover',
    },
    showToast: {
      control: 'boolean',
      description: 'Show toast notification on copy',
    },
    disabled: {
      control: 'boolean',
      description: 'Disable the button',
    },
  },
};

export default meta;
type Story = StoryObj<typeof CopyButton>;

/**
 * Default inline variant - icon only button
 */
export const Inline: Story = {
  args: {
    value: '192.168.1.1',
    variant: 'inline',
    'aria-label': 'Copy IP address',
  },
};

/**
 * Button variant - includes "Copy" text
 */
export const WithText: Story = {
  args: {
    value: 'xV8b2kP9mN3qR7wY1zL4cD6hF0jT5uA',
    variant: 'button',
  },
};

/**
 * With toast notifications
 */
export const WithToast: Story = {
  args: {
    value: 'ABC123DEF456',
    variant: 'button',
    showToast: true,
    toastTitle: 'Serial number copied',
    toastDescription: 'The serial number has been copied to clipboard',
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows a toast notification when the value is copied.',
      },
    },
  },
};

/**
 * Disabled state
 */
export const Disabled: Story = {
  args: {
    value: 'test-value',
    variant: 'button',
    disabled: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Button in disabled state - cannot be clicked.',
      },
    },
  },
};

/**
 * Custom tooltip text
 */
export const CustomTooltip: Story = {
  args: {
    value: '00:1A:2B:3C:4D:5E',
    variant: 'inline',
    tooltipText: 'Copy MAC address',
    copiedTooltipText: 'MAC address copied!',
    'aria-label': 'Copy MAC address',
  },
  parameters: {
    docs: {
      description: {
        story: 'Custom tooltip text for copy and copied states.',
      },
    },
  },
};

/**
 * Without tooltip
 */
export const WithoutTooltip: Story = {
  args: {
    value: '192.168.1.1',
    variant: 'inline',
    showTooltip: false,
    'aria-label': 'Copy IP address',
  },
  parameters: {
    docs: {
      description: {
        story: 'Inline button without tooltip.',
      },
    },
  },
};

/**
 * In context - IP address display
 */
export const InContextIP: Story = {
  render: () => (
    <div className="flex items-center gap-2 rounded-lg bg-slate-50 p-4 dark:bg-slate-800">
      <span className="text-sm font-medium text-slate-500 dark:text-slate-400">IP Address:</span>
      <code className="font-mono text-sm text-slate-900 dark:text-slate-50">192.168.88.1</code>
      <CopyButton
        value="192.168.88.1"
        variant="inline"
        aria-label="Copy IP address"
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Example usage showing an IP address with copy button.',
      },
    },
  },
};

/**
 * In context - Public key display
 */
export const InContextPublicKey: Story = {
  render: () => (
    <div className="max-w-md space-y-2 rounded-lg bg-slate-50 p-4 dark:bg-slate-800">
      <span className="block text-xs font-medium text-slate-500 dark:text-slate-400">
        Public Key
      </span>
      <div className="flex items-center justify-between gap-3">
        <code className="flex-1 truncate rounded bg-slate-100 px-3 py-2 font-mono text-xs dark:bg-slate-700">
          xV8b2kP9...jT5uA
        </code>
        <CopyButton
          value="xV8b2kP9mN3qR7wY1zL4cD6hF0jT5uA"
          variant="button"
          toastTitle="Public key copied"
          showToast
        />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Example usage showing a public key with copy button (like in WireGuardCard).',
      },
    },
  },
};

/**
 * With callbacks
 */
export const WithCallbacks: Story = {
  args: {
    value: 'test-value',
    variant: 'button',
    onCopy: (value) => console.log('Copied:', value),
    onError: (error) => console.error('Copy error:', error),
  },
  parameters: {
    docs: {
      description: {
        story: 'With onCopy and onError callbacks (check console).',
      },
    },
  },
};
