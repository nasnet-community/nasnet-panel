/**
 * Headless hook for log streaming in dashboard widget
 * Wraps existing useSystemLogs with TanStack Query polling for real-time updates
 * Story NAS-5.6: Recent Logs with Filtering
 */

import { useMemo, useEffect } from 'react';

import { useSystemLogs } from '@nasnet/api-client/queries';
import { useConnectionStore } from '@nasnet/state/stores';

import { MAX_VISIBLE_LOGS, POLLING_INTERVAL_MS } from './constants';

import type { UseLogStreamConfig, UseLogStreamReturn } from './types';

/**
 * Hook for streaming logs with real-time updates and topic filtering
 *
 * @description
 * Provides a live log stream for dashboard widgets using TanStack Query polling.
 * Automatically resolves router IP from connection store, handles topic filtering,
 * and maintains sorted order (newest first). Polling interval defaults to 5 seconds
 * for real-time feel without overwhelming the backend. Automatically cleans up
 * polling subscription on unmount.
 *
 * **Performance:** Limits visible entries to 10 for dashboard (configurable).
 * Logs are sorted and memoized to prevent unnecessary re-renders.
 *
 * **Accessibility:** Use the `hasMore` flag to show indicators when more logs exist,
 * encouraging users to navigate to the full logs page for complete log history.
 *
 * @param config - Configuration object with deviceId, topics, and maxEntries
 * @returns Object containing logs array, loading state, error, refetch function,
 *          total count, and hasMore flag
 *
 * @example
 * ```tsx
 * const { logs, loading, error, refetch } = useLogStream({
 *   deviceId: routerId,
 *   topics: ['firewall', 'system'],
 *   maxEntries: 10
 * });
 *
 * return (
 *   <div>
 *     {loading && <Skeleton />}
 *     {error && <ErrorMessage error={error} onRetry={refetch} />}
 *     {logs.map(log => <LogEntryItem key={log.id} entry={log} />)}
 *     {hasMore && <Link to="/logs">View all logs →</Link>}
 *   </div>
 * );
 * ```
 *
 * @param config.deviceId - Router device ID or IP address
 * @param config.topics - Log topics to filter by (empty = all topics)
 * @param config.maxEntries - Maximum entries to display (default: 10)
 *
 * @see useSystemLogs for underlying GraphQL query hook
 * @see MAX_VISIBLE_LOGS for default maximum entries
 * @see POLLING_INTERVAL_MS for default polling interval (5 seconds)
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

  // Cleanup: polling will be automatically stopped when component unmounts
  // via TanStack Query's automatic cleanup of inactive queries
  useEffect(() => {
    return () => {
      // No explicit cleanup needed - useSystemLogs handles subscription lifecycle
    };
  }, []);

  return {
    logs: sortedLogs,
    loading,
    error: error ? (error as Error) : null,
    refetch,
    totalCount: logs.length,
    hasMore: logs.length > maxEntries,
  };
}
