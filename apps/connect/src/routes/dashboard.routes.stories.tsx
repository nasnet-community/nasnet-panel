/**
 * Storybook stories for the Dashboard Routes route
 *
 * The /dashboard/routes route renders the RoutesPage which provides static
 * route management (NAS-6.5). Users can view, add, edit, and delete static
 * routes with gateway reachability checking and platform-aware UI.
 */

import { RoutesPage } from '@nasnet/features/network';

import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof RoutesPage> = {
  title: 'App/Dashboard/RoutesPage',
  component: RoutesPage,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Static route management page (NAS-6.5). Provides a full CRUD interface for ' +
          'managing static routes with filtering, sorting, gateway reachability checking, ' +
          'and platform-aware form rendering (Dialog on desktop, Sheet on mobile). ' +
          'Features include add/edit forms with interface and routing table selectors, ' +
          'and delete confirmation with safety warnings.',
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
type Story = StoryObj<typeof RoutesPage>;

/**
 * Default render with default routerId.
 */
export const Default: Story = {
  name: 'Default (loading state)',
  render: () => <RoutesPage />,
  parameters: {
    docs: {
      description: {
        story:
          'Initial render using the default "default-router" routerId. ' +
          'The RouteList component fetches routes via Apollo and shows ' +
          'loading state until data arrives. The "Add Route" button is visible in the header.',
      },
    },
  },
};

/**
 * With a specific router ID.
 */
export const WithRouterId: Story = {
  name: 'With Router ID',
  render: () => <RoutesPage routerId="192.168.88.1" />,
  parameters: {
    docs: {
      description: {
        story:
          'RoutesPage rendered with a specific router IP address. ' +
          'In production, routerId comes from the router context or connection store.',
      },
    },
  },
};

/**
 * Populated route list - annotated variant showing expected route entries.
 */
export const PopulatedRouteList: Story = {
  name: 'Populated Route List (annotated)',
  render: () => <RoutesPage />,
  decorators: [
    (Story) => (
      <div className="relative">
        <Story />
        <div
          style={{
            position: 'fixed',
            bottom: 16,
            right: 16,
            background: 'rgba(30,30,30,0.88)',
            color: '#d4d4d4',
            padding: '10px 14px',
            borderRadius: 8,
            fontSize: 11,
            lineHeight: 1.6,
            maxWidth: 300,
            pointerEvents: 'none',
          }}
        >
          <strong style={{ color: '#EFC729' }}>Expected route entries</strong>
          <br />
          In a live context the list shows:
          <br />- 0.0.0.0/0 via 192.168.1.1 (default)
          <br />- 10.0.0.0/8 via 10.0.0.1 (ether2)
          <br />- 172.16.0.0/12 via bridge1
          <br />
          Each row has edit/delete actions and status indicators.
        </div>
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story:
          'Describes the populated state where the RouteList displays all configured ' +
          'static routes including destination, gateway, interface, distance, and routing ' +
          'table. Routes show reachability status and offer edit/delete action buttons.',
      },
    },
  },
};

/**
 * Mobile view - platform-aware form rendering.
 */
export const MobileView: Story = {
  name: 'Mobile View (annotated)',
  render: () => <RoutesPage />,
  decorators: [
    (Story) => (
      <div className="relative">
        <Story />
        <div
          style={{
            position: 'fixed',
            bottom: 16,
            right: 16,
            background: 'rgba(59,130,246,0.85)',
            color: '#fff',
            padding: '8px 14px',
            borderRadius: 8,
            fontSize: 12,
            fontWeight: 600,
            pointerEvents: 'none',
          }}
        >
          Mobile: Route form opens as bottom Sheet (90vh)
        </div>
      </div>
    ),
  ],
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
    docs: {
      description: {
        story:
          'On mobile viewports, the RouteForm opens as a bottom Sheet instead of a ' +
          'centered Dialog. The usePlatform() hook detects the viewport and renders ' +
          'the appropriate container. Touch targets meet the 44px minimum requirement.',
      },
    },
  },
};

export const Desktop: Story = {
  render: () => <RoutesPage />,
  parameters: {
    viewport: { defaultViewport: 'desktop' },
  },
};
