/**
 * Spinner Component
 *
 * Animated loading spinner for indicating in-progress actions.
 * Used in buttons, loading overlays, and inline loading states.
 *
 * Accessibility:
 * - Uses role="status" for screen reader announcement
 * - Includes sr-only text for context
 * - Respects prefers-reduced-motion
 *
 * @module @nasnet/ui/primitives/spinner
 */
import * as React from 'react';
export interface SpinnerProps extends React.SVGAttributes<SVGSVGElement> {
    /** Size of the spinner */
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
    /** Screen reader label */
    label?: string;
}
/**
 * Spinner Component
 *
 * Animated loading spinner using the Loader2 icon from Lucide.
 * Automatically respects user's reduced motion preferences.
 *
 * @example
 * ```tsx
 * // Basic usage
 * <Spinner />
 *
 * // Different sizes
 * <Spinner size="sm" />  // 16px - for buttons
 * <Spinner size="md" />  // 20px - default
 * <Spinner size="lg" />  // 24px - for overlays
 *
 * // With custom label
 * <Spinner label="Saving configuration..." />
 * ```
 */
declare const Spinner: React.MemoExoticComponent<React.ForwardRefExoticComponent<SpinnerProps & React.RefAttributes<SVGSVGElement>>>;
export { Spinner };
//# sourceMappingURL=Spinner.d.ts.map