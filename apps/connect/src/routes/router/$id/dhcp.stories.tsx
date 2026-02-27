import { Skeleton } from '@nasnet/ui/primitives';

import type { Meta, StoryObj } from '@storybook/react';

/**
 * DHCP tab skeleton displayed while the lazy-loaded DHCPTab chunk loads.
 * Mirrors the DHCPTabSkeleton defined in the route file.
 */
function DHCPTabSkeleton() {
  return (
    <div className="space-y-4 p-4">
      <Skeleton className="h-8 w-48" />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
      <Skeleton className="h-64 w-full" />
    </div>
  );
}

const meta: Meta<typeof DHCPTabSkeleton> = {
  title: 'App/Router/DHCPTab',
  component: DHCPTabSkeleton,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'DHCP tab route component for managing DHCP servers, pools, and lease tables. The tab is code-split and lazy-loaded with a skeleton fallback for optimal bundle size.',
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
type Story = StoryObj<typeof DHCPTabSkeleton>;

export const Loading: Story = {
  render: () => <DHCPTabSkeleton />,
  parameters: {
    docs: {
      description: {
        story: 'Skeleton loading state shown while the DHCP tab chunk is being fetched and loaded.',
      },
    },
  },
};

export const LoadingMobile: Story = {
  render: () => <DHCPTabSkeleton />,
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
    docs: {
      description: {
        story:
          'Skeleton loading state on a mobile viewport. The grid collapses to a single column layout.',
      },
    },
  },
};

export const LoadingDesktop: Story = {
  render: () => <DHCPTabSkeleton />,
  parameters: {
    viewport: { defaultViewport: 'tablet' },
    docs: {
      description: {
        story:
          'Skeleton loading state on a wider viewport with the two-column grid layout visible.',
      },
    },
  },
};
