/**
 * ResourceUsageBar Types
 *
 * Type definitions for the ResourceUsageBar pattern component.
 * Follows the Headless + Platform Presenter pattern.
 */
/**
 * Usage status based on threshold ranges
 */
export type UsageStatus = 'idle' | 'normal' | 'warning' | 'critical' | 'danger' | 'unknown';
/**
 * Resource type for semantic labeling
 */
export type ResourceType = 'memory' | 'cpu' | 'disk' | 'network' | 'custom';
/**
 * Props for ResourceUsageBar component
 */
export interface ResourceUsageBarProps {
    /**
     * Current resource usage value
     */
    used: number;
    /**
     * Maximum resource capacity
     */
    total: number;
    /**
     * Resource type (affects icon and ARIA label)
     * @default 'memory'
     */
    resourceType?: ResourceType;
    /**
     * Custom label for the resource
     * Overrides default label based on resourceType
     */
    label?: string;
    /**
     * Unit of measurement
     * @default 'MB'
     */
    unit?: string;
    /**
     * Show numeric values alongside the bar
     * @default true
     */
    showValues?: boolean;
    /**
     * Show percentage text
     * @default true
     */
    showPercentage?: boolean;
    /**
     * Force a specific platform variant
     */
    variant?: 'mobile' | 'desktop';
    /**
     * Additional CSS classes
     */
    className?: string;
    /**
     * Custom thresholds (defaults to standard thresholds if not provided)
     */
    thresholds?: {
        /**
         * Below this percentage = idle (0%)
         * @default 0
         */
        idle?: number;
        /**
         * Below this percentage = normal (green)
         * @default 60
         */
        normal?: number;
        /**
         * Below this percentage = warning (amber)
         * @default 80
         */
        warning?: number;
        /**
         * Below this percentage = critical (orange)
         * @default 95
         */
        critical?: number;
    };
}
//# sourceMappingURL=types.d.ts.map