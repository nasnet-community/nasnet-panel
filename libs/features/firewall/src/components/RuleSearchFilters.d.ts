/**
 * Rule Search Filters Component
 * @description Filter panel for searching and filtering firewall rules with
 * debounced search, dropdown filters, active filter badges, and mobile collapse support.
 *
 * @example
 * <RuleSearchFilters
 *   filters={filters}
 *   onChange={handleFilterChange}
 *   onClearAll={handleClearAll}
 *   activeFilterCount={2}
 * />
 *
 * Epic 0.6 Enhancement: Advanced Rule Search
 */
import type { FirewallFilters } from '@nasnet/core/types';
export interface RuleSearchFiltersProps {
    /** CSS classes to apply to root element */
    className?: string;
    /** Current filter state */
    filters: FirewallFilters;
    /** Callback when any filter changes */
    onChange: (filters: Partial<FirewallFilters>) => void;
    /** Callback to clear all filters */
    onClearAll: () => void;
    /** Number of active filters (for badge display) */
    activeFilterCount: number;
}
/**
 * RuleSearchFilters Component
 *
 * Features:
 * - Text search with 300ms debouncing (comment, IPs, ports)
 * - Dropdown filters: chain, action, protocol, status
 * - Active filter badges with individual remove + clear all
 * - Mobile-optimized: collapsible filter panel with toggle button
 * - Accessibility: aria-labels, keyboard navigation
 *
 * @param props - Component props
 * @returns Rule search filters panel
 */
export declare const RuleSearchFilters: import("react").NamedExoticComponent<RuleSearchFiltersProps>;
//# sourceMappingURL=RuleSearchFilters.d.ts.map