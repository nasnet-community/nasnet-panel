/**
 * Headless hook for log streaming in dashboard widget
 * Wraps existing useSystemLogs with TanStack Query polling for real-time updates
 * Story NAS-5.6: Recent Logs with Filtering
 */

import { useMemo } from 'react';

import { useSystemLogs } from '@nasnet/api-client/queries';
import { useConnectionStore } from '@nasnet/state/stores';

import { MAX_VISIBLE_LOGS, POLLING_INTERVAL_MS } from './constants';

import type { UseLogStreamConfig, UseLogStreamReturn } from './types';

/**
 * Hook for streaming logs with real-time updates
 * Uses TanStack Query with polling for automatic refresh
 * Limits to max 10 entries for dashboard widget
 *
 * @param config - Configuration with deviceId, topics, maxEntries
 * @returns Logs, loading state, error, and refetch function
 *
 * @example
 * ```tsx
 * const { logs, loading, error } = useLogStream({
 *   deviceId: 'router-1',
 *   topics: ['firewall', 'system'],
 *   maxEntries: 10
 * });
 * ```
 */
export function useLogStream(config: UseLogStreamConfig): UseLogStreamReturn {
  const { deviceId, topics, maxEntries = MAX_VISIBLE_LOGS } = config;

  // Get router IP from connection store (deviceId may be the IP or we need to resolve it)
  const routerIp = useConnectionStore((state) => state.currentRouterIp) || deviceId;

  // Use existing TanStack Query hook with polling for real-time updates
  const {
    data: logs = [],
    isLoading: loading,
    error,
    refetch,
  } = useSystemLogs(routerIp, {
    topics: topics.length > 0 ? topics : undefined,
    limit: maxEntries,
    refetchInterval: POLLING_INTERVAL_MS, // 5-second polling for real-time updates
  });

  // Ensure logs are sorted newest first and limited to maxEntries
  const sortedLogs = useMemo(() => {
    return [...logs]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, maxEntries);
  }, [logs, maxEntries]);

  return {
    logs: sortedLogs,
    loading,
    error: error ? (error as Error) : null,
    refetch,
    totalCount: logs.length,
    hasMore: logs.length > maxEntries,
  };
}
