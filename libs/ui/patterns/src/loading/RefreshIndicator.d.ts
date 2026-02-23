/**
 * RefreshIndicator Component
 *
 * Subtle top-bar progress indicator for background data refreshes.
 * Used during stale-while-revalidate to show revalidation is happening.
 *
 * @module @nasnet/ui/patterns/loading
 */
import * as React from 'react';
export interface RefreshIndicatorProps {
    /** Whether a refresh is in progress */
    isRefreshing: boolean;
    /** Position of the indicator */
    position?: 'top' | 'bottom';
    /** Style variant */
    variant?: 'bar' | 'dots';
    /** Color variant */
    color?: 'primary' | 'secondary' | 'muted';
    /** Fixed position (stays at top of viewport) vs relative */
    fixed?: boolean;
    /** Additional CSS classes */
    className?: string;
}
/**
 * RefreshIndicator Component
 *
 * Shows a subtle progress indicator during background data refreshes.
 * Commonly placed at the top of a page or container.
 *
 * @example
 * ```tsx
 * // At top of page
 * <RefreshIndicator isRefreshing={isRevalidating} />
 *
 * // Fixed to viewport top
 * <RefreshIndicator isRefreshing={isRevalidating} fixed />
 *
 * // Bottom position with dots
 * <RefreshIndicator
 *   isRefreshing={isRevalidating}
 *   position="bottom"
 *   variant="dots"
 * />
 * ```
 */
export declare const RefreshIndicator: React.NamedExoticComponent<RefreshIndicatorProps>;
//# sourceMappingURL=RefreshIndicator.d.ts.map