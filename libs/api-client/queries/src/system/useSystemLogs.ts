/**
 * TanStack Query hook for fetching system logs
 * Provides caching, auto-refresh, and filtering for RouterOS logs
 * Stories 0-8-1: Log Viewer, 0-8-4: Log Auto-Refresh
 * Uses rosproxy backend for RouterOS API communication
 */

import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { makeRouterOSRequest } from '@nasnet/api-client/core';
import type { LogEntry, LogTopic, LogSeverity } from '@nasnet/core/types';
import { systemKeys } from './queryKeys';

/**
 * RouterOS log API response format
 */
interface RouterOSLogEntry {
  '.id': string;
  time: string; // RouterOS timestamp format
  topics: string; // Comma-separated topics
  message: string;
}

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
 * Fetches system logs from RouterOS via rosproxy
 * Transforms RouterOS API response to LogEntry type
 */
async function fetchSystemLogs(
  routerIp: string,
  options: UseSystemLogsOptions = {}
): Promise<LogEntry[]> {
  const { topics, severities, limit = 100 } = options;

  // Build query params
  const params = new URLSearchParams();
  if (limit) params.append('limit', limit.toString());
  if (topics && topics.length > 0) {
    params.append('topics', topics.join(','));
  }
  if (severities && severities.length > 0) {
    params.append('severities', severities.join(','));
  }

  const endpoint = `log${params.toString() ? `?${params.toString()}` : ''}`;
  const result = await makeRouterOSRequest<RouterOSLogEntry[]>(routerIp, endpoint);

  if (!result.success || !result.data) {
    throw new Error(result.error || 'Failed to fetch system logs');
  }

  // Transform RouterOS response to LogEntry format
  return result.data.map((entry: RouterOSLogEntry) => transformLogEntry(entry));
}

/**
 * Transforms RouterOS log entry to our LogEntry type
 */
function transformLogEntry(rosEntry: RouterOSLogEntry): LogEntry {
  // Parse timestamp - RouterOS returns ISO-8601 or unix timestamp
  const timestamp = parseRouterOSTimestamp(rosEntry.time);

  // Parse topics and extract primary topic and severity
  const { topic, severity } = parseTopics(rosEntry.topics);

  return {
    id: rosEntry['.id'],
    timestamp,
    topic,
    severity,
    message: rosEntry.message,
  };
}

/**
 * Parses RouterOS timestamp to Date object
 * Supports ISO-8601 and unix timestamp formats
 */
function parseRouterOSTimestamp(timeStr: string): Date {
  // Try parsing as ISO-8601 first
  const isoDate = new Date(timeStr);
  if (!isNaN(isoDate.getTime())) {
    return isoDate;
  }

  // Try parsing as unix timestamp
  const unixTimestamp = parseInt(timeStr, 10);
  if (!isNaN(unixTimestamp)) {
    return new Date(unixTimestamp * 1000);
  }

  // Fallback to current time if parsing fails
  console.warn('[parseRouterOSTimestamp] Failed to parse:', timeStr);
  return new Date();
}

/**
 * Parses comma-separated topics string to extract primary topic and severity
 * RouterOS topics format: "system,info" or "firewall,warning"
 */
function parseTopics(topicsStr: string): {
  topic: LogTopic;
  severity: LogSeverity;
} {
  const topics = topicsStr.split(',').map((t) => t.trim());

  // Common severity levels in topics
  const severityValues: LogSeverity[] = [
    'debug',
    'info',
    'warning',
    'error',
    'critical',
  ];
  const severity: LogSeverity =
    (topics.find((t) => severityValues.includes(t as LogSeverity)) as
      | LogSeverity
      | undefined) || 'info';

  // Valid topic values (excluding severities)
  const topicValues: LogTopic[] = [
    'system',
    'firewall',
    'wireless',
    'dhcp',
    'dns',
    'ppp',
    'vpn',
    'interface',
    'route',
    'script',
    'critical',
    'info',
    'warning',
    'error',
  ];
  const topic: LogTopic =
    (topics.find((t) => topicValues.includes(t as LogTopic)) as
      | LogTopic
      | undefined) || 'system';

  return { topic, severity };
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
export function useSystemLogs(
  routerIp: string,
  options: UseSystemLogsOptions = {}
): UseQueryResult<LogEntry[], Error> {
  return useQuery({
    queryKey: systemKeys.logs(routerIp, options),
    queryFn: () => fetchSystemLogs(routerIp, options),
    staleTime: 5_000, // 5 seconds - logs are time-sensitive
    refetchInterval: options.refetchInterval,
    refetchIntervalInBackground: false, // Pause polling when tab is hidden (AC-7)
    refetchOnWindowFocus: true, // Immediate refetch when tab becomes visible (AC-8)
    retry: 2,
    // Keep previous data during filter transitions for smooth UI
    placeholderData: (previousData) => previousData,
    enabled: !!routerIp, // Only fetch if router IP is provided
  });
}
