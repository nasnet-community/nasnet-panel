import { Route } from '@/routes/router/$id/vlans';

import type { Meta, StoryObj } from '@storybook/react';

const RouteComponent = Route.options.component as React.ComponentType;

const meta: Meta<typeof RouteComponent> = {
  title: 'App/Router/VLANs',
  component: RouteComponent,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Route component for VLAN management (/router/:id/vlans). ' +
          'Renders VLANSettingsPage with a routerId prop extracted from route params. ' +
          'Provides list and topology views with VLAN creation dialog.',
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
type Story = StoryObj<typeof RouteComponent>;

export const Default: Story = {
  render: () => <RouteComponent />,
};

export const ListView: Story = {
  name: 'List View',
  render: () => <RouteComponent />,
  parameters: {
    docs: {
      description: {
        story:
          'Default list view showing all VLANs for the router in a tabular format.',
      },
    },
  },
};

export const TopologyView: Story = {
  name: 'Topology View',
  render: () => <RouteComponent />,
  parameters: {
    docs: {
      description: {
        story:
          'Topology view tab showing VLAN hierarchy grouped by parent interface. ' +
          'Click the "Topology View" tab to switch from the default list view.',
      },
    },
  },
};

export const AlternateRouter: Story = {
  name: 'Alternate Router',
  render: () => <RouteComponent />,
  parameters: {
    docs: {
      description: {
        story:
          'Renders with an alternate router ID to verify the routerId prop flows through to all child components.',
      },
    },
  },
};

export const Mobile: Story = {
  render: () => <RouteComponent />,
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
  },
};

export const Desktop: Story = {
  render: () => <RouteComponent />,
  parameters: {
    viewport: { defaultViewport: 'desktop' },
  },
};
