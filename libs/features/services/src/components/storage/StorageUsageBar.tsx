/**
 * StorageUsageBar Component
 * @description Visual progress bar with color-coded thresholds for storage usage.
 * Displays current usage percentage, formatted capacity values, and status indicators.
 *
 * @features
 * - Color-coded thresholds: Green (<80%), Amber (80-89%), Red (90%+)
 * - BigInt formatting for precise large values
 * - Smooth CSS transitions for updates
 * - Full keyboard and screen reader support
 * - Responsive spacing and typography
 *
 * @see NAS-8.20: External Storage Management
 * @see Docs/design/COMPREHENSIVE_COMPONENT_CHECKLIST.md - section 4 (Typography)
 */

import * as React from 'react';
import { useMemo } from 'react';
import { cn } from '@nasnet/ui/utils';

/**
 * StorageUsageBar component props
 */
export interface StorageUsageBarProps {
  /** Usage percentage (0-100). Values outside range are clamped. */
  usagePercent: number;

  /** Total capacity in bytes (serialized uint64 as string) */
  totalBytes: string;

  /** Used capacity in bytes (serialized uint64 as string) */
  usedBytes: string;

  /** Optional free bytes (if not provided, calculated as total - used) */
  freeBytes?: string;

  /** Show warning styling (red) even if percentage below 90% threshold */
  showWarning?: boolean;

  /** Optional CSS class name for custom styling */
  className?: string;
}

/**
 * Format bytes to human-readable string using BigInt for precision
 */
function formatBytes(bytes: string): string {
  try {
    const num = BigInt(bytes);
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let value = Number(num);
    let unitIndex = 0;

    while (value >= 1024 && unitIndex < units.length - 1) {
      value /= 1024;
      unitIndex++;
    }

    return `${value.toFixed(1)} ${units[unitIndex]}`;
  } catch {
    return '0 B';
  }
}

/**
 * StorageUsageBar component
 * @description Displays storage usage with color-coded progress bar and capacity details
 * @param {StorageUsageBarProps} props - Component props
 * @returns {React.ReactNode} Rendered storage usage indicator
 */
function StorageUsageBarComponent({
  usagePercent,
  totalBytes,
  usedBytes,
  freeBytes,
  showWarning = false,
  className,
}: StorageUsageBarProps) {
  /**
   * Determine color class based on usage percentage
   * Uses semantic color tokens from design system
   */
  const colorClass = useMemo(() => {
    if (showWarning || usagePercent >= 90) return 'bg-error';
    if (usagePercent >= 80) return 'bg-warning';
    return 'bg-success';
  }, [usagePercent, showWarning]);

  /**
   * Determine text color for percentage display
   */
  const textColorClass = useMemo(() => {
    if (showWarning || usagePercent >= 90) return 'text-error';
    if (usagePercent >= 80) return 'text-warning';
    return 'text-success';
  }, [usagePercent, showWarning]);

  /**
   * Format byte values
   */
  const formattedTotal = useMemo(() => formatBytes(totalBytes), [totalBytes]);
  const formattedUsed = useMemo(() => formatBytes(usedBytes), [usedBytes]);
  const formattedFree = useMemo(() => {
    if (freeBytes) {
      return formatBytes(freeBytes);
    }
    try {
      const total = BigInt(totalBytes);
      const used = BigInt(usedBytes);
      const free = total - used;
      return formatBytes(free.toString());
    } catch {
      return '0 B';
    }
  }, [totalBytes, usedBytes, freeBytes]);

  /**
   * Clamp percentage to 0-100 range
   */
  const clampedPercent = Math.max(0, Math.min(100, usagePercent));

  return (
    <div className={cn('space-y-component-sm', className)}>
      {/* Usage Summary: Used amount and percentage (technical data in monospace) */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{formattedUsed} used</span>
        <span className={cn('font-mono font-medium', textColorClass)}>
          {clampedPercent.toFixed(1)}%
        </span>
      </div>

      {/* Progress Bar: Smooth visual indicator of usage level */}
      <div
        className="bg-muted h-2 w-full overflow-hidden rounded-full"
        role="progressbar"
        aria-valuenow={clampedPercent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Storage usage: ${clampedPercent.toFixed(1)}%`}
      >
        <div
          className={cn('h-full transition-all duration-300 ease-in-out', colorClass)}
          style={{ width: `${clampedPercent}%` }}
        />
      </div>

      {/* Capacity Details: Free and total capacity (technical data in monospace) */}
      <div className="text-muted-foreground flex items-center justify-between font-mono text-xs">
        <span>{formattedFree} free</span>
        <span>{formattedTotal} total</span>
      </div>
    </div>
  );
}

/**
 * Exported StorageUsageBar with React.memo() optimization
 */
export const StorageUsageBar = React.memo(StorageUsageBarComponent);
StorageUsageBar.displayName = 'StorageUsageBar';
