import { Skeleton } from '@nasnet/ui/primitives';

import type { Meta, StoryObj } from '@storybook/react';

/**
 * PluginStoreTabSkeleton is the loading placeholder shown while the
 * lazy-loaded PluginStoreTab component is being fetched. It renders
 * a title skeleton and a responsive grid of plugin card placeholders.
 *
 * The actual PluginStoreRoute uses Route.useParams() and lazy-loading,
 * so we render the skeleton directly for visual testing.
 */
function PluginStoreTabSkeleton() {
  return (
    <div className="space-y-4 p-4">
      <Skeleton className="h-8 w-48" />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    </div>
  );
}

const meta: Meta<typeof PluginStoreTabSkeleton> = {
  title: 'App/Router/PluginsRoute',
  component: PluginStoreTabSkeleton,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Plugin Store route skeleton loading state. The PluginStoreTab is lazy-loaded and displays downloadable features (Tor, sing-box, Xray-core, etc.). This skeleton shows a heading and a responsive grid of plugin card placeholders.',
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
type Story = StoryObj<typeof PluginStoreTabSkeleton>;

export const Default: Story = {
  render: () => <PluginStoreTabSkeleton />,
};

export const DarkBackground: Story = {
  render: () => (
    <div style={{ backgroundColor: 'hsl(var(--background))', minHeight: '100vh' }}>
      <PluginStoreTabSkeleton />
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

export const MobileGrid: Story = {
  render: () => (
    <div style={{ maxWidth: '400px' }}>
      <PluginStoreTabSkeleton />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Plugin grid skeleton at mobile width showing single-column card layout.',
      },
    },
  },
};

export const ExpandedGrid: Story = {
  render: () => (
    <div className="space-y-4 p-4">
      <Skeleton className="h-8 w-48" />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Extended skeleton showing six plugin card placeholders to simulate a fuller marketplace page.',
      },
    },
  },
};

export const Mobile: Story = {
  render: () => <PluginStoreTabSkeleton />,
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
  },
};

export const Desktop: Story = {
  render: () => <PluginStoreTabSkeleton />,
  parameters: {
    viewport: { defaultViewport: 'desktop' },
  },
};
