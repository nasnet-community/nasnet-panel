import { LoadingSkeleton } from './LoadingSkeleton';

import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof LoadingSkeleton> = {
  title: 'App/Network/LoadingSkeleton',
  component: LoadingSkeleton,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Simplified layout skeleton matching the network page design. Shows loading state for interfaces section, connected devices, IP addresses, and DHCP configuration with responsive grid layout.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof LoadingSkeleton>;

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
