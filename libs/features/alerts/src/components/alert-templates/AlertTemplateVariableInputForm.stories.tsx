/**
 * AlertTemplateVariableInputForm Storybook Stories
 * NAS-18.12: Alert Rule Templates Feature
 */

import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import { AlertTemplateVariableInputForm } from './AlertTemplateVariableInputForm';
import type { AlertRuleTemplate } from '../../schemas/alert-rule-template.schema';

// =============================================================================
// Meta Configuration
// =============================================================================

const meta: Meta<typeof AlertTemplateVariableInputForm> = {
  title: 'Features/Alerts/AlertTemplateVariableInputForm',
  component: AlertTemplateVariableInputForm,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Form component for collecting variable values when applying an alert rule template. Provides type-specific inputs with validation based on variable constraints.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    template: {
      description: 'Alert rule template with variables to configure',
      control: false,
    },
    onSubmit: {
      description: 'Callback when form is submitted with variable values',
      action: 'submitted',
    },
    onCancel: {
      description: 'Callback when form is cancelled',
      action: 'cancelled',
    },
    isSubmitting: {
      description: 'Whether the form is currently submitting',
      control: 'boolean',
    },
  },
};

export default meta;
type Story = StoryObj<typeof AlertTemplateVariableInputForm>;

// =============================================================================
// Fixtures
// =============================================================================

