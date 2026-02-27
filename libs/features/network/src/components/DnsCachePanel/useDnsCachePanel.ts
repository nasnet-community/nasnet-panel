/**
 * DNS Cache Panel - Headless Hook
 * NAS-6.12: DNS Cache & Diagnostics - Task 6.2
 *
 * @description Provides DNS cache statistics and flush logic using Apollo Client.
 * Returns structured state object with cache data, loading states, and action handlers.
 * All formatting and computed values are memoized for performance.
 */

import { useCallback, useMemo, useState } from 'react';
import { useDnsCacheStats, useFlushDnsCache } from '@nasnet/api-client/queries';
import type { DnsCacheStats, FlushDnsCacheResult } from './types';

/**
 * Configuration options for useDnsCachePanel hook
 * @interface UseDnsCachePanelOptions
 */
interface UseDnsCachePanelOptions {
  /** Unique device/router identifier for fetching stats */
  deviceId: string;
  /** Whether to enable polling for cache stats (default: true) */
  enablePolling?: boolean;
  /** Callback invoked on successful cache flush with result data */
  onFlushSuccess?: (result: FlushDnsCacheResult) => void;
  /** Callback invoked on flush error with error message */
  onFlushError?: (error: string) => void;
}

/**
 * Hook for DNS Cache Panel component
 *
 * @param options Configuration options (deviceId, polling, callbacks)
 * @returns Object with state, data, computed values, and action handlers
 *
 * @example
 * ```tsx
 * const {
 *   isLoading,
 *   cacheStats,
 *   cacheUsedFormatted,
 *   openFlushDialog,
 * } = useDnsCachePanel({ deviceId: 'router-1' });
 * ```
 */
export function useDnsCachePanel({
  deviceId,
  enablePolling = true,
  onFlushSuccess,
  onFlushError,
}: UseDnsCachePanelOptions) {
  const [isFlushDialogOpen, setIsFlushDialogOpen] = useState(false);
  const [flushResult, setFlushResult] = useState<FlushDnsCacheResult | null>(null);

  // Query cache stats with polling
  const {
    cacheStats,
    loading: statsLoading,
    error: statsError,
    refetch,
  } = useDnsCacheStats(deviceId, enablePolling);

  // Mutation for flushing cache
  const [flushCacheMutation, { loading: flushLoading }] = useFlushDnsCache();

  const handleOpenFlushDialog = useCallback(() => {
    setIsFlushDialogOpen(true);
    setFlushResult(null);
  }, []);

  const handleCloseFlushDialog = useCallback(() => {
    setIsFlushDialogOpen(false);
  }, []);

  const handleConfirmFlush = useCallback(async () => {
    try {
      const { data, errors } = await flushCacheMutation({
        variables: { deviceId },
      });

      if (errors || !data?.flushDnsCache) {
        const errorMessage = errors?.[0]?.message || 'Failed to flush DNS cache. Please try again.';
        onFlushError?.(errorMessage);
        return;
      }

      const result = data.flushDnsCache as FlushDnsCacheResult;
      setFlushResult(result);
      onFlushSuccess?.(result);

      // Close dialog after 2 seconds to show success message
      setTimeout(() => {
        setIsFlushDialogOpen(false);
        setFlushResult(null);
      }, 2000);

      // Refetch stats to show updated data
      await refetch();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to flush DNS cache. Please try again.';
      onFlushError?.(errorMessage);
    }
  }, [deviceId, flushCacheMutation, onFlushSuccess, onFlushError, refetch]);

  /**
   * Format bytes to human-readable format (B, KB, MB, GB)
   * Memoized for performance across re-renders
   */
  const formatBytes = useCallback((bytes: number): string => {
    if (bytes === 0) return '0 B';
    const BYTE_UNIT = 1024;
    const UNITS = ['B', 'KB', 'MB', 'GB'];
    const exponent = Math.floor(Math.log(bytes) / Math.log(BYTE_UNIT));
    return `${Math.round((bytes / Math.pow(BYTE_UNIT, exponent)) * 100) / 100} ${UNITS[exponent]}`;
  }, []);

  // Memoize computed values
  const cacheUsedFormatted = useMemo(
    () => (cacheStats ? formatBytes(cacheStats.cacheUsedBytes) : 'N/A'),
    [cacheStats, formatBytes]
  );

  const cacheMaxFormatted = useMemo(
    () => (cacheStats ? formatBytes(cacheStats.cacheMaxBytes) : 'N/A'),
    [cacheStats, formatBytes]
  );

  const hitRateFormatted = useMemo(
    () => (cacheStats?.hitRatePercent ? `${cacheStats.hitRatePercent.toFixed(1)}%` : 'N/A'),
    [cacheStats?.hitRatePercent]
  );

  return {
    // Loading & Error States
    isLoading: statsLoading,
    isFlushing: flushLoading,
    isError: !!statsError,
    isFlushDialogOpen,

    // Data
    cacheStats: cacheStats as DnsCacheStats | undefined,
    flushResult,
    error: statsError?.message,

    // Computed Formatted Values
    cacheUsedFormatted,
    cacheMaxFormatted,
    hitRateFormatted,

    // Action Handlers
    openFlushDialog: handleOpenFlushDialog,
    closeFlushDialog: handleCloseFlushDialog,
    confirmFlush: handleConfirmFlush,
    refetch,
  };
}
