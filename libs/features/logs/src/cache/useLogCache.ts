/**
 * React hook for log caching
 * Epic 0.8: System Logs - Local Log Caching
 */

import * as React from 'react';
import type { LogEntry } from '@nasnet/core/types';
import { getLogCache, type CachedLogEntry, type LogCacheConfig } from './logCache';

export interface UseLogCacheOptions {
  routerIp: string;
  config?: Partial<LogCacheConfig>;
  enabled?: boolean;
}

export interface UseLogCacheReturn {
  cachedLogs: CachedLogEntry[];
  isLoading: boolean;
  isOffline: boolean;
  cacheStats: {
    totalEntries: number;
    oldestEntry: Date | null;
    newestEntry: Date | null;
  } | null;
  storeLogs: (logs: LogEntry[]) => Promise<void>;
  clearCache: () => Promise<void>;
  refreshCache: () => Promise<void>;
}

/**
 * Hook for managing log cache operations
 */
export function useLogCache({
  routerIp,
  config,
  enabled = true,
}: UseLogCacheOptions): UseLogCacheReturn {
  const [cachedLogs, setCachedLogs] = React.useState<CachedLogEntry[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isOffline, setIsOffline] = React.useState(!navigator.onLine);
  const [cacheStats, setCacheStats] = React.useState<UseLogCacheReturn['cacheStats']>(null);

  const cache = React.useMemo(() => getLogCache(config), [config]);

  // Monitor online/offline status
  React.useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Load cached logs on mount and when offline
  const refreshCache = React.useCallback(async () => {
    if (!enabled || !routerIp) return;

    setIsLoading(true);
    try {
      const logs = await cache.getLogs(routerIp);
      setCachedLogs(logs);

      const stats = await cache.getStats();
      setCacheStats(stats);
    } catch (error) {
      console.error('[useLogCache] Failed to load cached logs:', error);
    } finally {
      setIsLoading(false);
    }
  }, [cache, routerIp, enabled]);

  // Initial load
  React.useEffect(() => {
    refreshCache();
  }, [refreshCache]);

  // Cleanup expired entries on mount
  React.useEffect(() => {
    if (enabled) {
      cache.cleanupExpired().catch((error) => {
        console.error('[useLogCache] Failed to cleanup expired entries:', error);
      });
    }
  }, [cache, enabled]);

  // Store logs in cache
  const storeLogs = React.useCallback(
    async (logs: LogEntry[]) => {
      if (!enabled || !routerIp || logs.length === 0) return;

      try {
        await cache.storeLogs(routerIp, logs);
        // Refresh cache stats
        const stats = await cache.getStats();
        setCacheStats(stats);
      } catch (error) {
        console.error('[useLogCache] Failed to store logs:', error);
      }
    },
    [cache, routerIp, enabled]
  );

  // Clear all cached logs
  const clearCache = React.useCallback(async () => {
    try {
      await cache.clearAll();
      setCachedLogs([]);
      setCacheStats({ totalEntries: 0, oldestEntry: null, newestEntry: null });
    } catch (error) {
      console.error('[useLogCache] Failed to clear cache:', error);
    }
  }, [cache]);

  return {
    cachedLogs,
    isLoading,
    isOffline,
    cacheStats,
    storeLogs,
    clearCache,
    refreshCache,
  };
}







