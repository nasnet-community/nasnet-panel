/**
 * useBandwidthHistory - Headless hook for bandwidth data fetching
 * Implements hybrid real-time strategy: GraphQL subscription + polling fallback
 * Follows ADR-018 (Headless + Platform Presenters pattern)
 */

import { useSubscription, useQuery } from '@apollo/client';
import { useMemo, useEffect, useRef, useState } from 'react';
import { BANDWIDTH_HISTORY_QUERY, BANDWIDTH_SUBSCRIPTION } from './graphql';
import {
  TIME_RANGE_MAP,
  AGGREGATION_MAP,
  MAX_DATA_POINTS,
  appendDataPoint,
} from './utils';
import type {
  TimeRange,
  BandwidthDataPoint,
  UseBandwidthHistoryConfig,
  UseBandwidthHistoryReturn,
} from './types';

/**
 * Hook for fetching and managing bandwidth history data
 *
 * Strategy:
 * - For 5m view: Use subscription for real-time updates with polling fallback
 * - For 1h/24h views: Use query only (no subscription)
 * - Automatically handles subscription failures and falls back to polling
 *
 * @param config - Hook configuration with deviceId, timeRange, interfaceId
 * @returns Bandwidth data with loading/error states and refetch function
 */
export function useBandwidthHistory(
  config: UseBandwidthHistoryConfig
): UseBandwidthHistoryReturn {
  const { deviceId, timeRange, interfaceId } = config;
  const dataRef = useRef<BandwidthDataPoint[]>([]);
  const [subscriptionActive, setSubscriptionActive] = useState(true);

  // Fetch historical data with optional polling fallback for 5m view
  const {
    data: historyData,
    loading,
    error,
    refetch,
  } = useQuery(BANDWIDTH_HISTORY_QUERY, {
    variables: {
      deviceId,
      interfaceId: interfaceId || null,
      timeRange: TIME_RANGE_MAP[timeRange],
      aggregation: AGGREGATION_MAP[timeRange],
    },
    // Enable polling fallback for 5m view when subscription is not active
    pollInterval: timeRange === '5m' && !subscriptionActive ? 2000 : 0,
    // Cache results for 10 seconds to reduce query load
    fetchPolicy: 'cache-and-network',
  });

  // Subscribe to real-time updates (only for 5m view)
  const { data: realtimeData } = useSubscription(BANDWIDTH_SUBSCRIPTION, {
    variables: {
      deviceId,
      interfaceId: interfaceId || null,
    },
    // Skip subscription for non-5m timeframes
    skip: timeRange !== '5m',
    // Handle subscription errors - activate polling fallback
    onError: (err) => {
      console.warn('Bandwidth subscription error, falling back to polling:', err);
      setSubscriptionActive(false);
    },
    // Mark subscription as active when data received
    onData: () => {
      if (!subscriptionActive) {
        setSubscriptionActive(true);
      }
    },
  });

  // Process and merge historical data
  const processedData = useMemo(() => {
    if (!historyData?.bandwidthHistory) return null;

    // Map GraphQL response to typed data points
    const historical = historyData.bandwidthHistory.dataPoints.map(
      (dp: any) => ({
        timestamp: new Date(dp.timestamp).getTime(),
        txRate: dp.txRate,
        rxRate: dp.rxRate,
        txBytes: dp.txBytes,
        rxBytes: dp.rxBytes,
      })
    );

    // Store in ref for real-time updates
    dataRef.current = historical;

    // Get current rates from latest data point or subscription
    const lastPoint = historical[historical.length - 1];
    const currentRates = realtimeData?.bandwidth
      ? {
          tx: realtimeData.bandwidth.txRate,
          rx: realtimeData.bandwidth.rxRate,
        }
      : {
          tx: lastPoint?.txRate || 0,
          rx: lastPoint?.rxRate || 0,
        };

    return {
      dataPoints: historical,
      aggregation: historyData.bandwidthHistory.aggregation,
      currentRates,
    };
  }, [historyData, realtimeData]);

  // Append real-time data points for 5m view
  useEffect(() => {
    // Only append for 5m view when subscription data arrives
    if (timeRange !== '5m' || !realtimeData?.bandwidth) return;

    const newPoint: BandwidthDataPoint = {
      timestamp: new Date(realtimeData.bandwidth.timestamp).getTime(),
      txRate: realtimeData.bandwidth.txRate,
      rxRate: realtimeData.bandwidth.rxRate,
      txBytes: realtimeData.bandwidth.txBytes,
      rxBytes: realtimeData.bandwidth.rxBytes,
    };

    // Append and trim to max points for performance
    dataRef.current = appendDataPoint(
      dataRef.current,
      newPoint,
      MAX_DATA_POINTS[timeRange]
    );
  }, [realtimeData, timeRange]);

  return {
    data: processedData,
    loading,
    error: error || null,
    refetch,
    isSubscriptionActive: subscriptionActive,
  };
}
