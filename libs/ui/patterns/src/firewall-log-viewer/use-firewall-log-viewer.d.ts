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
import { type FirewallLogFilters } from '@nasnet/api-client/queries';
import type { FirewallLogEntry } from '@nasnet/core/types';
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
    setFilters: (filters: Partial<FirewallLogFilters>) => void;
    clearFilters: () => void;
    toggleAutoRefresh: () => void;
    setRefreshInterval: (interval: RefreshInterval) => void;
    selectLog: (log: FirewallLogEntry | null) => void;
    toggleStats: () => void;
    setSortBy: (field: SortField) => void;
    toggleSortOrder: () => void;
    setSearchQuery: (query: string) => void;
    exportToCSV: () => void;
    totalCount: number;
    visibleCount: number;
    /** Number of active filters */
    activeFilterCount: number;
}
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
export declare function useFirewallLogViewer(options: UseFirewallLogViewerOptions): UseFirewallLogViewerReturn;
//# sourceMappingURL=use-firewall-log-viewer.d.ts.map