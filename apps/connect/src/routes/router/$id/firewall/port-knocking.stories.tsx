import { Skeleton } from '@nasnet/ui/primitives';

import type { Meta, StoryObj } from '@storybook/react';

/**
 * Loading skeleton for PortKnockingPage (replicated from route file)
 * The actual PortKnockingPage is lazy-loaded from @nasnet/features/firewall,
 * so we render the skeleton that users see while the chunk loads.
 */
function PortKnockingPageSkeleton() {
  return (
    <div className="space-y-6 p-4">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-10 w-56" />
          <Skeleton className="h-4 w-96" />
        </div>
        <Skeleton className="h-10 w-40" />
      </div>
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-12 w-64" />
      <Skeleton className="h-96 w-full" />
    </div>
  );
}

const meta: Meta<typeof PortKnockingPageSkeleton> = {
  title: 'App/Router/Firewall/PortKnockingRoute',
  component: PortKnockingPageSkeleton,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Port Knocking route page. Lazy-loads the PortKnockingPage component from ' +
          '@nasnet/features/firewall. The skeleton is shown while the chunk loads. ' +
          'Port knocking allows opening firewall ports via a secret knock sequence.',
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
type Story = StoryObj<typeof PortKnockingPageSkeleton>;

export const Default: Story = {
  render: () => <PortKnockingPageSkeleton />,
  parameters: {
    docs: {
      description: {
        story: 'Loading skeleton displayed while the PortKnockingPage chunk is being fetched.',
      },
    },
  },
};

export const DarkBackground: Story = {
  render: () => (
    <div className="bg-background text-foreground">
      <PortKnockingPageSkeleton />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Skeleton rendered on the default background to verify contrast and visibility.',
      },
    },
  },
};

export const NarrowViewport: Story = {
  render: () => <PortKnockingPageSkeleton />,
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
    docs: {
      description: {
        story: 'Skeleton at mobile viewport width to verify layout does not overflow.',
      },
    },
  },
};

export const Mobile: Story = {
  render: () => <PortKnockingPageSkeleton />,
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
  },
};

export const Desktop: Story = {
  render: () => <PortKnockingPageSkeleton />,
  parameters: {
    viewport: { defaultViewport: 'desktop' },
  },
};
