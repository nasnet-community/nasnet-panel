import { Skeleton } from '@nasnet/ui/primitives';

import type { Meta, StoryObj } from '@storybook/react';

/**
 * Loading skeleton matching the ManglePage layout.
 * Mirrors the ManglePageSkeleton defined in the route file.
 */
function ManglePageSkeleton() {
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
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-28" />
      </div>
      <Skeleton className="h-64 w-full" />
      <Skeleton className="h-64 w-full" />
    </div>
  );
}

const meta: Meta<typeof ManglePageSkeleton> = {
  title: 'App/Router/Firewall/Mangle',
  component: ManglePageSkeleton,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Route component for firewall mangle rules (/router/:id/firewall/mangle). ' +
          'Lazy-loads ManglePage from @nasnet/features/firewall with a loading skeleton fallback. ' +
          'Manages mangle rules with chain tabs (prerouting, input, forward, output, postrouting), ' +
          'rule editor, and flow diagram visualization.',
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
type Story = StoryObj<typeof ManglePageSkeleton>;

export const LoadingSkeleton: Story = {
  name: 'Loading Skeleton',
  render: () => <ManglePageSkeleton />,
  parameters: {
    docs: {
      description: {
        story:
          'Loading skeleton shown while the ManglePage component is being lazy-loaded. ' +
          'Displays placeholder blocks for page header, chain tabs, and rule tables.',
      },
    },
  },
};

export const SkeletonNarrow: Story = {
  name: 'Loading Skeleton (Narrow)',
  render: () => (
    <div style={{ maxWidth: '480px' }}>
      <ManglePageSkeleton />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Loading skeleton in a narrow viewport. Chain tabs wrap to multiple lines on smaller screens.',
      },
    },
  },
};

export const SkeletonWide: Story = {
  name: 'Loading Skeleton (Wide)',
  render: () => (
    <div style={{ maxWidth: '1440px', margin: '0 auto' }}>
      <ManglePageSkeleton />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Loading skeleton at full desktop width showing chain tabs in a single row ' +
          'and wide rule table placeholders.',
      },
    },
  },
};

export const Mobile: Story = {
  render: () => <ManglePageSkeleton />,
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
  },
};

export const Desktop: Story = {
  render: () => <ManglePageSkeleton />,
  parameters: {
    viewport: { defaultViewport: 'desktop' },
  },
};
