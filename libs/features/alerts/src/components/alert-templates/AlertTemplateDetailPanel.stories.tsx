/**
 * AlertTemplateDetailPanel Storybook Stories
 * NAS-18.12: Alert Rule Templates Feature
 *
 * Showcases all states of the AlertTemplateDetailPanel component:
 * - Built-in template with variables (tabbed layout)
 * - Built-in template without variables (single-view layout)
 * - Custom (user-created) template with Delete action
 * - Submitting state (disabled actions)
 * - Security / VPN / Resource category templates
 */

import { fn } from 'storybook/test';

import { AlertTemplateDetailPanel } from './AlertTemplateDetailPanel';

import type { AlertRuleTemplate } from '../../schemas/alert-rule-template.schema';
import type { Meta, StoryObj } from '@storybook/react';

// =============================================================================
// Meta
// =============================================================================

const meta: Meta<typeof AlertTemplateDetailPanel> = {
  title: 'Features/Alerts/AlertTemplateDetailPanel',
  component: AlertTemplateDetailPanel,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Displays detailed information about an alert rule template including conditions, variables, channels, and throttle configuration. On desktop (≥640px) it renders as a Dialog; on mobile it renders as a bottom Sheet. Templates with variables get a tabbed layout (Details + Configure); templates without variables show a flat layout with a direct Apply button.',
      },
    },
  },
  argTypes: {
    template: { control: false },
    open: { control: 'boolean' },
    isSubmitting: { control: 'boolean' },
    onClose: { action: 'closed' },
    onApply: { action: 'applied' },
    onExport: { action: 'exported' },
    onDelete: { action: 'deleted' },
  },
};

export default meta;
type Story = StoryObj<typeof AlertTemplateDetailPanel>;

// =============================================================================
// Fixtures
// =============================================================================

