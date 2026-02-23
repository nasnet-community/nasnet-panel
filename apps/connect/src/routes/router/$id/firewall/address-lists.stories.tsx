import { Skeleton } from '@nasnet/ui/primitives';

import type { Meta, StoryObj } from '@storybook/react';

/**
 * Loading skeleton matching the AddressListView layout.
 * Mirrors the AddressListViewSkeleton defined in the route file.
 */
function AddressListViewSkeleton() {
  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-32" />
        </div>
      </div>
      <Skeleton className="h-64 w-full" />
      <Skeleton className="h-64 w-full" />
    </div>
  );
}

const meta: Meta<typeof AddressListViewSkeleton> = {
  title: 'App/Router/Firewall/AddressLists',
  component: AddressListViewSkeleton,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Route component for firewall address lists (/router/:id/firewall/address-lists). ' +
          'Lazy-loads AddressListView from @nasnet/features/firewall with a loading skeleton fallback. ' +
          'Manages MikroTik firewall address lists with bulk import/export, entry creation, and deletion.',
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
type Story = StoryObj<typeof AddressListViewSkeleton>;

export const LoadingSkeleton: Story = {
  name: 'Loading Skeleton',
  render: () => <AddressListViewSkeleton />,
  parameters: {
    docs: {
      description: {
        story:
          'Loading skeleton shown while the AddressListView component is being lazy-loaded. ' +
          'Displays placeholder blocks for the page header, action buttons, and content area.',
      },
    },
  },
};

export const SkeletonNarrow: Story = {
  name: 'Loading Skeleton (Narrow)',
  render: () => (
    <div style={{ maxWidth: '480px' }}>
      <AddressListViewSkeleton />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Loading skeleton rendered in a narrow viewport to verify responsive behavior of the skeleton layout.',
      },
    },
  },
};

export const SkeletonWide: Story = {
  name: 'Loading Skeleton (Wide)',
  render: () => (
    <div style={{ maxWidth: '1440px', margin: '0 auto' }}>
      <AddressListViewSkeleton />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Loading skeleton rendered at full desktop width showing how the skeleton fills the available space.',
      },
    },
  },
};

export const Mobile: Story = {
  render: () => <AddressListViewSkeleton />,
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
  },
};

export const Desktop: Story = {
  render: () => <AddressListViewSkeleton />,
  parameters: {
    viewport: { defaultViewport: 'desktop' },
  },
};
