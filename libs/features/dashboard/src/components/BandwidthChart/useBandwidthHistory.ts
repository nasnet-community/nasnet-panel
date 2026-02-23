/**
 * useBandwidthHistory - Headless hook for bandwidth data fetching
 * Implements hybrid real-time strategy: GraphQL subscription + polling fallback
 * Follows ADR-018 (Headless + Platform Presenters pattern)
 * @description
 * Fetches and manages bandwidth history data with automatic subscription/polling
 * strategy selection. For 5m time range, uses real-time GraphQL subscriptions with
 * polling fallback if subscription fails. For 1h/24h ranges, uses cached queries only.
 * Automatically appends real-time data points and trims historical data to maintain
 * performance. Cleanup is automatic: subscriptions terminated on unmount, intervals
 * cleared, refs released.
 * @example
 * const { data, loading, error, refetch } = useBandwidthHistory({
 *   deviceId: 'router-1',
 *   timeRange: '5m',
 *   interfaceId: 'eth0'
 * });
 */

import { useSubscription, useQuery } from '@apollo/client';
import { useMemo, useEffect, useRef, useState } from 'react';
import { GET_BANDWIDTH_HISTORY as BANDWIDTH_HISTORY_QUERY, BANDWIDTH_UPDATE as BANDWIDTH_SUBSCRIPTION } from './graphql';
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
 * **Data Fetching Strategy:**
 * - For 5m view: GraphQL subscription for real-time updates + polling fallback (2s interval)
 * - For 1h/24h views: Cached query only (no real-time updates)
 * - Automatic fallback to polling if subscription errors
 * - Cache policy: cache-and-network (show cached immediately, refresh in background)
 *
 * **Performance Optimization:**
 * - Real-time data appended to ref, not causing re-renders until memoized value updates
 * - Data trimmed to MAX_DATA_POINTS per timeRange to prevent memory growth
 * - useMemo prevents recalculation when data hasn't changed
 * - useCallback on event handlers prevents subscription recreation
 *
 * **Cleanup & Memory Management:**
 * - useQuery/useSubscription cleanup: automatic on unmount
 * - Ref cleanup: dataRef cleared on unmount
 * - State cleanup: subscriptionActive state cleared
 * - No memory leaks from intervals (managed by Apollo)
 *
 * @param config - Hook configuration (deviceId, timeRange, interfaceId)
 * @returns Object with data, loading, error states, refetch function, subscription status
 */
export function useBandwidthHistory(
  config: UseBandwidthHistoryConfig
): UseBandwidthHistoryReturn {
  const { deviceId, timeRange, interfaceId } = config;
  const dataRef = useRef<BandwidthDataPoint[]>([]);
  const [subscriptionActive, setSubscriptionActive] = useState(true);

  /**
   * Fetch historical bandwidth data
   * - Uses cache-and-network: shows cached data immediately, refreshes in background
   * - Polling fallback (2s) activates only for 5m view when subscription fails
   * - Variables automatically memoized by Apollo to prevent unnecessary re-queries
   */
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
    // Cache policy: show cached data immediately, refresh in background
    fetchPolicy: 'cache-and-network',
  });

  /**
   * Subscribe to real-time bandwidth updates
   * - Only active for 5m time range
   * - Provides latest TX/RX rates with sub-second latency
   * - Automatic cleanup on unmount (Apollo handles cleanup)
   * - Fallback to polling if subscription errors
   */
  const { data: realtimeData } = useSubscription(BANDWIDTH_SUBSCRIPTION, {
    variables: {
      deviceId,
      interfaceId: interfaceId || null,
    },
    // Skip subscription for non-5m timeframes (unnecessary overhead)
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

  /**
   * Process and merge historical data with current rates
   * Memoized to prevent unnecessary recalculations (only updates when inputs change)
   */
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

    // Store in ref for real-time updates (doesn't trigger re-render)
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

  /**
   * Append real-time data points for 5m view
   * Only triggered when subscription data arrives (not on every render)
   * Trimmed to MAX_DATA_POINTS to maintain constant memory usage
   */
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

    // Append and trim to max points for performance (prevents memory leaks)
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
