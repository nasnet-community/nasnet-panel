/**
 * Firewall Log UI Store
 * Manages UI state for firewall log viewer (filters, auto-refresh, sort, stats)
 *
 * Task #10: FirewallLogsPage Integration
 * Story: NAS-5.6 - Implement Firewall Logging Viewer
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { FirewallLogFilterState } from '@nasnet/ui/patterns';
import { DEFAULT_FILTER_STATE } from '@nasnet/ui/patterns';

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
  // ============================================================================
  // Filters
  // ============================================================================

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

  // ============================================================================
  // Auto-Refresh
  // ============================================================================

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

  // ============================================================================
  // Sorting
  // ============================================================================

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

  // ============================================================================
  // Stats Panel
  // ============================================================================

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

  // ============================================================================
  // Mobile UI
  // ============================================================================

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

  // ============================================================================
  // Reset
  // ============================================================================

  /**
   * Reset all state to defaults
   */
  reset: () => void;
}

/**
 * Initial state
 */
const initialState = {
  filters: DEFAULT_FILTER_STATE,
  autoRefresh: false,
  refreshInterval: 10000 as RefreshInterval,
  sortBy: 'timestamp' as LogSortField,
  sortOrder: 'desc' as SortOrder,
  expandedStats: true,
  filtersSheetOpen: false,
};

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
export const useFirewallLogStore = create<FirewallLogUIState>()(
  persist(
    (set) => ({
      ...initialState,

      // Filters
      setFilters: (filters: FirewallLogFilterState) => set({ filters }),
      resetFilters: () => set({ filters: DEFAULT_FILTER_STATE }),

      // Auto-refresh
      toggleAutoRefresh: () =>
        set((state) => ({ autoRefresh: !state.autoRefresh })),
      setAutoRefresh: (enabled: boolean) => set({ autoRefresh: enabled }),
      setRefreshInterval: (interval: RefreshInterval) =>
        set({ refreshInterval: interval }),

      // Sorting
      setSortBy: (field: LogSortField) => set({ sortBy: field }),
      setSortOrder: (order: SortOrder) => set({ sortOrder: order }),
      toggleSortOrder: () =>
        set((state) => ({
          sortOrder: state.sortOrder === 'asc' ? 'desc' : 'asc',
        })),

      // Stats panel
      toggleExpandedStats: () =>
        set((state) => ({ expandedStats: !state.expandedStats })),
      setExpandedStats: (expanded: boolean) => set({ expandedStats: expanded }),

      // Mobile filters sheet
      toggleFiltersSheet: () =>
        set((state) => ({ filtersSheetOpen: !state.filtersSheetOpen })),
      setFiltersSheetOpen: (open: boolean) => set({ filtersSheetOpen: open }),

      // Reset
      reset: () => set(initialState),
    }),
    {
      name: 'firewall-log-ui-store',
      storage: createJSONStorage(() => localStorage),
      // Persist all state except filtersSheetOpen
      partialize: (state) => ({
        filters: state.filters,
        autoRefresh: state.autoRefresh,
        refreshInterval: state.refreshInterval,
        sortBy: state.sortBy,
        sortOrder: state.sortOrder,
        expandedStats: state.expandedStats,
      }),
    }
  )
);

/**
 * Selector hooks for optimized access
 * Use these to avoid unnecessary re-renders
 */
export const useLogFilters = () =>
  useFirewallLogStore((state) => state.filters);

export const useAutoRefresh = () =>
  useFirewallLogStore((state) => state.autoRefresh);

export const useRefreshInterval = () =>
  useFirewallLogStore((state) => state.refreshInterval);

export const useLogSort = () =>
  useFirewallLogStore((state) => ({
    sortBy: state.sortBy,
    sortOrder: state.sortOrder,
  }));

export const useExpandedStats = () =>
  useFirewallLogStore((state) => state.expandedStats);

export const useFiltersSheetOpen = () =>
  useFirewallLogStore((state) => state.filtersSheetOpen);
