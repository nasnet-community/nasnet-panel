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
export declare function useServiceLogFile(routerId: string, instanceId: string, maxLines?: number, enabled?: boolean): {
    logFile: ServiceLogFile | undefined;
    loading: boolean;
    error: import("@apollo/client").ApolloError | undefined;
    refetch: (variables?: Partial<import("@apollo/client").OperationVariables> | undefined) => Promise<import("@apollo/client").ApolloQueryResult<any>>;
};
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
export declare function useServiceLogsSubscription(routerId: string, instanceId: string, levelFilter?: LogLevel, enabled?: boolean): {
    logEntry: LogEntry | undefined;
    loading: boolean;
    error: import("@apollo/client").ApolloError | undefined;
};
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
export declare function useServiceLogs(routerId: string, instanceId: string, maxLines?: number, levelFilter?: LogLevel, enabled?: boolean): {
    logFile: ServiceLogFile | undefined;
    newLogEntry: LogEntry | undefined;
    loading: boolean;
    error: import("@apollo/client").ApolloError | undefined;
    refetch: (variables?: Partial<import("@apollo/client").OperationVariables> | undefined) => Promise<import("@apollo/client").ApolloQueryResult<any>>;
};
//# sourceMappingURL=useServiceLogs.d.ts.map