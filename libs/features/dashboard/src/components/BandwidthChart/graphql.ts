/**
 * GraphQL queries and subscriptions for BandwidthChart
 * Follows NasNetConnect GraphQL architecture patterns
 */

import { gql } from '@apollo/client';

/**
 * Query for historical bandwidth data
 *
 * @param deviceId - Router/device ID
 * @param interfaceId - Optional interface ID filter (null = all interfaces)
 * @param timeRange - Time range enum (FIVE_MIN, ONE_HOUR, TWENTY_FOUR_HOURS)
 * @param aggregation - Aggregation type (RAW, MINUTE, FIVE_MIN, HOUR)
 *
 * @returns Bandwidth history with data points and aggregation type
 */
export const BANDWIDTH_HISTORY_QUERY = gql`
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
 *
 * @param deviceId - Router/device ID
 * @param interfaceId - Optional interface ID filter (null = all interfaces)
 *
 * @returns Real-time bandwidth data points
 */
export const BANDWIDTH_SUBSCRIPTION = gql`
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
