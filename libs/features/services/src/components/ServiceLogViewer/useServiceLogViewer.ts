/**
 * useServiceLogViewer Hook
 *
 * Headless hook containing all business logic for ServiceLogViewer.
 * Implements 1000-line ring buffer with level filtering and search.
 *
 * @see NAS-8.12: Service Logs & Diagnostics
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useServiceLogs, type LogLevel, type LogEntry } from '@nasnet/api-client/queries';

const MAX_BUFFER_SIZE = 1000;

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
  // Log buffer (ring buffer with max 1000 entries)
  logEntries: LogEntry[];

  // Total number of entries in buffer
  totalEntries: number;

  // Filtering
  levelFilter: LogLevel | null;
  setLevelFilter: (level: LogLevel | null) => void;
  filteredEntries: LogEntry[];

  // Search
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  searchResults: LogEntry[];
  hasSearch: boolean;

  // Loading state
  isLoading: boolean;
  error: Error | undefined;

  // Actions
  clearLogs: () => void;
  refreshLogs: () => void;
  copyToClipboard: () => Promise<void>;

  // Auto-scroll management
  autoScroll: boolean;
  setAutoScroll: (enabled: boolean) => void;
  scrollToBottom: () => void;

  // Level counts for filter UI
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
export function useServiceLogViewer(props: ServiceLogViewerProps): UseServiceLogViewerReturn {
  const {
    routerId,
    instanceId,
    maxHistoricalLines = 100,
    autoScroll: initialAutoScroll = true,
  } = props;

  // Ring buffer for log entries (max 1000 lines)
  const [logBuffer, setLogBuffer] = useState<LogEntry[]>([]);

  // Filtering and search
  const [levelFilter, setLevelFilter] = useState<LogLevel | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [autoScroll, setAutoScroll] = useState(initialAutoScroll);

  // Scroll container ref (set by presenter)
  const scrollContainerRef = useRef<HTMLElement | null>(null);

  // Fetch historical logs + subscribe to real-time updates
  const { logFile, newLogEntry, loading, error, refetch } = useServiceLogs(
    routerId,
    instanceId,
    maxHistoricalLines
  );

  // Initialize buffer with historical logs
  useEffect(() => {
    if (logFile?.entries) {
      setLogBuffer(logFile.entries);
    }
  }, [logFile]);

  // Add new log entries to ring buffer
  useEffect(() => {
    if (newLogEntry) {
      setLogBuffer((prev) => {
        const updated = [...prev, newLogEntry];
        // Keep only last 1000 entries (ring buffer)
        if (updated.length > MAX_BUFFER_SIZE) {
          return updated.slice(updated.length - MAX_BUFFER_SIZE);
        }
        return updated;
      });
    }
  }, [newLogEntry]);

  // Filter entries by log level
  const filteredEntries = useMemo(() => {
    if (!levelFilter) {
      return logBuffer;
    }
    return logBuffer.filter((entry) => entry.level === levelFilter);
  }, [logBuffer, levelFilter]);

  // Search within filtered entries
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) {
      return filteredEntries;
    }
    const query = searchQuery.toLowerCase();
    return filteredEntries.filter(
      (entry) =>
        entry.message.toLowerCase().includes(query) ||
        entry.source.toLowerCase().includes(query) ||
        entry.rawLine.toLowerCase().includes(query)
    );
  }, [filteredEntries, searchQuery]);

  // Calculate level counts for filter UI
  const levelCounts = useMemo(() => {
    const counts: Record<LogLevel, number> = {
      DEBUG: 0,
      INFO: 0,
      WARN: 0,
      ERROR: 0,
      UNKNOWN: 0,
    };
    logBuffer.forEach((entry) => {
      counts[entry.level]++;
    });
    return counts;
  }, [logBuffer]);

  // Clear log buffer
  const clearLogs = useCallback(() => {
    setLogBuffer([]);
  }, []);

  // Refresh logs from server
  const refreshLogs = useCallback(() => {
    refetch();
  }, [refetch]);

  // Copy visible logs to clipboard
  const copyToClipboard = useCallback(async () => {
    const visibleLogs = searchResults
      .map((entry) => {
        const timestamp = new Date(entry.timestamp).toISOString();
        return `[${timestamp}] [${entry.level}] [${entry.source}] ${entry.message}`;
      })
      .join('\n');

    try {
      await navigator.clipboard.writeText(visibleLogs);
    } catch (err) {
      console.error('Failed to copy logs to clipboard:', err);
      throw err;
    }
  }, [searchResults]);

  // Scroll to bottom (called by presenter)
  const scrollToBottom = useCallback(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, []);

  // Auto-scroll on new entries
  useEffect(() => {
    if (autoScroll && newLogEntry) {
      scrollToBottom();
    }
  }, [autoScroll, newLogEntry, scrollToBottom]);

  return {
    logEntries: logBuffer,
    totalEntries: logBuffer.length,
    levelFilter,
    setLevelFilter,
    filteredEntries,
    searchQuery,
    setSearchQuery,
    searchResults,
    hasSearch: searchQuery.trim().length > 0,
    isLoading: loading,
    error,
    clearLogs,
    refreshLogs,
    copyToClipboard,
    autoScroll,
    setAutoScroll,
    scrollToBottom,
    levelCounts,
  };
}

/**
 * Format timestamp for log display
 * @description Converts ISO timestamp to HH:MM:SS.fff format
 */
export function formatLogTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    fractionalSecondDigits: 3,
  } as Intl.DateTimeFormatOptions);
}

/**
 * Get semantic color class for log level text
 * @description Returns semantic color token for log level display
 */
export function getLogLevelColor(level: LogLevel): string {
  switch (level) {
    case 'DEBUG':
      return 'text-muted-foreground';
    case 'INFO':
      return 'text-info';
    case 'WARN':
      return 'text-warning';
    case 'ERROR':
      return 'text-destructive';
    case 'UNKNOWN':
    default:
      return 'text-muted-foreground';
  }
}

/**
 * Get semantic background color class for log level
 * @description Returns semantic background token for log level highlight
 */
export function getLogLevelBgColor(level: LogLevel): string {
  switch (level) {
    case 'DEBUG':
      return 'bg-muted/30';
    case 'INFO':
      return 'bg-info/10';
    case 'WARN':
      return 'bg-warning/10';
    case 'ERROR':
      return 'bg-destructive/10';
    case 'UNKNOWN':
    default:
      return 'bg-muted/30';
  }
}
