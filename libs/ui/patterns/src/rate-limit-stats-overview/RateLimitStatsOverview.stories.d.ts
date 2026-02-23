/**
 * RateLimitStatsOverview Storybook Stories
 *
 * Visual documentation and testing for rate limit statistics overview component.
 *
 * Stories:
 * - Default (with activity)
 * - Empty state (no blocks)
 * - Recent activity only
 * - With chart
 * - Mobile vs Desktop presenters
 *
 * @module @nasnet/ui/patterns/rate-limit-stats-overview
 * @see NAS-7.11: Implement Connection Rate Limiting
 */
import type { StoryObj } from '@storybook/react';
/**
 * RateLimitStatsOverview - Rate limiting statistics and analytics
 *
 * The RateLimitStatsOverview component provides a comprehensive view of rate limiting
 * activity over time. It includes a 24-hour chart of trigger events, top blocked IPs,
 * and configurable polling intervals. Automatically adapts to platform (mobile/tablet/desktop).
 *
 * ## Features
 *
 * - **24-hour activity chart**: Line chart showing trigger events over last 24 hours
 * - **Top blocked IPs**: List of most frequently blocked addresses
 * - **Total block count**: Aggregate count of all blocks
 * - **Auto-refresh**: Configurable polling (5s, 10s, 30s, 1m, 5m)
 * - **Export data**: Download stats as JSON or CSV
 * - **Time range selector**: View last 1h, 6h, 12h, or 24h
 * - **Platform adaptive**: Desktop grid vs mobile stack
 * - **Accessibility**: WCAG AAA compliant, keyboard navigation, screen reader support
 *
 * ## Polling Intervals
 *
 * - **5 seconds**: Real-time monitoring (during active attack)
 * - **10 seconds**: Near real-time (high activity)
 * - **30 seconds**: Normal monitoring (default)
 * - **1 minute**: Light monitoring (low activity)
 * - **5 minutes**: Periodic checks (stable environment)
 * - **Manual**: User-triggered refresh only
 *
 * ## Usage
 *
 * ```tsx
 * import { RateLimitStatsOverview } from '@nasnet/ui/patterns/rate-limit-stats-overview';
 * import { useRateLimitStats } from '@nasnet/api-client/queries';
 *
 * function MyComponent() {
 *   const { data: stats, isLoading } = useRateLimitStats(routerId, {
 *     pollingInterval: 30000, // 30 seconds
 *   });
 *
 *   return (
 *     <RateLimitStatsOverview
 *       stats={stats}
 *       loading={isLoading}
 *       pollingInterval={30000}
 *       onExport={(format) => exportStats(stats, format)}
 *     />
 *   );
 * }
 * ```
 */
declare const meta: {
    title: string;
    component: import("react").NamedExoticComponent<import("./types").RateLimitStatsOverviewProps>;
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
    argTypes: {
        routerId: {
            control: "text";
            description: string;
        };
        className: {
            control: "text";
            description: string;
        };
    };
    args: {
        routerId: string;
    };
};
export default meta;
type Story = StoryObj<typeof meta>;
/**
 * Default State - With Activity
 *
 * Shows statistics with normal activity levels.
 * 24-hour chart shows varying trigger events throughout the day.
 */
export declare const Default: Story;
/**
 * Empty State - No Blocked IPs
 *
 * Shows empty state when no rate limiting has occurred.
 * Displays positive message that system is protected.
 */
export declare const Empty: Story;
/**
 * Recent Activity Only
 *
 * Shows statistics with activity only in last few hours.
 * Demonstrates dynamic chart scaling.
 */
export declare const RecentActivity: Story;
/**
 * High Activity - Attack Pattern
 *
 * Shows statistics during an active attack.
 * Chart shows sharp increase in trigger events.
 */
export declare const HighActivity: Story;
/**
 * Increasing Activity Pattern
 *
 * Shows statistics with steadily increasing activity.
 * May indicate developing attack or traffic spike.
 */
export declare const IncreasingActivity: Story;
/**
 * Decreasing Activity Pattern
 *
 * Shows statistics with declining activity.
 * Indicates attack subsiding or effective blocking.
 */
export declare const DecreasingActivity: Story;
/**
 * Loading State
 *
 * Shows skeleton loading state while fetching statistics.
 */
export declare const Loading: Story;
/**
 * With Chart - Full View
 *
 * Shows full stats overview with 24-hour chart expanded.
 * Chart takes prominent position for analysis.
 */
export declare const WithChart: Story;
/**
 * Without Chart - Compact View
 *
 * Hides the chart for more compact layout.
 * Shows only summary stats and top blocked IPs.
 */
export declare const WithoutChart: Story;
/**
 * 1 Hour Time Range
 *
 * Shows statistics for last 1 hour only.
 * More granular view for recent activity.
 */
export declare const OneHourRange: Story;
/**
 * Fast Polling - 5 Seconds
 *
 * Shows stats with 5-second auto-refresh.
 * Used during active attacks or monitoring.
 */
export declare const FastPolling: Story;
/**
 * Manual Refresh Only
 *
 * Disables auto-refresh, requires manual refresh button.
 * Saves bandwidth and resources.
 */
export declare const ManualRefresh: Story;
/**
 * Mobile Variant
 *
 * Forces mobile presenter (stacked layout).
 * Optimized for touch: vertical sections, simplified chart.
 */
export declare const MobileView: Story;
/**
 * Desktop Variant
 *
 * Forces desktop presenter (grid layout).
 * Optimized for large screens: side-by-side panels, full chart.
 */
export declare const DesktopView: Story;
/**
 * Accessibility Validation
 *
 * Validates WCAG AAA compliance.
 * Check Storybook a11y addon for zero violations.
 */
export declare const AccessibilityTest: Story;
//# sourceMappingURL=RateLimitStatsOverview.stories.d.ts.map