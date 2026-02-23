import { LogsTab } from './LogsTab';

import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof LogsTab> = {
  title: 'App/RouterPanel/LogsTab',
  component: LogsTab,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Logs Tab displays system logs with filtering options. Shows real-time system logs from the router with configurable log limit (default 100). Router navigation is mocked in this story.',
      },
    },
  },
  decorators: [
    (Story) => (
      <div style={{ minHeight: '600px', padding: '0', background: 'var(--background)' }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof LogsTab>;

export const Default: Story = {};

export const Loading: Story = {
  decorators: [
    (Story) => (
      <div style={{ minHeight: '600px', padding: '0', background: 'var(--background)' }}>
        <div style={{ opacity: 0.6, pointerEvents: 'none' }}>
          <Story />
        </div>
      </div>
    ),
  ],
};

export const Empty: Story = {
  decorators: [
    (Story) => (
      <div style={{ minHeight: '600px', padding: '0', background: 'var(--background)' }}>
        <Story />
      </div>
    ),
  ],
};

export const Mobile: Story = {
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
  },
};

export const Desktop: Story = {
  parameters: {
    viewport: { defaultViewport: 'desktop' },
  },
};
