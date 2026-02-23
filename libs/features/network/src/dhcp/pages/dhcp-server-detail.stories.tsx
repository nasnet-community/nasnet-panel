/**
 * Storybook stories for DHCPServerDetail
 *
 * Detailed view of a single DHCP server. Rendered when navigating to
 * /network/dhcp/:serverId. The page reads the server ID from the URL
 * via useParams and fetches server + lease data via GraphQL hooks.
 *
 * Four tabs:
 *  - Overview: Pool information card and DHCPSummaryCard
 *  - Leases: Active lease table (LeaseTable pattern)
 *  - Static Bindings: Add-binding form + static binding list
 *  - Settings: Full server settings form with React Hook Form + Zod
 *
 * Story: NAS-6.3 — DHCP Server Management
 */

import { DHCPServerDetail } from './dhcp-server-detail';

import type { Meta, StoryObj } from '@storybook/react';

// ---------------------------------------------------------------------------
// Meta
// ---------------------------------------------------------------------------

const meta: Meta<typeof DHCPServerDetail> = {
  title: 'Pages/Network/DHCPServerDetail',
  component: DHCPServerDetail,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'DHCP Server Detail page (NAS-6.3). ' +
          'Provides a tabbed interface for inspecting and managing a single ' +
          'DHCP server: pool information, active leases with a "Make Static" ' +
          'action, a static-binding form (MAC → IP), and a full settings form ' +
          'with gateway, DNS servers, lease time, optional domain, and NTP ' +
          'fields. ' +
          'Settings are validated with Zod and submitted via React Hook Form. ' +
          'The component reads serverId from the URL via @tanstack/react-router ' +
          'useParams and the current router IP from the Zustand connection store. ' +
          'Loading and not-found states are handled with graceful fallback UI.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof DHCPServerDetail>;

// ---------------------------------------------------------------------------
// Stories
// ---------------------------------------------------------------------------

/**
 * Default
 *
 * Renders the Overview tab. Content is driven by the MSW / Apollo mock
 * environment; the page reads serverId from the router context provided
 * by the Storybook decorator or the active route mock.
 */
export const Default: Story = {};

/**
 * Loading State
 *
 * Simulates the moment the page is first mounted before the GraphQL query
 * resolves. A centred "Loading DHCP server..." message occupies the full
 * page height.
 */
export const Loading: Story = {
  parameters: {
    mockData: {
      serverLoading: true,
      server: null,
      leases: [],
    },
    docs: {
      description: {
        story:
          'Full-page loading state displayed while the DHCP server data is ' +
          'being fetched from the router.',
      },
    },
  },
};

/**
 * Server Not Found
 *
 * Rendered when the server query resolves with a null result (e.g., the
 * server was deleted between page navigations). Shows a centred error card
 * with a "Back to DHCP Servers" navigation button.
 */
export const ServerNotFound: Story = {
  parameters: {
    mockData: {
      serverLoading: false,
      server: null,
      leases: [],
    },
    docs: {
      description: {
        story:
          'Empty / not-found state. Displayed when no server matches the ' +
          'serverId URL parameter.',
      },
    },
  },
};

/**
 * Mobile Viewport
 *
 * Narrow viewport (<640px). The tabbed interface stacks vertically;
 * form inputs are full-width with 44px touch targets to meet WCAG AAA
 * requirements for touch-first usage in server rooms.
 */
export const MobileViewport: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
    docs: {
      description: {
        story:
          'Mobile breakpoint (<640px). Tabs remain accessible; form layouts ' +
          'become single-column; pool info grid adjusts to two narrow columns.',
      },
    },
  },
};

/**
 * Desktop Viewport
 *
 * Wide viewport (>1024px). The tab strip fits all four tabs in a single row.
 * The pool information grid uses a two-column layout with generous spacing.
 */
export const DesktopViewport: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'desktop',
    },
    docs: {
      description: {
        story:
          'Desktop breakpoint (>1024px). Dense grid layout for the pool info ' +
          'card; the Settings form sections (Basic / Network / Optional) are ' +
          'clearly delineated with FormSection wrappers.',
      },
    },
  },
};
