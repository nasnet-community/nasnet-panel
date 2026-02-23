/**
 * ConnectionFilterBar Component
 *
 * Filter controls for connection list with debounced input.
 * Provides IP (with wildcard), port, protocol, and state filters.
 */
import type { ConnectionFilter } from './types';
export interface ConnectionFilterBarProps {
    /** Current filter values */
    filter: ConnectionFilter;
    /** Callback when filter changes */
    onFilterChange: (filter: Partial<ConnectionFilter>) => void;
    /** Callback to clear all filters */
    onClearFilter: () => void;
    /** Whether any filter is active */
    hasActiveFilter: boolean;
    /** Additional CSS classes */
    className?: string;
    /** Debounce delay in milliseconds */
    debounceMs?: number;
}
/**
 * Filter bar for connection list
 *
 * Features:
 * - IP filter with wildcard support (192.168.1.*)
 * - Port filter (matches source or destination)
 * - Protocol filter dropdown
 * - State filter dropdown
 * - Debounced text inputs (300ms)
 * - Clear all button
 *
 * @example
 * ```tsx
 * <ConnectionFilterBar
 *   filter={filter}
 *   onFilterChange={setFilter}
 *   onClearFilter={clearFilter}
 *   hasActiveFilter={hasActiveFilter}
 * />
 * ```
 */
export declare function ConnectionFilterBar({ filter, onFilterChange, onClearFilter, hasActiveFilter, className, debounceMs, }: ConnectionFilterBarProps): import("react/jsx-runtime").JSX.Element;
export declare namespace ConnectionFilterBar {
    var displayName: string;
}
//# sourceMappingURL=ConnectionFilterBar.d.ts.map