/**
 * ErrorRateIndicator Component
 * Displays error rate percentage with trend visualization
 *
 * NAS-6.9: Implement Interface Traffic Statistics
 *
 * @description Displays interface error rate as a percentage with color-coded status and trend visualization.
 */

import * as React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@nasnet/ui/utils';
import type { ErrorRateIndicatorProps } from './interface-stats-panel.types';

/**
 * ErrorRateIndicator Component
 *
 * Displays interface error rate as a percentage with:
 * - Color-coded status (healthy/warning/error)
 * - Trend indicator (increasing/decreasing/stable)
 * - Threshold-based alerts
 *
 * Color coding:
 * - Green (success): rate <= threshold/2
 * - Amber (warning): threshold/2 < rate <= threshold
 * - Red (destructive): rate > threshold
 *
 * @example
 * ```tsx
 * <ErrorRateIndicator
 *   rate={0.05}      // 0.05%
 *   trend={1}         // Increasing
 *   threshold={0.1}   // 0.1% threshold
 * />
 * // Displays: "0.050%" in amber with upward arrow
 *
 * <ErrorRateIndicator
 *   rate={0.001}     // 0.001%
 *   trend={0}         // Stable
 * />
 * // Displays: "0.001%" in green with horizontal line
 * ```
 */
export const ErrorRateIndicator = React.memo(function ErrorRateIndicator({
  rate,
  trend,
  threshold = 0.1,
  className,
}: ErrorRateIndicatorProps) {
  // Determine status based on threshold
  const status = React.useMemo(() => {
    if (rate > threshold) return 'error' as const;
    if (rate > threshold / 2) return 'warning' as const;
    return 'healthy' as const;
  }, [rate, threshold]);

  // Select trend icon
  const TrendIcon = React.useMemo(() => {
    if (trend > 0) return TrendingUp;
    if (trend < 0) return TrendingDown;
    return Minus;
  }, [trend]);

  // Trend label for accessibility
  const trendLabel = React.useMemo(() => {
    if (trend > 0) return 'increasing';
    if (trend < 0) return 'decreasing';
    return 'stable';
  }, [trend]);

  // Status message for screen readers
  const statusMessage = React.useMemo(() => {
    if (status === 'error') return 'Error rate exceeds threshold';
    if (status === 'warning') return 'Error rate approaching threshold';
    return 'Error rate is normal';
  }, [status]);

  return (
    <div
      className={cn(
        'flex items-center gap-component-sm rounded-[var(--semantic-radius-card)] px-component-sm py-1 transition-colors',
        status === 'error' && 'bg-destructive/10 text-destructive',
        status === 'warning' && 'bg-warning/10 text-warning',
        status === 'healthy' && 'bg-success/10 text-success',
        className
      )}
      role="status"
      aria-label={`Error rate: ${rate.toFixed(3)}%, ${trendLabel}. ${statusMessage}`}
    >
      <span className="text-sm font-medium">Error Rate:</span>
      <code className="font-mono text-lg font-semibold tabular-nums">
        {rate.toFixed(3)}%
      </code>
      <TrendIcon
        className="h-4 w-4"
        aria-hidden="true"
      />
      <span className="sr-only">{statusMessage}</span>
    </div>
  );
});
