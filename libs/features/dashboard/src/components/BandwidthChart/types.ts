/**
 * TypeScript type definitions for BandwidthChart component
 * Following Headless + Platform Presenter pattern (ADR-018)
 */

/**
 * Time range options for bandwidth graph
 * Maps to GraphQL TimeRange enum
 */
export type TimeRange = '5m' | '1h' | '24h';

/**
 * Single bandwidth data point with timestamp and traffic metrics
 */
export interface BandwidthDataPoint {
  /** Unix timestamp in milliseconds */
  timestamp: number;
  /** Transmit rate in bits per second */
  txRate: number;
  /** Receive rate in bits per second */
  rxRate: number;
  /** Total transmitted bytes */
  txBytes: number;
  /** Total received bytes */
  rxBytes: number;
}

/**
 * Configuration for useBandwidthHistory hook
 */
export interface UseBandwidthHistoryConfig {
  /** Router/device ID to fetch bandwidth data for */
  deviceId: string;
  /** Time range for historical data */
  timeRange: TimeRange;
  /** Optional interface ID filter (null = all interfaces) */
  interfaceId?: string | null;
}

/**
 * Return type for useBandwidthHistory hook
 */
export interface UseBandwidthHistoryReturn {
  /** Processed bandwidth data with current rates */
  data: {
    /** Array of bandwidth data points */
    dataPoints: BandwidthDataPoint[];
    /** Applied aggregation type (RAW, MINUTE, FIVE_MIN) */
    aggregation: string;
    /** Current traffic rates */
    currentRates: {
      /** Current TX rate in bps */
      tx: number;
      /** Current RX rate in bps */
      rx: number;
    };
  } | null;
  /** Loading state */
  loading: boolean;
  /** Error object if query/subscription fails */
  error: Error | null;
  /** Function to manually refetch data */
  refetch: () => void;
  /** Whether GraphQL subscription is active */
  isSubscriptionActive: boolean;
}

/**
 * Props for main BandwidthChart component
 */
export interface BandwidthChartProps {
  /** Router/device ID to display bandwidth for */
  deviceId: string;
  /** Optional CSS class name */
  className?: string;
}

/**
 * Props for platform-specific presenters (Desktop/Mobile)
 * Extends main props with hook override for testing
 */
export interface BandwidthChartPresenterProps extends BandwidthChartProps {
  /** Optional hook override for testing */
  hookOverride?: UseBandwidthHistoryReturn;
}

/**
 * Props for custom Recharts tooltip
 */
export interface CustomTooltipProps {
  /** Whether tooltip is active (hovering over point) */
  active?: boolean;
  /** Recharts payload data */
  payload?: any[];
  /** Data point label (timestamp) */
  label?: number;
}

/**
 * Props for TimeRangeSelector component
 */
export interface TimeRangeSelectorProps {
  /** Currently selected time range */
  value: TimeRange;
  /** Callback when time range changes */
  onChange: (timeRange: TimeRange) => void;
  /** Optional CSS class name */
  className?: string;
}

/**
 * Props for InterfaceFilter component
 */
export interface InterfaceFilterProps {
  /** Router/device ID to fetch interfaces for */
  routerId: string;
  /** Currently selected interface ID (null = all interfaces) */
  value: string | null;
  /** Callback when interface selection changes */
  onChange: (interfaceId: string | null) => void;
  /** Optional CSS class name */
  className?: string;
}

/**
 * Props for BandwidthDataTable (accessible alternative)
 */
export interface BandwidthDataTableProps {
  /** Bandwidth data points to display in table */
  dataPoints: BandwidthDataPoint[];
  /** Current time range for context */
  timeRange: TimeRange;
  /** Optional CSS class name */
  className?: string;
}

/**
 * GraphQL TimeRange enum values
 */
export enum GraphQLTimeRange {
  FIVE_MIN = 'FIVE_MIN',
  ONE_HOUR = 'ONE_HOUR',
  TWENTY_FOUR_HOURS = 'TWENTY_FOUR_HOURS',
}

/**
 * GraphQL AggregationType enum values
 */
export enum GraphQLAggregationType {
  RAW = 'RAW',
  MINUTE = 'MINUTE',
  FIVE_MIN = 'FIVE_MIN',
  HOUR = 'HOUR',
}
