/**
 * Headless Hook: usePortKnockSequenceTable
 *
 * Business logic for port knock sequence table/list:
 * - Sorting by name, protected port, knock count, status, recent access
 * - Filtering by status (enabled/disabled)
 * - Column definitions for table rendering
 *
 * @see Docs/sprint-artifacts/Epic7-Security-Firewall/NAS-7-12-implement-port-knocking.md
 */
import type { PortKnockSequence } from '@nasnet/core/types';
/**
 * Sort column options
 */
export type SortColumn = 'name' | 'protectedPort' | 'knockCount' | 'status' | 'recentAccess';
/**
 * Sort direction
 */
export type SortDirection = 'asc' | 'desc';
/**
 * Filter options
 */
export interface SequenceFilters {
    /** Filter by enabled status */
    enabled?: boolean;
    /** Search by name */
    search?: string;
}
/**
 * Column definition for table rendering
 */
export interface ColumnDef {
    id: string;
    label: string;
    sortable: boolean;
    accessor: (row: PortKnockSequence) => string | number | boolean;
}
/**
 * Hook return type
 */
export interface UsePortKnockSequenceTableReturn {
    /** Filtered and sorted data */
    data: PortKnockSequence[];
    /** Current sort column */
    sortBy: SortColumn;
    /** Current sort direction */
    sortDirection: SortDirection;
    /** Set sort column and direction */
    setSortBy: (column: SortColumn, direction?: SortDirection) => void;
    /** Current filters */
    filters: SequenceFilters;
    /** Set filters */
    setFilters: (filters: SequenceFilters) => void;
    /** Column definitions */
    columns: ColumnDef[];
    /** Toggle sort direction for a column */
    toggleSort: (column: SortColumn) => void;
}
export interface UsePortKnockSequenceTableOptions {
    /** Raw sequence data */
    sequences: PortKnockSequence[];
    /** Default sort column */
    defaultSortBy?: SortColumn;
    /** Default sort direction */
    defaultSortDirection?: SortDirection;
    /** Default filters */
    defaultFilters?: SequenceFilters;
}
/**
 * Headless hook for port knock sequence table logic
 */
export declare function usePortKnockSequenceTable(options: UsePortKnockSequenceTableOptions): UsePortKnockSequenceTableReturn;
//# sourceMappingURL=use-port-knock-sequence-table.d.ts.map