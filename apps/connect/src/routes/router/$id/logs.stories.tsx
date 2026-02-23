import { Skeleton } from '@nasnet/ui/primitives';

import type { Meta, StoryObj } from '@storybook/react';

/**
 * LogsTabSkeleton is the loading placeholder shown while the lazy-loaded
 * LogsTab component is being fetched. It mirrors the logs page layout
 * with filter bar placeholders and a large content area skeleton.
 *
 * The actual LogsTab uses Route.useParams() and lazy-loading, so we
 * render the skeleton directly for visual testing.
 */
function LogsTabSkeleton() {
  return (
    <div className="space-y-4 p-4">
      <div className="flex gap-4">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-48" />
      </div>
      <Skeleton className="h-96 w-full" />
    </div>
  );
}

const meta: Meta<typeof LogsTabSkeleton> = {
  title: 'App/Router/LogsRoute',
  component: LogsTabSkeleton,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Logs route skeleton loading state. The LogsTab is lazy-loaded with virtualized log lists and filtering. This skeleton is displayed while the bundle chunk is fetched.',
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
type Story = StoryObj<typeof LogsTabSkeleton>;

export const Default: Story = {
  render: () => <LogsTabSkeleton />,
};

export const DarkBackground: Story = {
  render: () => (
    <div style={{ backgroundColor: 'hsl(var(--background))', minHeight: '100vh' }}>
      <LogsTabSkeleton />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Skeleton loading state displayed on a dark background surface.',
      },
    },
  },
};

export const NarrowViewport: Story = {
  render: () => (
    <div style={{ maxWidth: '400px' }}>
      <LogsTabSkeleton />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Skeleton at a narrow mobile viewport width, showing how filter bar skeletons wrap.',
      },
    },
  },
};

export const Mobile: Story = {
  render: () => <LogsTabSkeleton />,
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
  },
};

export const Desktop: Story = {
  render: () => <LogsTabSkeleton />,
  parameters: {
    viewport: { defaultViewport: 'desktop' },
  },
};
