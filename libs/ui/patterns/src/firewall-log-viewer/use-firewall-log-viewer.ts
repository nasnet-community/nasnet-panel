/**
 * Headless useFirewallLogViewer Hook
 *
 * Manages complete state for firewall log viewer including:
 * - Filter state with debouncing
 * - Auto-refresh control
 * - Log selection for detail view
 * - CSV export
 * - Virtualization support
 *
 * @module @nasnet/ui/patterns/firewall-log-viewer
 */

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useFirewallLogs, type FirewallLogFilters } from '@nasnet/api-client/queries';
import type { FirewallLogEntry, InferredAction } from '@nasnet/core/types';
import { exportLogsToCSV } from '@nasnet/core-utils';

// ============================================================================
// Types
// ============================================================================

/**
 * Sort options for log viewer
 */
export type SortField = 'timestamp' | 'action' | 'srcIp' | 'dstIp' | 'protocol';
export type SortOrder = 'asc' | 'desc';

/**
 * Auto-refresh interval options (in milliseconds)
 */
export type RefreshInterval = 1000 | 3000 | 5000 | 10000 | 30000 | false;

/**
 * Complete viewer state
 */
export interface FirewallLogViewerState {
  /** Filter state */
  filters: FirewallLogFilters;

  /** Auto-refresh enabled */
  isAutoRefreshEnabled: boolean;

  /** Refresh interval in milliseconds (false = disabled) */
  refreshInterval: RefreshInterval;

  /** Selected log for detail view */
  selectedLog: FirewallLogEntry | null;

  /** Expanded statistics panel */
  expandedStats: boolean;

  /** Sort field */
  sortBy: SortField;

  /** Sort order */
  sortOrder: SortOrder;

  /** Search query (debounced) */
  searchQuery: string;
}

/**
 * Hook options
 */
export interface UseFirewallLogViewerOptions {
  /** Router ID */
  routerId: string;

  /** Initial state override */
  initialState?: Partial<FirewallLogViewerState>;

  /** Debounce delay for text inputs (default: 300ms) */
  debounceDelay?: number;
}

/**
 * Hook return type
 */
export interface UseFirewallLogViewerReturn {
  /** Current state */
  state: FirewallLogViewerState;

  /** Filtered and sorted logs */
  logs: FirewallLogEntry[];

  /** Loading state */
  isLoading: boolean;

  /** Error state */
  error: Error | null;

  /** Selected log */
  selectedLog: FirewallLogEntry | null;

  // Filter actions
  setFilters: (filters: Partial<FirewallLogFilters>) => void;
  clearFilters: () => void;

  // Auto-refresh actions
  toggleAutoRefresh: () => void;
  setRefreshInterval: (interval: RefreshInterval) => void;

  // Selection actions
  selectLog: (log: FirewallLogEntry | null) => void;

  // Stats actions
  toggleStats: () => void;

  // Sort actions
  setSortBy: (field: SortField) => void;
  toggleSortOrder: () => void;

  // Search actions
  setSearchQuery: (query: string) => void;

  // Export actions
  exportToCSV: () => void;

  // Virtualization support
  totalCount: number;
  visibleCount: number;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Default viewer state
 */
const DEFAULT_STATE: FirewallLogViewerState = {
  filters: {},
  isAutoRefreshEnabled: true,
  refreshInterval: 5000,
  selectedLog: null,
  expandedStats: false,
  sortBy: 'timestamp',
  sortOrder: 'desc',
  searchQuery: '',
};

/**
 * Sort logs by field
 */
function sortLogs(
  logs: FirewallLogEntry[],
  sortBy: SortField,
  sortOrder: SortOrder
): FirewallLogEntry[] {
  const sorted = [...logs];

  sorted.sort((a, b) => {
    let aVal: any;
    let bVal: any;

    switch (sortBy) {
      case 'timestamp':
        aVal = a.timestamp.getTime();
        bVal = b.timestamp.getTime();
        break;
      case 'action':
        aVal = a.parsed?.action || 'unknown';
        bVal = b.parsed?.action || 'unknown';
        break;
      case 'srcIp':
        aVal = a.parsed?.srcIp || '';
        bVal = b.parsed?.srcIp || '';
        break;
      case 'dstIp':
        aVal = a.parsed?.dstIp || '';
        bVal = b.parsed?.dstIp || '';
        break;
      case 'protocol':
        aVal = a.parsed?.protocol || '';
        bVal = b.parsed?.protocol || '';
        break;
      default:
        return 0;
    }

    if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  return sorted;
}

/**
 * Filter logs by search query
 */
function filterBySearch(
  logs: FirewallLogEntry[],
  searchQuery: string
): FirewallLogEntry[] {
  if (!searchQuery) return logs;

  const query = searchQuery.toLowerCase();

  return logs.filter((log) => {
    // Search in message
    if (log.message.toLowerCase().includes(query)) return true;

    // Search in IPs
    if (log.parsed?.srcIp?.includes(query)) return true;
    if (log.parsed?.dstIp?.includes(query)) return true;

    // Search in prefix
    if (log.parsed?.prefix?.toLowerCase().includes(query)) return true;

    // Search in protocol
    if (log.parsed?.protocol?.toLowerCase().includes(query)) return true;

    return false;
  });
}

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * Headless hook for firewall log viewer.
 *
 * Provides complete state management for viewing, filtering, and exporting
 * firewall logs with auto-refresh, debouncing, and virtualization support.
 *
 * @example
 * ```tsx
 * const viewer = useFirewallLogViewer({
 *   routerId: 'router-1',
 *   debounceDelay: 300,
 * });
 *
 * return (
 *   <div>
 *     <input
 *       value={viewer.state.searchQuery}
 *       onChange={(e) => viewer.setSearchQuery(e.target.value)}
 *     />
 *     {viewer.logs.map((log) => (
 *       <LogRow key={log.id} log={log} onClick={() => viewer.selectLog(log)} />
 *     ))}
 *   </div>
 * );
 * ```
 */
export function useFirewallLogViewer(
  options: UseFirewallLogViewerOptions
): UseFirewallLogViewerReturn {
  const { routerId, initialState, debounceDelay = 300 } = options;

  // State
  const [state, setState] = useState<FirewallLogViewerState>({
    ...DEFAULT_STATE,
    ...initialState,
  });

  // Debounced search query
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(state.searchQuery);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  // Debounce search query updates
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearchQuery(state.searchQuery);
    }, debounceDelay);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [state.searchQuery, debounceDelay]);

