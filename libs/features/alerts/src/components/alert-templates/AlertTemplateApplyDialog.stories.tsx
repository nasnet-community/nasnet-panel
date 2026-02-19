/**
 * AlertTemplateApplyDialog Storybook Stories
 * NAS-18.12: Alert Rule Templates Feature
 *
 * Showcases the apply dialog workflow:
 * - Loading state (template fetching skeleton)
 * - Template with variables (full form)
 * - Template without variables (simplified form)
 * - Applying/submitting state
 * - Error state (failed to load template)
 */

import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import { MockedProvider } from '@apollo/client/testing';
import { AlertTemplateApplyDialog } from './AlertTemplateApplyDialog';
import {
  GET_ALERT_RULE_TEMPLATE_BY_ID,
  APPLY_ALERT_RULE_TEMPLATE,
  PREVIEW_ALERT_RULE_TEMPLATE,
} from '@nasnet/api-client/queries';

// =============================================================================
// Meta
// =============================================================================

const meta: Meta<typeof AlertTemplateApplyDialog> = {
  title: 'Features/Alerts/AlertTemplateApplyDialog',
  component: AlertTemplateApplyDialog,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Full-featured dialog for applying an alert rule template. Fetches the template by ID, dynamically generates a form from its variables, validates with Zod, shows a real-time preview of resolved conditions, and calls a GraphQL mutation to create the alert rule. On desktop (≥640px) renders as a Dialog; on mobile renders as a bottom Sheet.',
      },
    },
  },
  argTypes: {
    templateId: { control: 'text' },
    open: { control: 'boolean' },
    onClose: { action: 'closed' },
    onSuccess: { action: 'success' },
    onError: { action: 'error' },
  },
};

export default meta;
type Story = StoryObj<typeof AlertTemplateApplyDialog>;

// =============================================================================
// Mock Data
// =============================================================================

