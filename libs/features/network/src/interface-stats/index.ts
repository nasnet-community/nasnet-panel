/**
 * Interface Statistics Feature Module
 * NAS-6.9: Implement Interface Traffic Statistics
 *
 * Provides components for viewing real-time and historical interface statistics:
 * - Real-time traffic counters (TX/RX bytes, packets, errors, drops)
 * - Bandwidth rate calculations
 * - Error rate monitoring with threshold alerts
 * - Platform-specific presenters (mobile/desktop)
 */

// Main component with platform detection
export { InterfaceStatsPanel } from './interface-stats-panel';
export type { InterfaceStatsPanelProps } from './interface-stats-panel.types';

// Platform presenters (can be used directly for testing/Storybook)
export { InterfaceStatsPanelDesktop } from './interface-stats-panel-desktop';
export { InterfaceStatsPanelMobile } from './interface-stats-panel-mobile';

// Headless hook for custom implementations
export { useInterfaceStatsPanel } from './use-interface-stats-panel';
export type { UseInterfaceStatsPanelOptions } from './use-interface-stats-panel';

// Subcomponents (can be used independently)
export { StatsCounter } from './stats-counter';
export { ErrorRateIndicator } from './error-rate-indicator';
export { PollingIntervalSelector } from './polling-interval-selector';
export { StatsLiveRegion } from './stats-live-region';

// Bandwidth Chart Components
export { BandwidthChart } from './bandwidth-chart';
export type { BandwidthChartProps } from './bandwidth-chart';
export { TimeRangeSelector, timeRangePresetToInput } from './time-range-selector';
export type { TimeRangeSelectorProps, TimeRangePreset } from './time-range-selector';

// Data Export Components (AC5)
export { useStatsExport } from './use-stats-export';
export type { UseStatsExportOptions } from './use-stats-export';
export { ExportMenu } from './export-menu';
export type { ExportMenuProps } from './export-menu';

// Multi-Interface Comparison (AC4)
export { InterfaceComparison } from './interface-comparison';
export type { InterfaceComparisonProps, InterfaceInfo } from './interface-comparison';

// TypeScript types
export type {
  InterfaceStatsState,
  StatsCounterProps,
  ErrorRateIndicatorProps,
} from './interface-stats-panel.types';
export type { PollingIntervalSelectorProps } from './polling-interval-selector';
export type { StatsLiveRegionProps } from './stats-live-region';
