/**
 * Rule Counter Visualization
 * Pattern components for displaying firewall rule counter statistics
 *
 * Exports:
 * - CounterCell: Main component with platform detection
 * - CounterCellDesktop: Desktop presenter
 * - CounterCellMobile: Mobile presenter
 * - useRuleCounterVisualization: Headless hook
 * - formatPackets, formatBytes: Utility functions
 */

export {
  CounterCell,
  CounterCellDesktop,
  CounterCellMobile,
  type CounterCellProps,
} from './CounterCell';

export {
  useRuleCounterVisualization,
  formatPackets,
  formatBytes,
  type CounterData,
  type CounterRates,
  type UseRuleCounterVisualizationOptions,
  type RuleCounterVisualizationState,
} from './use-rule-counter-visualization';
