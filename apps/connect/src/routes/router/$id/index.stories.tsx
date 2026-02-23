import { fn } from 'storybook/test';

import { OverviewTab } from '@/app/routes/router-panel/tabs/OverviewTab';

import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof OverviewTab> = {
  title: 'App/Router/OverviewTab',
  component: OverviewTab,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Router overview tab showing system summary, resource usage, uptime, and quick status indicators. This is the default tab displayed when navigating to a router.',
      },
    },
  },
  decorators: [
    (Story) => (
      <div style={{ minHeight: '600px' }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof OverviewTab>;

export const Default: Story = {
  render: () => {
    localStorage.getItem = fn().mockReturnValue('test-router-id');

    return <OverviewTab />;
  },
};

export const NoRouterSelected: Story = {
  render: () => {
    localStorage.getItem = fn().mockReturnValue(null);

    return <OverviewTab />;
  },
  parameters: {
    docs: {
      description: {
        story:
          'State when no router ID is available. The overview should handle the missing router context gracefully.',
      },
    },
  },
};

export const MobileViewport: Story = {
  render: () => {
    localStorage.getItem = fn().mockReturnValue('test-router-id');

    return <OverviewTab />;
  },
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
    docs: {
      description: {
        story:
          'Overview tab rendered in a mobile viewport. Stats and widgets should stack vertically for a consumer-grade experience.',
      },
    },
  },
};

export const Mobile: Story = {
  render: () => {
    localStorage.getItem = fn().mockReturnValue('test-router-id');

    return <OverviewTab />;
  },
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
  },
};

export const Desktop: Story = {
  render: () => {
    localStorage.getItem = fn().mockReturnValue('test-router-id');

    return <OverviewTab />;
  },
  parameters: {
    viewport: { defaultViewport: 'desktop' },
  },
};
