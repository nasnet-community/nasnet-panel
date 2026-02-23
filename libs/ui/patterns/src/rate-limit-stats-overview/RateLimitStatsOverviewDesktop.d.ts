/**
 * RateLimitStatsOverviewDesktop Component
 * Desktop layout with 3-column grid for stats overview
 *
 * NAS-7.11: Implement Connection Rate Limiting
 */
import type { RateLimitStatsOverviewProps } from './types';
/**
 * RateLimitStatsOverviewDesktop Component
 *
 * Desktop layout with 3-column grid:
 * - Left: Total blocked counter with trend indicator
 * - Center: 24-hour timeline chart (Recharts BarChart)
 * - Right: Top 5 blocked IPs list
 *
 * Features:
 * - Dense data presentation
 * - Grid layout optimized for wide screens
 * - Recharts BarChart with hourly buckets
 * - Polling interval selector
 * - Export to CSV button
 *
 * @example
 * ```tsx
 * <RateLimitStatsOverviewDesktop routerId="192.168.1.1" />
 * ```
 */
export declare const RateLimitStatsOverviewDesktop: import("react").NamedExoticComponent<RateLimitStatsOverviewProps>;
//# sourceMappingURL=RateLimitStatsOverviewDesktop.d.ts.map