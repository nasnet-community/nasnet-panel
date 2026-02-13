/**
 * DNS Cache Panel - Headless Hook
 * NAS-6.12: DNS Cache & Diagnostics - Task 6.2
 *
 * Provides DNS cache statistics and flush logic using Apollo Client.
 */

import { useCallback, useState } from 'react';
import { useDnsCacheStats, useFlushDnsCache } from '@nasnet/api-client/queries';
import type { DnsCacheStats, FlushDnsCacheResult } from './types';

interface UseDnsCachePanelOptions {
  deviceId: string;
  enablePolling?: boolean;
  onFlushSuccess?: (result: FlushDnsCacheResult) => void;
  onFlushError?: (error: string) => void;
}

export function useDnsCachePanel({
  deviceId,
  enablePolling = true,
  onFlushSuccess,
  onFlushError,
}: UseDnsCachePanelOptions) {
  const [isFlushDialogOpen, setIsFlushDialogOpen] = useState(false);
  const [flushResult, setFlushResult] = useState<FlushDnsCacheResult | null>(null);

  // Query cache stats with polling
  const { cacheStats, loading: statsLoading, error: statsError, refetch } = useDnsCacheStats(
    deviceId,
    enablePolling
  );

  // Mutation for flushing cache
  const [flushCacheMutation, { loading: flushLoading }] = useFlushDnsCache();

  const openFlushDialog = useCallback(() => {
    setIsFlushDialogOpen(true);
    setFlushResult(null);
  }, []);

  const closeFlushDialog = useCallback(() => {
    setIsFlushDialogOpen(false);
  }, []);

  const confirmFlush = useCallback(async () => {
    try {
      const { data, errors } = await flushCacheMutation({
        variables: { deviceId },
      });

      if (errors || !data?.flushDnsCache) {
        const errorMessage = errors?.[0]?.message || 'Failed to flush DNS cache';
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
      const errorMessage = err instanceof Error ? err.message : 'Failed to flush DNS cache';
      onFlushError?.(errorMessage);
    }
  }, [deviceId, flushCacheMutation, onFlushSuccess, onFlushError, refetch]);

  const formatBytes = useCallback((bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${Math.round((bytes / Math.pow(k, i)) * 100) / 100} ${sizes[i]}`;
  }, []);

  return {
    // State
    isLoading: statsLoading,
    isFlushing: flushLoading,
    isError: !!statsError,
    isFlushDialogOpen,

    // Data
    cacheStats: cacheStats as DnsCacheStats | undefined,
    flushResult,
    error: statsError?.message,

    // Computed
    cacheUsedFormatted: cacheStats ? formatBytes(cacheStats.cacheUsedBytes) : 'N/A',
    cacheMaxFormatted: cacheStats ? formatBytes(cacheStats.cacheMaxBytes) : 'N/A',
    hitRateFormatted: cacheStats?.hitRatePercent ? `${cacheStats.hitRatePercent.toFixed(1)}%` : 'N/A',

    // Actions
    openFlushDialog,
    closeFlushDialog,
    confirmFlush,
    refetch,
  };
}
