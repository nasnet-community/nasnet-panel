/**
 * SaveTemplateDialog Storybook Stories
 * NAS-18.12: Alert Rule Templates Feature
 *
 * Stories demonstrating the SaveTemplateDialog component for saving
 * alert rules as reusable templates.
 */

import { MockedProvider } from '@apollo/client/testing';
import { fn } from 'storybook/test';

import { SaveTemplateDialog } from './SaveTemplateDialog';
import { SAVE_CUSTOM_ALERT_RULE_TEMPLATE } from '@nasnet/api-client/queries';

import type { Meta, StoryObj } from '@storybook/react';

// =============================================================================
// Meta Configuration
// =============================================================================

const meta: Meta<typeof SaveTemplateDialog> = {
  title: 'Features/Alerts/Alert Templates/SaveTemplateDialog',
  component: SaveTemplateDialog,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
### SaveTemplateDialog Component

Dialog for saving an existing alert rule as a reusable template.

**Features:**
- Pre-fills form with alert rule data
- Template naming and description
- Category selection (7 categories)
- Optional variable definitions for customization
- Validation with Zod schema
- Success/error feedback with toast notifications

**Workflow:**
1. User opens dialog from existing alert rule
2. Form pre-filled with rule data
3. User customizes name, description, category
4. User optionally defines variables (future enhancement)
5. Save creates custom template
6. Template appears in browser with CUSTOM category

**Usage:**
\`\`\`tsx
<SaveTemplateDialog
  open={isOpen}
  onOpenChange={setIsOpen}
  alertRule={alertRuleData}
  onTemplateSaved={(templateId) => console.log('Saved:', templateId)}
/>
\`\`\`
        `,
      },
    },
  },
  argTypes: {
    open: {
      description: 'Whether the dialog is open',
      control: 'boolean',
    },
    onOpenChange: {
      description: 'Callback when dialog is closed',
      action: 'openChange',
    },
    alertRule: {
      description: 'Alert rule to save as template',
      control: 'object',
    },
    onTemplateSaved: {
      description: 'Callback when template is successfully saved',
      action: 'templateSaved',
    },
  },
  decorators: [
    (Story) => (
      <div className="flex min-h-screen items-center justify-center p-8">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof SaveTemplateDialog>;

// =============================================================================
// Mock Data
// =============================================================================

const mockAlertRule = {
  name: 'Device Offline Alert',
  description: 'Alert when a MikroTik device goes offline and becomes unreachable',
  eventType: 'device.offline',
  severity: 'CRITICAL' as const,
  conditions: [
    {
      field: 'status',
      operator: 'eq',
      value: 'offline',
    },
    {
      field: 'duration',
      operator: 'gt',
      value: '60',
    },
  ],
  channels: ['email', 'inapp'],
  throttle: {
    maxAlerts: 1,
    periodSeconds: 300,
    groupByField: 'deviceId',
  },
};

const mockHighCPUAlertRule = {
  name: 'High CPU Usage',
  description: 'Alert when CPU usage exceeds 85% for more than 5 minutes',
  eventType: 'device.cpu.high',
  severity: 'WARNING' as const,
  conditions: [
    {
      field: 'cpuUsage',
      operator: 'gt',
      value: '85',
    },
    {
      field: 'duration',
      operator: 'gt',
      value: '300',
    },
  ],
  channels: ['email', 'inapp'],
};

// =============================================================================
// Apollo Mocks
// =============================================================================

const successMocks = [
  {
    request: {
      query: SAVE_CUSTOM_ALERT_RULE_TEMPLATE,
      variables: {
        input: {
          name: 'Device Offline Alert',
          description: 'Alert when a MikroTik device goes offline and becomes unreachable',
          category: 'NETWORK',
          eventType: 'device.offline',
          severity: 'CRITICAL',
          conditions: mockAlertRule.conditions,
          channels: mockAlertRule.channels,
          throttle: mockAlertRule.throttle,
          variables: [],
        },
      },
    },
    result: {
      data: {
        saveCustomAlertRuleTemplate: {
          template: {
            id: 'custom-template-1',
            name: 'Device Offline Alert',
            description: 'Alert when a MikroTik device goes offline and becomes unreachable',
            category: 'NETWORK',
            eventType: 'device.offline',
            severity: 'CRITICAL',
            isBuiltIn: false,
            isDefault: false,
            variableCount: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          errors: [],
        },
      },
    },
  },
];

const _errorMocks = [
  {
    request: {
      query: SAVE_CUSTOM_ALERT_RULE_TEMPLATE,
      variables: {
        input: {
          name: 'Device Offline Alert',
          description: 'Alert when a MikroTik device goes offline and becomes unreachable',
          category: 'NETWORK',
          eventType: 'device.offline',
          severity: 'CRITICAL',
          conditions: mockAlertRule.conditions,
          channels: mockAlertRule.channels,
          throttle: mockAlertRule.throttle,
          variables: [],
        },
      },
    },
    result: {
      data: {
        saveCustomAlertRuleTemplate: {
          template: null,
          errors: [
            {
              code: 'VALIDATION_ERROR',
              message: 'A template with this name already exists',
              field: 'name',
            },
          ],
        },
      },
    },
  },
];

// =============================================================================
// Stories
// =============================================================================

/**
 * Default state with a device offline alert rule pre-filled in the form.
 */
export const Default: Story = {
  args: {
    open: true,
    onOpenChange: fn(),
    alertRule: mockAlertRule,
    onTemplateSaved: fn(),
  },
  decorators: [
    (Story) => (
      <MockedProvider
        mocks={successMocks}
        addTypename={false}
      >
        <Story />
      </MockedProvider>
    ),
  ],
};

/**
 * Dialog with a high CPU alert rule demonstrating different severity and conditions.
 */
export const WithHighCPURule: Story = {
  args: {
    open: true,
    onOpenChange: fn(),
    alertRule: mockHighCPUAlertRule,
    onTemplateSaved: fn(),
  },
  decorators: [
    (Story) => (
      <MockedProvider
        mocks={successMocks}
        addTypename={false}
      >
        <Story />
      </MockedProvider>
    ),
  ],
};

/**
 * Loading state when saving the template (shows disabled submit button).
 */
export const Loading: Story = {
  args: {
    open: true,
    onOpenChange: fn(),
    alertRule: mockAlertRule,
    onTemplateSaved: fn(),
  },
  decorators: [
    (Story) => (
      <MockedProvider
        mocks={[]}
        addTypename={false}
      >
        <Story />
      </MockedProvider>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story:
          'Loading state is shown when the mutation is in progress. Submit button shows "Saving..." and is disabled.',
      },
    },
  },
};
