/**
 * Utility functions for BandwidthChart component
 * Provides formatting, data transformation, and GraphQL mapping utilities
 *
 * @module BandwidthChart/utils
 * @see BandwidthChart component
 */

import type { TimeRange, BandwidthDataPoint } from './types';
import { GraphQLTimeRange, GraphQLAggregationType } from './types';

/**
 * Map frontend time range shorthand to GraphQL enum values
 * Used to convert user-facing time range labels to GraphQL API parameters
 *
 * @constant
 * @type {Record<TimeRange, GraphQLTimeRange>}
 *
 * @example
 * const gqlTimeRange = TIME_RANGE_MAP['1h']; // GraphQLTimeRange.ONE_HOUR
 */
export const TIME_RANGE_MAP: Record<TimeRange, GraphQLTimeRange> = {
  '5m': GraphQLTimeRange.FIVE_MIN,
  '1h': GraphQLTimeRange.ONE_HOUR,
  '24h': GraphQLTimeRange.TWENTY_FOUR_HOURS,
};

/**
 * Map time range to appropriate GraphQL aggregation type
 * Balances data freshness (small ranges) with query efficiency (large ranges)
 *
 * @constant
 * @type {Record<TimeRange, GraphQLAggregationType>}
 *
 * Mapping strategy:
 * - 5m: RAW (2-second intervals, ~150 points) - for real-time precision
 * - 1h: MINUTE (1-minute averages, ~60 points) - for hourly trends
 * - 24h: FIVE_MIN (5-minute averages, ~288 points) - for daily patterns
 *
 * @example
 * const aggregation = AGGREGATION_MAP['1h']; // GraphQLAggregationType.MINUTE
 */
export const AGGREGATION_MAP: Record<TimeRange, GraphQLAggregationType> = {
  '5m': GraphQLAggregationType.RAW, // 2-second intervals, ~150 points
  '1h': GraphQLAggregationType.MINUTE, // 1-minute averages, ~60 points
  '24h': GraphQLAggregationType.FIVE_MIN, // 5-minute averages, ~288 points
};

/**
 * Maximum data points per time range (for rendering performance)
 * Prevents excessive DOM elements and chart redrawing
 *
 * @constant
 * @type {Record<TimeRange, number>}
 *
 * Calculation:
 * - 5m: 150 points (5 min / 2 sec intervals)
 * - 1h: 60 points (60 min / 1 min intervals)
 * - 24h: 288 points (24 hr × 60 min / 5 min intervals)
 *
 * @example
 * const maxPoints = MAX_DATA_POINTS['24h']; // 288
 */
export const MAX_DATA_POINTS: Record<TimeRange, number> = {
  '5m': 150, // 5 min / 2 sec = 150 points
  '1h': 60, // 60 min / 1 min = 60 points
  '24h': 288, // 24 hr * 60 min / 5 min = 288 points
};

/**
 * Format bitrate (bits per second) for display
 * Used in tooltips and detailed views for clarity
 *
 * @function formatBitrate
 * @param {number} bps - Bitrate in bits per second
 * @returns {string} Formatted string with appropriate unit (Gbps, Mbps, Kbps, bps)
 *
 * @example
 * formatBitrate(1500000)       // "1.5 Mbps"
 * formatBitrate(12500000000)   // "12.50 Gbps"
 * formatBitrate(500)           // "500 bps"
 */
export function formatBitrate(bps: number): string {
  if (bps >= 1_000_000_000) return `${(bps / 1_000_000_000).toFixed(2)} Gbps`;
  if (bps >= 1_000_000) return `${(bps / 1_000_000).toFixed(1)} Mbps`;
  if (bps >= 1_000) return `${(bps / 1_000).toFixed(1)} Kbps`;
  return `${bps} bps`;
}

/**
 * Format bytes for display (for tooltip totals and data usage)
 * Uses binary units (KB, MB, GB, TB) with appropriate precision
 *
 * @function formatBytes
 * @param {number} bytes - Byte count
 * @returns {string} Formatted string with appropriate unit (TB, GB, MB, KB, B)
 *
 * @example
 * formatBytes(1048576)     // "1.0 MB"
 * formatBytes(2147483648) // "2.00 GB"
 * formatBytes(512)        // "512 B"
 */
export function formatBytes(bytes: number): string {
  if (bytes >= 1_000_000_000_000) return `${(bytes / 1_000_000_000_000).toFixed(2)} TB`;
  if (bytes >= 1_000_000_000) return `${(bytes / 1_000_000_000).toFixed(2)} GB`;
  if (bytes >= 1_000_000) return `${(bytes / 1_000_000).toFixed(1)} MB`;
  if (bytes >= 1_000) return `${(bytes / 1_000).toFixed(1)} KB`;
  return `${bytes} B`;
}

/**
 * Format X-axis timestamp based on time range
 * Adapts display format to the context for optimal readability
 *
 * @function formatXAxis
 * @param {number} timestamp - Unix timestamp in milliseconds
 * @param {TimeRange} timeRange - Current time range selection (5m, 1h, 24h)
 * @returns {string} Formatted time string
 *
 * Behavior:
 * - 5m/1h ranges: Time only (HH:MM) for brevity
 * - 24h range: Date + time (Mon DD HH:MM) for context
 *
 * @example
 * formatXAxis(1645094400000, '5m')  // "14:30"
 * formatXAxis(1645094400000, '24h') // "Feb 17 14:30"
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
 * Compact format optimized for chart axis labels
 *
 * @function formatYAxis
 * @param {number} bps - Bitrate in bits per second
 * @returns {string} Formatted string with suffix (G, M, K, or raw number)
 *
 * @example
 * formatYAxis(1500000)      // "1.5M"
 * formatYAxis(12500000000)  // "12.5G"
 * formatYAxis(500)          // "500"
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
 * Uses uniform sampling (every nth point) for simplicity and performance
 *
 * @function downsampleData
 * @param {BandwidthDataPoint[]} data - Array of bandwidth data points
 * @param {number} targetPoints - Target number of points after downsampling
 * @returns {BandwidthDataPoint[]} Downsampled data array (or original if already small)
 *
 * @example
 * const downsampled = downsampleData(largeDataSet, 100);
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
 * Used for real-time data streaming via GraphQL subscriptions
 * Maintains a sliding window of the most recent data points
 *
 * @function appendDataPoint
 * @param {BandwidthDataPoint[]} existing - Existing data points array
 * @param {BandwidthDataPoint} newPoint - New data point to append
 * @param {number} maxPoints - Maximum number of points to keep (older points removed)
 * @returns {BandwidthDataPoint[]} Updated data array with new point appended, trimmed to maxPoints
 *
 * @example
 * const updated = appendDataPoint(points, newPoint, 150); // Keep last 150 points
 */
export function appendDataPoint(
  existing: BandwidthDataPoint[],
  newPoint: BandwidthDataPoint,
  maxPoints: number
): BandwidthDataPoint[] {
  return [...existing, newPoint].slice(-maxPoints);
}
