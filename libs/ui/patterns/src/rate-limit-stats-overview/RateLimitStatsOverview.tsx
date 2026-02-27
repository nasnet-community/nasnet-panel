/**
 * RateLimitStatsOverview Component
 * Main wrapper with platform detection for rate limit statistics
 *
 * Follows Headless + Platform Presenters pattern (ADR-018)
 *
 * NAS-7.11: Implement Connection Rate Limiting
 */

import { memo } from 'react';

import { usePlatform } from '@nasnet/ui/layouts';

import { RateLimitStatsOverviewDesktop } from './RateLimitStatsOverviewDesktop';
import { RateLimitStatsOverviewMobile } from './RateLimitStatsOverviewMobile';

import type { RateLimitStatsOverviewProps } from './types';

/**
 * RateLimitStatsOverview Component
 *
 * Displays comprehensive rate limiting statistics with platform-specific UI:
 * - Desktop: 3-column grid layout with dense data presentation
 * - Mobile: Stacked cards with simplified chart (12h vs 24h)
 *
 * Features:
 * - Total blocked connections counter with trend indicator
 * - 24-hour timeline chart (Recharts BarChart) - 12h on mobile
 * - Top 5 blocked IP addresses list
 * - Auto-refresh with configurable polling interval (5s, 10s, 30s, 60s)
 * - Export to CSV functionality
 * - WCAG AAA accessibility (live regions, ARIA labels)
 *
 * @example
 * ```tsx
 * <RateLimitStatsOverview routerId="192.168.1.1" />
 * ```
 */
export const RateLimitStatsOverview = memo(function RateLimitStatsOverview(
  props: RateLimitStatsOverviewProps
) {
  const platform = usePlatform();

  return platform === 'mobile' ?
      <RateLimitStatsOverviewMobile {...props} />
    : <RateLimitStatsOverviewDesktop {...props} />;
});

RateLimitStatsOverview.displayName = 'RateLimitStatsOverview';

// Re-export presenters for direct usage
export { RateLimitStatsOverviewDesktop, RateLimitStatsOverviewMobile };
export type { RateLimitStatsOverviewProps };
