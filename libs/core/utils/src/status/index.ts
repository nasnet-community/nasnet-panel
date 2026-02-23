/**
 * @fileoverview Status calculation utilities
 *
 * Exports status calculation functions and color theming for resource monitoring.
 *
 * @example
 * ```typescript
 * import { calculateStatus, getStatusColor } from '@nasnet/core/utils';
 *
 * const status = calculateStatus(75); // 'warning'
 * const colors = getStatusColor(status); // { text: 'text-amber-500', ... }
 * ```
 */

export { calculateStatus, getStatusColor } from './calculateStatus';
