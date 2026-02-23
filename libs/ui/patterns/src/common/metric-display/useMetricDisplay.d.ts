/**
 * useMetricDisplay Hook
 *
 * Headless hook for the MetricDisplay pattern.
 * Contains all business logic, computed values, and accessibility attributes.
 *
 * @see ADR-018 for Headless + Presenter architecture
 */
import type { MetricDisplayProps } from './types';
export interface UseMetricDisplayReturn {
    /** Formatted value with unit */
    formattedValue: string;
    /** Whether the metric is interactive */
    isInteractive: boolean;
    /** Trend icon name for rendering */
    trendIconName: 'arrow-up' | 'arrow-down' | 'minus' | null;
    /** CSS classes for the trend indicator */
    trendClasses: string;
    /** CSS classes for the value based on variant */
    valueClasses: string;
    /** CSS classes for the container based on size */
    sizeClasses: {
        container: string;
        label: string;
        value: string;
        unit: string;
        trend: string;
        icon: string;
    };
    /** Accessibility attributes */
    ariaProps: {
        role: 'button' | 'article';
        tabIndex: number;
        'aria-label': string;
    };
    /** Semantic status for screen readers */
    statusText: string;
}
/**
 * Headless hook for MetricDisplay pattern
 *
 * @example
 * ```tsx
 * const metric = useMetricDisplay({
 *   label: 'CPU Usage',
 *   value: 85,
 *   unit: '%',
 *   variant: 'warning',
 *   trend: 'up',
 *   trendValue: '+5%',
 * });
 *
 * return (
 *   <div className={metric.sizeClasses.container}>
 *     <span className={metric.valueClasses}>{metric.formattedValue}</span>
 *   </div>
 * );
 * ```
 */
export declare function useMetricDisplay(props: MetricDisplayProps): UseMetricDisplayReturn;
//# sourceMappingURL=useMetricDisplay.d.ts.map