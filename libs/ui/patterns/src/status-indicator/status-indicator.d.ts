/**
 * Status Indicator Component
 *
 * Compact inline status indicator with color-coded dot and optional label.
 * Supports five semantic statuses, three sizes, and optional pulse animation.
 *
 * @module @nasnet/ui/patterns/status-indicator
 * @example
 * ```tsx
 * <StatusIndicator status="online" label="Connected" />
 * <StatusIndicator status="offline" size="lg" showDot />
 * <StatusIndicator status="warning" pulse />
 * ```
 */
import * as React from 'react';
import { type VariantProps } from 'class-variance-authority';
declare const statusIndicatorVariants: (props?: ({
    status?: "warning" | "info" | "offline" | "pending" | "online" | null | undefined;
    size?: "sm" | "md" | "lg" | null | undefined;
} & import("class-variance-authority/types").ClassProp) | undefined) => string;
/**
 * StatusIndicator component props
 */
export interface StatusIndicatorProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof statusIndicatorVariants> {
    /** Optional text label shown next to the dot */
    label?: string;
    /** Whether to show the colored status dot (default: true) */
    showDot?: boolean;
    /** Animate the dot with a pulsing glow effect (useful for live/active states) */
    pulse?: boolean;
}
/**
 * Memoized StatusIndicator component
 */
export declare const StatusIndicator: React.MemoExoticComponent<React.ForwardRefExoticComponent<StatusIndicatorProps & React.RefAttributes<HTMLDivElement>>>;
/**
 * Status indicator variant styles from CVA
 * Exported for external use in other components
 */
export { statusIndicatorVariants };
//# sourceMappingURL=status-indicator.d.ts.map