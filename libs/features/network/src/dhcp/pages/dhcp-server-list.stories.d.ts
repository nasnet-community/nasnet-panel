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
declare const meta: Meta<typeof DHCPServerList>;
export default meta;
type Story = StoryObj<typeof DHCPServerList>;
/**
 * Default — Servers Populated
 *
 * Renders the full table/card list using data from the MSW / Apollo mock
 * environment. On desktop the DataTable is shown; on mobile the card grid
 * is rendered automatically based on usePlatform().
 */
export declare const Default: Story;
/**
 * Empty State
 *
 * No DHCP servers are configured. The EmptyState pattern component is shown
 * with a Server icon, a descriptive message, and a "Create DHCP Server"
 * primary action button.
 */
export declare const EmptyState: Story;
/**
 * Loading State
 *
 * The useDHCPServers query is in-flight. A centred loading indicator
 * occupies the full page height while data is being fetched from the router.
 */
export declare const LoadingState: Story;
/**
 * Mobile Viewport — Card Grid
 *
 * Narrow viewport (<640px) forces the card-grid rendering path.
 * Each DHCPServerCard shows the server name, status badge, pool, interface,
 * and active lease count in a compact touch-friendly layout.
 */
export declare const MobileViewport: Story;
/**
 * Desktop Viewport — Dense DataTable
 *
 * Wide viewport (>1024px). All columns are visible simultaneously; the action
 * dropdown menu appears at the far right of each row. Enabled servers show a
 * "bound" status badge; disabled servers show "stopped".
 */
export declare const DesktopViewport: Story;
//# sourceMappingURL=dhcp-server-list.stories.d.ts.map