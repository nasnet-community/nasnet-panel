/**
 * Headless hook for log streaming in dashboard widget
 * Wraps existing useSystemLogs with TanStack Query polling for real-time updates
 * Story NAS-5.6: Recent Logs with Filtering
 */
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
export declare function useLogStream(config: UseLogStreamConfig): UseLogStreamReturn;
//# sourceMappingURL=useLogStream.d.ts.map