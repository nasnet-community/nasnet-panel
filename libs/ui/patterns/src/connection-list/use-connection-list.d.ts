/**
 * useConnectionList Hook
 *
 * Headless hook for ConnectionList pattern component.
 * Provides filtering, sorting, and auto-refresh control for connection tracking data.
 *
 * @see ADR-018: Headless Platform Presenters
 */
import type { ConnectionEntry, ConnectionFilter, ConnectionSort, ConnectionSortField } from './types';
export interface UseConnectionListOptions {
    /** Connection entries to display */
    connections: ConnectionEntry[];
    /** Initial filter state */
    initialFilter?: Partial<ConnectionFilter>;
    /** Initial sort state */
    initialSort?: ConnectionSort;
    /** Auto-refresh interval in milliseconds */
    refreshInterval?: number;
    /** Callback when refresh is triggered */
    onRefresh?: () => void;
}
export interface UseConnectionListReturn {
    filteredConnections: ConnectionEntry[];
    totalCount: number;
    filteredCount: number;
    filter: ConnectionFilter;
    setFilter: (filter: Partial<ConnectionFilter>) => void;
    clearFilter: () => void;
    hasActiveFilter: boolean;
    sort: ConnectionSort;
    setSort: (field: ConnectionSortField) => void;
    toggleSortDirection: () => void;
    isPaused: boolean;
    togglePause: () => void;
    refresh: () => void;
}
/**
 * Headless hook for connection list logic
 */
export declare function useConnectionList(options: UseConnectionListOptions): UseConnectionListReturn;
//# sourceMappingURL=use-connection-list.d.ts.map