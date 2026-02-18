/**
 * StatusDot Component
 *
 * Simple visual indicator dot for status representation.
 * Commonly used for showing active/inactive states.
 *
 * @module @nasnet/ui/patterns/status-dot
 */

import { cn } from '@nasnet/ui/primitives';

export interface StatusDotProps {
  /** Additional CSS classes */
  className?: string;
}

/**
 * StatusDot - Visual status indicator
 *
 * A small circular dot used to indicate status (active, inactive, success, error, etc.)
 * Color is controlled via className (e.g., bg-success, bg-error, bg-muted)
 *
 * @example
 * ```tsx
 * <StatusDot className="bg-success" /> // Green dot for active
 * <StatusDot className="bg-muted" /> // Gray dot for inactive
 * <StatusDot className="bg-error" /> // Red dot for error
 * ```
 */
export function StatusDot({ className }: StatusDotProps) {
  return (
    <span
      className={cn(
        'inline-block h-2 w-2 rounded-full',
        className
      )}
      aria-hidden="true"
    />
  );
}

StatusDot.displayName = 'StatusDot';
