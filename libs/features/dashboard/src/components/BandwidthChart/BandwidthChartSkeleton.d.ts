/**
 * Bandwidth chart skeleton, error, and empty state components
 *
 * @description
 * Set of memoized components for loading, error, and empty states:
 * - BandwidthChartSkeleton: pulse animation matching final layout
 * - BandwidthChartError: professional error message with retry button
 * - BandwidthChartEmpty: empty state guidance
 *
 * All components respect `prefers-reduced-motion` for WCAG AAA compliance.
 * Buttons meet 44px touch target minimum for mobile accessibility.
 */
/**
 * Props for BandwidthChartSkeleton
 */
interface BandwidthChartSkeletonProps {
    /** Height of chart area (300px desktop, 200px mobile) */
    height?: number;
    /** Optional CSS class name */
    className?: string;
}
/**
 * BandwidthChartSkeleton - Loading skeleton for bandwidth chart
 *
 * @description
 * Displays placeholder skeleton matching final chart layout (card + header + controls).
 * Pulse animation respects `prefers-reduced-motion` setting (disabled → instant/no animation).
 * Height configurable (300px desktop, 200px mobile).
 *
 * @param props - { height?, className? }
 * @param props.height - Chart height in pixels (default 300)
 * @param props.className - Optional CSS classes
 *
 * @returns Memoized skeleton component
 */
export declare const BandwidthChartSkeleton: import("react").NamedExoticComponent<BandwidthChartSkeletonProps>;
/**
 * Props for error state
 */
interface BandwidthChartErrorProps {
    /** Error message to display */
    message?: string;
    /** Retry callback */
    onRetry?: () => void;
    /** Optional CSS class name */
    className?: string;
}
/**
 * BandwidthChartError - Error state with retry action
 *
 * @description
 * Professional error display with icon, message, and memoized retry button.
 * Button uses `Button` primitive for consistent styling and meets 44px
 * touch target requirement (WCAG AAA).
 *
 * @param props - { message?, onRetry?, className? }
 * @param props.message - Error message text (default: generic message)
 * @param props.onRetry - Memoized callback when retry clicked
 * @param props.className - Optional CSS classes
 *
 * @returns Memoized error component
 */
export declare const BandwidthChartError: import("react").NamedExoticComponent<BandwidthChartErrorProps>;
/**
 * Props for empty state
 */
interface BandwidthChartEmptyProps {
    /** Optional CSS class name */
    className?: string;
}
/**
 * BandwidthChartEmpty - Empty state when no data available
 *
 * @description
 * Displays centered empty state with icon, title, and helpful message.
 * Used when data fetch succeeds but no data points returned for selected
 * time range and interface filter.
 *
 * @param props - { className? }
 * @param props.className - Optional CSS classes
 *
 * @returns Memoized empty state component
 */
export declare const BandwidthChartEmpty: import("react").NamedExoticComponent<BandwidthChartEmptyProps>;
export {};
//# sourceMappingURL=BandwidthChartSkeleton.d.ts.map