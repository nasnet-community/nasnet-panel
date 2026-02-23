import { TemplatesPage } from './templates';

import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta = {
  title: 'App/Services/TemplatesPage',
  component: TemplatesPage,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Multi-service templates page for browsing and installing template bundles. Features template browser with filtering, installation wizard for configuration, and real-time progress tracking. Router context is mocked — navigation callbacks use Storybook actions.',
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
type Story = StoryObj;

export const Default: Story = {
  render: () => <TemplatesPage />,
};

export const BrowsingTemplates: Story = {
  render: () => <TemplatesPage />,
  parameters: {
    docs: {
      description: {
        story: 'Template browser showing available templates with filtering and search capabilities.',
      },
    },
  },
};

export const InstallationFlow: Story = {
  render: () => <TemplatesPage />,
  parameters: {
    docs: {
      description: {
        story:
          'Templates page ready with installation wizard modal showing configuration options for selected template.',
      },
    },
  },
};

export const Mobile: Story = {
  render: () => <TemplatesPage />,
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
  },
};

export const Desktop: Story = {
  render: () => <TemplatesPage />,
  parameters: {
    viewport: { defaultViewport: 'desktop' },
  },
};
