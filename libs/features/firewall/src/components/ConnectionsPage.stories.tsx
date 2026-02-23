/**
 * Storybook stories for ConnectionsPage
 *
 * Demonstrates the connection tracking page with its tabbed interface:
 * the active connections list and the connection tracking settings panel.
 *
 * Note: This page component depends heavily on router hooks (useParams) and
 * data-fetching hooks. Stories showcase the UI shell and tab navigation using
 * the decorator pattern to intercept those dependencies.
 */

import { ConnectionsPage } from './ConnectionsPage';

import type { Meta, StoryObj } from '@storybook/react';

// ============================================================================
// Meta
// ============================================================================

const meta: Meta<typeof ConnectionsPage> = {
  title: 'Features/Firewall/ConnectionsPage',
  component: ConnectionsPage,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Full-page view for firewall connection tracking. ' +
          'Provides a two-tab interface: "Connections" for monitoring and killing active ' +
          'network connections with 5-second auto-refresh and wildcard filtering, and ' +
          '"Settings" for configuring connection tracking parameters. ' +
          'Requires a selected router (routerId from URL params).',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof ConnectionsPage>;

// ============================================================================
// Stories
// ============================================================================

/**
 * Default state when no routerId is present in the URL params.
 * Shows the empty-state prompt asking the user to select a router.
 */
export const NoRouterSelected: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'When no router is selected (routerId absent from URL params), the page renders ' +
          'an informational empty state with an Activity icon and guidance text.',
      },
    },
    reactRouter: {
      routePath: '/firewall/connections',
      routeParams: {},
    },
  },
};

/**
 * Page shell with a router ID present — shows the tabbed layout.
 * Data hooks are not mocked so the list and settings panels will
 * show their own loading/empty states.
 */
export const WithRouterSelected: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'When a valid routerId is present in the URL the page renders the full ' +
          'two-tab interface. The connections list tab is active by default.',
      },
    },
    reactRouter: {
      routePath: '/router/$id/firewall/connections',
      routeParams: { id: '192.168.88.1' },
    },
  },
};

/**
 * Renders with the Settings tab pre-selected to show the connection
 * tracking settings panel.
 */
export const SettingsTabActive: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'The Settings tab contains the ConnectionTrackingSettings panel where admins ' +
          'can configure TCP, UDP, and ICMP timeout values. Dangerous changes require ' +
          'a safety confirmation countdown before being applied.',
      },
    },
    reactRouter: {
      routePath: '/router/$id/firewall/connections',
      routeParams: { id: '192.168.88.1' },
    },
  },
  play: async ({ canvasElement }) => {
    // Click the Settings tab to activate it
    const settingsTab = canvasElement.querySelector('[value="settings"]') as HTMLElement | null;
    settingsTab?.click();
  },
};

/**
 * Dark-mode variant — verifies semantic token usage renders correctly
 * on dark backgrounds.
 */
export const DarkMode: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Dark mode rendering of the ConnectionsPage using the project theme provider.',
      },
    },
    backgrounds: { default: 'dark' },
    reactRouter: {
      routePath: '/router/$id/firewall/connections',
      routeParams: { id: '10.0.0.1' },
    },
  },
};
