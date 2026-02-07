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
 * BandwidthChart component
 *
 * Main wrapper that auto-detects platform and renders appropriate presenter:
 * - Mobile (<640px) → BandwidthChartMobile (200px height, simplified)
 * - Desktop (≥640px) → BandwidthChartDesktop (300px height, full controls)
 *
 * Features:
 * - Real-time bandwidth visualization (TX/RX lines)
 * - Historical timeframe selection (5min, 1hr, 24hr)
 * - Interface filtering
 * - GraphQL subscription + polling fallback
 * - WCAG AAA accessibility compliance
 *
 * @param props - Component props
 *
 * @example
 * ```tsx
 * <BandwidthChart deviceId="router-123" />
 * ```
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
