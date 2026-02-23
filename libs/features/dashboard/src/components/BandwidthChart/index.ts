/**
 * BandwidthChart module - Public exports
 * Bandwidth visualization with historical data and real-time updates
 */

// Main component (auto-detecting wrapper)
export { BandwidthChart } from './BandwidthChart';
export { default } from './BandwidthChart';

// Platform-specific presenters (for direct use if needed)
export { BandwidthChartDesktop } from './BandwidthChartDesktop';
export { BandwidthChartMobile } from './BandwidthChartMobile';

// Headless hook (for custom implementations)
export { useBandwidthHistory } from './useBandwidthHistory';

// Sub-components (for composition)
export { TimeRangeSelector } from './TimeRangeSelector';
export { InterfaceFilter } from './InterfaceFilter';
export { CustomTooltip } from './CustomTooltip';
export { BandwidthDataTable } from './BandwidthDataTable';
export {
  BandwidthChartSkeleton,
  BandwidthChartError,
  BandwidthChartEmpty,
} from './BandwidthChartSkeleton';

// Utility functions (for custom formatting)
export {
  formatBitrate,
  formatBytes,
  formatXAxis,
  formatYAxis,
  downsampleData,
  appendDataPoint,
  TIME_RANGE_MAP,
  AGGREGATION_MAP,
  MAX_DATA_POINTS,
} from './utils';

// GraphQL operations (for custom queries)
export { GET_BANDWIDTH_HISTORY as BANDWIDTH_HISTORY_QUERY, BANDWIDTH_UPDATE as BANDWIDTH_SUBSCRIPTION } from './graphql';

// TypeScript types
export type {
  TimeRange,
  BandwidthDataPoint,
  UseBandwidthHistoryConfig,
  UseBandwidthHistoryReturn,
  BandwidthChartProps,
  BandwidthChartPresenterProps,
  CustomTooltipProps,
  TimeRangeSelectorProps,
  InterfaceFilterProps,
  BandwidthDataTableProps,
} from './types';
export { GraphQLTimeRange, GraphQLAggregationType } from './types';
