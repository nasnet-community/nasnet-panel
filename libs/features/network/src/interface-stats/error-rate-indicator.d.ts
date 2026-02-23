/**
 * ErrorRateIndicator Component
 * Displays error rate percentage with trend visualization
 *
 * NAS-6.9: Implement Interface Traffic Statistics
 *
 * @description Displays interface error rate as a percentage with color-coded status and trend visualization.
 */
import * as React from 'react';
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
export declare const ErrorRateIndicator: React.NamedExoticComponent<ErrorRateIndicatorProps>;
//# sourceMappingURL=error-rate-indicator.d.ts.map