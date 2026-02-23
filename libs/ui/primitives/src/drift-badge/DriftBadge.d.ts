import * as React from 'react';
import { type VariantProps } from 'class-variance-authority';
/**
 * Drift Badge Component
 *
 * Visual indicator for configuration drift status between desired state
 * (configuration layer) and actual state (deployment layer).
 *
 * Colors follow semantic tokens from design system:
 * - Green (success): In sync - configuration matches deployment
 * - Amber (warning): Drift detected - configuration differs from deployment
 * - Red (error): Error/Unknown - unable to determine drift status
 *
 * @see NAS-4.13: Implement Drift Detection Foundation
 * @see Docs/design/ux-design/3-visual-foundation.md - Color semantics
 *
 * Accessibility:
 * - WCAG AAA compliant (7:1 contrast ratio)
 * - Screen reader support via aria-label
 * - Focus visible indicator
 */
declare const driftBadgeVariants: (props?: ({
    status?: "error" | "synced" | "drifted" | "pending" | "checking" | null | undefined;
    size?: "sm" | "md" | "lg" | null | undefined;
} & import("class-variance-authority/types").ClassProp) | undefined) => string;
/**
 * Drift status values matching DriftStatus enum from drift-detection module
 */
export type DriftBadgeStatus = 'synced' | 'drifted' | 'error' | 'pending' | 'checking';
export interface DriftBadgeProps extends Omit<React.HTMLAttributes<HTMLSpanElement>, 'children'>, VariantProps<typeof driftBadgeVariants> {
    /**
     * Current drift status
     */
    status: DriftBadgeStatus;
    /**
     * Number of drifted fields (shown when status is 'drifted')
     */
    count?: number;
    /**
     * Timestamp of last drift check
     */
    lastChecked?: Date | string;
    /**
     * Whether to show tooltip with drift summary
     * @default true
     */
    showTooltip?: boolean;
    /**
     * Custom tooltip content
     */
    tooltipContent?: React.ReactNode;
    /**
     * Whether the badge should be interactive (clickable)
     * @default false
     */
    interactive?: boolean;
    /**
     * Callback when badge is clicked (only if interactive)
     */
    onClick?: (event: React.MouseEvent<HTMLSpanElement>) => void;
}
/**
 * DriftBadge displays the drift status between configuration and deployment layers.
 *
 * @component
 * @example
 * ```tsx
 * // Basic usage
 * <DriftBadge status="synced" />
 *
 * // With count for drifted status
 * <DriftBadge status="drifted" count={3} />
 *
 * // With tooltip showing last check time
 * <DriftBadge
 *   status="drifted"
 *   count={3}
 *   lastChecked={new Date()}
 *   showTooltip
 * />
 *
 * // Interactive badge with drift resolution
 * <DriftBadge
 *   status="drifted"
 *   count={3}
 *   interactive
 *   onClick={() => openDriftResolutionModal()}
 * />
 *
 * // Custom tooltip content
 * <DriftBadge
 *   status="drifted"
 *   count={2}
 *   showTooltip
 *   tooltipContent="Click to review and resolve configuration drift"
 * />
 * ```
 *
 * @accessibility
 * - WCAG AAA: 7:1 contrast ratio maintained in light and dark themes
 * - Semantic HTML: Uses role="status" for non-interactive, role="button" for interactive
 * - Keyboard: Interactive badges support Enter/Space activation and tabIndex
 * - Screen Reader: Full aria-label support with count and status information
 * - Motion: Respects prefers-reduced-motion for checking animation
 */
export declare const DriftBadge: React.MemoExoticComponent<React.ForwardRefExoticComponent<DriftBadgeProps & React.RefAttributes<HTMLSpanElement>>>;
export { driftBadgeVariants };
//# sourceMappingURL=DriftBadge.d.ts.map