/**
 * BandwidthChart - Main component with automatic platform detection
 * Auto-selects Desktop or Mobile presenter based on viewport
 * Follows ADR-018 (Headless + Platform Presenters pattern)
 */

import { memo } from 'react';
import { usePlatform } from '@nasnet/ui/layouts';
import { BandwidthChartDesktop } from './BandwidthChartDesktop';
import { BandwidthChartMobile } from './BandwidthChartMobile';
import type { BandwidthChartProps } from './types';

/**
 * BandwidthChart - Real-time bandwidth usage visualization
 *
 * @description
 * Main wrapper that auto-detects platform and renders appropriate presenter:
 * - Mobile (<640px) → BandwidthChartMobile (200px height, simplified)
 * - Desktop (≥640px) → BandwidthChartDesktop (300px height, full controls)
 *
 * Displays real-time TX/RX traffic with historical data selection (5min/1hr/24hr),
 * interface filtering, GraphQL subscriptions with polling fallback, and full WCAG AAA
 * accessibility support including screen reader accessible data table.
 *
 * **Design System:** Uses semantic color tokens (primary, success, muted) and
 * responsive spacing tokens. Implements Headless + Platform Presenter pattern
 * per ADR-018 with platform-specific optimizations.
 *
 * **Accessibility:** Chart has `role="img"` with descriptive aria-label and
 * screen-reader-only data table. Respects `prefers-reduced-motion`. All data
 * values use `font-variant-numeric: tabular-nums` for alignment.
 *
 * **Performance:** Uses memoization, stable callbacks via `useCallback`, and
 * respects viewport size for efficient rendering. Platform presenters are
 * conditionally rendered (not both at once).
 *
 * @param props - Component props { deviceId: string, className?: string }
 * @param props.deviceId - Router/device UUID to fetch bandwidth data
 * @param props.className - Optional CSS class name
 *
 * @returns Memoized component with platform-specific presenter
 *
 * @example
 * ```tsx
 * import { BandwidthChart } from '@nasnet/features/dashboard';
 *
 * // Auto-detection (recommended)
 * <BandwidthChart deviceId="router-123" />
 *
 * // Mobile optimized (200px height, simplified)
 * <BandwidthChart deviceId="router-123" className="min-h-screen" />
 *
 * // With custom styling
 * <BandwidthChart deviceId="router-123" className="rounded-lg shadow-md" />
 * ```
 *
 * @see BandwidthChartDesktop for desktop-specific implementation
 * @see BandwidthChartMobile for mobile-specific implementation
 * @see useBandwidthHistory for data fetching hook
 * @see DESIGN_TOKENS.md for semantic color reference
 */
export const BandwidthChart = memo<BandwidthChartProps>((props) => {
  const platform = usePlatform();

  // Render mobile presenter for mobile/small screens
  if (platform === 'mobile') {
    return <BandwidthChartMobile {...props} />;
  }

  // Render desktop presenter for tablet and desktop
  return <BandwidthChartDesktop {...props} />;
});

BandwidthChart.displayName = 'BandwidthChart';

// Export as default
export default BandwidthChart;
