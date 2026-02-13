/**
 * ConnectionStateBadge Component
 *
 * Badge displaying connection state with semantic colors.
 * Supports all 11 MikroTik connection states.
 */

import * as React from 'react';

import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@nasnet/ui/primitives';

import type { ConnectionState } from './types';

const connectionStateBadgeVariants = cva(
  'inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ring-1 ring-inset transition-colors',
  {
    variants: {
      variant: {
        // Active connection states (success - green)
        established: 'bg-success/10 text-success ring-success/20 dark:bg-success/20 dark:text-green-400',

        // New/related connections (info - blue)
        new: 'bg-info/10 text-info ring-info/20 dark:bg-info/20 dark:text-sky-400',
        related: 'bg-info/10 text-info ring-info/20 dark:bg-info/20 dark:text-sky-400',
        'syn-sent': 'bg-info/10 text-info ring-info/20 dark:bg-info/20 dark:text-sky-400',
        'syn-received': 'bg-info/10 text-info ring-info/20 dark:bg-info/20 dark:text-sky-400',

        // Closing connections (warning - amber)
        'time-wait': 'bg-warning/10 text-warning ring-warning/20 dark:bg-warning/20 dark:text-amber-400',
        'fin-wait': 'bg-warning/10 text-warning ring-warning/20 dark:bg-warning/20 dark:text-amber-400',
        'close-wait': 'bg-warning/10 text-warning ring-warning/20 dark:bg-warning/20 dark:text-amber-400',
        'last-ack': 'bg-warning/10 text-warning ring-warning/20 dark:bg-warning/20 dark:text-amber-400',

        // Closed connections (muted - gray)
        close: 'bg-slate-100 text-slate-700 ring-slate-600/20 dark:bg-slate-800 dark:text-slate-400 dark:ring-slate-500/20',

        // Invalid connections (error - red)
        invalid: 'bg-error/10 text-error ring-error/20 dark:bg-error/20 dark:text-red-400',
      },
    },
    defaultVariants: {
      variant: 'new',
    },
  }
);

export interface ConnectionStateBadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof connectionStateBadgeVariants> {
  /** Connection state */
  state: ConnectionState;
  /** Custom label (defaults to formatted state) */
  label?: string;
}

/**
 * Format connection state to human-readable label
 */
function formatStateLabel(state: ConnectionState): string {
  const labelMap: Record<ConnectionState, string> = {
    established: 'Established',
    new: 'New',
    related: 'Related',
    invalid: 'Invalid',
    'time-wait': 'Time-Wait',
    'syn-sent': 'SYN-Sent',
    'syn-received': 'SYN-Received',
    'fin-wait': 'FIN-Wait',
    'close-wait': 'Close-Wait',
    'last-ack': 'Last-ACK',
    close: 'Close',
  };

  return labelMap[state] || state;
}

const ConnectionStateBadgeBase = React.forwardRef<
  HTMLSpanElement,
  ConnectionStateBadgeProps
>(({ className, state, label, ...props }, ref) => {
  const displayLabel = label || formatStateLabel(state);

  return (
    <span
      ref={ref}
      className={cn(connectionStateBadgeVariants({ variant: state }), className)}
      aria-label={`Connection state: ${displayLabel}`}
      {...props}
    >
      {displayLabel}
    </span>
  );
});

ConnectionStateBadgeBase.displayName = 'ConnectionStateBadge';

/**
 * Memoized ConnectionStateBadge to prevent unnecessary re-renders
 */
export const ConnectionStateBadge = React.memo(ConnectionStateBadgeBase);

export { connectionStateBadgeVariants };
