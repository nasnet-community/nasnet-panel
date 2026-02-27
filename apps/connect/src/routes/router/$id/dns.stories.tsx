import { Skeleton } from '@nasnet/ui/primitives';

import type { Meta, StoryObj } from '@storybook/react';

/**
 * DNS tab skeleton displayed while the lazy-loaded DnsTab chunk loads.
 * Mirrors the DnsTabSkeleton defined in the route file.
 */
function DnsTabSkeleton() {
  return (
    <div className="space-y-6 p-4">
      <Skeleton className="h-8 w-48" />
      <div className="space-y-4">
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    </div>
  );
}

const meta: Meta<typeof DnsTabSkeleton> = {
  title: 'App/Router/DnsTab',
  component: DnsTabSkeleton,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'DNS tab route component for managing DNS server settings, static entries, and cache configuration. The tab is code-split and lazy-loaded with a skeleton fallback.',
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
type Story = StoryObj<typeof DnsTabSkeleton>;

export const Loading: Story = {
  render: () => <DnsTabSkeleton />,
  parameters: {
    docs: {
      description: {
        story: 'Skeleton loading state shown while the DNS tab chunk is being fetched and loaded.',
      },
    },
  },
};

export const LoadingMobile: Story = {
  render: () => <DnsTabSkeleton />,
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
    docs: {
      description: {
        story: 'Skeleton loading state on a mobile viewport. Content stacks vertically.',
      },
    },
  },
};

export const LoadingDesktop: Story = {
  render: () => <DnsTabSkeleton />,
  parameters: {
    viewport: { defaultViewport: 'tablet' },
    docs: {
      description: {
        story: 'Skeleton loading state on a wider viewport showing the full-width content blocks.',
      },
    },
  },
};
