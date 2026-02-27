/**
 * TanStack Query hook for fetching system logs
 * Provides caching, auto-refresh, and filtering for RouterOS logs
 * Stories 0-8-1: Log Viewer, 0-8-4: Log Auto-Refresh
 * Uses rosproxy backend for RouterOS API communication
 */
import { UseQueryResult } from '@tanstack/react-query';
import type { LogEntry, LogTopic, LogSeverity } from '@nasnet/core/types';
/**
 * Options for useSystemLogs hook
 */
export interface UseSystemLogsOptions {
  /**
   * Filter by specific topics (empty = all topics)
   */
  topics?: LogTopic[];
  /**
   * Filter by specific severities (empty = all severities)
   */
  severities?: LogSeverity[];
  /**
   * Maximum number of log entries to fetch
   * @default 100
   */
  limit?: number;
  /**
   * Auto-refresh interval in milliseconds
   * @default undefined (no auto-refresh for Story 0.8.1)
   */
  refetchInterval?: number;
}
/**
 * React Query hook for system logs
 *
 * @param routerIp - Target router IP address
 * @param options - Configuration for log fetching and filtering
 * @returns Query result with log entries, loading state, and error
 *
 * @example
 * ```tsx
 * function LogViewer() {
 *   const routerIp = useConnectionStore(state => state.currentRouterIp);
 *   const { data: logs, isLoading, error } = useSystemLogs(routerIp || '', { limit: 100 });
 *
 *   if (isLoading) return <LogSkeleton />;
 *   if (error) return <ErrorState error={error} />;
 *
 *   return logs.map(log => <LogEntry key={log.id} entry={log} />);
 * }
 * ```
 */
export declare function useSystemLogs(
  routerIp: string,
  options?: UseSystemLogsOptions
): UseQueryResult<LogEntry[], Error>;
//# sourceMappingURL=useSystemLogs.d.ts.map
