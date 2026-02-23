/**
 * Storybook stories for DashboardPage
 *
 * Main landing page after login. Renders router health summary cards,
 * resource utilisation gauges, and the recent-logs widget for every
 * configured router. Epic 5 — Story 5.1.
 *
 * Because DashboardPage owns its own internal state and composes several
 * data-fetching sub-components (RouterHealthSummaryCard, ResourceGauges,
 * RecentLogs), these stories demonstrate the page shell at the layout level.
 * Individual sub-components are tested in their own story files.
 */
import { DashboardPage } from './DashboardPage';
import type { Meta, StoryObj } from '@storybook/react';
declare const meta: Meta<typeof DashboardPage>;
export default meta;
type Story = StoryObj<typeof DashboardPage>;
/**
 * Default render with the three hard-coded mock router IDs.
 * Each section fires its own GraphQL query/subscription so the actual
 * content depends on the MSW/Apollo mock setup in the Storybook environment.
 */
export declare const Default: Story;
/**
 * Demonstrates the full-page layout in a narrow viewport to verify
 * mobile-first single-column stacking.
 * Resize the Canvas panel to <640px to activate the mobile layout.
 */
export declare const MobileViewport: Story;
/**
 * Tablet viewport (640–1024px) — two-column grid, collapsible sidebar.
 */
export declare const TabletViewport: Story;
/**
 * Desktop viewport (>1024px) — three-column grid with dense data tables.
 */
export declare const DesktopViewport: Story;
//# sourceMappingURL=DashboardPage.stories.d.ts.map