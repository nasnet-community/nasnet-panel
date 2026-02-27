import { LoadingSkeleton } from './LoadingSkeleton';

import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof LoadingSkeleton> = {
  title: 'App/Wifi/LoadingSkeleton',
  component: LoadingSkeleton,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Loading skeleton placeholder for WiFi dashboard. Shows pulsing placeholders while data is being fetched.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof LoadingSkeleton>;

export const Default: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Standard WiFi loading skeleton with header, stats grid, interface cards, and clients table placeholders.',
      },
    },
  },
};

export const Mobile: Story = {
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
    docs: {
      description: {
        story: 'Loading skeleton on mobile viewport. Stats grid collapses to 2 columns.',
      },
    },
  },
};

export const Desktop: Story = {
  parameters: {
    viewport: { defaultViewport: 'desktop' },
    docs: {
      description: {
        story:
          'Loading skeleton on desktop viewport. Stats grid displays all 4 columns with full spacing.',
      },
    },
  },
};
