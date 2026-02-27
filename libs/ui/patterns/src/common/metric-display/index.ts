/**
 * MetricDisplay Pattern
 *
 * Displays key metrics with label, value, optional trend, and icon.
 * Implements the Headless + Platform Presenters pattern (ADR-018) with full
 * support for mobile, tablet, and desktop platforms.
 *
 * Architecture:
 * - useMetricDisplay: Headless hook with all business logic and accessibility
 * - MetricDisplay: Auto-detecting wrapper using usePlatform()
 * - MetricDisplayMobile: Touch-optimized for <640px (44px touch targets)
 * - MetricDisplayTablet: Balanced for 640–1024px (40–44px touch targets)
 * - MetricDisplayDesktop: Mouse-optimized for >1024px (32–38px targets)
 *
 * @example
 * ```tsx
 * import { MetricDisplay } from '@nasnet/ui/patterns';
 * import { Cpu } from 'lucide-react';
 *
 * // Auto-detecting based on platform
 * <MetricDisplay
 *   label="CPU Usage"
 *   value={85}
 *   unit="%"
 *   icon={Cpu}
 *   variant="warning"
 *   trend="up"
 *   trendValue="+5%"
 *   onClick={() => navigate('/system/cpu')}
 * />
 *
 * // Manual presenter override (rare, testing only)
 * <MetricDisplay
 *   label="Memory"
 *   value={2.4}
 *   unit="GB"
 *   presenter="mobile"
 * />
 * ```
 */

// Main component (auto-detect)
export { MetricDisplay } from './MetricDisplay';

// Platform presenters
export { MetricDisplayMobile } from './MetricDisplay.Mobile';
export { MetricDisplayTablet } from './MetricDisplay.Tablet';
export { MetricDisplayDesktop } from './MetricDisplay.Desktop';

// Headless hook
export { useMetricDisplay } from './useMetricDisplay';
export type { UseMetricDisplayReturn } from './useMetricDisplay';

// Types
export type { MetricDisplayProps, MetricTrend, MetricVariant, MetricSize } from './types';
