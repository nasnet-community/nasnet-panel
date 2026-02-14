import { useQuery, useSubscription } from '@apollo/client';
import {
  GET_SERVICE_LOG_FILE,
  SUBSCRIBE_SERVICE_LOGS,
} from './logs-diagnostics.graphql';

/**
 * Log level for filtering
 */
export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'UNKNOWN';

/**
 * Single log entry from a service instance
 */
export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  source: string;
  rawLine: string;
  metadata?: Record<string, unknown>;
}

/**
 * Service log file with metadata
 */
export interface ServiceLogFile {
  instanceID: string;
  serviceName: string;
  filePath: string;
  sizeBytes: number;
  lineCount: number;
  entries: LogEntry[];
  createdAt: string;
  lastUpdated: string;
}

/**
 * Hook to fetch service log file with recent entries
 *
 * Retrieves the last N lines from a service instance's log file.
 * Use this to display historical logs in the log viewer.
 *
 * @param routerId - Router ID
 * @param instanceId - Service instance ID
 * @param maxLines - Maximum number of lines to return (default 100)
 * @param enabled - Whether to enable the query (default: true)
 * @returns Log file data, loading state, and error
 *
 * @example
 * ```tsx
 * const { logFile, loading, error, refetch } = useServiceLogFile('router-1', 'instance-1', 100);
 *
 * if (logFile) {
 *   logFile.entries.forEach(entry => {
 *     console.log(`[${entry.level}] ${entry.message}`);
 *   });
 * }
 * ```
 */
export function useServiceLogFile(
  routerId: string,
  instanceId: string,
  maxLines: number = 100,
  enabled: boolean = true
) {
  const { data, loading, error, refetch } = useQuery(GET_SERVICE_LOG_FILE, {
    variables: { routerID: routerId, instanceID: instanceId, maxLines },
    skip: !enabled || !routerId || !instanceId,
    pollInterval: 0, // Use subscription for real-time updates
    fetchPolicy: 'cache-and-network',
  });

  return {
    logFile: data?.serviceLogFile as ServiceLogFile | undefined,
    loading,
    error,
    refetch,
  };
}

/**
 * Hook to subscribe to real-time log stream for a service instance
 *
 * Monitors live log output from a running service instance.
 * Emits new log entries as they are generated.
 * Use this to display real-time logs with automatic updates.
 *
 * @param routerId - Router ID
 * @param instanceId - Service instance ID
 * @param levelFilter - Optional log level filter (e.g., 'ERROR' to show only errors)
 * @param enabled - Whether to enable the subscription (default: true)
 * @returns Log entry data, loading state, and error
 *
 * @example
 * ```tsx
 * const { logEntry, loading, error } = useServiceLogsSubscription(
 *   'router-1',
 *   'instance-1',
 *   'ERROR' // Only show error logs
 * );
 *
 * useEffect(() => {
 *   if (logEntry) {
 *     // Add new log entry to UI
 *     appendToLogViewer(logEntry);
 *   }
 * }, [logEntry]);
 * ```
 */
export function useServiceLogsSubscription(
  routerId: string,
  instanceId: string,
  levelFilter?: LogLevel,
  enabled: boolean = true
) {
  const { data, loading, error } = useSubscription(SUBSCRIBE_SERVICE_LOGS, {
    variables: {
      routerID: routerId,
      instanceID: instanceId,
      levelFilter: levelFilter || null,
    },
    skip: !enabled || !routerId || !instanceId,
    onData: ({ data }) => {
      if (data.data?.serviceLogs) {
        const logEntry = data.data.serviceLogs;
        // Apollo Client automatically updates the cache
        // Additional side effects can be added here (e.g., notifications for errors)
        if (logEntry.level === 'ERROR') {
          console.error(`[${logEntry.source}] ${logEntry.message}`);
        }
      }
    },
  });

  return {
    logEntry: data?.serviceLogs as LogEntry | undefined,
    loading,
    error,
  };
}

/**
 * Combined hook for comprehensive log monitoring
 *
 * Fetches historical logs and subscribes to real-time updates.
 * Use this when you need both initial log state and live streaming.
 *
 * @param routerId - Router ID
 * @param instanceId - Service instance ID
 * @param maxLines - Maximum historical lines to fetch (default 100)
 * @param levelFilter - Optional log level filter for subscription
 * @param enabled - Whether to enable both query and subscription (default: true)
 * @returns Combined log data, loading state, and error
 *
 * @example
 * ```tsx
 * const {
 *   logFile,
 *   newLogEntry,
 *   loading,
 *   error,
 *   refetch
 * } = useServiceLogs('router-1', 'instance-1');
 *
 * // Display historical logs from logFile.entries
 * // Append new entries from newLogEntry in real-time
 * ```
 */
export function useServiceLogs(
  routerId: string,
  instanceId: string,
  maxLines: number = 100,
  levelFilter?: LogLevel,
  enabled: boolean = true
) {
  const {
    logFile,
    loading: fileLoading,
    error: fileError,
    refetch,
  } = useServiceLogFile(routerId, instanceId, maxLines, enabled);

  const {
    logEntry: newLogEntry,
    loading: subscriptionLoading,
    error: subscriptionError,
  } = useServiceLogsSubscription(routerId, instanceId, levelFilter, enabled);

  return {
    logFile,
    newLogEntry,
    loading: fileLoading || subscriptionLoading,
    error: fileError || subscriptionError,
    refetch,
  };
}
