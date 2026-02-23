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
/**
 * StatusDot component props
 */
export interface StatusDotProps extends React.HTMLAttributes<HTMLSpanElement> {
    /** Additional CSS classes (e.g., bg-success, bg-error, bg-muted) */
    className?: string;
}
/**
 * Memoized StatusDot component
 */
export declare const StatusDot: React.MemoExoticComponent<React.ForwardRefExoticComponent<StatusDotProps & React.RefAttributes<HTMLSpanElement>>>;
//# sourceMappingURL=StatusDot.d.ts.map