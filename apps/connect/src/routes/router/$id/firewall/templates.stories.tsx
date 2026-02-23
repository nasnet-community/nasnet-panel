import { TemplatesRoute } from './templates';

import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof TemplatesRoute> = {
  title: 'App/Firewall/TemplatesRoute',
  component: TemplatesRoute,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Lazy-loaded firewall templates management page with loading skeleton. Handles template creation, editing, and deletion for firewall rules. Router context is mocked — navigation callbacks use Storybook actions.',
      },
    },
  },
  decorators: [
    (Story) => (
      <div style={{ minHeight: '700px' }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof TemplatesRoute>;

export const Default: Story = {
  render: () => <TemplatesRoute />,
};

export const Loading: Story = {
  render: () => <TemplatesRoute />,
  parameters: {
    docs: {
      description: {
        story: 'Loading state showing skeleton placeholders while TemplatesPage lazy-loads.',
      },
    },
  },
};

export const ManagingTemplates: Story = {
  render: () => <TemplatesRoute />,
  parameters: {
    docs: {
      description: {
        story: 'Firewall templates management interface loaded and ready for CRUD operations.',
      },
    },
  },
};

export const Mobile: Story = {
  render: () => <TemplatesRoute />,
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
  },
};

export const Desktop: Story = {
  render: () => <TemplatesRoute />,
  parameters: {
    viewport: { defaultViewport: 'desktop' },
  },
};
