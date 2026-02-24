/**
 * Rule Filters Hook
 * @description Manages filter state for firewall rule search and filtering with
 * memoized computation and useCallback optimization for stable event handlers.
 *
 * @example
 * const filters = useRuleFilters();
 * const filtered = filters.filterRules(allRules);
 * filters.setSearch('port 80');
 */
import type { FirewallFilters, FirewallRule, FirewallChain, FirewallAction, FirewallProtocol } from '@nasnet/core/types';
/**
 * Check if any filters are active
 * @param filters - The filter state to check
 * @returns True if any filter is set to a non-default value
 */
export declare function hasActiveFilters(filters: FirewallFilters): boolean;
/**
 * Count the number of active filters
 * @description Useful for displaying badge counts in the UI.
 * @param filters - The filter state to count
 * @returns Number of active filters (0-5)
 */
export declare function countActiveFilters(filters: FirewallFilters): number;
/**
 * Apply filters to a list of firewall rules
 * @description Pure function that filters rules by search, chain, action, protocol, and status.
 * Search matches: comment, srcAddress, dstAddress, srcPort, dstPort (case-insensitive).
 * @param rules - Rules to filter
 * @param filters - Filter state
 * @returns Filtered subset of rules
 */
export declare function applyFilters(rules: FirewallRule[], filters: FirewallFilters): FirewallRule[];
/**
 * Hook return type
 */
export interface UseRuleFiltersReturn {
    /** Current filter state */
    filters: FirewallFilters;
    /** Set search text (matches comment, IPs, ports) */
    setSearch: (search: string) => void;
    /** Set chain filter */
    setChain: (chain: FirewallChain | 'all') => void;
    /** Set action filter (accept, drop, reject, log) */
    setAction: (action: FirewallAction | 'all') => void;
    /** Set protocol filter (tcp, udp, icmp) */
    setProtocol: (protocol: FirewallProtocol | 'all') => void;
    /** Set status filter (enabled, disabled) */
    setStatus: (status: 'enabled' | 'disabled' | 'all') => void;
    /** Clear all filters to default state */
    clearAll: () => void;
    /** Set multiple filters at once */
    setFilters: (filters: Partial<FirewallFilters>) => void;
    /** Whether any filters are currently active */
    hasActiveFilters: boolean;
    /** Count of active filters (0-5) */
    activeFilterCount: number;
    /** Memoized function to apply filters to a rule list */
    filterRules: (rules: FirewallRule[]) => FirewallRule[];
}
/**
 * Hook to manage firewall rule filters
 * @description Manages filter state with useReducer for complex filter interactions.
 * Provides memoized setters and computed properties (activeFilterCount, hasActiveFilters).
 *
 * Features:
 * - Manages filter state with useReducer for multi-filter coordination
 * - useCallback on all setters for stable event handler references
 * - useMemo on computed properties (activeCount, hasActiveFilters)
 * - useMemo on filterRules function to prevent unnecessary re-computations
 * - Supports partial initial filters with defaults fallback
 *
 * @param initialFilters - Optional initial filter state (merged with defaults)
 * @returns Filter state and memoized handlers
 *
 * @example
 * const filters = useRuleFilters({ chain: 'input' });
 * filters.setSearch('port 443');
 * const filtered = filters.filterRules(allRules);
 */
export declare function useRuleFilters(initialFilters?: Partial<FirewallFilters>): UseRuleFiltersReturn;
//# sourceMappingURL=useRuleFilters.d.ts.map