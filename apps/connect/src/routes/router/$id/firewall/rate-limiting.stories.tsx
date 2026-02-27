import { Skeleton } from '@nasnet/ui/primitives';

import type { Meta, StoryObj } from '@storybook/react';

/**
 * Loading skeleton for RateLimitingPage (replicated from route file)
 * The actual RateLimitingPage is lazy-loaded from @nasnet/features/firewall,
 * so we render the skeleton that users see while the chunk loads.
 */
function RateLimitingPageSkeleton() {
  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-24" />
        </div>
      </div>
      <div className="flex gap-2 border-b pb-2">
        <Skeleton className="h-10 w-20" />
        <Skeleton className="h-10 w-28" />
        <Skeleton className="h-10 w-24" />
      </div>
      <Skeleton className="h-64 w-full" />
      <Skeleton className="h-64 w-full" />
    </div>
  );
}

const meta: Meta<typeof RateLimitingPageSkeleton> = {
  title: 'App/Router/Firewall/RateLimitingRoute',
  component: RateLimitingPageSkeleton,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Rate Limiting route page. Lazy-loads the RateLimitingPage component from ' +
          '@nasnet/features/firewall. The skeleton is shown while the chunk loads. ' +
          'Manages bandwidth throttling rules with tabs for different rule categories.',
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
type Story = StoryObj<typeof RateLimitingPageSkeleton>;

export const Default: Story = {
  render: () => <RateLimitingPageSkeleton />,
  parameters: {
    docs: {
      description: {
        story: 'Loading skeleton displayed while the RateLimitingPage chunk is being fetched.',
      },
    },
  },
};

export const DarkBackground: Story = {
  render: () => (
    <div className="bg-background text-foreground">
      <RateLimitingPageSkeleton />
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
  render: () => <RateLimitingPageSkeleton />,
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
    docs: {
      description: {
        story:
          'Skeleton at mobile viewport width to verify the tab bar and content do not overflow.',
      },
    },
  },
};

export const Mobile: Story = {
  render: () => <RateLimitingPageSkeleton />,
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
  },
};

export const Desktop: Story = {
  render: () => <RateLimitingPageSkeleton />,
  parameters: {
    viewport: { defaultViewport: 'desktop' },
  },
};
