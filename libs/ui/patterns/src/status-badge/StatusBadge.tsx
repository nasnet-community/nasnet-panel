/**
 * Status Badge Component
 * Displays status with color-coded badge
 * Epic 0.5: DHCP Management - Story 0.5.2
 *
 * @module @nasnet/ui/patterns/status-badge
 * @example
 * ```tsx
 * <StatusBadge status="bound" />
 * <StatusBadge status="waiting" label="Pending" />
 * ```
 */

import * as React from 'react';
import { useCallback } from 'react';

import { cva, type VariantProps } from 'class-variance-authority';

import type { LeaseStatus, DHCPClientStatus } from '@nasnet/core/types';
import { cn } from '@nasnet/ui/primitives';

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-[var(--semantic-radius-badge)] px-2.5 py-0.5 text-xs font-medium transition-colors duration-150',
  {
    variants: {
      variant: {
        // Lease statuses (online/bound)
        bound: 'bg-success-light text-success-dark dark:bg-green-900/20 dark:text-green-400',
        waiting: 'bg-warning-light text-warning-dark dark:bg-amber-900/20 dark:text-amber-400',
        offered: 'bg-info-light text-info-dark dark:bg-sky-900/20 dark:text-sky-400',
        busy: 'bg-error-light text-error-dark dark:bg-red-900/20 dark:text-red-400',

        // Client statuses
        searching: 'bg-warning-light text-warning-dark dark:bg-amber-900/20 dark:text-amber-400',
        requesting: 'bg-info-light text-info-dark dark:bg-sky-900/20 dark:text-sky-400',
        stopped: 'bg-muted text-muted-foreground',

        // Generic
        static: 'bg-muted text-muted-foreground',
        default: 'bg-muted text-muted-foreground',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

/**
 * StatusBadge component props
 */
export interface StatusBadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  /** Status value (DHCP lease status, client status, or static) */
  status?: LeaseStatus | DHCPClientStatus | 'static';
  /** Optional custom label (overrides default status label) */
  label?: string;
  /** Show animated dot indicator (for active/online states) */
  showDot?: boolean;
}

const StatusBadgeBase = React.forwardRef<HTMLSpanElement, StatusBadgeProps>(
  ({ className, status, variant, label, showDot = false, ...props }, ref) => {
    // Map status to variant if status is provided
    const badgeVariant = status || variant || 'default';

    // Default label based on status
    const displayLabel = label || (status ? formatStatusLabel(status) : '');

    // Determine dot color based on status
    const getDotColor = (st: string) => {
      switch (st) {
        case 'bound':
          return 'bg-success dark:bg-green-400';
        case 'waiting':
          return 'bg-warning dark:bg-amber-400';
        case 'offered':
          return 'bg-info dark:bg-sky-400';
        case 'busy':
          return 'bg-error dark:bg-red-400';
        case 'searching':
          return 'bg-warning dark:bg-amber-400';
        case 'requesting':
          return 'bg-info dark:bg-sky-400';
        case 'stopped':
          return 'bg-muted-foreground';
        case 'static':
          return 'bg-muted-foreground';
        default:
          return 'bg-muted-foreground';
      }
    };

    return (
      <span
        ref={ref}
        role="status"
        aria-label={`Status: ${displayLabel}`}
        className={cn(badgeVariants({ variant: badgeVariant as any }), className)}
        {...props}
      >
        {showDot && (
          <span
            className={cn(
              'h-2 w-2 rounded-full flex-shrink-0',
              getDotColor(badgeVariant as string),
              ['bound', 'waiting', 'offered', 'searching', 'requesting'].includes(badgeVariant as string)
                ? 'animate-pulse'
                : ''
            )}
            aria-hidden="true"
          />
        )}
        {displayLabel}
      </span>
    );
  }
);

StatusBadgeBase.displayName = 'StatusBadge';

/**
 * Memoized StatusBadge to prevent unnecessary re-renders
 * Only re-renders when props actually change
 */
export const StatusBadge = React.memo(StatusBadgeBase);

/**
 * Formats status enum to human-readable label
 * Memoized to prevent unnecessary object recreation
 */
const formatStatusLabel = ((status: string): string => {
  const labelMap: Record<string, string> = {
    bound: 'Bound',
    waiting: 'Waiting',
    offered: 'Offered',
    busy: 'Busy',
    searching: 'Searching',
    requesting: 'Requesting',
    stopped: 'Stopped',
    static: 'Static',
  };

  return labelMap[status] || status;
});

/**
 * Badge variant styles from CVA
 * Exported for external use in other components
 */
export { badgeVariants };
