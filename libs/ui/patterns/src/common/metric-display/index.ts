/**
 * MetricDisplay Pattern
 *
 * Displays key metrics with label, value, optional trend, and icon.
 * Implements the Headless + Platform Presenters pattern (ADR-018).
 *
 * @example
 * ```tsx
 * import { MetricDisplay } from '@nasnet/ui/patterns';
 * import { Cpu } from 'lucide-react';
 *
 * <MetricDisplay
 *   label="CPU Usage"
 *   value={85}
 *   unit="%"
 *   icon={Cpu}
 *   variant="warning"
 *   trend="up"
 *   trendValue="+5%"
 * />
 * ```
 */

// Main component (auto-detect)
export { MetricDisplay } from './MetricDisplay';

// Platform presenters
export { MetricDisplayMobile } from './MetricDisplay.Mobile';
export { MetricDisplayDesktop } from './MetricDisplay.Desktop';

// Headless hook
export { useMetricDisplay } from './useMetricDisplay';
export type { UseMetricDisplayReturn } from './useMetricDisplay';

// Types
export type {
  MetricDisplayProps,
  MetricTrend,
  MetricVariant,
  MetricSize,
} from './types';
