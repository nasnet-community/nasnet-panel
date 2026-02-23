import { NetworkTab } from './NetworkTab';

import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof NetworkTab> = {
  title: 'App/RouterPanel/NetworkTab',
  component: NetworkTab,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Network Tab displays the Network Dashboard with Grafana-inspired data visualization focused design (Direction 3). Shows network topology, interface status, traffic metrics, and routing information. Router navigation is mocked in this story.',
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
type Story = StoryObj<typeof NetworkTab>;

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
