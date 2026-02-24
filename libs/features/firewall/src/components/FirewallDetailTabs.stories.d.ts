/**
 * Storybook stories for FirewallDetailTabs
 *
 * The FirewallDetailTabs component renders a 10-tab navigation over filter
 * rules, NAT rules, routing table, mangle, RAW, rate-limiting, address lists,
 * connections, templates and logs.
 *
 * Because this component composes several data-fetching child components
 * (FilterRulesTable, NATRulesTable, RoutingTable, etc.) these stories render
 * the tab shell in isolation using static tab-content placeholders so that
 * the tab navigation, responsive labels and active-tab indicator can be
 * reviewed without a live router connection.
 */
import { FirewallDetailTabs } from './FirewallDetailTabs';
import type { Meta, StoryObj } from '@storybook/react';
declare const meta: Meta<typeof FirewallDetailTabs>;
export default meta;
type Story = StoryObj<typeof FirewallDetailTabs>;
/**
 * Starts on the Filter Rules tab (default).
 */
export declare const DefaultFilterTab: Story;
/**
 * Opens directly on the NAT Rules tab.
 */
export declare const NATRulesTab: Story;
/**
 * Opens directly on the Routing Table tab.
 */
export declare const RoutingTableTab: Story;
/**
 * Opens the RAW Rules tab — renders the "navigate elsewhere" placeholder.
 */
export declare const RAWRulesTab: Story;
/**
 * Opens the Connections tab.
 */
export declare const ConnectionsTab: Story;
/**
 * Desktop viewport — all tab labels visible.
 */
export declare const DesktopViewport: Story;
/**
 * Mobile viewport — tab labels collapse to short abbreviations.
 */
export declare const MobileViewport: Story;
//# sourceMappingURL=FirewallDetailTabs.stories.d.ts.map