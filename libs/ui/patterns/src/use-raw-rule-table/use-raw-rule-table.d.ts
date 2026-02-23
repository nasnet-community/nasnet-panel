/**
 * Headless RAW Rule Table Hook
 *
 * Provides table state management including:
 * - Sorting by multiple columns
 * - Filtering by action, protocol, chain, enabled/disabled
 * - Drag-drop reorder state management
 * - Row selection for bulk operations
 *
 * This is a headless hook - it provides logic but no rendering.
 * Use with RawRulesTable domain component for actual UI.
 *
 * @module @nasnet/ui/patterns/use-raw-rule-table
 */
import type { RawRule, RawAction, RawChain } from '@nasnet/core/types';
/**
 * Sortable columns in the RAW rules table
 */
export type SortableColumn = 'order' | 'chain' | 'action' | 'protocol' | 'packets' | 'bytes';
/**
 * Sort direction
 */
export type SortDirection = 'asc' | 'desc';
/**
 * Filter options for RAW rules
 */
export interface RawRuleFilters {
    action?: RawAction | 'all';
    protocol?: string | 'all';
    status?: 'enabled' | 'disabled' | 'all';
    chain?: RawChain | 'all';
    searchTerm?: string;
}
/**
 * Column definition for table
 */
export interface ColumnDef<T> {
    id: string;
    header: string;
    accessor: keyof T | ((row: T) => any);
    sortable?: boolean;
    width?: string;
}
/**
 * Hook options
 */
export interface UseRawRuleTableOptions {
    data: RawRule[];
    initialSortBy?: SortableColumn;
    initialSortDirection?: SortDirection;
    initialFilters?: Partial<RawRuleFilters>;
    enableSelection?: boolean;
}
/**
 * Hook return type
 */
export interface UseRawRuleTableReturn {
    data: RawRule[];
    sortBy: SortableColumn;
    sortDirection: SortDirection;
    setSortBy: (column: SortableColumn) => void;
    toggleSort: (column: SortableColumn) => void;
    filters: RawRuleFilters;
    setFilters: (filters: Partial<RawRuleFilters>) => void;
    clearFilters: () => void;
    hasActiveFilters: boolean;
    reorder: (fromIndex: number, toIndex: number) => void;
    isDragging: boolean;
    setIsDragging: (dragging: boolean) => void;
    draggedItemId: string | null;
    setDraggedItemId: (id: string | null) => void;
    selectedIds: Set<string>;
    toggleSelection: (id: string) => void;
    selectAll: () => void;
    clearSelection: () => void;
    isSelected: (id: string) => boolean;
    hasSelection: boolean;
    columns: ColumnDef<RawRule>[];
    totalCount: number;
    filteredCount: number;
}
/**
 * Headless hook for RAW rule table state management.
 *
 * Handles sorting, filtering, drag-drop, and selection state.
 * Does not render any UI - provides state and handlers for presentation layer.
 *
 * @example
 * ```tsx
 * const table = useRawRuleTable({
 *   data: rules,
 *   initialSortBy: 'order',
 *   enableSelection: true,
 * });
 *
 * return (
 *   <Table>
 *     {table.data.map((rule) => (
 *       <TableRow key={rule.id}>
 *         <TableCell>{rule.chain}</TableCell>
 *         <TableCell>{rule.action}</TableCell>
 *       </TableRow>
 *     ))}
 *   </Table>
 * );
 * ```
 */
export declare function useRawRuleTable(options: UseRawRuleTableOptions): UseRawRuleTableReturn;
//# sourceMappingURL=use-raw-rule-table.d.ts.map