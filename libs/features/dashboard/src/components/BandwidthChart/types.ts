/**
 * TypeScript type definitions for BandwidthChart component
 * Following Headless + Platform Presenter pattern (ADR-018)
 * @description
 * Complete type definitions for bandwidth charting, including data points,
 * hook configuration, component props, and GraphQL enums. All types are
 * fully documented with JSDoc descriptions on each field.
 */

/**
 * Time range options for bandwidth graph
 * Maps to GraphQL TimeRange enum
 * - '5m': Real-time view with 2-second data points
 * - '1h': Hourly view with 1-minute aggregation
 * - '24h': Daily view with 5-minute aggregation
 */
export type TimeRange = '5m' | '1h' | '24h';

/**
 * Single bandwidth data point with timestamp and traffic metrics
 * Represents a snapshot of network traffic at a specific moment in time
 */
export interface BandwidthDataPoint {
  /** Unix timestamp in milliseconds (for sorting and x-axis plotting) */
  timestamp: number;
  /** Transmit rate in bits per second (used for chart series) */
  txRate: number;
  /** Receive rate in bits per second (used for chart series) */
  rxRate: number;
  /** Total transmitted bytes since interface creation (for tooltip display) */
  txBytes: number;
  /** Total received bytes since interface creation (for tooltip display) */
  rxBytes: number;
}

/**
 * Configuration for useBandwidthHistory hook
 * Passed to the hook to specify what data to fetch and how to fetch it
 */
export interface UseBandwidthHistoryConfig {
  /** Router/device ID to fetch bandwidth data for (required) */
  deviceId: string;
  /** Time range for historical data: '5m' (real-time), '1h' (1min agg), '24h' (5min agg) */
  timeRange: TimeRange;
  /** Optional interface ID filter (null or undefined = all interfaces) */
  interfaceId?: string | null;
}

/**
 * Return type for useBandwidthHistory hook
 * Contains all bandwidth data, loading states, and control functions
 */
export interface UseBandwidthHistoryReturn {
  /** Processed bandwidth data with current rates (null during initial load) */
  data: {
    /** Array of bandwidth data points (time-ordered, trimmed to MAX_DATA_POINTS) */
    dataPoints: BandwidthDataPoint[];
    /** Applied aggregation type: RAW (2s), MINUTE (60s), or FIVE_MIN (300s) */
    aggregation: string;
    /** Current traffic rates from latest data point or subscription */
    currentRates: {
      /** Current TX rate in bits per second */
      tx: number;
      /** Current RX rate in bits per second */
      rx: number;
    };
  } | null;
  /** Loading state: true during initial query/subscription setup */
  loading: boolean;
  /** Error object if query/subscription fails (null if no error) */
  error: Error | null;
  /** Function to manually refetch bandwidth history (bypasses cache) */
  refetch: () => void;
  /** Whether GraphQL subscription is active (false if using polling fallback) */
  isSubscriptionActive: boolean;
}

/**
 * Props for main BandwidthChart component (auto-detection wrapper)
 * Selects appropriate presenter (Mobile/Tablet/Desktop) based on viewport
 */
export interface BandwidthChartProps {
  /** Router/device ID to display bandwidth for (passed to useBandwidthHistory) */
  deviceId: string;
  /** Optional CSS class name for container (semantic spacing tokens preferred) */
  className?: string;
}

/**
 * Props for platform-specific presenters (Desktop/Mobile/Tablet)
 * Extends main props with hook override for testing
 * Used internally by platform presenters, not by consumers
 */
export interface BandwidthChartPresenterProps extends BandwidthChartProps {
  /** Optional hook override for testing (bypasses real data fetch) */
  hookOverride?: UseBandwidthHistoryReturn;
}

/**
 * Props for custom Recharts tooltip component
 * Consumed by Recharts when rendering tooltips on data points
 */
export interface CustomTooltipProps {
  /** Whether tooltip is active (user hovering over chart point) */
  active?: boolean;
  /** Recharts payload array containing data series values */
  payload?: any[];
  /** Data point label/timestamp (used for x-axis) */
  label?: number;
}

/**
 * Props for TimeRangeSelector component (segmented control)
 * Controls which time range view is displayed on the chart
 */
export interface TimeRangeSelectorProps {
  /** Currently selected time range ('5m', '1h', or '24h') */
  value: TimeRange;
  /** Callback fired when user selects different time range */
  onChange: (timeRange: TimeRange) => void;
  /** Optional CSS class name for container (semantic spacing tokens preferred) */
  className?: string;
}

/**
 * Props for InterfaceFilter component (select dropdown)
 * Controls which interface bandwidth is displayed on the chart
 */
export interface InterfaceFilterProps {
  /** Router/device ID to fetch interfaces from (passed to useInterfaces hook) */
  routerId: string;
  /** Currently selected interface ID (null/undefined = all interfaces) */
  value: string | null;
  /** Callback fired when user selects different interface */
  onChange: (interfaceId: string | null) => void;
  /** Optional CSS class name for container (minimum 44px height for touch targets) */
  className?: string;
}

/**
 * Props for BandwidthDataTable component (accessible tabular view)
 * Alternative to chart for users who prefer data tables or need screen reader support
 */
export interface BandwidthDataTableProps {
  /** Bandwidth data points to display in virtualized table */
  dataPoints: BandwidthDataPoint[];
  /** Current time range for context (affects column labels and rounding) */
  timeRange: TimeRange;
  /** Optional CSS class name for container */
  className?: string;
}

/**
 * GraphQL TimeRange enum values
 * Maps to backend aggregation strategy and UI time range labels
 */
export enum GraphQLTimeRange {
  /** 5-minute view with 2-second raw data points */
  FIVE_MIN = 'FIVE_MIN',
  /** 1-hour view with 1-minute averaged points */
  ONE_HOUR = 'ONE_HOUR',
  /** 24-hour view with 5-minute averaged points */
  TWENTY_FOUR_HOURS = 'TWENTY_FOUR_HOURS',
}

/**
 * GraphQL AggregationType enum values
 * Determines how data points are sampled and averaged from the metrics store
 */
export enum GraphQLAggregationType {
  /** Raw data: 2-second intervals, no averaging (most data points) */
  RAW = 'RAW',
  /** 1-minute rolling average (reduces data ~30x) */
  MINUTE = 'MINUTE',
  /** 5-minute rolling average (reduces data ~150x) */
  FIVE_MIN = 'FIVE_MIN',
  /** 1-hour rolling average (reduces data ~1800x) */
  HOUR = 'HOUR',
}