const templateWithNumericVariables: AlertRuleTemplate = {
  id: 'network-device-offline',
  name: 'Device Offline Alert',
  description: 'Alert when a device goes offline for extended period',
  category: 'NETWORK',
  severity: 'CRITICAL',
  eventType: 'device.offline',
  conditions: [
    {
      field: 'status',
      operator: 'EQUALS',
      value: 'offline',
    },
  ],
  channels: ['email', 'inapp'],
  variables: [
    {
      name: 'DURATION_SECONDS',
      label: 'Offline Duration',
      type: 'DURATION',
      required: true,
      defaultValue: '60',
      min: 30,
      max: 3600,
      unit: 'seconds',
      description: 'How long the device must be offline before alerting',
    },
    {
      name: 'RETRY_COUNT',
      label: 'Retry Attempts',
      type: 'INTEGER',
      required: false,
      defaultValue: '3',
      min: 1,
      max: 10,
      description: 'Number of connection retries before considering offline',
    },
  ],
  throttle: {
    maxAlerts: 1,
    periodSeconds: 300,
    groupByField: 'device_id',
  },
  isBuiltIn: true,
  version: '1.0.0',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

const templateWithMixedVariables: AlertRuleTemplate = {
  id: 'security-rate-limit',
  name: 'Rate Limiting Alert',
  description: 'Alert when API rate limit is exceeded',
  category: 'SECURITY',
  severity: 'WARNING',
  eventType: 'api.rate_limit.exceeded',
  conditions: [
    {
      field: 'request_count',
      operator: 'GREATER_THAN',
      value: '{{MAX_REQUESTS}}',
    },
  ],
  channels: ['inapp', 'webhook'],
  variables: [
    {
      name: 'MAX_REQUESTS',
      label: 'Max Requests',
      type: 'INTEGER',
      required: true,
      defaultValue: '100',
      min: 10,
      max: 10000,
      description: 'Maximum number of requests allowed',
    },
    {
      name: 'TIME_WINDOW',
      label: 'Time Window',
      type: 'DURATION',
      required: true,
      defaultValue: '60',
      min: 10,
      max: 3600,
      unit: 'seconds',
      description: 'Time window for rate limiting',
    },
    {
      name: 'THRESHOLD_PERCENTAGE',
      label: 'Warning Threshold',
      type: 'PERCENTAGE',
      required: false,
      defaultValue: '80',
      min: 50,
      max: 100,
      unit: '%',
      description: 'Percentage at which to send warning (before hitting limit)',
    },
    {
      name: 'ENDPOINT_PATTERN',
      label: 'Endpoint Pattern',
      type: 'STRING',
      required: false,
      defaultValue: '/api/*',
      description: 'Regex pattern for API endpoints to monitor',
    },
  ],
  throttle: null,
  isBuiltIn: true,
  version: '1.0.0',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

const templateWithStringVariables: AlertRuleTemplate = {
  id: 'custom-event-alert',
  name: 'Custom Event Alert',
  description: 'Alert for custom application events',
  category: 'CUSTOM',
  severity: 'INFO',
  eventType: 'custom.event',
  conditions: [],
  channels: ['email'],
  variables: [
    {
      name: 'EVENT_NAME',
      label: 'Event Name',
      type: 'STRING',
      required: true,
      description: 'Name of the custom event to monitor',
    },
    {
      name: 'MESSAGE_PATTERN',
      label: 'Message Pattern',
      type: 'STRING',
      required: false,
      defaultValue: '.*',
      description: 'Regex pattern to match in event message',
    },
  ],
  throttle: null,
  isBuiltIn: false,
  version: '1.0.0',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

const templateNoVariables: AlertRuleTemplate = {
  id: 'simple-alert',
  name: 'Simple Offline Alert',
  description: 'Alert immediately when device goes offline',
  category: 'NETWORK',
  severity: 'CRITICAL',
  eventType: 'device.offline',
  conditions: [
    {
      field: 'status',
      operator: 'EQUALS',
      value: 'offline',
    },
  ],
  channels: ['email', 'inapp'],
  variables: [],
  throttle: null,
  isBuiltIn: true,
  version: '1.0.0',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

// =============================================================================
// Stories
// =============================================================================

/**
 * Default form with numeric variables (DURATION and INTEGER types)
 */
export const Default: Story = {
  args: {
    template: templateWithNumericVariables,
    onSubmit: fn(),
    onCancel: fn(),
    isSubmitting: false,
  },
};

/**
 * Form with mixed variable types (INTEGER, DURATION, PERCENTAGE, STRING)
 */
export const MixedVariableTypes: Story = {
  args: {
    template: templateWithMixedVariables,
    onSubmit: fn(),
    onCancel: fn(),
    isSubmitting: false,
  },
};

/**
 * Form with string variables only
 */
export const StringVariables: Story = {
  args: {
    template: templateWithStringVariables,
    onSubmit: fn(),
    onCancel: fn(),
    isSubmitting: false,
  },
};

/**
 * Template with no variables (shows message + direct apply button)
 */
export const NoVariables: Story = {
  args: {
    template: templateNoVariables,
    onSubmit: fn(),
    onCancel: fn(),
    isSubmitting: false,
  },
};

/**
 * Form in submitting state (buttons disabled)
 */
export const Submitting: Story = {
  args: {
    template: templateWithNumericVariables,
    onSubmit: fn(),
    onCancel: fn(),
    isSubmitting: true,
  },
};

/**
 * Form without cancel button
 */
export const NoCancel: Story = {
  args: {
    template: templateWithNumericVariables,
    onSubmit: fn(),
    onCancel: undefined,
    isSubmitting: false,
  },
};

/**
 * Form with many variables (scrollable)
 */
export const ManyVariables: Story = {
  args: {
    template: {
      ...templateWithMixedVariables,
      variables: [
        ...templateWithMixedVariables.variables,
        {
          name: 'COOL_DOWN_PERIOD',
          label: 'Cool Down Period',
          type: 'DURATION',
          required: false,
          defaultValue: '300',
          min: 60,
          max: 3600,
          unit: 'seconds',
          description: 'Time to wait before re-checking after violation',
        },
        {
          name: 'ALERT_PRIORITY',
          label: 'Alert Priority',
          type: 'INTEGER',
          required: true,
          defaultValue: '5',
          min: 1,
          max: 10,
          description: 'Priority level for this alert (1=lowest, 10=highest)',
        },
        {
          name: 'EXCLUDE_IPS',
          label: 'Exclude IP Addresses',
          type: 'STRING',
          required: false,
          description: 'Comma-separated list of IP addresses to exclude',
        },
      ],
    },
    onSubmit: fn(),
    onCancel: fn(),
    isSubmitting: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Form with many variables demonstrates scrollable behavior and complex variable configurations.',
      },
    },
  },
};

/**
 * Form demonstrating validation errors (interactive)
 */
export const WithValidationErrors: Story = {
  args: {
    template: templateWithNumericVariables,
    onSubmit: fn(),
    onCancel: fn(),
    isSubmitting: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Try clearing required fields or entering values outside min/max ranges to see validation errors.',
      },
    },
  },
};
