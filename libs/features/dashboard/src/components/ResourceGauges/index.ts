/**
 * ResourceGauges Module
 * Real-time resource utilization display
 *
 * AC 5.2.5: Exports for Story 5.2
 */

// Main component
export { ResourceGauges } from './ResourceGauges';
export type { ResourceGaugesProps } from './ResourceGauges';

// Hooks
export { useResourceMetrics, formatBytes } from './useResourceMetrics';
export type { ResourceMetrics, FormattedResourceMetrics } from './useResourceMetrics';

// Reusable components
export { CircularGauge } from './CircularGauge';
export type { CircularGaugeProps, GaugeThresholds } from './CircularGauge';

export { CPUBreakdownModal } from './CPUBreakdownModal';
export type { CPUBreakdownModalProps } from './CPUBreakdownModal';

// GraphQL operations (for direct use if needed)
export { RESOURCE_METRICS_SUBSCRIPTION, GET_RESOURCE_METRICS } from './useResourceMetrics';
