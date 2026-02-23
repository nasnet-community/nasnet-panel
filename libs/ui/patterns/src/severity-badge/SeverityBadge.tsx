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
        debug: 'text-muted-foreground bg-muted',
        info: 'text-info bg-info/10',
        warning: 'text-warning bg-warning/10',
        error: 'text-error bg-error/10',
        critical: 'text-error bg-error/20 font-bold ring-1 ring-inset ring-error/30',
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
function SeverityBadgeBase({
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
          'hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-all',
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

export const SeverityBadge = React.memo(SeverityBadgeBase);

SeverityBadge.displayName = 'SeverityBadge';
