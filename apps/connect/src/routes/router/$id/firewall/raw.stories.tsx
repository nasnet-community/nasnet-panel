import { Skeleton } from '@nasnet/ui/primitives';

import type { Meta, StoryObj } from '@storybook/react';


/**
 * Loading skeleton for RawPage (replicated from route file)
 * The actual RawPage is lazy-loaded from @nasnet/features/firewall,
 * so we render the skeleton that users see while the chunk loads.
 */
function RawPageSkeleton() {
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
      <Skeleton className="h-20 w-full" />
      <div className="flex gap-2 border-b pb-2">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-20" />
      </div>
      <Skeleton className="h-64 w-full" />
      <Skeleton className="h-64 w-full" />
    </div>
  );
}

const meta: Meta<typeof RawPageSkeleton> = {
  title: 'App/Router/Firewall/RawRoute',
  component: RawPageSkeleton,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'RAW Firewall Rules route page. Lazy-loads the RawPage component from ' +
          '@nasnet/features/firewall. The skeleton is shown while the chunk loads. ' +
          'RAW rules operate at the pre-routing stage before connection tracking.',
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
type Story = StoryObj<typeof RawPageSkeleton>;

export const Default: Story = {
  render: () => <RawPageSkeleton />,
  parameters: {
    docs: {
      description: {
        story: 'Loading skeleton displayed while the RawPage chunk is being fetched.',
      },
    },
  },
};

export const DarkBackground: Story = {
  render: () => (
    <div className="bg-background text-foreground">
      <RawPageSkeleton />
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
  render: () => <RawPageSkeleton />,
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
    docs: {
      description: {
        story: 'Skeleton at mobile viewport width to verify the info panel and tab bar wrap properly.',
      },
    },
  },
};

export const Mobile: Story = {
  render: () => <RawPageSkeleton />,
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
  },
};

export const Desktop: Story = {
  render: () => <RawPageSkeleton />,
  parameters: {
    viewport: { defaultViewport: 'desktop' },
  },
};
