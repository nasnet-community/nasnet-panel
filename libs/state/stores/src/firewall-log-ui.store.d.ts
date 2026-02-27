/**
 * Firewall Log UI Store
 * Manages UI state for firewall log viewer (filters, auto-refresh, sort, stats)
 *
 * Task #10: FirewallLogsPage Integration
 * Story: NAS-5.6 - Implement Firewall Logging Viewer
 */
import type { FirewallLogFilterState } from '@nasnet/core/types';
/**
 * Auto-refresh interval presets (in milliseconds)
 */
export type RefreshInterval = 5000 | 10000 | 30000 | 60000 | false;
/**
 * Sort field options for log entries
 */
export type LogSortField = 'timestamp' | 'srcIp' | 'dstIp' | 'protocol' | 'action';
/**
 * Sort order
 */
export type SortOrder = 'asc' | 'desc';
/**
 * Firewall Log UI State Interface
 */
export interface FirewallLogUIState {
  /**
   * Current filter state (time range, actions, IPs, ports, prefix)
   */
  filters: FirewallLogFilterState;
  /**
   * Update filters
   */
  setFilters: (filters: FirewallLogFilterState) => void;
  /**
   * Reset filters to default
   */
  resetFilters: () => void;
  /**
   * Auto-refresh enabled state
   */
  autoRefresh: boolean;
  /**
   * Toggle auto-refresh
   */
  toggleAutoRefresh: () => void;
  /**
   * Set auto-refresh enabled state
   */
  setAutoRefresh: (enabled: boolean) => void;
  /**
   * Auto-refresh interval in milliseconds
   * false = disabled
   */
  refreshInterval: RefreshInterval;
  /**
   * Set refresh interval
   */
  setRefreshInterval: (interval: RefreshInterval) => void;
  /**
   * Current sort field
   */
  sortBy: LogSortField;
  /**
   * Set sort field
   */
  setSortBy: (field: LogSortField) => void;
  /**
   * Current sort order
   */
  sortOrder: SortOrder;
  /**
   * Set sort order
   */
  setSortOrder: (order: SortOrder) => void;
  /**
   * Toggle sort order for current field
   */
  toggleSortOrder: () => void;
  /**
   * Stats panel expanded state (desktop only)
   */
  expandedStats: boolean;
  /**
   * Toggle stats panel expansion
   */
  toggleExpandedStats: () => void;
  /**
   * Set stats panel expanded state
   */
  setExpandedStats: (expanded: boolean) => void;
  /**
   * Filters sheet open state (mobile only)
   */
  filtersSheetOpen: boolean;
  /**
   * Toggle filters sheet
   */
  toggleFiltersSheet: () => void;
  /**
   * Set filters sheet open state
   */
  setFiltersSheetOpen: (open: boolean) => void;
  /**
   * Reset all state to defaults
   */
  reset: () => void;
}
/**
 * Firewall Log UI Store
 *
 * Persisted state:
 * - filters (user preferences)
 * - autoRefresh (remember user's choice)
 * - refreshInterval (remember interval preference)
 * - sortBy, sortOrder (remember sort preferences)
 * - expandedStats (remember panel state)
 *
 * Non-persisted:
 * - filtersSheetOpen (transient mobile UI state)
 */
export declare const useFirewallLogStore: import('zustand').UseBoundStore<
  Omit<import('zustand').StoreApi<FirewallLogUIState>, 'persist'> & {
    persist: {
      setOptions: (
        options: Partial<import('zustand/middleware').PersistOptions<FirewallLogUIState, unknown>>
      ) => void;
      clearStorage: () => void;
      rehydrate: () => Promise<void> | void;
      hasHydrated: () => boolean;
      onHydrate: (fn: (state: FirewallLogUIState) => void) => () => void;
      onFinishHydration: (fn: (state: FirewallLogUIState) => void) => () => void;
      getOptions: () => Partial<
        import('zustand/middleware').PersistOptions<FirewallLogUIState, unknown>
      >;
    };
  }
>;
/**
 * Selector hooks for optimized access
 * Use these to avoid unnecessary re-renders
 */
export declare const useLogFilters: () => FirewallLogFilterState;
export declare const useAutoRefresh: () => boolean;
export declare const useRefreshInterval: () => RefreshInterval;
export declare const useLogSort: () => {
  sortBy: LogSortField;
  sortOrder: SortOrder;
};
export declare const useExpandedStats: () => boolean;
export declare const useFiltersSheetOpen: () => boolean;
//# sourceMappingURL=firewall-log-ui.store.d.ts.map
