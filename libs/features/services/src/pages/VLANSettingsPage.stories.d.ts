/**
 * Storybook stories for VLANSettingsPage
 *
 * VLAN Settings management page with three tabs:
 * - Pool Config: Configure VLAN pool range
 * - Allocations: View and filter VLAN allocations
 * - Diagnostics: Orphan detection and cleanup tools
 *
 * The page is platform-aware: Desktop renders a sidebar gauge + tabbed
 * content area; Mobile/Tablet stacks the gauge above the tabs.
 *
 * Individual sub-components (VLANPoolGauge, VLANAllocationTable,
 * VLANPoolConfig) are tested in their own story files.
 */
import { VLANSettingsPage } from './VLANSettingsPage';
import type { Meta, StoryObj } from '@storybook/react';
declare const meta: Meta<typeof VLANSettingsPage>;
export default meta;
type Story = StoryObj<typeof VLANSettingsPage>;
/**
 * Default — Desktop layout with a typical router ID.
 *
 * Renders the sidebar gauge and Pool Config tab by default.
 * The actual gauge and table content depends on the MSW / Apollo mock
 * setup in the Storybook environment.
 */
export declare const Default: Story;
/**
 * Mobile Viewport
 *
 * Narrow viewport (<640px) collapses the desktop sidebar.
 * The gauge is rendered above the tabs in a stacked layout.
 * Tab labels are abbreviated (Config / Allocs / Tools) to fit the screen.
 */
export declare const MobileViewport: Story;
/**
 * Tablet Viewport
 *
 * Mid-range viewport (640–1024px) uses the mobile/tablet stacked layout
 * (same as mobile) since the component branches only on desktop.
 */
export declare const TabletViewport: Story;
/**
 * Desktop Viewport
 *
 * Wide viewport (>1024px) activates the sidebar-plus-content layout.
 * The 320px gauge sidebar is fixed on the left; tabs occupy the remaining space.
 */
export declare const DesktopViewport: Story;
//# sourceMappingURL=VLANSettingsPage.stories.d.ts.map