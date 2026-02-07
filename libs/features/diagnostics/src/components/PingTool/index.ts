/**
 * PingTool Component - Public API
 *
 * Exports:
 * - PingTool (default): Main component with platform detection
 * - usePing: Headless hook for custom implementations
 * - Types: PingResult, PingStatistics, PingFormValues, etc.
 */

// Main component (default export)
export { PingTool as default, PingTool } from './PingTool';

// Headless hook for advanced usage
export { usePing } from './usePing';
export type { UsePingOptions, UsePingReturn } from './usePing';

// Type definitions
export type {
  PingResult,
  PingStatistics,
  PingJobStatus,
  PingToolProps,
} from './PingTool.types';

// Form types
export type { PingFormValues } from './ping.schema';

// Note: ping-machine is NOT exported (internal implementation detail)
// Note: GraphQL operations are NOT exported (internal implementation detail)
// Note: Individual presenters (Desktop/Mobile) are NOT exported (use main PingTool)
// Note: Sub-components (PingResults, PingStatistics, LatencyGraph) are NOT exported
