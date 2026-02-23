import { DashboardSkeleton } from './DashboardSkeleton';

import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof DashboardSkeleton> = {
  title: 'App/Skeletons/DashboardSkeleton',
  component: DashboardSkeleton,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Loading skeleton for the main dashboard page. Matches the layout of the dashboard with cards, metrics, and charts. Provides a skeleton layout with header, status summary cards, main content area with chart, and recent activity section.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof DashboardSkeleton>;

export const Default: Story = {
  args: {},
};

export const Mobile: Story = {
  args: {},
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};

export const Tablet: Story = {
  args: {},
  parameters: {
    viewport: {
      defaultViewport: 'tablet',
    },
  },
};

export const Desktop: Story = {
  args: {},
  parameters: {
    viewport: {
      defaultViewport: 'desktop',
    },
  },
};
