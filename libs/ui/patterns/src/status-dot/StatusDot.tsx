/**
 * StatusDot Component
 *
 * Simple visual indicator dot for status representation.
 * Commonly used for showing active/inactive states.
 *
 * @module @nasnet/ui/patterns/status-dot
 * @example
 * ```tsx
 * <StatusDot className="bg-success" /> // Green dot for active
 * <StatusDot className="bg-muted" /> // Gray dot for inactive
 * <StatusDot className="bg-error" /> // Red dot for error
 * ```
 */

import * as React from 'react';
import { cn } from '@nasnet/ui/primitives';

/**
 * StatusDot component props
 */
export interface StatusDotProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Additional CSS classes (e.g., bg-success, bg-error, bg-muted) */
  className?: string;
}

/**
 * StatusDot - Visual status indicator
 *
 * A small circular dot used to indicate status (active, inactive, success, error, etc.)
 * Color is controlled via className (e.g., bg-success, bg-error, bg-muted)
 *
 * Lightweight component optimized for use in tables, lists, and status displays.
 */
const StatusDotBase = React.forwardRef<HTMLSpanElement, StatusDotProps>(
  ({ className, ...props }, ref) => (
    <span
      ref={ref}
      className={cn('inline-block h-2 w-2 rounded-full', className)}
      aria-hidden="true"
      {...props}
    />
  )
);

StatusDotBase.displayName = 'StatusDot';

/**
 * Memoized StatusDot component
 */
export const StatusDot = React.memo(StatusDotBase);
