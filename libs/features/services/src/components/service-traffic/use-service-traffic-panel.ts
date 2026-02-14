/**
 * Headless hook for Service Traffic Statistics Panel
 * Manages traffic state, rate calculations, and quota monitoring
 *
 * NAS-8.8: Implement Traffic Statistics and Quota Management
 *
 * @see service-traffic-panel.types.ts for type definitions
 */

import { useState, useEffect, useMemo, useRef } from 'react';
import { useTrafficMonitoring } from '@nasnet/api-client/queries';
import type { ServiceTrafficStats } from '@nasnet/api-client/generated';
import type { ServiceTrafficState } from './service-traffic-panel.types';

/**
 * Options for useServiceTrafficPanel hook
 */
export interface UseServiceTrafficPanelOptions {
  /** Router ID */
  routerID: string;
  /** Service instance ID */
  instanceID: string;
  /** Number of hours of historical data to fetch (default: 24) */
  historyHours?: number;
}

/**
 * Headless hook for service traffic statistics panel
 *
 * Manages:
 * - Real-time traffic statistics via GraphQL subscription
 * - Rate calculations using BigInt arithmetic
 * - Quota monitoring with warning/limit detection
 * - Counter reset detection
 *
 * @example
 * ```tsx
 * const trafficState = useServiceTrafficPanel({
 *   routerID: 'router-1',
 *   instanceID: 'xray-instance-1',
 *   historyHours: 24,
 * });
 *
 * if (trafficState.stats) {
 *   console.log('Upload Rate:', formatBitsPerSec(trafficState.uploadRate || 0n));
 *   console.log('Download Rate:', formatBitsPerSec(trafficState.downloadRate || 0n));
 *   console.log('Quota Usage:', trafficState.quotaUsagePercent, '%');
 * }
 * ```
 */
export function useServiceTrafficPanel({
  routerID,
  instanceID,
  historyHours = 24,
}: UseServiceTrafficPanelOptions): ServiceTrafficState {
  // Ref to track previous stats for delta calculations
  const previousStatsRef = useRef<ServiceTrafficStats | null>(null);
  const [previousStats, setPreviousStats] = useState<ServiceTrafficStats | null>(null);

  // Combined hook for query + subscription
  const { stats, loading, error, refetch } = useTrafficMonitoring({
    routerID,
    instanceID,
    historyHours,
  });

  // Calculate upload/download rates (bytes/sec) using BigInt arithmetic
  const { uploadRate, downloadRate } = useMemo(() => {
    if (!stats || !previousStats) {
      return { uploadRate: null, downloadRate: null };
    }

    try {
      // Parse timestamps to get interval
      const currentTime = new Date(stats.lastUpdated).getTime();
      const previousTime = new Date(previousStats.lastUpdated).getTime();
      const intervalMs = currentTime - previousTime;

      // Skip if interval is invalid (e.g., same timestamp)
      if (intervalMs <= 0) {
        return { uploadRate: null, downloadRate: null };
      }

      // Calculate deltas
      const uploadDiff = BigInt(stats.totalUploadBytes) - BigInt(previousStats.totalUploadBytes);
      const downloadDiff = BigInt(stats.totalDownloadBytes) - BigInt(previousStats.totalDownloadBytes);

      // Detect counter resets (negative deltas)
      // This can happen if service restarts or counters overflow
      if (uploadDiff < 0n || downloadDiff < 0n) {
        console.warn('Service traffic counter reset detected, skipping rate calculation');
        return { uploadRate: null, downloadRate: null };
      }

      // Calculate rates: (delta bytes * 1000ms) / interval in ms
      // This gives us bytes per second
      const upload = (uploadDiff * 1000n) / BigInt(intervalMs);
      const download = (downloadDiff * 1000n) / BigInt(intervalMs);

      return { uploadRate: upload, downloadRate: download };
    } catch (err) {
      console.error('Error calculating service traffic rates:', err);
      return { uploadRate: null, downloadRate: null };
    }
  }, [stats, previousStats]);

  // Calculate quota metrics
  const quotaMetrics = useMemo(() => {
    if (!stats?.quota) {
      return {
        quotaUsagePercent: 0,
        quotaWarning: false,
        quotaExceeded: false,
      };
    }

    return {
      quotaUsagePercent: stats.quota.usagePercent,
      quotaWarning: stats.quota.warningTriggered && !stats.quota.limitReached,
      quotaExceeded: stats.quota.limitReached,
    };
  }, [stats?.quota]);

  // Update previous stats for rate calculation
  // Store stats after a short delay to ensure proper delta
  useEffect(() => {
    if (stats && stats !== previousStatsRef.current) {
      const timer = setTimeout(() => {
        setPreviousStats(stats);
        previousStatsRef.current = stats;
      }, 1000); // 1 second delay

      return () => clearTimeout(timer);
    }
  }, [stats]);

  return {
    stats,
    uploadRate,
    downloadRate,
    quotaUsagePercent: quotaMetrics.quotaUsagePercent,
    quotaWarning: quotaMetrics.quotaWarning,
    quotaExceeded: quotaMetrics.quotaExceeded,
    loading,
    error: error ?? null,
  };
}
