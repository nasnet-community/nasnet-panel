import { Skeleton } from '@nasnet/ui/primitives';

import type { Meta, StoryObj } from '@storybook/react';

/**
 * Loading skeleton for ServicePortsPage (replicated from route file)
 * The actual ServicePortsPage is lazy-loaded from @nasnet/features/firewall,
 * so we render the skeleton that users see while the chunk loads.
 */
function ServicePortsPageSkeleton() {
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

const meta: Meta<typeof ServicePortsPageSkeleton> = {
  title: 'App/Router/Firewall/ServicePortsRoute',
  component: ServicePortsPageSkeleton,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Service Ports Management route page. Lazy-loads the ServicePortsPage component from ' +
          '@nasnet/features/firewall. The skeleton is shown while the chunk loads. ' +
          'Allows defining custom service names for ports and creating service groups ' +
          'for use in firewall rules.',
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
type Story = StoryObj<typeof ServicePortsPageSkeleton>;

export const Default: Story = {
  render: () => <ServicePortsPageSkeleton />,
  parameters: {
    docs: {
      description: {
        story: 'Loading skeleton displayed while the ServicePortsPage chunk is being fetched.',
      },
    },
  },
};

export const DarkBackground: Story = {
  render: () => (
    <div className="bg-background text-foreground">
      <ServicePortsPageSkeleton />
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
  render: () => <ServicePortsPageSkeleton />,
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
    docs: {
      description: {
        story:
          'Skeleton at mobile viewport width to verify the two table placeholders stack properly.',
      },
    },
  },
};

export const Mobile: Story = {
  render: () => <ServicePortsPageSkeleton />,
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
  },
};

export const Desktop: Story = {
  render: () => <ServicePortsPageSkeleton />,
  parameters: {
    viewport: { defaultViewport: 'desktop' },
  },
};
