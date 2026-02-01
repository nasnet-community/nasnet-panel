/**
 * SeverityBadge Component
 * Displays log severity with color-coded visual indicators
 * Epic 0.8: System Logs - Story 0.8.3
 */

import * as React from 'react';

import { cva, type VariantProps } from 'class-variance-authority';
import { X } from 'lucide-react';

import type { LogSeverity } from '@nasnet/core/types';
import { cn } from '@nasnet/ui/primitives';

/**
 * Severity badge variants with color mapping
 * - debug: Gray (low priority, muted)
 * - info: Blue (informational)
 * - warning: Amber/Yellow (attention needed)
 * - error: Red (error occurred)
 * - critical: Red Bold (critical issue)
 *
 * Colors meet WCAG AA contrast requirements
 */
const severityBadgeVariants = cva(
  'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-colors',
  {
    variants: {
      severity: {
        debug: 'text-slate-600 bg-slate-100 dark:text-slate-400 dark:bg-slate-800',
        info: 'text-info bg-info/10 dark:text-sky-400 dark:bg-info/20',
        warning: 'text-warning bg-warning/10 dark:text-amber-400 dark:bg-warning/20',
        error: 'text-error bg-error/10 dark:text-red-400 dark:bg-error/20',
        critical: 'text-error bg-error/20 dark:text-red-300 dark:bg-error/30 font-bold ring-1 ring-inset ring-error/30',
      },
    },
    defaultVariants: {
      severity: 'info',
    },
  }
);

export interface SeverityBadgeProps
  extends VariantProps<typeof severityBadgeVariants>,
    Omit<React.HTMLAttributes<HTMLSpanElement>, 'children'> {
  /**
   * Log severity level
   */
  severity: LogSeverity;

  /**
   * Optional callback when badge is dismissed (for filter badges)
   * If provided, a dismiss button (X) will be shown
   */
  onRemove?: () => void;
}

/**
 * SeverityBadge Component
 *
 * Displays a color-coded badge for log severity levels.
 * Used in both log entries and filter badges.
 *
 * @example
 * ```tsx
 * // In log entry (no remove button)
 * <SeverityBadge severity="error" />
 *
 * // In filter area (with remove button)
 * <SeverityBadge
 *   severity="warning"
 *   onRemove={() => removeSeverity('warning')}
 * />
 * ```
 */
export function SeverityBadge({
  severity,
  onRemove,
  className,
  ...props
}: SeverityBadgeProps) {
  // Capitalize severity for display
  const displayText = severity.charAt(0).toUpperCase() + severity.slice(1);

  if (onRemove) {
    // Filter badge with dismiss button
    return (
      <button
        type="button"
        onClick={onRemove}
        className={cn(
          severityBadgeVariants({ severity }),
          'hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-all',
          className
        )}
        aria-label={`Remove ${displayText} filter`}
        {...props}
      >
        <span>{displayText}</span>
        <X className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
    );
  }

  // Read-only badge (for log entries)
  return (
    <span
      className={cn(severityBadgeVariants({ severity }), className)}
      role="status"
      aria-label={`Severity: ${displayText}`}
      {...props}
    >
      {displayText}
    </span>
  );
}
