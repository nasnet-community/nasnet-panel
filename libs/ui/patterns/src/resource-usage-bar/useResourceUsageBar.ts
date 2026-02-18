/**
 * ResourceUsageBar Headless Hook
 *
 * Provides all logic and state for resource usage visualization.
 * Follows the Headless + Platform Presenter pattern.
 *
 * Responsibilities:
 * - Calculate usage percentage
 * - Determine status based on thresholds
 * - Map status to semantic colors
 * - Format numeric values for display
 * - Provide accessibility attributes
 */

import { useMemo } from 'react';

import type { ResourceUsageBarProps, UsageStatus, ResourceType } from './types';

// ===== Constants =====

/**
 * Default threshold values (percentage)
 *
 * Thresholds:
 * - 0% = idle (gray)
 * - <60% = normal (success/green)
 * - 60-79% = warning (warning/amber)
 * - 80-94% = critical (error/orange)
 * - ≥95% = danger (error/red)
 */
const DEFAULT_THRESHOLDS = {
  idle: 0,
  normal: 60,
  warning: 80,
  critical: 95,
} as const;

/**
 * Resource type labels for ARIA
 */
const RESOURCE_TYPE_LABELS: Record<ResourceType, string> = {
  memory: 'Memory',
  cpu: 'CPU',
  disk: 'Disk',
  network: 'Network',
  custom: 'Resource',
};

/**
 * Status to semantic color token mapping
 * Uses Tier 2 semantic tokens, not primitives
 */
const STATUS_COLOR_MAP: Record<UsageStatus, string> = {
  idle: 'neutral',
  normal: 'success',
  warning: 'warning',
  critical: 'error',
  danger: 'error',
  unknown: 'neutral',
};

// ===== Hook State Interface =====

/**
 * State returned by useResourceUsageBar hook
 */
export interface UseResourceUsageBarReturn {
  /**
   * Usage percentage (0-100)
   */
  percentage: number;

  /**
   * Current usage status
   */
  status: UsageStatus;

  /**
   * Semantic color token for the status
   */
  colorToken: string;

  /**
   * Formatted usage text (e.g., "512 MB")
   */
  usedText: string;

  /**
   * Formatted total text (e.g., "1024 MB")
   */
  totalText: string;

  /**
   * Formatted percentage text (e.g., "50%")
   */
  percentageText: string;

  /**
   * Human-readable status label
   */
  statusLabel: string;

  /**
   * Resource label for display
   */
  label: string;

  /**
   * ARIA label for screen readers
   */
  ariaLabel: string;

  /**
   * ARIA value now (for progressbar role)
   */
  ariaValueNow: number;

  /**
   * ARIA value min (for progressbar role)
   */
  ariaValueMin: number;

  /**
   * ARIA value max (for progressbar role)
   */
  ariaValueMax: number;

  /**
   * ARIA value text (for progressbar role)
   */
  ariaValueText: string;
}

// ===== Helper Functions =====

/**
 * Format number with commas and unit
 */
function formatValue(value: number, unit: string): string {
  // Round to 2 decimal places if fractional
  const rounded = value % 1 === 0 ? value : value.toFixed(2);
  return `${rounded} ${unit}`;
}

/**
 * Calculate usage status based on percentage and thresholds
 */
function calculateStatus(
  percentage: number,
  thresholds: { idle: number; normal: number; warning: number; critical: number }
): UsageStatus {
  if (Number.isNaN(percentage) || percentage < 0) {
    return 'unknown';
  }

  if (percentage <= thresholds.idle) {
    return 'idle';
  }

  if (percentage < thresholds.normal) {
    return 'normal';
  }

  if (percentage < thresholds.warning) {
    return 'warning';
  }

  if (percentage < thresholds.critical) {
    return 'critical';
  }

  return 'danger';
}

/**
 * Get human-readable status label
 */
function getStatusLabel(status: UsageStatus): string {
  const labels: Record<UsageStatus, string> = {
    idle: 'Idle',
    normal: 'Normal',
    warning: 'Warning',
    critical: 'Critical',
    danger: 'Danger',
    unknown: 'Unknown',
  };

  return labels[status];
}

// ===== Hook Implementation =====

/**
 * Headless hook for resource usage bar state.
 *
 * Provides all the logic and derived state needed by presenters.
 * Does not render anything - that's the presenter's job.
 *
 * @example
 * ```tsx
 * function ResourceUsageBarMobile(props: ResourceUsageBarProps) {
 *   const state = useResourceUsageBar(props);
 *
 *   return (
 *     <div role="progressbar" aria-valuenow={state.ariaValueNow}>
 *       <div style={{ width: `${state.percentage}%` }} />
 *       <span>{state.percentageText}</span>
 *     </div>
 *   );
 * }
 * ```
 */
export function useResourceUsageBar(
  props: ResourceUsageBarProps
): UseResourceUsageBarReturn {
  const {
    used,
    total,
    resourceType = 'memory',
    label: customLabel,
    unit = 'MB',
    thresholds: customThresholds,
  } = props;

  // Merge custom thresholds with defaults
  const thresholds = useMemo(
    () => ({
      ...DEFAULT_THRESHOLDS,
      ...customThresholds,
    }),
    [customThresholds]
  );

  // Calculate percentage (memoized)
  const percentage = useMemo(() => {
    if (total <= 0) return 0;
    const pct = (used / total) * 100;
    return Math.min(100, Math.max(0, pct)); // Clamp to 0-100
  }, [used, total]);

  // Determine status based on thresholds (memoized)
  const status = useMemo(
    () => calculateStatus(percentage, thresholds),
    [percentage, thresholds]
  );

  // Get semantic color token
  const colorToken = STATUS_COLOR_MAP[status];

  // Format values
  const usedText = formatValue(used, unit);
  const totalText = formatValue(total, unit);
  const percentageText = `${Math.round(percentage)}%`;

  // Get status label
  const statusLabel = getStatusLabel(status);

  // Determine label
  const label = customLabel || RESOURCE_TYPE_LABELS[resourceType];

  // Build ARIA attributes
  const ariaLabel = `${label} usage: ${usedText} of ${totalText} (${percentageText})`;
  const ariaValueText = `${usedText} of ${totalText}`;
  const ariaValueNow = Math.round(percentage);
  const ariaValueMin = 0;
  const ariaValueMax = 100;

  return {
    percentage,
    status,
    colorToken,
    usedText,
    totalText,
    percentageText,
    statusLabel,
    label,
    ariaLabel,
    ariaValueNow,
    ariaValueMin,
    ariaValueMax,
    ariaValueText,
  };
}
