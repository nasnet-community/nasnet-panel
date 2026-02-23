/**
 * FirewallLogStats Pattern Component
 *
 * Statistics panel for firewall log viewer with:
 * - Top Blocked IPs list (top 10)
 * - Top Ports list (top 10)
 * - Action Distribution pie chart
 *
 * Implements Headless + Platform Presenters pattern (ADR-018).
 *
 * @example
 * ```tsx
 * import { FirewallLogStats } from '@nasnet/ui/patterns';
 *
 * <FirewallLogStats
 *   logs={firewallLogs}
 *   onAddToBlocklist={(ip) => addToBlocklist(ip)}
 * />
 * ```
 */
import type { FirewallLogEntry } from '@nasnet/core/types';
export interface FirewallLogStatsProps {
    /** Firewall log entries to compute stats from */
    logs: FirewallLogEntry[];
    /** Callback when "Add to Blocklist" is clicked */
    onAddToBlocklist?: (ip: string) => void;
    /** Loading state */
    loading?: boolean;
    /** Container className */
    className?: string;
}
/**
 * FirewallLogStats - Display firewall log statistics
 *
 * Automatically selects the appropriate presenter based on platform:
 * - Mobile (<640px): Compact cards with 44px touch targets, stacked layout
 * - Tablet/Desktop (>=640px): Side-by-side layout with detailed stats
 *
 * Features:
 * - Top 10 blocked IPs with "Add to Blocklist" action
 * - Top 10 destination ports with service name lookup
 * - Action distribution pie chart (Orange accent #F97316)
 * - Responsive layouts optimized for each platform
 */
declare function FirewallLogStatsComponent(props: FirewallLogStatsProps): import("react/jsx-runtime").JSX.Element;
export declare const FirewallLogStats: import("react").MemoExoticComponent<typeof FirewallLogStatsComponent>;
export {};
//# sourceMappingURL=FirewallLogStats.d.ts.map