/**
 * WebhookConfigForm Storybook Stories
 * NAS-18.4: Webhook notification configuration with Platform Presenters
 *
 * Showcases create/edit modes, authentication variants, template presets,
 * and platform-specific layouts for the webhook configuration form.
 */

import { MockedProvider } from '@apollo/client/testing';
import { fn } from 'storybook/test';

import { WebhookConfigForm } from './WebhookConfigForm';

import type { Meta, StoryObj } from '@storybook/react';

// =============================================================================
// Meta
// =============================================================================

const meta: Meta<typeof WebhookConfigForm> = {
  title: 'Features/Alerts/WebhookConfigForm',
  component: WebhookConfigForm,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
WebhookConfigForm is a platform-aware webhook configuration form that automatically
selects the correct presenter based on screen width:

- **Mobile (<640px):** Touch-optimized single-column layout, 44px touch targets, bottom sheet for test results
- **Desktop (≥640px):** Dense two-column layout, inline test results, code editor for custom templates

**Key features:**
- Create mode (no \`webhook\` prop) and Edit mode (\`webhook\` prop provided)
- Three authentication types: None, Basic Auth, Bearer Token
- Five message templates: Generic JSON, Slack, Discord, Microsoft Teams, Custom
- Custom HTTP headers management
- Signing secret generation (displayed ONE TIME after creation)
- Retry configuration and timeout settings
- HTTPS-only URL enforcement for security

The form uses GraphQL mutations (\`createWebhook\`, \`updateWebhook\`, \`testWebhook\`)
via \`useWebhookConfigForm\` headless hook. Wrap stories in \`MockedProvider\` when
testing mutation flows end-to-end.
        `,
      },
    },
  },
  argTypes: {
    onSuccess: { action: 'success' },
    onError: { action: 'error' },
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
};

export default meta;
type Story = StoryObj<typeof WebhookConfigForm>;

// =============================================================================
// Mock webhook object (edit mode)
// =============================================================================

const mockWebhook = {
  id: 'wh-001',
  name: 'Slack Alerts',
  description: 'Sends critical router alerts to #alerts channel',
  url: 'https://hooks.slack.com/services/T000/B000/xxxx',
  method: 'POST' as const,
  authType: 'NONE' as const,
  username: undefined,
  password: undefined,
  bearerToken: undefined,
  template: 'SLACK' as const,
  customTemplate: undefined,
  headers: {},
  signingSecret: undefined,
  timeoutSeconds: 10,
  retryEnabled: true,
  maxRetries: 3,
  enabled: true,
  createdAt: '2025-10-01T00:00:00Z',
  updatedAt: '2025-11-15T12:30:00Z',
};

const mockWebhookWithBearerAuth = {
  ...mockWebhook,
  id: 'wh-002',
  name: 'PagerDuty Integration',
  description: 'Escalates critical alerts to PagerDuty',
  url: 'https://events.pagerduty.com/v2/enqueue',
  authType: 'BEARER' as const,
  bearerToken: 'pd_api_key_hidden',
  template: 'GENERIC' as const,
  headers: { 'X-Routing-Key': 'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX' },
};

const mockWebhookWithBasicAuth = {
  ...mockWebhook,
  id: 'wh-003',
  name: 'Internal Alertmanager',
  description: 'Sends alerts to self-hosted Alertmanager',
  url: 'https://alertmanager.internal.example.com/api/v1/alerts',
  authType: 'BASIC' as const,
  username: 'nasnet',
  template: 'GENERIC' as const,
};

// =============================================================================
// Stories
// =============================================================================

/**
 * Create mode — empty form for a new webhook
 */
export const CreateMode: Story = {
  args: {
    onSuccess: fn(),
    onError: fn(),
  },
  parameters: {
    docs: {
      description: {
        story:
          'Default create mode with an empty form. After successful submission the signing secret is shown once.',
      },
    },
  },
};

/**
 * Edit mode — pre-filled with an existing Slack webhook
 */
export const EditModeSlack: Story = {
  args: {
    webhook: mockWebhook,
    onSuccess: fn(),
    onError: fn(),
  },
  parameters: {
    docs: {
      description: {
        story:
          'Edit mode with a pre-existing Slack webhook. Password fields are intentionally blank (never sent from server).',
      },
    },
  },
};

/**
 * Edit mode — webhook using Bearer Token authentication
 */
export const EditModeBearerAuth: Story = {
  args: {
    webhook: mockWebhookWithBearerAuth,
    onSuccess: fn(),
    onError: fn(),
  },
  parameters: {
    docs: {
      description: {
        story:
          'Edit mode for a PagerDuty webhook using Bearer token authentication with custom headers.',
      },
    },
  },
};

/**
 * Edit mode — webhook using Basic authentication
 */
export const EditModeBasicAuth: Story = {
  args: {
    webhook: mockWebhookWithBasicAuth,
    onSuccess: fn(),
    onError: fn(),
  },
  parameters: {
    docs: {
      description: {
        story: 'Edit mode for an internal Alertmanager webhook using HTTP Basic authentication.',
      },
    },
  },
};

/**
 * Mobile viewport — touch-optimized layout
 */
export const Mobile: Story = {
  args: {
    onSuccess: fn(),
    onError: fn(),
  },
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
    docs: {
      description: {
        story:
          'Mobile presenter (<640px) with single-column layout, 44px touch targets, and bottom sheet for test results.',
      },
    },
  },
};

/**
 * Desktop viewport — two-column dense layout
 */
export const Desktop: Story = {
  args: {
    webhook: mockWebhook,
    onSuccess: fn(),
    onError: fn(),
  },
  parameters: {
    viewport: { defaultViewport: 'desktop' },
    docs: {
      description: {
        story:
          'Desktop presenter (≥640px) with two-column grid, inline test result panel, and code editor for custom templates.',
      },
    },
  },
};
