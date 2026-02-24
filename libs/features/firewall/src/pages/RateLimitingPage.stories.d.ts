/**
 * RateLimitingPage Storybook Stories
 *
 * Interactive stories for the Rate Limiting page domain component.
 * Demonstrates three tabs (Rate Limits, SYN Flood, Statistics), empty states, and responsive layout.
 *
 * @module @nasnet/features/firewall/pages
 */
import type { StoryObj } from '@storybook/react';
/**
 * RateLimitingPage - Connection rate limiting management page
 *
 * The RateLimitingPage provides a three-tab interface for managing connection rate limiting,
 * SYN flood protection, and viewing blocking statistics on MikroTik routers.
 *
 * ## Features
 *
 * - **Rate Limits Tab**: Manage per-IP/subnet connection rate limit rules
 * - **SYN Flood Tab**: Configure SYN flood protection with info and warning alerts
 * - **Statistics Tab**: View rate limit stats overview and blocked IPs table
 * - **Add Rule**: Opens RateLimitRuleEditor Sheet (tab-aware header action)
 * - **Refresh**: Re-fetch statistics with spinning icon feedback
 * - **Export CSV**: Download statistics for reporting
 * - **Clear Blocked IPs**: Bulk unblock all blocked IPs (shown only when IPs exist)
 * - **Empty States**: Tab-specific empty states with contextual guidance
 * - **Loading Skeletons**: Smooth loading during data fetch
 * - **Responsive**: Bottom Sheet on mobile, right Sheet on desktop
 * - **Accessibility**: WCAG AAA with min-h-[44px] touch targets
 *
 * ## Tab Behaviors
 *
 * - **rate-limits**: Header shows "Add Rate Limit" button
 * - **syn-flood**: Header is empty (config panel handles its own actions)
 * - **statistics**: Header shows Refresh, Export CSV, and optional Clear buttons
 *
 * ## Usage
 *
 * ```tsx
 * import { RateLimitingPage } from '@nasnet/features/firewall/pages';
 *
 * function FirewallApp() {
 *   return <RateLimitingPage />;
 * }
 * ```
 */
declare const meta: {
    title: string;
    component: import("react").NamedExoticComponent<object>;
    parameters: {
        layout: string;
        docs: {
            description: {
                component: string;
            };
        };
        a11y: {
            config: {
                rules: {
                    id: string;
                    enabled: boolean;
                }[];
            };
        };
    };
    tags: string[];
    decorators: ((Story: import("storybook/internal/csf").PartialStoryFn<import("@storybook/react").ReactRenderer, object>) => import("react/jsx-runtime").JSX.Element)[];
};
export default meta;
type Story = StoryObj<typeof meta>;
/**
 * Rate Limits Tab - Empty State
 *
 * No rate limit rules configured. Shows a dashed-border card with "Add Rate Limit" CTA.
 * The header also shows the "Add Rate Limit" button since this is the active tab.
 */
export declare const EmptyRateLimitsTab: Story;
/**
 * SYN Flood Protection Tab
 *
 * The SYN Flood tab shows two alerts (info and warning) plus the SynFloodConfigPanel.
 * The header has no action buttons when this tab is active — config handles itself.
 */
export declare const SynFloodTab: Story;
/**
 * Statistics Tab - Empty Blocked IPs
 *
 * Statistics tab with the RateLimitStatsOverview visible but no blocked IPs yet.
 * Shows empty state for the blocked IPs section. Header shows Refresh and Export CSV.
 */
export declare const StatisticsTabEmpty: Story;
/**
 * Statistics Tab - With Blocked IPs
 *
 * Statistics tab showing the BlockedIPsTable with active blocked IPs.
 * Header gains a "Clear Blocked IPs" destructive button when blocked IPs exist.
 */
export declare const StatisticsTabWithBlockedIPs: Story;
/**
 * Mobile View
 *
 * Mobile layout (<640px) with horizontally scrollable tabs and bottom Sheet for rule editor.
 * Tab labels may be truncated; touch targets meet 44px minimum requirement.
 */
export declare const MobileView: Story;
//# sourceMappingURL=RateLimitingPage.stories.d.ts.map