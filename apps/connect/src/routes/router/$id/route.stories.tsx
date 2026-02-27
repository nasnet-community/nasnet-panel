import { fn } from 'storybook/test';

import { RouterPanel } from '@/app/routes/router-panel/RouterPanel';

import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof RouterPanel> = {
  title: 'App/Router/RouterPanelLayout',
  component: RouterPanel,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Router panel layout route. Wraps all router-specific views with a header displaying router info/status and adaptive tab navigation (bottom tabs on mobile, top tabs on desktop). This is the parent layout for /router/:id/* routes.',
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
type Story = StoryObj<typeof RouterPanel>;

export const Default: Story = {
  render: () => {
    localStorage.getItem = fn().mockReturnValue(null);

    return (
      <RouterPanel routerId="demo-router-001">
        <div className="text-muted-foreground p-6 text-center">
          Tab content renders here via Outlet
        </div>
      </RouterPanel>
    );
  },
};

export const WithContent: Story = {
  render: () => {
    localStorage.getItem = fn().mockReturnValue(null);

    return (
      <RouterPanel routerId="demo-router-002">
        <div className="space-y-4 p-6">
          <h2 className="text-lg font-semibold">Overview Tab Content</h2>
          <p className="text-muted-foreground">
            This simulates a child tab rendered inside the RouterPanel layout. In production, the
            TanStack Router Outlet renders the active tab component here.
          </p>
        </div>
      </RouterPanel>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'RouterPanel layout with simulated child content representing an active tab view.',
      },
    },
  },
};

export const MobileLayout: Story = {
  render: () => {
    localStorage.getItem = fn().mockReturnValue(null);

    return (
      <div style={{ maxWidth: '400px' }}>
        <RouterPanel routerId="mobile-router-001">
          <div className="text-muted-foreground p-4 text-center">Mobile tab content area</div>
        </RouterPanel>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'RouterPanel at mobile viewport width showing bottom navigation and compact header.',
      },
    },
  },
};

export const Mobile: Story = {
  render: () => {
    localStorage.getItem = fn().mockReturnValue(null);

    return (
      <RouterPanel routerId="demo-router-001">
        <div className="text-muted-foreground p-4 text-center">
          Tab content renders here via Outlet
        </div>
      </RouterPanel>
    );
  },
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
  },
};

export const Desktop: Story = {
  render: () => {
    localStorage.getItem = fn().mockReturnValue(null);

    return (
      <RouterPanel routerId="demo-router-001">
        <div className="text-muted-foreground p-6 text-center">
          Tab content renders here via Outlet
        </div>
      </RouterPanel>
    );
  },
  parameters: {
    viewport: { defaultViewport: 'desktop' },
  },
};
