/**
 * Resource Status Calculation
 * Calculates health status based on resource usage percentages
 */
import type { ResourceStatus } from '@nasnet/core/types';
/**
 * Calculate resource status based on usage percentage
 * Determines if resource usage is healthy, warning, or critical
 *
 * Thresholds:
 * - Healthy: < 50%
 * - Warning: 50-80%
 * - Critical: > 80%
 *
 * @param percentage - Usage percentage (0-100)
 * @returns Resource status level
 *
 * @example
 * calculateStatus(25) // => 'healthy'
 * calculateStatus(65) // => 'warning'
 * calculateStatus(95) // => 'critical'
 */
export declare function calculateStatus(percentage: number): ResourceStatus;
/**
 * Get color class based on resource status
 * Returns Tailwind CSS color classes for consistent theming
 *
 * @param status - Resource status
 * @returns Tailwind color classes
 *
 * @example
 * getStatusColor('healthy') // => { text: 'text-green-500', bg: 'bg-green-500', border: 'border-green-500' }
 * getStatusColor('warning') // => { text: 'text-amber-500', bg: 'bg-amber-500', border: 'border-amber-500' }
 * getStatusColor('critical') // => { text: 'text-red-500', bg: 'bg-red-500', border: 'border-red-500' }
 */
export declare function getStatusColor(status: ResourceStatus): {
    readonly text: string;
    readonly bg: string;
    readonly border: string;
};
//# sourceMappingURL=calculateStatus.d.ts.map