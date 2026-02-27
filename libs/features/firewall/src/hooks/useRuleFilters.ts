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

import { useReducer, useCallback, useMemo } from 'react';
import type {
  FirewallFilters,
  FirewallRule,
  FirewallChain,
  FirewallAction,
  FirewallProtocol,
} from '@nasnet/core/types';

/**
 * Filter action types for reducer dispatch
 * @internal
 */
type FilterAction =
  | { type: 'SET_SEARCH'; payload: string }
  | { type: 'SET_CHAIN'; payload: FirewallChain | 'all' }
  | { type: 'SET_ACTION'; payload: FirewallAction | 'all' }
  | { type: 'SET_PROTOCOL'; payload: FirewallProtocol | 'all' }
  | { type: 'SET_STATUS'; payload: 'enabled' | 'disabled' | 'all' }
  | { type: 'CLEAR_ALL' }
  | { type: 'SET_FILTERS'; payload: Partial<FirewallFilters> };

/**
 * Default filter state
 * @internal
 */
const DEFAULT_FILTERS: FirewallFilters = {
  search: '',
  chain: 'all',
  action: 'all',
  protocol: 'all',
  status: 'all',
};

/**
 * Filter reducer for managing filter state transitions
 * @internal
 */
function filterReducer(state: FirewallFilters, action: FilterAction): FirewallFilters {
  switch (action.type) {
    case 'SET_SEARCH':
      return { ...state, search: action.payload };
    case 'SET_CHAIN':
      return { ...state, chain: action.payload };
    case 'SET_ACTION':
      return { ...state, action: action.payload };
    case 'SET_PROTOCOL':
      return { ...state, protocol: action.payload };
    case 'SET_STATUS':
      return { ...state, status: action.payload };
    case 'CLEAR_ALL':
      return DEFAULT_FILTERS;
    case 'SET_FILTERS':
      return { ...state, ...action.payload };
    default:
      return state;
  }
}

/**
 * Check if any filters are active
 * @param filters - The filter state to check
 * @returns True if any filter is set to a non-default value
 */
export function hasActiveFilters(filters: FirewallFilters): boolean {
  return (
    (filters.search && filters.search.length > 0) ||
    filters.chain !== 'all' ||
    filters.action !== 'all' ||
    filters.protocol !== 'all' ||
    filters.status !== 'all'
  );
}

/**
 * Count the number of active filters
 * @description Useful for displaying badge counts in the UI.
 * @param filters - The filter state to count
 * @returns Number of active filters (0-5)
 */
export function countActiveFilters(filters: FirewallFilters): number {
  let count = 0;
  if (filters.search && filters.search.length > 0) count++;
  if (filters.chain !== 'all') count++;
  if (filters.action !== 'all') count++;
  if (filters.protocol !== 'all') count++;
  if (filters.status !== 'all') count++;
  return count;
}

/**
 * Apply filters to a list of firewall rules
 * @description Pure function that filters rules by search, chain, action, protocol, and status.
 * Search matches: comment, srcAddress, dstAddress, srcPort, dstPort (case-insensitive).
 * @param rules - Rules to filter
 * @param filters - Filter state
 * @returns Filtered subset of rules
 */
export function applyFilters(rules: FirewallRule[], filters: FirewallFilters): FirewallRule[] {
  return rules.filter((rule) => {
    // Search filter (matches comment, srcAddress, dstAddress, srcPort, dstPort)
    if (filters.search && filters.search.length > 0) {
      const searchLower = filters.search.toLowerCase();
      const matchesSearch =
        (rule.comment && rule.comment.toLowerCase().includes(searchLower)) ||
        (rule.srcAddress && rule.srcAddress.toLowerCase().includes(searchLower)) ||
        (rule.dstAddress && rule.dstAddress.toLowerCase().includes(searchLower)) ||
        (rule.srcPort && rule.srcPort.includes(searchLower)) ||
        (rule.dstPort && rule.dstPort.includes(searchLower));

      if (!matchesSearch) return false;
    }

    // Chain filter
    if (filters.chain && filters.chain !== 'all') {
      if (rule.chain !== filters.chain) return false;
    }

    // Action filter
    if (filters.action && filters.action !== 'all') {
      if (rule.action !== filters.action) return false;
    }

    // Protocol filter
    if (filters.protocol && filters.protocol !== 'all') {
      if (rule.protocol !== filters.protocol) return false;
    }

    // Status filter
    if (filters.status && filters.status !== 'all') {
      const isEnabled = !rule.disabled;
      if (filters.status === 'enabled' && !isEnabled) return false;
      if (filters.status === 'disabled' && isEnabled) return false;
    }

    return true;
  });
}

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
export function useRuleFilters(initialFilters?: Partial<FirewallFilters>): UseRuleFiltersReturn {
  const [filters, dispatch] = useReducer(
    filterReducer,
    initialFilters ? { ...DEFAULT_FILTERS, ...initialFilters } : DEFAULT_FILTERS
  );

  const setSearch = useCallback((search: string) => {
    dispatch({ type: 'SET_SEARCH', payload: search });
  }, []);

  const setChain = useCallback((chain: FirewallChain | 'all') => {
    dispatch({ type: 'SET_CHAIN', payload: chain });
  }, []);

  const setAction = useCallback((action: FirewallAction | 'all') => {
    dispatch({ type: 'SET_ACTION', payload: action });
  }, []);

  const setProtocol = useCallback((protocol: FirewallProtocol | 'all') => {
    dispatch({ type: 'SET_PROTOCOL', payload: protocol });
  }, []);

  const setStatus = useCallback((status: 'enabled' | 'disabled' | 'all') => {
    dispatch({ type: 'SET_STATUS', payload: status });
  }, []);

  const clearAll = useCallback(() => {
    dispatch({ type: 'CLEAR_ALL' });
  }, []);

  const setFiltersAction = useCallback((newFilters: Partial<FirewallFilters>) => {
    dispatch({ type: 'SET_FILTERS', payload: newFilters });
  }, []);

  const filterRules = useCallback(
    (rules: FirewallRule[]) => applyFilters(rules, filters),
    [filters]
  );

  const isActive = useMemo(() => hasActiveFilters(filters), [filters]);
  const activeCount = useMemo(() => countActiveFilters(filters), [filters]);

  return {
    filters,
    setSearch,
    setChain,
    setAction,
    setProtocol,
    setStatus,
    clearAll,
    setFilters: setFiltersAction,
    hasActiveFilters: isActive,
    activeFilterCount: activeCount,
    filterRules,
  };
}
