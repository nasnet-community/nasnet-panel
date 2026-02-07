/**
 * Utility functions for BandwidthChart component
 */

import type { TimeRange, BandwidthDataPoint } from './types';
import { GraphQLTimeRange, GraphQLAggregationType } from './types';

/**
 * Map frontend time range shorthand to GraphQL enum values
 */
export const TIME_RANGE_MAP: Record<TimeRange, GraphQLTimeRange> = {
  '5m': GraphQLTimeRange.FIVE_MIN,
  '1h': GraphQLTimeRange.ONE_HOUR,
  '24h': GraphQLTimeRange.TWENTY_FOUR_HOURS,
};

/**
 * Map time range to aggregation type
 */
export const AGGREGATION_MAP: Record<TimeRange, GraphQLAggregationType> = {
  '5m': GraphQLAggregationType.RAW, // 2-second intervals, ~150 points
  '1h': GraphQLAggregationType.MINUTE, // 1-minute averages, ~60 points
  '24h': GraphQLAggregationType.FIVE_MIN, // 5-minute averages, ~288 points
};

/**
 * Maximum data points per time range (for performance)
 */
export const MAX_DATA_POINTS: Record<TimeRange, number> = {
  '5m': 150, // 5 min / 2 sec = 150 points
  '1h': 60, // 60 min / 1 min = 60 points
  '24h': 288, // 24 hr * 60 min / 5 min = 288 points
};

/**
 * Format bitrate (bits per second) for display
 *
 * @param bps - Bitrate in bits per second
 * @returns Formatted string with appropriate unit (Gbps, Mbps, Kbps, bps)
 *
 * @example
 * formatBitrate(1500000) // "1.5 Mbps"
 * formatBitrate(12500000000) // "12.50 Gbps"
 */
export function formatBitrate(bps: number): string {
  if (bps >= 1_000_000_000) return `${(bps / 1_000_000_000).toFixed(2)} Gbps`;
  if (bps >= 1_000_000) return `${(bps / 1_000_000).toFixed(1)} Mbps`;
  if (bps >= 1_000) return `${(bps / 1_000).toFixed(1)} Kbps`;
  return `${bps} bps`;
}

/**
 * Format bytes for display (for tooltip totals)
 *
 * @param bytes - Byte count
 * @returns Formatted string with appropriate unit (TB, GB, MB, KB, B)
 *
 * @example
 * formatBytes(1048576) // "1.0 MB"
 * formatBytes(2147483648) // "2.00 GB"
 */
export function formatBytes(bytes: number): string {
  if (bytes >= 1_000_000_000_000)
    return `${(bytes / 1_000_000_000_000).toFixed(2)} TB`;
  if (bytes >= 1_000_000_000) return `${(bytes / 1_000_000_000).toFixed(2)} GB`;
  if (bytes >= 1_000_000) return `${(bytes / 1_000_000).toFixed(1)} MB`;
  if (bytes >= 1_000) return `${(bytes / 1_000).toFixed(1)} KB`;
  return `${bytes} B`;
}

/**
 * Format X-axis timestamp based on time range
 *
 * @param timestamp - Unix timestamp in milliseconds
 * @param timeRange - Current time range selection
 * @returns Formatted time string
 */
export function formatXAxis(timestamp: number, timeRange: TimeRange): string {
  const date = new Date(timestamp);

  if (timeRange === '5m' || timeRange === '1h') {
    // Show only time for short ranges
    return date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  // Show date + time for 24h range
  return date.toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Format Y-axis bitrate with K/M/G suffix
 *
 * @param bps - Bitrate in bits per second
 * @returns Formatted string with suffix
 *
 * @example
 * formatYAxis(1500000) // "1.5M"
 * formatYAxis(12500000000) // "12.5G"
 */
export function formatYAxis(bps: number): string {
  if (bps >= 1_000_000_000) return `${(bps / 1_000_000_000).toFixed(1)}G`;
  if (bps >= 1_000_000) return `${(bps / 1_000_000).toFixed(1)}M`;
  if (bps >= 1_000) return `${(bps / 1_000).toFixed(1)}K`;
  return `${bps}`;
}

/**
 * Downsample data for large datasets (>500 points)
 * Reduces rendering load while maintaining visual fidelity
 *
 * @param data - Array of bandwidth data points
 * @param targetPoints - Target number of points after downsampling
 * @returns Downsampled data array
 */
export function downsampleData(
  data: BandwidthDataPoint[],
  targetPoints: number
): BandwidthDataPoint[] {
  if (data.length <= targetPoints) return data;

  const factor = Math.ceil(data.length / targetPoints);
  return data.filter((_, index) => index % factor === 0);
}

/**
 * Append new data point to existing array with max length constraint
 * Used for real-time data streaming
 *
 * @param existing - Existing data points array
 * @param newPoint - New data point to append
 * @param maxPoints - Maximum number of points to keep
 * @returns Updated data array with new point appended and oldest removed if needed
 */
export function appendDataPoint(
  existing: BandwidthDataPoint[],
  newPoint: BandwidthDataPoint,
  maxPoints: number
): BandwidthDataPoint[] {
  return [...existing, newPoint].slice(-maxPoints);
}
