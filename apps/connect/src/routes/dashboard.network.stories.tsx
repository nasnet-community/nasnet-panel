/**
 * Storybook stories for the Dashboard Network route
 *
 * The /dashboard/network route renders the InterfaceListPage which displays
 * a list of network interfaces on the connected router. Users can view,
 * filter, and manage router interfaces (ether, wlan, bridge, etc.).
 */

import { InterfaceListPage } from '@nasnet/features/network';

import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof InterfaceListPage> = {
  title: 'App/Dashboard/InterfaceListPage',
  component: InterfaceListPage,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Network interface management page (NAS-6.1). Displays a list of all router ' +
          'network interfaces with their status, type, and configuration details. ' +
          'Supports filtering and sorting. The routerId prop defaults to "default-router" ' +
          'when not connected to a live router.',
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
type Story = StoryObj<typeof InterfaceListPage>;

/**
 * Default render with default routerId - shows the interface list shell.
 */
export const Default: Story = {
  name: 'Default (loading state)',
  render: () => <InterfaceListPage />,
  parameters: {
    docs: {
      description: {
        story:
          'Initial render using the default "default-router" routerId. ' +
          'The InterfaceList component fetches data via Apollo and shows ' +
          'loading skeletons until data arrives.',
      },
    },
  },
};

/**
 * With a specific router ID passed as prop.
 */
export const WithRouterId: Story = {
  name: 'With Router ID',
  render: () => <InterfaceListPage routerId="192.168.88.1" />,
  parameters: {
    docs: {
      description: {
        story:
          'InterfaceListPage rendered with a specific router IP. In production, ' +
          'the routerId is provided by the TanStack Router context or connection store.',
      },
    },
  },
};

/**
 * Populated interface list - annotated variant showing expected data shape.
 */
export const PopulatedList: Story = {
  name: 'Populated List (annotated)',
  render: () => <InterfaceListPage />,
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
            maxWidth: 280,
            pointerEvents: 'none',
          }}
        >
          <strong style={{ color: '#EFC729' }}>Expected interfaces</strong>
          <br />
          In a live context the list shows:
          <br />- ether1 (WAN) — running, 1Gbps
          <br />- ether2-5 (LAN) — running/disabled
          <br />- bridge1 — running
          <br />- wlan1 — running, 2.4GHz
        </div>
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story:
          'Describes the populated state where the InterfaceList shows all router ' +
          'interfaces including ethernet ports, bridges, wireless, and virtual interfaces. ' +
          'Each row shows interface name, type, MAC address, status, and link speed.',
      },
    },
  },
};

export const Mobile: Story = {
  render: () => <InterfaceListPage />,
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
  },
};

export const Desktop: Story = {
  render: () => <InterfaceListPage />,
  parameters: {
    viewport: { defaultViewport: 'desktop' },
  },
};
