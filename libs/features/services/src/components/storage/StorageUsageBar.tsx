/**
 * StorageUsageBar Component
 * Visual progress bar with color-coded thresholds for storage usage
 *
 * Features:
 * - Color-coded thresholds: Green (<80%), Amber (80-89%), Red (90%+)
 * - BigInt formatting for values >2GB
 * - Smooth transitions
 * - Accessible with ARIA attributes
 *
 * @see NAS-8.20: External Storage Management
 */

import * as React from 'react';
import { useMemo } from 'react';
import { cn } from '@nasnet/ui/utils';

/**
 * StorageUsageBar props
 */
export interface StorageUsageBarProps {
  /** Usage percentage (0-100) */
  usagePercent: number;

  /** Total bytes (serialized uint64) */
  totalBytes: string;

  /** Used bytes (serialized uint64) */
  usedBytes: string;

  /** Optional free bytes (if not provided, calculated from total - used) */
  freeBytes?: string;

  /** Whether to show warning styling even if below threshold */
  showWarning?: boolean;

  /** Optional className for styling */
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
 * Displays storage usage with color-coded progress bar
 */
export function StorageUsageBar({
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
    <div className={cn('space-y-2', className)}>
      {/* Usage Summary */}
      <div className="flex justify-between items-center text-sm">
        <span className="text-muted-foreground">
          {formattedUsed} used
        </span>
        <span className={cn('font-medium', textColorClass)}>
          {clampedPercent.toFixed(1)}%
        </span>
      </div>

      {/* Progress Bar */}
      <div
        className="h-2 w-full rounded-full bg-muted overflow-hidden"
        role="progressbar"
        aria-valuenow={clampedPercent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Storage usage: ${clampedPercent.toFixed(1)}%`}
      >
        <div
          className={cn(
            'h-full transition-all duration-300 ease-in-out',
            colorClass
          )}
          style={{ width: `${clampedPercent}%` }}
        />
      </div>

      {/* Capacity Details */}
      <div className="flex justify-between items-center text-xs text-muted-foreground">
        <span>{formattedFree} free</span>
        <span>{formattedTotal} total</span>
      </div>
    </div>
  );
}
