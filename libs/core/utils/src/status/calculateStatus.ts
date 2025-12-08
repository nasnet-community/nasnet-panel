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
 */
export function calculateStatus(percentage: number): ResourceStatus {
  if (percentage < 50) {
    return 'healthy';
  }
  if (percentage <= 80) {
    return 'warning';
  }
  return 'critical';
}

/**
 * Get color class based on resource status
 * Returns Tailwind CSS color classes for consistent theming
 *
 * @param status - Resource status
 * @returns Tailwind color classes
 */
export function getStatusColor(status: ResourceStatus): {
  text: string;
  bg: string;
  border: string;
} {
  switch (status) {
    case 'healthy':
      return {
        text: 'text-green-500',
        bg: 'bg-green-500',
        border: 'border-green-500',
      };
    case 'warning':
      return {
        text: 'text-amber-500',
        bg: 'bg-amber-500',
        border: 'border-amber-500',
      };
    case 'critical':
      return {
        text: 'text-red-500',
        bg: 'bg-red-500',
        border: 'border-red-500',
      };
    default: {
      // Exhaustive check - this should never be reached
      const _exhaustive: never = status;
      return {
        text: 'text-gray-500',
        bg: 'bg-gray-500',
        border: 'border-gray-500',
      };
    }
  }
}
