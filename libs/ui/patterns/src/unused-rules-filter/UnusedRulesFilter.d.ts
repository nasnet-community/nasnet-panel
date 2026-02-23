/**
 * UnusedRulesFilter - Pattern component for filtering and sorting firewall rules by usage
 * Layer 2 pattern component following ADR-017
 *
 * Features:
 * - Filter by unused rules (packets === 0)
 * - Sort by packet count
 * - WCAG AAA accessible
 */
import React from 'react';
export type SortOption = 'default' | 'packets-asc' | 'packets-desc';
export interface UnusedRulesFilterProps {
    /** Callback when filter checkbox changes */
    onFilterChange: (showUnusedOnly: boolean) => void;
    /** Callback when sort option changes */
    onSortChange: (sort: SortOption) => void;
    /** Current filter state */
    showUnusedOnly: boolean;
    /** Current sort option */
    currentSort: SortOption;
    /** Optional CSS class name */
    className?: string;
}
/**
 * UnusedRulesFilter component
 *
 * Provides filtering and sorting controls for firewall rule optimization.
 * Helps users identify unused rules (with 0 packet count) and sort by efficiency.
 *
 * @example
 * ```tsx
 * <UnusedRulesFilter
 *   showUnusedOnly={showUnused}
 *   onFilterChange={(show) => setShowUnused(show)}
 *   currentSort="packets-desc"
 *   onSortChange={(sort) => setSort(sort)}
 * />
 * ```
 */
export declare const UnusedRulesFilter: React.NamedExoticComponent<UnusedRulesFilterProps>;
//# sourceMappingURL=UnusedRulesFilter.d.ts.map