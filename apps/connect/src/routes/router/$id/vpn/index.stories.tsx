import { Skeleton } from '@nasnet/ui/primitives';

import type { Meta, StoryObj } from '@storybook/react';

/**
 * VPN Index route renders the VPNDashboard component, which depends on
 * TanStack Router params and useVPNStats. Since we cannot render the real
 * component without router context, we provide a presentational replica of
 * its loading and empty states. For the full interactive dashboard stories
 * see App/Pages/VPNDashboard.
 */

function VPNRouteSkeleton() {
  return (
    <div className="px-4 py-6 sm:px-6">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <Skeleton className="mb-2 h-9 w-52" />
            <Skeleton className="h-4 w-72" />
          </div>
          <Skeleton className="h-10 w-24" />
        </div>
        {/* Status Hero */}
        <Skeleton className="h-48 w-full rounded-2xl" />
        {/* Navigation Cards */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Skeleton className="h-36 rounded-xl" />
          <Skeleton className="h-36 rounded-xl" />
        </div>
        {/* Protocol Stats Grid */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {[...Array(6)].map((_, i) => (
            <Skeleton
              key={i}
              className="h-32 rounded-xl"
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function VPNRouteError() {
  return (
    <div className="px-4 py-6 sm:px-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-foreground mb-1 text-2xl font-bold sm:text-3xl">VPN Dashboard</h1>
            <p className="text-muted-foreground text-sm">
              Monitor and manage your VPN infrastructure
            </p>
          </div>
          <button
            className="border-border flex min-h-[44px] min-w-[44px] items-center gap-2 rounded-md border px-3 text-sm"
            aria-label="Refresh VPN dashboard"
          >
            Refresh
          </button>
        </div>
        <div
          className="bg-error/10 dark:bg-error/20 border-error rounded-2xl border-2 p-6"
          role="alert"
        >
          <h3 className="text-foreground mb-2 text-lg font-semibold">
            Failed to load VPN statistics
          </h3>
          <p className="text-muted-foreground mb-4 text-sm">
            Unable to retrieve VPN data from the router. Please check your connection.
          </p>
          <button className="border-border min-h-[44px] rounded-md border px-3 py-2 text-sm">
            Try Again
          </button>
        </div>
      </div>
    </div>
  );
}

const meta: Meta<typeof VPNRouteSkeleton> = {
  title: 'App/Router/VPN/VPNIndexRoute',
  component: VPNRouteSkeleton,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'VPN index route (/router/$id/vpn/). Renders the VPNDashboard component which shows ' +
          'VPN infrastructure health, server/client counts, per-protocol stats, and active issues. ' +
          'These stories show the loading and error states as presentational replicas. ' +
          'For the full interactive dashboard see App/Pages/VPNDashboard.',
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
type Story = StoryObj<typeof VPNRouteSkeleton>;

export const Loading: Story = {
  render: () => <VPNRouteSkeleton />,
  parameters: {
    docs: {
      description: {
        story:
          'Loading skeleton with shimmer placeholders for the hero, navigation cards, and protocol grid.',
      },
    },
  },
};

export const ErrorState: Story = {
  render: () => <VPNRouteError />,
  parameters: {
    docs: {
      description: {
        story:
          'Error state shown when the VPN stats API call fails. Displays a prominent error banner ' +
          'with a retry button.',
      },
    },
  },
};

export const NarrowViewport: Story = {
  render: () => <VPNRouteSkeleton />,
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
    docs: {
      description: {
        story: 'Loading skeleton at mobile viewport width to verify responsive grid layout.',
      },
    },
  },
};

export const Mobile: Story = {
  render: () => <VPNRouteSkeleton />,
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
  },
};

export const Desktop: Story = {
  render: () => <VPNRouteSkeleton />,
  parameters: {
    viewport: { defaultViewport: 'desktop' },
  },
};
