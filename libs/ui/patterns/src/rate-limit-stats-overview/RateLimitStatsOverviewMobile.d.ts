/**
 * RateLimitStatsOverviewMobile Component
 * Mobile layout with stacked cards and simplified chart
 *
 * NAS-7.11: Implement Connection Rate Limiting
 */
import type { RateLimitStatsOverviewProps } from './types';
/**
 * RateLimitStatsOverviewMobile Component
 *
 * Mobile layout with stacked cards optimized for small screens:
 * - Card 1: Total blocked counter with trend
 * - Card 2: 12-hour timeline chart (reduced from 24h)
 * - Card 3: Top 5 blocked IPs list
 *
 * Features:
 * - Stacked layout for narrow screens
 * - 44px touch targets (WCAG AAA)
 * - Simplified chart with fewer data points
 * - Touch-friendly controls
 *
 * @example
 * ```tsx
 * <RateLimitStatsOverviewMobile routerId="192.168.1.1" />
 * ```
 */
export declare function RateLimitStatsOverviewMobile(props: RateLimitStatsOverviewProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=RateLimitStatsOverviewMobile.d.ts.map