  // Debounced text filters
  const [debouncedFilters, setDebouncedFilters] = useState(state.filters);
  const filtersTimeoutRef = useRef<NodeJS.Timeout>();

  // Debounce filter updates (for IP/port inputs)
  useEffect(() => {
    if (filtersTimeoutRef.current) {
      clearTimeout(filtersTimeoutRef.current);
    }

    filtersTimeoutRef.current = setTimeout(() => {
      setDebouncedFilters(state.filters);
    }, debounceDelay);

    return () => {
      if (filtersTimeoutRef.current) {
        clearTimeout(filtersTimeoutRef.current);
      }
    };
  }, [state.filters, debounceDelay]);

  // Fetch logs with auto-refresh
  const { data: rawLogs = [], isLoading, error } = useFirewallLogs(routerId, {
    filters: debouncedFilters,
    refetchInterval: state.isAutoRefreshEnabled ? state.refreshInterval : false,
    enabled: !!routerId,
  });

  // Apply search filter and sorting
  const processedLogs = useMemo(() => {
    let logs = rawLogs;

    // Filter by search query
    logs = filterBySearch(logs, debouncedSearchQuery);

    // Sort logs
    logs = sortLogs(logs, state.sortBy, state.sortOrder);

    return logs;
  }, [rawLogs, debouncedSearchQuery, state.sortBy, state.sortOrder]);

  // Filter actions
  const setFilters = useCallback((filters: Partial<FirewallLogFilters>) => {
    setState((prev) => ({
      ...prev,
      filters: { ...prev.filters, ...filters },
    }));
  }, []);

  const clearFilters = useCallback(() => {
    setState((prev) => ({
      ...prev,
      filters: {},
    }));
  }, []);

  // Auto-refresh actions
  const toggleAutoRefresh = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isAutoRefreshEnabled: !prev.isAutoRefreshEnabled,
    }));
  }, []);

  const setRefreshInterval = useCallback((interval: RefreshInterval) => {
    setState((prev) => ({
      ...prev,
      refreshInterval: interval,
      isAutoRefreshEnabled: interval !== false,
    }));
  }, []);

  // Selection actions
  const selectLog = useCallback((log: FirewallLogEntry | null) => {
    setState((prev) => ({
      ...prev,
      selectedLog: log,
    }));
  }, []);

  // Stats actions
  const toggleStats = useCallback(() => {
    setState((prev) => ({
      ...prev,
      expandedStats: !prev.expandedStats,
    }));
  }, []);

  // Sort actions
  const setSortBy = useCallback((field: SortField) => {
    setState((prev) => ({
      ...prev,
      sortBy: field,
    }));
  }, []);

  const toggleSortOrder = useCallback(() => {
    setState((prev) => ({
      ...prev,
      sortOrder: prev.sortOrder === 'asc' ? 'desc' : 'asc',
    }));
  }, []);

  // Search actions
  const setSearchQuery = useCallback((query: string) => {
    setState((prev) => ({
      ...prev,
      searchQuery: query,
    }));
  }, []);

  // Export actions
  const exportToCSV = useCallback(() => {
    exportLogsToCSV(processedLogs, routerId);
  }, [processedLogs, routerId]);

  return {
    state,
    logs: processedLogs,
    isLoading,
    error: error as Error | null,
    selectedLog: state.selectedLog,
    setFilters,
    clearFilters,
    toggleAutoRefresh,
    setRefreshInterval,
    selectLog,
    toggleStats,
    setSortBy,
    toggleSortOrder,
    setSearchQuery,
    exportToCSV,
    totalCount: rawLogs.length,
    visibleCount: processedLogs.length,
  };
}
