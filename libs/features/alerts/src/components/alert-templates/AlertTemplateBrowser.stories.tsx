/**
 * AlertTemplateBrowser Storybook Stories
 * NAS-18.12: Alert Rule Templates Feature
 *
 * Comprehensive stories showcasing all states and variants of the AlertTemplateBrowser component.
 */

import type { Meta, StoryObj } from '@storybook/react';
import { within, userEvent, expect } from '@storybook/test';
import { MockedProvider } from '@apollo/client/testing';
import { AlertTemplateBrowser } from './AlertTemplateBrowser';
import {
  allTemplates,
  builtInTemplates,
  customTemplate,
  templatesByCategory,
} from '../../__test-utils__/alert-rule-template-fixtures';
import { GET_ALERT_RULE_TEMPLATES, APPLY_ALERT_RULE_TEMPLATE } from '@nasnet/api-client/queries';

// =============================================================================
// Meta
// =============================================================================

const meta: Meta<typeof AlertTemplateBrowser> = {
  title: 'Features/Alerts/AlertTemplateBrowser',
  component: AlertTemplateBrowser,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
AlertTemplateBrowser provides a browseable gallery of alert rule templates with filtering,
search, and template application functionality.

**Features:**
- Filter by 7 categories (Network, Security, Resources, VPN, DHCP, System, Custom)
- Search by template name or description
- Sort by name, category, or date
- Preview template with variable substitution
- Create alert rule from template with custom values
- Built-in and custom templates
- Fully responsive (Mobile/Desktop)
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    onRuleCreated: { action: 'rule-created' },
    initialCategory: {
      control: 'select',
      options: ['', 'NETWORK', 'SECURITY', 'RESOURCES', 'VPN', 'DHCP', 'SYSTEM', 'CUSTOM'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof AlertTemplateBrowser>;

// =============================================================================
// Mocks
// =============================================================================

const createMocks = (templates: typeof allTemplates, delay = 500) => [
  {
    request: {
      query: GET_ALERT_RULE_TEMPLATES,
      variables: {},
    },
    result: {
      data: {
        alertRuleTemplates: templates,
      },
    },
    delay,
  },
  {
    request: {
      query: APPLY_ALERT_RULE_TEMPLATE,
      variables: {
        templateId: 'device-offline',
        variables: { OFFLINE_DURATION: 60 },
      },
    },
    result: {
      data: {
        applyAlertRuleTemplate: {
          alertRule: {
            id: 'rule-1',
            name: 'Device Offline Alert',
            description: 'Alerts when device goes offline',
            eventType: 'router.offline',
            conditions: [
              { field: 'status', operator: 'EQUALS', value: 'offline' },
              { field: 'duration', operator: 'GREATER_THAN', value: '60' },
            ],
            severity: 'CRITICAL',
            channels: ['email', 'inapp'],
            throttle: {
              maxAlerts: 1,
              periodSeconds: 3600,
              groupByField: 'deviceId',
            },
            enabled: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          errors: [],
        },
      },
    },
  },
];

// =============================================================================
// Stories
// =============================================================================

/**
 * Default state with all templates
 */
export const Default: Story = {
  args: {},
  decorators: [
    (Story) => (
      <MockedProvider mocks={createMocks(allTemplates, 100)} addTypename={false}>
        <Story />
      </MockedProvider>
    ),
  ],
};

/**
 * Filtered by Network category
 */
export const FilteredByCategory: Story = {
  args: {
    initialCategory: 'NETWORK',
  },
  decorators: [
    (Story) => (
      <MockedProvider
        mocks={[
          {
            request: {
              query: GET_ALERT_RULE_TEMPLATES,
              variables: { category: 'NETWORK' },
            },
            result: {
              data: {
                alertRuleTemplates: templatesByCategory.NETWORK,
              },
            },
            delay: 100,
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
        story: 'Browser filtered to show only Network category templates.',
      },
    },
  },
};

/**
 * Security category templates
 */
export const SecurityTemplates: Story = {
  args: {
    initialCategory: 'SECURITY',
  },
  decorators: [
    (Story) => (
      <MockedProvider
        mocks={[
          {
            request: {
              query: GET_ALERT_RULE_TEMPLATES,
              variables: { category: 'SECURITY' },
            },
            result: {
              data: {
                alertRuleTemplates: templatesByCategory.SECURITY,
              },
            },
            delay: 100,
          },
        ]}
        addTypename={false}
      >
        <Story />
      </MockedProvider>
    ),
  ],
};

/**
 * Resources category templates
 */
export const ResourceTemplates: Story = {
  args: {
    initialCategory: 'RESOURCES',
  },
  decorators: [
    (Story) => (
      <MockedProvider
        mocks={[
          {
            request: {
              query: GET_ALERT_RULE_TEMPLATES,
              variables: { category: 'RESOURCES' },
            },
            result: {
              data: {
                alertRuleTemplates: templatesByCategory.RESOURCES,
              },
            },
            delay: 100,
          },
        ]}
        addTypename={false}
      >
        <Story />
      </MockedProvider>
    ),
  ],
};

/**
 * Empty state - no templates found
 */
export const Empty: Story = {
  args: {},
  decorators: [
    (Story) => (
      <MockedProvider
        mocks={[
          {
            request: {
              query: GET_ALERT_RULE_TEMPLATES,
              variables: {},
            },
            result: {
              data: {
                alertRuleTemplates: [],
              },
            },
            delay: 100,
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
        story: 'Empty state when no templates are available.',
      },
    },
  },
};

/**
 * Loading state
 */
export const Loading: Story = {
  args: {},
  decorators: [
    (Story) => (
      <MockedProvider mocks={createMocks(allTemplates, 5000)} addTypename={false}>
        <Story />
      </MockedProvider>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story: 'Loading state while fetching templates from the server.',
      },
    },
  },
};

/**
 * Error state
 */
export const Error: Story = {
  args: {},
  decorators: [
    (Story) => (
      <MockedProvider
        mocks={[
          {
            request: {
              query: GET_ALERT_RULE_TEMPLATES,
              variables: {},
            },
            error: new Error('Failed to load templates'),
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
        story: 'Error state when template loading fails.',
      },
    },
  },
};

/**
 * Custom templates only
 */
export const CustomOnly: Story = {
  args: {
    initialCategory: 'CUSTOM',
  },
  decorators: [
    (Story) => (
      <MockedProvider
        mocks={[
          {
            request: {
              query: GET_ALERT_RULE_TEMPLATES,
              variables: { category: 'CUSTOM' },
            },
            result: {
              data: {
                alertRuleTemplates: [customTemplate],
              },
            },
            delay: 100,
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
        story: 'Browser showing only custom user-created templates.',
      },
    },
  },
};

/**
 * Mobile viewport
 */
export const Mobile: Story = {
  args: {},
  decorators: [
    (Story) => (
      <MockedProvider mocks={createMocks(allTemplates, 100)} addTypename={false}>
        <Story />
      </MockedProvider>
    ),
  ],
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
    docs: {
      description: {
        story: 'Browser on mobile viewport with touch-optimized UI.',
      },
    },
  },
};

/**
 * Tablet viewport
 */
export const Tablet: Story = {
  args: {},
  decorators: [
    (Story) => (
      <MockedProvider mocks={createMocks(allTemplates, 100)} addTypename={false}>
        <Story />
      </MockedProvider>
    ),
  ],
  parameters: {
    viewport: {
      defaultViewport: 'tablet',
    },
  },
};

/**
 * Desktop viewport
 */
export const Desktop: Story = {
  args: {},
  decorators: [
    (Story) => (
      <MockedProvider mocks={createMocks(allTemplates, 100)} addTypename={false}>
        <Story />
      </MockedProvider>
    ),
  ],
  parameters: {
    viewport: {
      defaultViewport: 'desktop',
    },
    docs: {
      description: {
        story: 'Browser on desktop viewport with data-dense layout.',
      },
    },
  },
};

/**
 * Interactive test - Apply template
 */
export const InteractiveApply: Story = {
  args: {},
  decorators: [
    (Story) => (
      <MockedProvider mocks={createMocks(allTemplates, 100)} addTypename={false}>
        <Story />
      </MockedProvider>
    ),
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Wait for templates to load
    await new Promise((resolve) => setTimeout(resolve, 200));

    // Find and click first template card
    const templateCards = await canvas.findAllByRole('button');
    if (templateCards.length > 0) {
      await userEvent.click(templateCards[0]);
    }
  },
  parameters: {
    docs: {
      description: {
        story: 'Interactive example demonstrating template selection and application.',
      },
    },
  },
};
