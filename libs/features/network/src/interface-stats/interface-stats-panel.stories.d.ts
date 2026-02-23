/**
 * Storybook stories for InterfaceStatsPanel
 * NAS-6.9: Implement Interface Traffic Statistics
 *
 * InterfaceStatsPanel is a headless + platform-presenter component (ADR-018)
 * that auto-selects InterfaceStatsPanelDesktop or InterfaceStatsPanelMobile
 * based on the current viewport.  Stories cover prop combinations and both
 * explicit presenter variants.
 *
 * The component fetches data via useInterfaceStatsPanel (Apollo + subscription).
 * A MockedProvider decorator provides the necessary GraphQL mock context so the
 * panel renders its loading/error/data states correctly in Storybook.
 */
import { InterfaceStatsPanel } from './interface-stats-panel';
import type { Meta, StoryObj } from '@storybook/react';
declare const meta: Meta<typeof InterfaceStatsPanel>;
export default meta;
type Story = StoryObj<typeof InterfaceStatsPanel>;
/**
 * Platform-adaptive panel for the primary WAN interface.
 * Renders Desktop presenter on wide viewports, Mobile on narrow viewports.
 */
export declare const Default: Story;
/**
 * LAN bridge interface with a longer display name.
 */
export declare const LanBridgeInterface: Story;
/**
 * High error rate scenario — triggers the red warning banner and error-rate
 * indicator in error state.
 */
export declare const HighErrorRate: Story;
/**
 * Desktop presenter rendered directly — for visual regression tests at a
 * fixed wide viewport regardless of Storybook's current breakpoint.
 */
export declare const DesktopPresenter: Story;
/**
 * Mobile presenter rendered directly — for visual regression tests at a
 * fixed narrow viewport.
 */
export declare const MobilePresenter: Story;
/**
 * Slow polling interval — 30 s refresh, suitable for bandwidth-constrained
 * management links or metered LTE uplinks.
 */
export declare const SlowPolling: Story;
//# sourceMappingURL=interface-stats-panel.stories.d.ts.map