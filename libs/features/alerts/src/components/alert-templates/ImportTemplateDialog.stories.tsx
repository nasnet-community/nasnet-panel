/**
 * ImportTemplateDialog Storybook Stories
 * NAS-18.12: Alert Rule Templates Feature
 *
 * Stories demonstrating the ImportTemplateDialog component for importing
 * alert rule templates from JSON files.
 */

import { MockedProvider } from '@apollo/client/testing';
import { fn } from '@storybook/test';

import { ImportTemplateDialog } from './ImportTemplateDialog';
import { IMPORT_ALERT_RULE_TEMPLATE } from '../../hooks/useAlertRuleTemplates';

import type { Meta, StoryObj } from '@storybook/react';

// =============================================================================
// Meta Configuration
// =============================================================================

const meta: Meta<typeof ImportTemplateDialog> = {
  title: 'Features/Alerts/Alert Templates/ImportTemplateDialog',
  component: ImportTemplateDialog,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
### ImportTemplateDialog Component

Dialog for importing alert rule templates from JSON files.

**Features:**
- File upload (.json files)
- JSON paste into textarea
- Client-side validation with Zod schema
- Server-side validation via GraphQL mutation
- Error display with specific field errors
- Success feedback with toast notification

**Workflow:**
1. User opens dialog
2. User uploads .json file OR pastes JSON
3. Client validates JSON structure
4. Server validates template data
5. Template is imported and appears in browser

**Validation:**
- JSON must be valid
- Must match AlertRuleTemplate schema
- Event type must exist
- Conditions must be valid
- Variables must be properly defined

**Usage:**
\`\`\`tsx
<ImportTemplateDialog
  open={isOpen}
  onOpenChange={setIsOpen}
  onTemplateImported={(templateId) => console.log('Imported:', templateId)}
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
    onTemplateImported: {
      description: 'Callback when template is successfully imported',
      action: 'templateImported',
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
type Story = StoryObj<typeof ImportTemplateDialog>;

// =============================================================================
// Mock Data
// =============================================================================

const validTemplateJSON = JSON.stringify(
  {
    name: 'High CPU Alert',
    description: 'Alert when CPU usage exceeds threshold for extended period',
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

const invalidTemplateJSON = `{
  "name": "Invalid Template",
  "description": "Missing required fields",
  "category": "INVALID_CATEGORY",
  // Invalid comment in JSON
  "eventType": "device.invalid"
}`;

// =============================================================================
// Apollo Mocks
// =============================================================================

const successMocks = [
  {
    request: {
      query: IMPORT_ALERT_RULE_TEMPLATE,
      variables: {
        json: validTemplateJSON,
      },
    },
    result: {
      data: {
        importAlertRuleTemplate: {
          template: {
            id: 'imported-template-1',
            name: 'High CPU Alert',
            description: 'Alert when CPU usage exceeds threshold for extended period',
            category: 'RESOURCES',
            eventType: 'device.cpu.high',
            severity: 'WARNING',
            isBuiltIn: false,
            isDefault: false,
            variableCount: 2,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          errors: [],
        },
      },
    },
  },
];

const validationErrorMocks = [
  {
    request: {
      query: IMPORT_ALERT_RULE_TEMPLATE,
      variables: {
        json: expect.any(String),
      },
    },
    result: {
      data: {
        importAlertRuleTemplate: {
          template: null,
          errors: [
            {
              code: 'VALIDATION_ERROR',
              message: 'Invalid event type: device.invalid',
              field: 'eventType',
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
 * Default state showing empty dialog ready for file upload or JSON paste.
 */
export const Default: Story = {
  args: {
    open: true,
    onOpenChange: fn(),
    onTemplateImported: fn(),
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
 * Dialog with invalid JSON showing validation error.
 * Demonstrates client-side JSON parsing error.
 */
export const InvalidJSON: Story = {
  args: {
    open: true,
    onOpenChange: fn(),
    onTemplateImported: fn(),
  },
  decorators: [
    (Story) => (
      <MockedProvider mocks={validationErrorMocks} addTypename={false}>
        <Story />
      </MockedProvider>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story:
          'Shows validation error when user pastes invalid JSON (syntax errors, comments, etc.). Error message displayed in red alert box.',
      },
    },
  },
};

/**
 * Dialog showing successful import with valid template JSON.
 * Pre-filled with valid JSON for demonstration.
 */
export const Success: Story = {
  args: {
    open: true,
    onOpenChange: fn(),
    onTemplateImported: fn(),
  },
  decorators: [
    (Story) => (
      <MockedProvider mocks={successMocks} addTypename={false}>
        <Story />
      </MockedProvider>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story:
          'Success state after importing a valid template. Shows toast notification and closes dialog.',
      },
    },
  },
};
