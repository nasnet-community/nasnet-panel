/**
 * TypeScript types for RecentLogs dashboard widget
 * Story NAS-5.6: Recent Logs with Filtering
 */
import type { LogEntry, LogTopic } from '@nasnet/core/types';
/**
 * Configuration for useLogStream hook
 *
 * @description
 * Configures log streaming behavior including device, topic filters, and maximum entries.
 */
export interface UseLogStreamConfig {
    /** Router device ID or IP address to fetch logs from */
    deviceId: string;
    /** Log topics to filter by (empty array = show all) */
    topics: LogTopic[];
    /** Maximum number of log entries to keep in stream (default: 10) */
    maxEntries?: number;
}
/**
 * Return value from useLogStream hook
 *
 * @description
 * Provides logs array, loading/error states, and refetch function for manual refresh.
 */
export interface UseLogStreamReturn {
    /** Array of filtered and sorted log entries */
    logs: LogEntry[];
    /** Whether logs are currently being fetched */
    loading: boolean;
    /** Error object if fetch failed, null otherwise */
    error: Error | null;
    /** Manual refetch function to request fresh logs */
    refetch: () => void;
    /** Total number of logs available (before maxEntries limit) */
    totalCount: number;
    /** Whether more logs are available beyond maxEntries limit */
    hasMore: boolean;
}
/**
 * Props for LogEntryItem component
 *
 * @description
 * Defines props for individual log entry display with optional highlighting and compact mode.
 */
export interface LogEntryItemProps {
    /** Log entry data to display */
    entry: LogEntry;
    /** Triggers highlight animation (default: false) */
    isNew?: boolean;
    /** Single-line text truncation for mobile (default: false) */
    compact?: boolean;
}
/**
 * Props for TopicFilter component
 *
 * @description
 * Multi-select filter component for log topics with WCAG AAA accessibility.
 */
export interface TopicFilterProps {
    /** Currently selected topic filters */
    selectedTopics: LogTopic[];
    /** Callback invoked when topic selection changes */
    onSelectionChange: (topics: LogTopic[]) => void;
    /** Optional CSS class for custom styling */
    className?: string;
}
/**
 * Props for RecentLogs component
 *
 * @description
 * Dashboard widget for displaying recent log entries with optional filtering.
 */
export interface RecentLogsProps {
    /** Router device ID or IP address */
    deviceId: string;
    /** Optional CSS class for custom styling */
    className?: string;
}
/**
 * Props for RecentLogsSkeleton component
 *
 * @description
 * Loading skeleton placeholder for RecentLogs widget.
 */
export interface RecentLogsSkeletonProps {
    /** Optional CSS class for custom styling */
    className?: string;
}
//# sourceMappingURL=types.d.ts.map