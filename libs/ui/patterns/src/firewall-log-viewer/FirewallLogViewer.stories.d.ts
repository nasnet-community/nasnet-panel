/**
 * FirewallLogViewer Storybook Stories
 *
 * Comprehensive stories covering various states and scenarios.
 * Includes both Desktop and Mobile presenters.
 *
 * @module @nasnet/ui/patterns/firewall-log-viewer
 */
import { FirewallLogViewer } from './FirewallLogViewer';
import type { Meta, StoryObj } from '@storybook/react';
declare const meta: Meta<typeof FirewallLogViewer>;
export default meta;
type Story = StoryObj<typeof FirewallLogViewer>;
/**
 * Default state with sample logs.
 * Shows typical log viewer with mix of accept/drop/reject actions.
 */
export declare const Default: Story;
/**
 * Loading state while fetching logs.
 * Shows skeleton or loading indicator.
 */
export declare const Loading: Story;
/**
 * Error state when log fetch fails.
 * Shows error message with retry option.
 */
export declare const ErrorState: Story;
/**
 * Empty state with no logs found.
 * Shows when filters return no results or no logs exist.
 */
export declare const Empty: Story;
/**
 * With active filters applied.
 * Shows filtered logs with filter badge count.
 */
export declare const WithFilters: Story;
/**
 * With stats panel expanded.
 * Shows log statistics with top blocked IPs and ports.
 */
export declare const WithStats: Story;
/**
 * With log selected showing details.
 * Shows expanded detail panel for selected log entry.
 */
export declare const WithSelectedLog: Story;
/**
 * With auto-refresh enabled.
 * Shows active auto-refresh with interval selector.
 */
export declare const WithAutoRefresh: Story;
/**
 * Large dataset (100+ logs).
 * Demonstrates virtualization performance with many logs.
 */
export declare const LargeDataset: Story;
/**
 * Mobile layout variant.
 * Forces mobile presenter for demonstration.
 */
export declare const MobileLayout: Story;
/**
 * Sorted by source IP ascending.
 * Shows logs sorted by different criteria.
 */
export declare const SortedBySourceIP: Story;
/**
 * With search query applied.
 * Shows logs filtered by search term.
 */
export declare const WithSearch: Story;
/**
 * Only drop actions (security monitoring).
 * Focused view for security analysis.
 */
export declare const SecurityMonitoring: Story;
/**
 * Refreshing state.
 * Shows refresh indicator while data updates.
 */
export declare const Refreshing: Story;
//# sourceMappingURL=FirewallLogViewer.stories.d.ts.map