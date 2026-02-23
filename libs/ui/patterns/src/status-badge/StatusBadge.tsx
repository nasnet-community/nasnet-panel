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
  'inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ring-1 ring-inset transition-colors',
  {
    variants: {
      variant: {
        // Lease statuses
        bound: 'bg-success/10 text-success ring-success/20',
        waiting: 'bg-warning/10 text-warning ring-warning/20',
        offered: 'bg-info/10 text-info ring-info/20',
        busy: 'bg-error/10 text-error ring-error/20',

        // Client statuses
        searching: 'bg-warning/10 text-warning ring-warning/20',
        requesting: 'bg-info/10 text-info ring-info/20',
        stopped: 'bg-muted text-muted-foreground ring-border',

        // Generic
        static: 'bg-accent text-accent-foreground ring-border',
        default: 'bg-muted text-muted-foreground ring-border',
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
}

const StatusBadgeBase = React.forwardRef<HTMLSpanElement, StatusBadgeProps>(
  ({ className, status, variant, label, ...props }, ref) => {
    // Map status to variant if status is provided
    const badgeVariant = status || variant || 'default';

    // Default label based on status
    const displayLabel = label || (status ? formatStatusLabel(status) : '');

    return (
      <span
        ref={ref}
        role="status"
        aria-label={`Status: ${displayLabel}`}
        className={cn(badgeVariants({ variant: badgeVariant as any }), className)}
        {...props}
      >
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
