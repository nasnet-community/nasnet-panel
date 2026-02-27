import { Skeleton } from '@nasnet/ui/primitives';

import type { Meta, StoryObj } from '@storybook/react';

/**
 * Firewall tab skeleton displayed while the lazy-loaded FirewallTab chunk loads.
 * Mirrors the FirewallTabSkeleton defined in the route file.
 */
function FirewallTabSkeleton() {
  return (
    <div className="space-y-4 p-4">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-64 w-full" />
      <Skeleton className="h-64 w-full" />
    </div>
  );
}

const meta: Meta<typeof FirewallTabSkeleton> = {
  title: 'App/Router/FirewallTab',
  component: FirewallTabSkeleton,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Firewall tab route component for managing firewall rules, NAT, and address lists. The tab is code-split and lazy-loaded with a skeleton fallback due to heavy virtualized rule tables.',
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
type Story = StoryObj<typeof FirewallTabSkeleton>;

export const Loading: Story = {
  render: () => <FirewallTabSkeleton />,
  parameters: {
    docs: {
      description: {
        story:
          'Skeleton loading state shown while the Firewall tab chunk is being fetched. Contains a header placeholder and two large content block placeholders for the rule tables.',
      },
    },
  },
};

export const LoadingMobile: Story = {
  render: () => <FirewallTabSkeleton />,
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
    docs: {
      description: {
        story: 'Skeleton loading state on a mobile viewport. Content blocks stretch full-width.',
      },
    },
  },
};

export const LoadingDesktop: Story = {
  render: () => <FirewallTabSkeleton />,
  parameters: {
    viewport: { defaultViewport: 'tablet' },
    docs: {
      description: {
        story:
          'Skeleton loading state on a wider viewport showing the full-width rule table placeholders.',
      },
    },
  },
};
