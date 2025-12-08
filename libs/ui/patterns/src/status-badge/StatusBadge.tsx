/**
 * Status Badge Component
 * Displays status with color-coded badge
 * Epic 0.5: DHCP Management - Story 0.5.2
 */

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@nasnet/ui/primitives';
import type { LeaseStatus, DHCPClientStatus } from '@nasnet/core/types';

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ring-1 ring-inset transition-colors',
  {
    variants: {
      variant: {
        // Lease statuses
        bound: 'bg-success/10 text-success ring-success/20 dark:bg-success/20 dark:text-green-400',
        waiting: 'bg-warning/10 text-warning ring-warning/20 dark:bg-warning/20 dark:text-amber-400',
        offered: 'bg-info/10 text-info ring-info/20 dark:bg-info/20 dark:text-sky-400',
        busy: 'bg-error/10 text-error ring-error/20 dark:bg-error/20 dark:text-red-400',

        // Client statuses
        searching: 'bg-warning/10 text-warning ring-warning/20 dark:bg-warning/20 dark:text-amber-400',
        requesting: 'bg-info/10 text-info ring-info/20 dark:bg-info/20 dark:text-sky-400',
        stopped: 'bg-slate-100 text-slate-700 ring-slate-600/20 dark:bg-slate-800 dark:text-slate-400 dark:ring-slate-500/20',

        // Generic
        static: 'bg-purple-50 text-purple-700 ring-purple-600/20 dark:bg-purple-500/20 dark:text-purple-400 dark:ring-purple-500/20',
        default: 'bg-slate-100 text-slate-700 ring-slate-600/20 dark:bg-slate-800 dark:text-slate-400 dark:ring-slate-500/20',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface StatusBadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  status?: LeaseStatus | DHCPClientStatus | 'static';
  label?: string;
}

export const StatusBadge = React.forwardRef<HTMLSpanElement, StatusBadgeProps>(
  ({ className, status, variant, label, ...props }, ref) => {
    // Map status to variant if status is provided
    const badgeVariant = status || variant || 'default';

    // Default label based on status
    const displayLabel = label || (status ? formatStatusLabel(status) : '');

    return (
      <span
        ref={ref}
        className={cn(badgeVariants({ variant: badgeVariant as any }), className)}
        {...props}
      >
        {displayLabel}
      </span>
    );
  }
);

StatusBadge.displayName = 'StatusBadge';

/**
 * Formats status enum to human-readable label
 */
function formatStatusLabel(status: string): string {
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
}

export { badgeVariants };
