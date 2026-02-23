/**
 * Headless useFirewallLogFilters Hook
 *
 * Manages firewall log filter state and provides utility functions
 * for wildcard IP matching, port range validation, and filter counts.
 *
 * @module @nasnet/ui/patterns/firewall-log-filters
 */
import type { InferredAction } from '@nasnet/core/types';
import type { FirewallLogFilterState, TimeRangePreset, TimeRange } from './firewall-log-filters.types';
export interface UseFirewallLogFiltersOptions {
    /** Current filter state */
    filters: FirewallLogFilterState;
    /** Callback when filters change */
    onFiltersChange: (filters: FirewallLogFilterState) => void;
    /** Available prefixes for autocomplete */
    availablePrefixes?: string[];
}
export interface UseFirewallLogFiltersReturn {
    /** Current filters */
    filters: FirewallLogFilterState;
    /** Update time range preset */
    setTimeRangePreset: (preset: TimeRangePreset) => void;
    /** Update custom time range */
    setCustomTimeRange: (range: TimeRange) => void;
    /** Toggle action filter */
    toggleAction: (action: InferredAction) => void;
    /** Set source IP filter */
    setSrcIp: (ip: string) => void;
    /** Set destination IP filter */
    setDstIp: (ip: string) => void;
    /** Set source port filter */
    setSrcPort: (port: string) => void;
    /** Set destination port filter */
    setDstPort: (port: string) => void;
    /** Set prefix filter */
    setPrefix: (prefix: string) => void;
    /** Clear all filters */
    clearFilters: () => void;
    /** Active filter count */
    activeFilterCount: number;
    /** Computed time range from preset or custom */
    computedTimeRange: TimeRange;
    /** Validation: Is IP filter valid (with wildcard support) */
    isValidIpFilter: (ip: string) => boolean;
    /** Validation: Is port filter valid (single or range) */
    isValidPortFilter: (port: string) => boolean;
    /** Available prefixes for autocomplete */
    availablePrefixes: string[];
}
/**
 * Headless hook for firewall log filters.
 *
 * Manages filter state, validation, and provides utility functions
 * for wildcard IP matching and port range validation.
 *
 * @example
 * ```tsx
 * const filterHook = useFirewallLogFilters({
 *   filters: currentFilters,
 *   onFiltersChange: handleFiltersChange,
 *   availablePrefixes: ['DROPPED-', 'ACCEPTED-'],
 * });
 *
 * return (
 *   <div>
 *     <input
 *       value={filterHook.filters.srcIp || ''}
 *       onChange={(e) => filterHook.setSrcIp(e.target.value)}
 *     />
 *   </div>
 * );
 * ```
 */
export declare function useFirewallLogFilters(options: UseFirewallLogFiltersOptions): UseFirewallLogFiltersReturn;
//# sourceMappingURL=use-firewall-log-filters.d.ts.map