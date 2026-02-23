/**
 * Storybook stories for DHCPServerList
 *
 * Top-level DHCP server management page at /network/dhcp.
 * Lists all DHCP servers configured on the selected router with platform-aware
 * rendering:
 *  - Desktop: dense DataTable with inline action dropdown menu
 *  - Mobile: scrollable card grid using DHCPServerCard pattern
 *
 * Row actions: View Details, Edit, Enable/Disable toggle, Delete (with toast
 * feedback). An empty state with a "Create DHCP Server" CTA is shown when
 * no servers are configured.
 *
 * Story: NAS-6.3 — DHCP Server Management
 */

import { DHCPServerList } from './dhcp-server-list';

import type { Meta, StoryObj } from '@storybook/react';

// ---------------------------------------------------------------------------
// Meta
// ---------------------------------------------------------------------------

const meta: Meta<typeof DHCPServerList> = {
  title: 'Pages/Network/DHCPServerList',
  component: DHCPServerList,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'DHCP Server List page (NAS-6.3). ' +
          'Displays all DHCP servers assigned to the currently connected router ' +
          'in a DataTable (desktop) or card grid (mobile). ' +
          'Each row/card exposes: server name, bound interface, address pool ' +
          '(CIDR), gateway + DNS summary, lease time, active lease count, and ' +
          'a status badge (bound vs. stopped). ' +
          'Row actions (via a dropdown menu) include: View Details, Edit, ' +
          'Enable, Disable, and Delete with toast success/error feedback. ' +
          'An EmptyState component with a "Create DHCP Server" action replaces ' +
          'the table when no servers are configured. ' +
          'A loading spinner is shown while the useDHCPServers query is in-flight. ' +
          'The component has no props — it reads the router IP from the Zustand ' +
          'connection store and detects the platform via usePlatform.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof DHCPServerList>;

// ---------------------------------------------------------------------------
// Stories
// ---------------------------------------------------------------------------

/**
 * Default — Servers Populated
 *
 * Renders the full table/card list using data from the MSW / Apollo mock
 * environment. On desktop the DataTable is shown; on mobile the card grid
 * is rendered automatically based on usePlatform().
 */
export const Default: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Standard populated view. Desktop renders a DataTable with columns ' +
          'for Name, Interface, Pool, Network (GW + DNS), Lease Time, Active ' +
          'Leases, Status, and Actions. Mobile renders a DHCPServerCard grid.',
      },
    },
  },
};

/**
 * Empty State
 *
 * No DHCP servers are configured. The EmptyState pattern component is shown
 * with a Server icon, a descriptive message, and a "Create DHCP Server"
 * primary action button.
 */
export const EmptyState: Story = {
  parameters: {
    mockData: {
      servers: [],
      isLoading: false,
    },
    docs: {
      description: {
        story:
          'Rendered when useDHCPServers returns an empty array. ' +
          'Shows the EmptyState pattern with a call-to-action to create the ' +
          'first DHCP server.',
      },
    },
  },
};

/**
 * Loading State
 *
 * The useDHCPServers query is in-flight. A centred loading indicator
 * occupies the full page height while data is being fetched from the router.
 */
export const LoadingState: Story = {
  parameters: {
    mockData: {
      servers: [],
      isLoading: true,
    },
    docs: {
      description: {
        story:
          'Full-page loading state. Displayed while the DHCP server list is ' +
          'being fetched. A "Loading DHCP servers..." message is centred in ' +
          'the viewport.',
      },
    },
  },
};

/**
 * Mobile Viewport — Card Grid
 *
 * Narrow viewport (<640px) forces the card-grid rendering path.
 * Each DHCPServerCard shows the server name, status badge, pool, interface,
 * and active lease count in a compact touch-friendly layout.
 */
export const MobileViewport: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
    docs: {
      description: {
        story:
          'Mobile breakpoint (<640px). The DataTable is replaced with a vertical ' +
          'card grid. Each card uses the DHCPServerCard pattern component with ' +
          '44px-minimum touch targets.',
      },
    },
  },
};

/**
 * Desktop Viewport — Dense DataTable
 *
 * Wide viewport (>1024px). All columns are visible simultaneously; the action
 * dropdown menu appears at the far right of each row. Enabled servers show a
 * "bound" status badge; disabled servers show "stopped".
 */
export const DesktopViewport: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'desktop',
    },
    docs: {
      description: {
        story:
          'Desktop breakpoint (>1024px). Full DataTable with all columns: Name, ' +
          'Interface, Pool, Network (GW + DNS inline), Lease Time, Active Leases, ' +
          'Status badge, and the Actions dropdown (View / Edit / Enable-Disable / ' +
          'Delete).',
      },
    },
  },
};