const mockTemplateWithVariables = {
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
      description: 'How long the device must be offline before alerting.',
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

const mockTemplateNoVariables = {
  id: 'simple-offline',
  name: 'Simple Offline Alert',
  description: 'Alert immediately when any device goes offline.',
  category: 'NETWORK',
  severity: 'CRITICAL',
  eventType: 'device.offline',
  conditions: [{ field: 'status', operator: 'EQUALS', value: 'offline' }],
  channels: ['email', 'inapp'],
  variables: [],
  throttle: null,
  isBuiltIn: true,
  version: '1.0.0',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

const mockSecurityTemplate = {
  id: 'security-brute-force',
  name: 'Brute Force Detection',
  description: 'Alert when repeated failed login attempts are detected.',
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
  throttle: { maxAlerts: 3, periodSeconds: 3600, groupByField: 'source_ip' },
  isBuiltIn: true,
  version: '2.1.0',
  createdAt: '2024-02-01T00:00:00Z',
  updatedAt: '2024-03-10T14:00:00Z',
};

// Mocked GraphQL response for a successfully applied template
const applySuccessMock = {
  request: {
    query: APPLY_ALERT_RULE_TEMPLATE,
    variables: {
      templateId: 'network-device-offline',
      variables: { DURATION_SECONDS: '60' },
      customizations: { enabled: true },
    },
  },
  result: {
    data: {
      applyAlertRuleTemplate: {
        alertRule: {
          id: 'rule-001',
          name: 'Device Offline Alert',
          description: 'Alert when a network device goes offline for an extended period.',
          eventType: 'device.offline',
          conditions: [{ field: 'status', operator: 'EQUALS', value: 'offline' }],
          severity: 'CRITICAL',
          channels: ['email', 'inapp'],
          throttle: { maxAlerts: 1, periodSeconds: 300, groupByField: 'device_id' },
          enabled: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        errors: [],
      },
    },
  },
};

// Preview mock for resolved conditions
const previewMock = {
  request: {
    query: PREVIEW_ALERT_RULE_TEMPLATE,
    variables: {
      templateId: 'network-device-offline',
      variables: { DURATION_SECONDS: '60' },
    },
  },
  result: {
    data: {
      previewAlertRuleTemplate: {
        preview: {
          template: mockTemplateWithVariables,
          resolvedConditions: [
            { field: 'status', operator: 'EQUALS', value: 'offline' },
            { field: 'duration', operator: 'GREATER_THAN', value: '60' },
          ],
          validationInfo: {
            isValid: true,
            missingVariables: [],
            warnings: [],
          },
        },
        errors: [],
      },
    },
  },
};

// =============================================================================
// Stories
// =============================================================================

/**
 * Default — dialog opened for a template that has one variable.
 * Shows the dynamic form with a duration input field and a preview section.
 */
export const Default: Story = {
  args: {
    templateId: 'network-device-offline',
    open: true,
    onClose: fn(),
    onSuccess: fn(),
    onError: fn(),
  },
  decorators: [
    (Story) => (
      <MockedProvider
        mocks={[
          {
            request: {
              query: GET_ALERT_RULE_TEMPLATE_BY_ID,
              variables: { id: 'network-device-offline' },
            },
            result: { data: { alertRuleTemplate: mockTemplateWithVariables } },
            delay: 300,
          },
          previewMock,
          applySuccessMock,
        ]}
        addTypename={false}
      >
        <Story />
      </MockedProvider>
    ),
  ],
};

/**
 * Loading — simulates the skeleton state while the template is being fetched.
 */
export const Loading: Story = {
  args: {
    templateId: 'network-device-offline',
    open: true,
    onClose: fn(),
    onSuccess: fn(),
    onError: fn(),
  },
  decorators: [
    (Story) => (
      <MockedProvider
        mocks={[
          {
            request: {
              query: GET_ALERT_RULE_TEMPLATE_BY_ID,
              variables: { id: 'network-device-offline' },
            },
            result: { data: { alertRuleTemplate: mockTemplateWithVariables } },
            delay: 60000, // long delay forces loading skeleton to stay visible
          },
        ]}
        addTypename={false}
      >
        <Story />
      </MockedProvider>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story: 'Shows the skeleton loading state while the template data is being fetched from the server.',
      },
    },
  },
};

/**
 * No Variables — template that requires no configuration.
 * The variable section is hidden and the form only shows customization fields.
 */
export const NoVariables: Story = {
  args: {
    templateId: 'simple-offline',
    open: true,
    onClose: fn(),
    onSuccess: fn(),
    onError: fn(),
  },
  decorators: [
    (Story) => (
      <MockedProvider
        mocks={[
          {
            request: {
              query: GET_ALERT_RULE_TEMPLATE_BY_ID,
              variables: { id: 'simple-offline' },
            },
            result: { data: { alertRuleTemplate: mockTemplateNoVariables } },
            delay: 200,
          },
        ]}
        addTypename={false}
      >
        <Story />
      </MockedProvider>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story: 'When the template has no variables the variable form section is omitted and the dialog goes straight to customizations and the Apply button.',
      },
    },
  },
};

/**
 * Multiple Variables — security template requiring two inputs.
 */
export const MultipleVariables: Story = {
  args: {
    templateId: 'security-brute-force',
    open: true,
    onClose: fn(),
    onSuccess: fn(),
    onError: fn(),
  },
  decorators: [
    (Story) => (
      <MockedProvider
        mocks={[
          {
            request: {
              query: GET_ALERT_RULE_TEMPLATE_BY_ID,
              variables: { id: 'security-brute-force' },
            },
            result: { data: { alertRuleTemplate: mockSecurityTemplate } },
            delay: 200,
          },
        ]}
        addTypename={false}
      >
        <Story />
      </MockedProvider>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story: 'Security template with two required variables (INTEGER and DURATION types).',
      },
    },
  },
};

/**
 * Error state — shown when the template cannot be loaded.
 */
export const TemplateLoadError: Story = {
  args: {
    templateId: 'network-device-offline',
    open: true,
    onClose: fn(),
    onSuccess: fn(),
    onError: fn(),
  },
  decorators: [
    (Story) => (
      <MockedProvider
        mocks={[
          {
            request: {
              query: GET_ALERT_RULE_TEMPLATE_BY_ID,
              variables: { id: 'network-device-offline' },
            },
            error: new Error('Failed to load template — server unreachable'),
          },
        ]}
        addTypename={false}
      >
        <Story />
      </MockedProvider>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story: 'Error state displayed when the GraphQL query for the template fails.',
      },
    },
  },
};

/**
 * Closed — dialog is mounted but not visible (open=false).
 */
export const Closed: Story = {
  args: {
    templateId: 'network-device-offline',
    open: false,
    onClose: fn(),
    onSuccess: fn(),
    onError: fn(),
  },
  decorators: [
    (Story) => (
      <MockedProvider mocks={[]} addTypename={false}>
        <Story />
      </MockedProvider>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story: 'The dialog renders nothing when open=false — useful for controlled state testing.',
      },
    },
  },
};
