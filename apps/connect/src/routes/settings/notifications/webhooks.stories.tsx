import { WebhooksPage } from './webhooks';

import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof WebhooksPage> = {
  title: 'App/Settings/WebhooksPage',
  component: WebhooksPage,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Webhook configuration page for setting up HTTP POST notifications for alerts. Features webhook creation/editing with HTTPS validation, template presets, custom headers, and test functionality. Router context is mocked — navigation callbacks use Storybook actions.',
      },
    },
  },
  decorators: [
    (Story) => (
      <div style={{ minHeight: '700px', padding: '24px' }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof WebhooksPage>;

export const Default: Story = {
  render: () => <WebhooksPage />,
};

export const CreateNewWebhook: Story = {
  render: () => <WebhooksPage />,
  parameters: {
    docs: {
      description: {
        story:
          'Initial state showing the webhook configuration form ready for creating a new webhook endpoint.',
      },
    },
  },
};

export const WithSecurityInfo: Story = {
  render: () => <WebhooksPage />,
  parameters: {
    docs: {
      description: {
        story:
          'Full page layout including header, info card about webhooks, configuration form, and security notes.',
      },
    },
  },
  decorators: [
    (Story) => (
      <div
        style={{
          minHeight: '900px',
          padding: '24px',
          background: 'var(--color-background)',
        }}
      >
        <Story />
      </div>
    ),
  ],
};

export const Mobile: Story = {
  render: () => <WebhooksPage />,
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
    docs: {
      description: {
        story:
          'Webhook configuration page rendered at mobile viewport. Form layout adapts for touch input.',
      },
    },
  },
};

export const Desktop: Story = {
  render: () => <WebhooksPage />,
  parameters: {
    viewport: { defaultViewport: 'desktop' },
    docs: {
      description: {
        story:
          'Webhook configuration page rendered at desktop viewport with full-width layout.',
      },
    },
  },
};
