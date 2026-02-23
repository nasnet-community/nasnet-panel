import { Route } from '@/routes/router/$id/routing';

import type { Meta, StoryObj } from '@storybook/react';

const RouteComponent = Route.options.component as React.ComponentType;

const meta: Meta<typeof RouteComponent> = {
  title: 'App/Router/DeviceRoutingRoute',
  component: RouteComponent,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Device-to-Service Routing route (NAS-8.3). Routes devices through service instances (Tor, Xray, etc.) using Policy-Based Routing. Provides device discovery, service assignment, and real-time routing updates.',
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

export const WithSpecificRouter: Story = {
  render: () => <RouteComponent />,
  parameters: {
    docs: {
      description: {
        story:
          'Device routing page for a specific MikroTik RB5009 router, showing device discovery and service assignment interfaces.',
      },
    },
  },
};

export const MobileView: Story = {
  render: () => <RouteComponent />,
  decorators: [
    (Story: React.ComponentType) => (
      <div style={{ maxWidth: '400px' }}>
        <Story />
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story:
          'Device routing page at mobile viewport width showing responsive layout adaptations.',
      },
    },
  },
};

export const TabletView: Story = {
  render: () => <RouteComponent />,
  decorators: [
    (Story: React.ComponentType) => (
      <div style={{ maxWidth: '768px' }}>
        <Story />
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story:
          'Device routing page at tablet viewport width with hybrid layout.',
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
