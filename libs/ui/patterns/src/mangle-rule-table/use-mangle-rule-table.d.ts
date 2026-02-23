/**
 * Headless Mangle Rule Table Hook
 *
 * Provides table state management including:
 * - Sorting by multiple columns
 * - Filtering by action, protocol, enabled/disabled, mark name
 * - Drag-drop reorder state management
 *
 * This is a headless hook - it provides logic but no rendering.
 * Use with MangleRulesTable domain component for actual UI.
 *
 * @see Docs/sprint-artifacts/Epic7-Security-Firewall/NAS-7-5-implement-mangle-rules.md
 */
import type { MangleRule, MangleAction } from '@nasnet/core/types';
/**
 * Sortable columns in the mangle rules table
 */
export type SortableColumn = 'position' | 'chain' | 'action' | 'newConnectionMark' | 'newPacketMark' | 'newRoutingMark' | 'packets' | 'bytes';
/**
 * Sort direction
 */
export type SortDirection = 'asc' | 'desc';
/**
 * Filter options for mangle rules
 */
export interface MangleRuleFilters {
    action?: MangleAction | 'all';
    protocol?: string | 'all';
    status?: 'enabled' | 'disabled' | 'all';
    markName?: string;
    chain?: string | 'all';
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
export interface UseMangleRuleTableOptions {
    data: MangleRule[];
    initialSortBy?: SortableColumn;
    initialSortDirection?: SortDirection;
    initialFilters?: Partial<MangleRuleFilters>;
}
/**
 * Hook return type
 */
export interface UseMangleRuleTableReturn {
    data: MangleRule[];
    sortBy: SortableColumn;
    sortDirection: SortDirection;
    setSortBy: (column: SortableColumn) => void;
    toggleSort: (column: SortableColumn) => void;
    filters: MangleRuleFilters;
    setFilters: (filters: Partial<MangleRuleFilters>) => void;
    clearFilters: () => void;
    hasActiveFilters: boolean;
    reorder: (fromIndex: number, toIndex: number) => void;
    isDragging: boolean;
    setIsDragging: (dragging: boolean) => void;
    draggedItemId: string | null;
    setDraggedItemId: (id: string | null) => void;
    columns: ColumnDef<MangleRule>[];
    totalCount: number;
    filteredCount: number;
}
/**
 * Headless hook for mangle rule table state management
 *
 * @example
 * ```tsx
 * const {
 *   data,
 *   sortBy,
 *   setSortBy,
 *   filters,
 *   setFilters,
 *   reorder,
 *   columns
 * } = useMangleRuleTable({
 *   data: mangleRules,
 *   initialSortBy: 'position',
 * });
 * ```
 */
export declare function useMangleRuleTable(options: UseMangleRuleTableOptions): UseMangleRuleTableReturn;
//# sourceMappingURL=use-mangle-rule-table.d.ts.map