/**
 * ExportTemplateDialog Storybook Stories
 * NAS-18.12: Alert Rule Templates Feature
 *
 * Stories demonstrating the ExportTemplateDialog component for exporting
 * alert rule templates as JSON files.
 */

import type { Meta, StoryObj } from '@storybook/react';
import { MockedProvider } from '@apollo/client/testing';
import { fn } from '@storybook/test';
import { ExportTemplateDialog } from './ExportTemplateDialog';
import { EXPORT_ALERT_RULE_TEMPLATE } from '../../hooks/useAlertRuleTemplates';

// =============================================================================
// Meta Configuration
// =============================================================================

const meta: Meta<typeof ExportTemplateDialog> = {
  title: 'Features/Alerts/Alert Templates/ExportTemplateDialog',
  component: ExportTemplateDialog,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
### ExportTemplateDialog Component

Dialog for exporting alert rule templates as JSON files.

**Features:**
- Fetches template JSON from server
- Pretty-printed JSON preview
- Copy to clipboard
- Download as .json file
- Filename based on template name

**Workflow:**
1. User opens dialog for selected template
2. Server exports template as JSON string
3. JSON is displayed in textarea (read-only)
4. User can copy to clipboard OR download file
5. Downloaded file is named: template-name.json

**Use Cases:**
- Backup custom templates
- Share templates with other users
- Version control templates in git
- Migrate templates between systems

**Usage:**
\`\`\`tsx
<ExportTemplateDialog
  open={isOpen}
  onOpenChange={setIsOpen}
  templateId="template-1"
  templateName="High CPU Alert"
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
    templateId: {
      description: 'Template ID to export',
      control: 'text',
    },
    templateName: {
      description: 'Template name for filename',
      control: 'text',
    },
  },
  decorators: [
    (Story) => (
      <div className="min-h-screen flex items-center justify-center p-8">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof ExportTemplateDialog>;

// =============================================================================
// Mock Data
// =============================================================================

const exportedTemplateJSON = JSON.stringify(
  {
    name: 'High CPU Alert',
    description: 'Alert when CPU usage exceeds 85% for more than 5 minutes',
    category: 'RESOURCES',
    eventType: 'device.cpu.high',
    severity: 'WARNING',
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
    throttle: {
      maxAlerts: 3,
      periodSeconds: 600,
      groupByField: 'deviceId',
    },
    variables: [
      {
        name: 'CPU_THRESHOLD',
        label: 'CPU Threshold (%)',
        type: 'NUMBER',
        required: true,
        defaultValue: '85',
        min: 50,
        max: 100,
        unit: '%',
        description: 'CPU usage percentage that triggers the alert',
      },
      {
        name: 'DURATION',
        label: 'Duration (seconds)',
        type: 'NUMBER',
        required: true,
        defaultValue: '300',
        min: 60,
        max: 3600,
        unit: 'seconds',
        description: 'How long CPU must be high before alerting',
      },
    ],
  },
  null,
  2
);

const simpleTemplateJSON = JSON.stringify(
  {
    name: 'Device Offline',
    description: 'Alert when device becomes unreachable',
    category: 'NETWORK',
    eventType: 'device.offline',
    severity: 'CRITICAL',
    conditions: [
      {
        field: 'status',
        operator: 'eq',
        value: 'offline',
      },
    ],
    channels: ['email', 'inapp'],
    variables: [],
  },
  null,
  2
);

// =============================================================================
// Apollo Mocks
// =============================================================================

const successMocks = [
  {
    request: {
      query: EXPORT_ALERT_RULE_TEMPLATE,
      variables: {
        id: 'high-cpu-alert',
      },
    },
    result: {
      data: {
        exportAlertRuleTemplate: exportedTemplateJSON,
      },
    },
  },
];

const simpleMocks = [
  {
    request: {
      query: EXPORT_ALERT_RULE_TEMPLATE,
      variables: {
        id: 'device-offline',
      },
    },
    result: {
      data: {
        exportAlertRuleTemplate: simpleTemplateJSON,
      },
    },
  },
];

const loadingMocks = [
  {
    request: {
      query: EXPORT_ALERT_RULE_TEMPLATE,
      variables: {
        id: 'high-cpu-alert',
      },
    },
    delay: 5000, // 5 second delay to show loading state
    result: {
      data: {
        exportAlertRuleTemplate: exportedTemplateJSON,
      },
    },
  },
];

// =============================================================================
// Stories
// =============================================================================

/**
 * Default state showing exported template JSON with copy and download buttons.
 */
export const Default: Story = {
  args: {
    open: true,
    onOpenChange: fn(),
    templateId: 'high-cpu-alert',
    templateName: 'High CPU Alert',
  },
  decorators: [
    (Story) => (
      <MockedProvider mocks={successMocks} addTypename={false}>
        <Story />
      </MockedProvider>
    ),
  ],
};

/**
 * Loading state when fetching template JSON from server.
 * Shows "Loading..." in the textarea.
 */
export const Loading: Story = {
  args: {
    open: true,
    onOpenChange: fn(),
    templateId: 'high-cpu-alert',
    templateName: 'High CPU Alert',
  },
  decorators: [
    (Story) => (
      <MockedProvider mocks={loadingMocks} addTypename={false}>
        <Story />
      </MockedProvider>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story:
          'Loading state while fetching template JSON. Textarea shows "Loading..." and buttons are disabled.',
      },
    },
  },
};

/**
 * Dialog with simpler template (fewer fields, no variables).
 * Demonstrates cleaner JSON export.
 */
export const SimpleTemplate: Story = {
  args: {
    open: true,
    onOpenChange: fn(),
    templateId: 'device-offline',
    templateName: 'Device Offline',
  },
  decorators: [
    (Story) => (
      <MockedProvider mocks={simpleMocks} addTypename={false}>
        <Story />
      </MockedProvider>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story:
          'Exports a simpler template with no variables and minimal conditions. Shows cleaner JSON structure.',
      },
    },
  },
};
