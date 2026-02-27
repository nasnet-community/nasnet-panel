/**
 * SafetyFeedback Stories
 *
 * Demonstrates the SafetyFeedback component across all feedback types,
 * with and without action buttons, short and long detail text, and
 * the auto-dismiss behaviour.
 */

import { SafetyFeedback } from './SafetyFeedback';

import type { Meta, StoryObj } from '@storybook/react';

// ===== Meta =====

const meta: Meta<typeof SafetyFeedback> = {
  title: 'Patterns/Feedback/SafetyFeedback',
  component: SafetyFeedback,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Displays important feedback about configuration changes as part of the Invisible ' +
          'Safety Pipeline pattern. Covers four semantic types – `success`, `warning`, ' +
          '`rollback`, and `validation-error` – each with distinct iconography and colour ' +
          'treatment. Supports expandable detail text for long messages, custom action ' +
          'buttons, and an optional auto-dismiss timer (success only).',
      },
    },
  },
  argTypes: {
    type: {
      control: 'select',
      options: ['success', 'warning', 'rollback', 'validation-error'],
      description: 'Semantic type of the feedback message',
    },
    message: {
      control: 'text',
      description: 'Primary headline message',
    },
    details: {
      control: 'text',
      description:
        'Optional detail text. If longer than 100 characters an expandable toggle is shown.',
    },
    autoDismiss: {
      control: { type: 'number', min: 0, max: 10000, step: 500 },
      description:
        'Auto-dismiss timeout in milliseconds (only applies to `success` type, 0 = disabled)',
    },
  },
  decorators: [
    (Story) => (
      <div className="max-w-lg">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof SafetyFeedback>;

// ===== Stories =====

/**
 * Success feedback – configuration applied without issues.
 */
export const Success: Story = {
  args: {
    type: 'success',
    message: 'Configuration applied successfully',
    details: 'All changes have been saved and are now active on the router.',
    actions: [],
    autoDismiss: 0,
  },
};

/**
 * Warning feedback – non-blocking issue that the user should be aware of.
 */
export const Warning: Story = {
  args: {
    type: 'warning',
    message: 'Firewall rule overlaps detected',
    details:
      'Two NAT rules target the same destination port (8080). Only the first matching rule will apply.',
    actions: [
      {
        label: 'Review Rules',
        onClick: () => console.log('Review Rules clicked'),
        variant: 'default',
      },
    ],
  },
};

/**
 * Rollback feedback – a dangerous operation was automatically reversed after verification failed.
 */
export const Rollback: Story = {
  args: {
    type: 'rollback',
    message: 'Configuration rolled back automatically',
    details:
      'The applied changes caused a connectivity verification failure. ' +
      'Previous settings have been restored and your network is functioning normally.',
    actions: [
      {
        label: 'View Details',
        onClick: () => console.log('View Details clicked'),
        variant: 'ghost',
      },
      {
        label: 'Try Again',
        onClick: () => console.log('Try Again clicked'),
        variant: 'default',
      },
    ],
  },
};

/**
 * Validation error feedback – the configuration did not pass pre-apply validation.
 */
export const ValidationError: Story = {
  args: {
    type: 'validation-error',
    message: '3 validation errors found',
    details:
      '• Interface ether2: IP address 192.168.1.1/24 conflicts with ether1\n' +
      '• Route: next-hop 10.0.0.254 is unreachable\n' +
      '• DNS server: 999.999.999.999 is not a valid IPv4 address',
    actions: [
      {
        label: 'Fix Errors',
        onClick: () => console.log('Fix Errors clicked'),
        variant: 'default',
      },
    ],
  },
};

/**
 * No details – minimal variant with just a headline and no action buttons.
 */
export const Minimal: Story = {
  args: {
    type: 'success',
    message: 'Settings saved',
    details: undefined,
    actions: [],
    autoDismiss: 0,
  },
};

/**
 * Long detail text – details exceeding 100 characters render behind a Show Details toggle.
 */
export const LongDetails: Story = {
  args: {
    type: 'validation-error',
    message: 'Configuration validation failed',
    details:
      'The following issues were detected during validation: (1) The WireGuard peer public key ' +
      'on interface wg0 is malformed – it must be a 44-character base64-encoded string. ' +
      '(2) The allowed-IPs list contains an invalid CIDR block: 10.0.0.0/33. ' +
      '(3) The listen port 51820 is already in use by another process. ' +
      'Please correct these issues and retry.',
    actions: [
      {
        label: 'Dismiss',
        onClick: () => console.log('Dismissed'),
        variant: 'ghost',
      },
    ],
  },
  parameters: {
    docs: {
      description: {
        story:
          'When `details` exceeds 100 characters the component renders a "Show Details" ' +
          'toggle instead of displaying the text inline.',
      },
    },
  },
};

/**
 * Auto-dismiss – success banner that disappears after 4 seconds.
 */
export const AutoDismiss: Story = {
  args: {
    type: 'success',
    message: 'DHCP lease reserved successfully',
    details: 'The static binding will appear in the lease table momentarily.',
    autoDismiss: 4000,
    onDismiss: () => console.log('Auto-dismissed'),
  },
  parameters: {
    docs: {
      description: {
        story:
          'Setting `autoDismiss` to a positive number causes the banner to fade out ' +
          'automatically after that many milliseconds. Only available for `success` type.',
      },
    },
  },
};

/**
 * Multiple action buttons – shows how two or more actions render side by side.
 */
export const MultipleActions: Story = {
  args: {
    type: 'rollback',
    message: 'We detected an issue and rolled back your changes',
    details: 'Your previous configuration has been restored. The network is working normally.',
    actions: [
      {
        label: 'View Logs',
        onClick: () => console.log('View Logs'),
        variant: 'ghost',
      },
      {
        label: 'Report Issue',
        onClick: () => console.log('Report Issue'),
        variant: 'default',
      },
      {
        label: 'Try Again',
        onClick: () => console.log('Try Again'),
        variant: 'default',
      },
    ],
  },
};

/**
 * All types side by side for a quick visual overview.
 */
export const AllTypes: Story = {
  render: () => (
    <div className="flex max-w-lg flex-col gap-6">
      <SafetyFeedback
        type="success"
        message="Configuration applied successfully"
        details="All changes are now active."
      />
      <SafetyFeedback
        type="warning"
        message="Overlapping firewall rules detected"
        details="Two rules target port 8080. Only the first match will apply."
        actions={[{ label: 'Review', onClick: () => {}, variant: 'default' }]}
      />
      <SafetyFeedback
        type="rollback"
        message="Configuration rolled back automatically"
        details="Previous settings restored after verification failed."
        actions={[
          { label: 'Details', onClick: () => {}, variant: 'ghost' },
          { label: 'Retry', onClick: () => {}, variant: 'default' },
        ]}
      />
      <SafetyFeedback
        type="validation-error"
        message="2 validation errors found"
        details="IP conflict on ether2 and invalid DNS address detected."
        actions={[{ label: 'Fix Errors', onClick: () => {}, variant: 'default' }]}
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'All four feedback types rendered at once for a quick visual comparison.',
      },
    },
  },
};
