import { OverviewTab } from './OverviewTab';

import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof OverviewTab> = {
  title: 'App/RouterPanel/OverviewTab',
  component: OverviewTab,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Overview Tab (Epic 0.2: Dashboard Overview) displays the router status dashboard with Action-First design direction (Direction 4). Features include a golden amber hero header with prominent status, quick actions grid (VPN, WiFi, Restart, Firewall), status pills, resource monitoring with gauges (CPU, Memory, Disk), DHCP summary, traffic visualization, VPN clients summary, and hardware details. Router navigation and data fetching are mocked in this story.',
      },
    },
  },
  decorators: [
    (Story) => (
      <div style={{ minHeight: 'auto', background: 'var(--background)' }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof OverviewTab>;

export const Default: Story = {};

export const Loading: Story = {
  decorators: [
    (Story) => (
      <div style={{ minHeight: 'auto', background: 'var(--background)' }}>
        <div style={{ opacity: 0.6, pointerEvents: 'none' }}>
          <Story />
        </div>
      </div>
    ),
  ],
};

export const HealthyStatus: Story = {
  decorators: [
    (Story) => (
      <div style={{ minHeight: 'auto', background: 'var(--background)' }}>
        <Story />
      </div>
    ),
  ],
};

export const WarningStatus: Story = {
  decorators: [
    (Story) => (
      <div style={{ minHeight: 'auto', background: 'var(--background)' }}>
        <Story />
      </div>
    ),
  ],
};

export const ErrorStatus: Story = {
  decorators: [
    (Story) => (
      <div style={{ minHeight: 'auto', background: 'var(--background)' }}>
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
