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
declare const meta: Meta<typeof DHCPServerDetail>;
export default meta;
type Story = StoryObj<typeof DHCPServerDetail>;
/**
 * Default
 *
 * Renders the Overview tab. Content is driven by the MSW / Apollo mock
 * environment; the page reads serverId from the router context provided
 * by the Storybook decorator or the active route mock.
 */
export declare const Default: Story;
/**
 * Loading State
 *
 * Simulates the moment the page is first mounted before the GraphQL query
 * resolves. A centred "Loading DHCP server..." message occupies the full
 * page height.
 */
export declare const Loading: Story;
/**
 * Server Not Found
 *
 * Rendered when the server query resolves with a null result (e.g., the
 * server was deleted between page navigations). Shows a centred error card
 * with a "Back to DHCP Servers" navigation button.
 */
export declare const ServerNotFound: Story;
/**
 * Mobile Viewport
 *
 * Narrow viewport (<640px). The tabbed interface stacks vertically;
 * form inputs are full-width with 44px touch targets to meet WCAG AAA
 * requirements for touch-first usage in server rooms.
 */
export declare const MobileViewport: Story;
/**
 * Desktop Viewport
 *
 * Wide viewport (>1024px). The tab strip fits all four tabs in a single row.
 * The pool information grid uses a two-column layout with generous spacing.
 */
export declare const DesktopViewport: Story;
//# sourceMappingURL=dhcp-server-detail.stories.d.ts.map