/**
 * GraphQL queries and subscriptions for BandwidthChart
 * Follows NasNetConnect GraphQL architecture patterns
 *
 * @see https://docs.nasnet.io/architecture/api-contracts
 */

import { gql } from '@apollo/client';

/**
 * Query for historical bandwidth data
 * Retrieves aggregated bandwidth metrics for a device over a specified time range
 *
 * @query BandwidthHistory
 * @param deviceId - Router/device ID (required)
 * @param interfaceId - Optional interface ID filter (null = all interfaces)
 * @param timeRange - Time range enum (FIVE_MIN, ONE_HOUR, TWENTY_FOUR_HOURS)
 * @param aggregation - Aggregation type (RAW, MINUTE, FIVE_MIN, HOUR)
 *
 * @returns {Object} Bandwidth history with data points and aggregation type
 * @returns {Array<Object>} dataPoints - Array of bandwidth measurements
 * @returns {string} dataPoints[].timestamp - ISO 8601 timestamp
 * @returns {number} dataPoints[].txRate - Transmit rate in bits per second
 * @returns {number} dataPoints[].rxRate - Receive rate in bits per second
 * @returns {number} dataPoints[].txBytes - Total transmitted bytes
 * @returns {number} dataPoints[].rxBytes - Total received bytes
 *
 * @example
 * const { data } = useQuery(GET_BANDWIDTH_HISTORY, {
 *   variables: { deviceId: 'router1', timeRange: 'ONE_HOUR', aggregation: 'MINUTE' }
 * });
 */
export const GET_BANDWIDTH_HISTORY = gql`
  query BandwidthHistory(
    $deviceId: ID!
    $interfaceId: ID
    $timeRange: TimeRange!
    $aggregation: AggregationType!
  ) {
    bandwidthHistory(
      deviceId: $deviceId
      interfaceId: $interfaceId
      timeRange: $timeRange
      aggregation: $aggregation
    ) {
      dataPoints {
        timestamp
        txRate
        rxRate
        txBytes
        rxBytes
      }
      aggregation
    }
  }
`;

/**
 * Subscription for real-time bandwidth updates
 * Only used for 5-minute view (real-time monitoring)
 * Emits new data point every 2 seconds for live tracking
 *
 * @subscription Bandwidth
 * @param deviceId - Router/device ID (required)
 * @param interfaceId - Optional interface ID filter (null = all interfaces)
 *
 * @returns {Object} Real-time bandwidth measurement
 * @returns {string} timestamp - ISO 8601 timestamp
 * @returns {number} txRate - Transmit rate in bits per second
 * @returns {number} rxRate - Receive rate in bits per second
 * @returns {number} txBytes - Total transmitted bytes
 * @returns {number} rxBytes - Total received bytes
 *
 * @example
 * useSubscription(BANDWIDTH_UPDATE, {
 *   variables: { deviceId: 'router1' }
 * });
 */
export const BANDWIDTH_UPDATE = gql`
  subscription Bandwidth($deviceId: ID!, $interfaceId: ID) {
    bandwidth(deviceId: $deviceId, interfaceId: $interfaceId) {
      timestamp
      txRate
      rxRate
      txBytes
      rxBytes
    }
  }
`;

// Named re-exports for test compatibility
export { GET_BANDWIDTH_HISTORY as BANDWIDTH_HISTORY_QUERY };
export { BANDWIDTH_UPDATE as BANDWIDTH_SUBSCRIPTION };
