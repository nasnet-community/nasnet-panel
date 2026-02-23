/**
 * ResourceUsageBar Headless Hook
 *
 * Provides all logic and state for resource usage visualization.
 * Follows the Headless + Platform Presenter pattern.
 *
 * Responsibilities:
 * - Calculate usage percentage
 * - Determine status based on thresholds
 * - Map status to semantic colors
 * - Format numeric values for display
 * - Provide accessibility attributes
 */
import type { ResourceUsageBarProps, UsageStatus } from './types';
/**
 * State returned by useResourceUsageBar hook
 */
export interface UseResourceUsageBarReturn {
    /**
     * Usage percentage (0-100)
     */
    percentage: number;
    /**
     * Current usage status
     */
    status: UsageStatus;
    /**
     * Semantic color token for the status
     */
    colorToken: string;
    /**
     * Formatted usage text (e.g., "512 MB")
     */
    usedText: string;
    /**
     * Formatted total text (e.g., "1024 MB")
     */
    totalText: string;
    /**
     * Formatted percentage text (e.g., "50%")
     */
    percentageText: string;
    /**
     * Human-readable status label
     */
    statusLabel: string;
    /**
     * Resource label for display
     */
    label: string;
    /**
     * ARIA label for screen readers
     */
    ariaLabel: string;
    /**
     * ARIA value now (for progressbar role)
     */
    ariaValueNow: number;
    /**
     * ARIA value min (for progressbar role)
     */
    ariaValueMin: number;
    /**
     * ARIA value max (for progressbar role)
     */
    ariaValueMax: number;
    /**
     * ARIA value text (for progressbar role)
     */
    ariaValueText: string;
}
/**
 * Headless hook for resource usage bar state.
 *
 * Provides all the logic and derived state needed by presenters.
 * Does not render anything - that's the presenter's job.
 *
 * @example
 * ```tsx
 * function ResourceUsageBarMobile(props: ResourceUsageBarProps) {
 *   const state = useResourceUsageBar(props);
 *
 *   return (
 *     <div role="progressbar" aria-valuenow={state.ariaValueNow}>
 *       <div style={{ width: `${state.percentage}%` }} />
 *       <span>{state.percentageText}</span>
 *     </div>
 *   );
 * }
 * ```
 */
export declare function useResourceUsageBar(props: ResourceUsageBarProps): UseResourceUsageBarReturn;
//# sourceMappingURL=useResourceUsageBar.d.ts.map