const networkTemplateWithVariables: AlertRuleTemplate = {
  id: 'network-device-offline',
  name: 'Device Offline Alert',
  description: 'Alert when a network device goes offline for an extended period.',
  category: 'NETWORK',
  severity: 'CRITICAL',
  eventType: 'device.offline',
  conditions: [
    { field: 'status', operator: 'EQUALS', value: 'offline' },
    { field: 'duration', operator: 'GREATER_THAN', value: '{{DURATION_SECONDS}}' },
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
      description: 'How long the device must be offline before an alert is sent.',
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
  updatedAt: '2024-01-15T10:30:00Z',
};

const networkTemplateNoVariables: AlertRuleTemplate = {
  id: 'network-simple-offline',
  name: 'Simple Offline Alert',
  description: 'Alert immediately when any device goes offline. No configuration needed.',
  category: 'NETWORK',
  severity: 'CRITICAL',
  eventType: 'device.offline',
  conditions: [{ field: 'status', operator: 'EQUALS', value: 'offline' }],
  channels: ['email', 'inapp'],
  variables: [],
  throttle: undefined,
  isBuiltIn: true,
  version: '1.0.0',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

const securityTemplate: AlertRuleTemplate = {
  id: 'security-brute-force',
  name: 'Brute Force Detection',
  description: 'Alert when repeated failed login attempts are detected from the same IP address.',
  category: 'SECURITY',
  severity: 'CRITICAL',
  eventType: 'auth.login.failed',
  conditions: [
    { field: 'failure_count', operator: 'GREATER_THAN', value: '{{MAX_FAILURES}}' },
    { field: 'time_window', operator: 'LESS_THAN', value: '{{TIME_WINDOW}}' },
  ],
  channels: ['email', 'inapp', 'webhook'],
  variables: [
    {
      name: 'MAX_FAILURES',
      label: 'Max Failed Attempts',
      type: 'INTEGER',
      required: true,
      defaultValue: '5',
      min: 3,
      max: 50,
      description: 'Number of failed login attempts before alerting.',
    },
    {
      name: 'TIME_WINDOW',
      label: 'Detection Window',
      type: 'DURATION',
      required: true,
      defaultValue: '300',
      min: 60,
      max: 3600,
      unit: 'seconds',
      description: 'Time window in which failures are counted.',
    },
  ],
  throttle: {
    maxAlerts: 3,
    periodSeconds: 3600,
    groupByField: 'source_ip',
  },
  isBuiltIn: true,
  version: '2.1.0',
  createdAt: '2024-02-01T00:00:00Z',
  updatedAt: '2024-03-10T14:00:00Z',
};

const resourcesTemplate: AlertRuleTemplate = {
  id: 'resources-high-cpu',
  name: 'High CPU Usage Alert',
  description: 'Alert when CPU usage exceeds a configurable threshold for a sustained period.',
  category: 'RESOURCES',
  severity: 'WARNING',
  eventType: 'system.cpu.high',
  conditions: [{ field: 'cpu_percent', operator: 'GREATER_THAN', value: '{{CPU_THRESHOLD}}' }],
  channels: ['inapp'],
  variables: [
    {
      name: 'CPU_THRESHOLD',
      label: 'CPU Threshold',
      type: 'PERCENTAGE',
      required: true,
      defaultValue: '85',
      min: 50,
      max: 99,
      unit: '%',
      description: 'CPU usage percentage at which to fire the alert.',
    },
  ],
  throttle: {
    maxAlerts: 5,
    periodSeconds: 600,
    groupByField: undefined,
  },
  isBuiltIn: true,
  version: '1.2.0',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-20T09:00:00Z',
};

const customTemplate: AlertRuleTemplate = {
  id: 'custom-my-alert',
  name: 'My Custom Alert',
  description: 'User-created alert rule for monitoring a specific event.',
  category: 'CUSTOM',
  severity: 'INFO',
  eventType: 'custom.event',
  conditions: [{ field: 'event_name', operator: 'EQUALS', value: 'my-event' }],
  channels: ['inapp'],
  variables: [],
  throttle: undefined,
  isBuiltIn: false,
  version: '1.0.0',
  createdAt: '2025-01-10T00:00:00Z',
  updatedAt: '2025-01-10T00:00:00Z',
};

// =============================================================================
// Stories
// =============================================================================

/**
 * Built-in network template that has variables — shows the tabbed layout
 * with a Details tab and a Configure tab containing the variable input form.
 */
export const WithVariables: Story = {
  args: {
    template: networkTemplateWithVariables,
    open: true,
    isSubmitting: false,
    onClose: fn(),
    onApply: fn(),
    onExport: fn(),
  },
};

/**
 * Built-in template with no variables — shows the flat single-view layout
 * with a direct Apply Template button.
 */
export const NoVariables: Story = {
  args: {
    template: networkTemplateNoVariables,
    open: true,
    isSubmitting: false,
    onClose: fn(),
    onApply: fn(),
    onExport: fn(),
  },
  parameters: {
    docs: {
      description: {
        story:
          'When a template has no variables the tabbed layout is replaced by a single details view with a direct Apply button.',
      },
    },
  },
};

/**
 * Security category template with multiple variables and throttle config.
 */
export const SecurityTemplate: Story = {
  args: {
    template: securityTemplate,
    open: true,
    isSubmitting: false,
    onClose: fn(),
    onApply: fn(),
    onExport: fn(),
  },
  parameters: {
    docs: {
      description: {
        story:
          'Security category template showcasing multiple variables and a group-by throttle configuration.',
      },
    },
  },
};

/**
 * Resources category template with a percentage variable.
 */
export const ResourcesTemplate: Story = {
  args: {
    template: resourcesTemplate,
    open: true,
    isSubmitting: false,
    onClose: fn(),
    onApply: fn(),
    onExport: fn(),
  },
};

/**
 * Custom (user-created) template — shows the Delete button alongside Export.
 * The Delete button is hidden for built-in templates.
 */
export const CustomTemplateWithDelete: Story = {
  args: {
    template: customTemplate,
    open: true,
    isSubmitting: false,
    onClose: fn(),
    onApply: fn(),
    onExport: fn(),
    onDelete: fn(),
  },
  parameters: {
    docs: {
      description: {
        story:
          'User-created (non-built-in) templates show a destructive Delete button that is hidden for built-in templates.',
      },
    },
  },
};

/**
 * Submitting state — all action buttons are disabled and the Apply button
 * shows "Applying..." text.
 */
export const Submitting: Story = {
  args: {
    template: networkTemplateNoVariables,
    open: true,
    isSubmitting: true,
    onClose: fn(),
    onApply: fn(),
    onExport: fn(),
  },
  parameters: {
    docs: {
      description: {
        story:
          'While the template is being applied all action buttons are disabled to prevent duplicate submissions.',
      },
    },
  },
};
