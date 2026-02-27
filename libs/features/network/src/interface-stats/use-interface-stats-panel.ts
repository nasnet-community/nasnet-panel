/**
 * Headless hook for Interface Statistics Panel
 * Manages statistics state, rate calculations, and error detection
 *
 * NAS-6.9: Implement Interface Traffic Statistics
 *
 * @see interface-stats-panel.types.ts for type definitions
 */

import { useState, useEffect, useMemo, useRef } from 'react';
import { useInterfaceStatsQuery, useInterfaceStatsSubscription } from '@nasnet/api-client/queries';
import type { InterfaceStats } from '@nasnet/api-client/generated';
import type { InterfaceStatsState } from './interface-stats-panel.types';

/**
 * Options for useInterfaceStatsPanel hook
 */
export interface UseInterfaceStatsPanelOptions {
  /** Router ID */
  routerId: string;
  /** Interface ID */
  interfaceId: string;
  /** Polling interval for subscription (e.g., '1s', '5s', '10s', '30s') */
  pollingInterval?: string;
}

/**
 * Parses a duration string (e.g., "5s", "1m", "2h") to milliseconds
 *
 * @param duration - Duration string in RouterOS format
 * @returns Duration in milliseconds
 */
function parseDurationToMs(duration: string): number {
  const match = duration.match(/^(\d+)(s|m|h)$/);
  if (!match) return 5000; // default 5 seconds

  const value = parseInt(match[1], 10);
  const unit = match[2];

  if (unit === 's') {
    return value * 1000;
  } else if (unit === 'm') {
    return value * 60 * 1000;
  } else if (unit === 'h') {
    return value * 60 * 60 * 1000;
  }
  return 5000; // fallback
}

/**
 * Headless hook for interface statistics panel
 *
 * Manages:
 * - Real-time statistics via GraphQL subscription
 * - Rate calculations using BigInt arithmetic
 * - Error rate percentage calculation
 * - Counter reset detection
 *
 * @example
 * ```tsx
 * const statsState = useInterfaceStatsPanel({
 *   routerId: 'router-1',
 *   interfaceId: 'ether1',
 *   pollingInterval: '5s',
 * });
 *
 * if (statsState.stats) {
 *   console.log('TX Rate:', formatBitsPerSec(statsState.rates?.txRate || 0n));
 *   console.log('Error Rate:', statsState.errorRate.toFixed(3), '%');
 * }
 * ```
 */
export function useInterfaceStatsPanel({
  routerId,
  interfaceId,
  pollingInterval = '5s',
}: UseInterfaceStatsPanelOptions): InterfaceStatsState {
  // Ref to track previous stats for delta calculations
  const previousStatsRef = useRef<InterfaceStats | null>(null);
  const [previousStats, setPreviousStats] = useState<InterfaceStats | null>(null);

  // Initial query for current stats
  const {
    data: queryData,
    loading,
    error,
  } = useInterfaceStatsQuery({
    routerId,
    interfaceId,
  });

  // Real-time subscription for updates
  const { data: subscriptionData } = useInterfaceStatsSubscription({
    routerId,
    interfaceId,
    interval: pollingInterval as any,
  });

  // Current stats (prefer subscription data over initial query)
  const currentStats = useMemo(() => {
    return subscriptionData?.interfaceStatsUpdated ?? queryData?.interface?.statistics ?? null;
  }, [subscriptionData, queryData]);

  // Calculate rates (bytes/sec) using BigInt arithmetic
  const rates = useMemo(() => {
    if (!currentStats || !previousStats) return null;

    const intervalMs = parseDurationToMs(pollingInterval);

    try {
      const txDiff = BigInt(currentStats.txBytes) - BigInt(previousStats.txBytes);
      const rxDiff = BigInt(currentStats.rxBytes) - BigInt(previousStats.rxBytes);

      // Detect counter resets (negative deltas)
      // This can happen if router reboots or counters overflow
      if (txDiff < 0n || rxDiff < 0n) {
        console.warn('Interface counter reset detected, skipping rate calculation');
        return null;
      }

      // Calculate rates: (delta bytes * 1000ms) / interval in ms
      // This gives us bytes per second
      return {
        txRate: (txDiff * 1000n) / BigInt(intervalMs),
        rxRate: (rxDiff * 1000n) / BigInt(intervalMs),
      };
    } catch (err) {
      console.error('Error calculating interface rates:', err);
      return null;
    }
  }, [currentStats, previousStats, pollingInterval]);

  // Calculate error rate percentage
  const errorRate = useMemo(() => {
    if (!currentStats) return 0;

    try {
      const totalPackets = BigInt(currentStats.txPackets) + BigInt(currentStats.rxPackets);
      const totalErrors = BigInt(currentStats.txErrors) + BigInt(currentStats.rxErrors);

      if (totalPackets === 0n) return 0;

      // Calculate as percentage with 3 decimal places
      // (errors * 100000) / packets / 1000 = percentage with 3 decimals
      return Number((totalErrors * 100000n) / totalPackets) / 1000;
    } catch (err) {
      console.error('Error calculating error rate:', err);
      return 0;
    }
  }, [currentStats]);

  // Update previous stats for rate calculation
  // Wait for one interval before storing, so we have a proper delta
  useEffect(() => {
    if (!currentStats || currentStats === previousStatsRef.current) {
      return;
    }

    const intervalMs = parseDurationToMs(pollingInterval);
    const timer = setTimeout(() => {
      setPreviousStats(currentStats);
      previousStatsRef.current = currentStats;
    }, intervalMs);

    return () => clearTimeout(timer);
  }, [currentStats, pollingInterval]);

  // Check if interface has any errors
  const hasErrors = useMemo(() => {
    if (!currentStats) return false;
    return currentStats.txErrors > 0 || currentStats.rxErrors > 0;
  }, [currentStats]);

  return {
    stats: currentStats,
    rates,
    errorRate,
    loading,
    error: error ?? null,
    hasErrors,
  };
}
