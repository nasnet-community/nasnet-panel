/**
 * useServiceLogViewer Hook
 *
 * Headless hook containing all business logic for ServiceLogViewer.
 * Implements 1000-line ring buffer with level filtering and search.
 *
 * @see NAS-8.12: Service Logs & Diagnostics
 */
import { type LogLevel, type LogEntry } from '@nasnet/api-client/queries';
/**
 * Props for ServiceLogViewer component
 */
export interface ServiceLogViewerProps {
    /** Router ID */
    routerId: string;
    /** Service instance ID */
    instanceId: string;
    /** Initial number of historical lines to fetch (default 100) */
    maxHistoricalLines?: number;
    /** Whether to enable auto-scroll to bottom (default: true) */
    autoScroll?: boolean;
    /** Callback when user clicks a log entry */
    onEntryClick?: (entry: LogEntry) => void;
    /** Additional CSS class */
    className?: string;
}
/**
 * Return type for useServiceLogViewer hook
 */
export interface UseServiceLogViewerReturn {
    logEntries: LogEntry[];
    totalEntries: number;
    levelFilter: LogLevel | null;
    setLevelFilter: (level: LogLevel | null) => void;
    filteredEntries: LogEntry[];
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    searchResults: LogEntry[];
    hasSearch: boolean;
    isLoading: boolean;
    error: Error | undefined;
    clearLogs: () => void;
    refreshLogs: () => void;
    copyToClipboard: () => Promise<void>;
    autoScroll: boolean;
    setAutoScroll: (enabled: boolean) => void;
    scrollToBottom: () => void;
    levelCounts: Record<LogLevel, number>;
}
/**
 * Headless hook for ServiceLogViewer
 *
 * Features:
 * - 1000-line ring buffer (oldest entries discarded)
 * - Real-time log streaming via subscription
 * - Level filtering (DEBUG, INFO, WARN, ERROR)
 * - Text search across log messages
 * - Auto-scroll to bottom on new entries
 * - Copy all visible logs to clipboard
 *
 * @description Manages log buffer, filtering, search, and level counts with memoized computations
 */
export declare function useServiceLogViewer(props: ServiceLogViewerProps): UseServiceLogViewerReturn;
/**
 * Format timestamp for log display
 * @description Converts ISO timestamp to HH:MM:SS.fff format
 */
export declare function formatLogTimestamp(timestamp: string): string;
/**
 * Get semantic color class for log level text
 * @description Returns semantic color token for log level display
 */
export declare function getLogLevelColor(level: LogLevel): string;
/**
 * Get semantic background color class for log level
 * @description Returns semantic background token for log level highlight
 */
export declare function getLogLevelBgColor(level: LogLevel): string;
//# sourceMappingURL=useServiceLogViewer.d.ts.map