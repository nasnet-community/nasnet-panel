/**
 * @fileoverview Virtualized Table Component
 *
 * A high-performance table component integrating TanStack Virtual with TanStack Table.
 * Automatically enables virtualization for tables with >50 rows.
 *
 * Features:
 * - Row virtualization for large datasets
 * - Full TanStack Table integration (sorting, filtering, pagination)
 * - Sticky headers
 * - Column resizing support
 * - Keyboard navigation
 * - Horizontal scroll for wide tables
 * - Platform-aware row heights
 *
 * @example
 * ```tsx
 * <VirtualizedTable
 *   data={firewallRules}
 *   columns={columns}
 *   enableSorting
 *   enableFiltering
 *   onRowClick={(row) => console.log(row.original)}
 * />
 * ```
 */
import { type ReactNode } from 'react';
import { type ColumnDef, type SortingState, type Row, type VisibilityState } from '@tanstack/react-table';
/**
 * Virtualization threshold - tables with more rows than this will be virtualized
 */
export declare const TABLE_VIRTUALIZATION_THRESHOLD = 50;
/**
 * Default row heights by platform
 */
export declare const TABLE_ROW_HEIGHTS: {
    readonly mobile: 56;
    readonly tablet: 48;
    readonly desktop: 40;
};
export interface VirtualizedTableProps<T> {
    /** Table data array */
    data: T[];
    /** Column definitions (TanStack Table ColumnDef) */
    columns: ColumnDef<T, unknown>[];
    /** Enable sorting functionality */
    enableSorting?: boolean;
    /** Enable column filtering */
    enableFiltering?: boolean;
    /** Enable row selection */
    enableRowSelection?: boolean;
    /** Enable multi-row selection */
    enableMultiRowSelection?: boolean;
    /** Container height */
    height?: number | string;
    /** Estimated row height */
    estimateRowHeight?: number;
    /** Overscan (buffer) rows */
    overscan?: number;
    /** Container className */
    className?: string;
    /** Table className */
    tableClassName?: string;
    /** Header className */
    headerClassName?: string;
    /** Row className (or function) */
    rowClassName?: string | ((row: Row<T>) => string);
    /** Cell className */
    cellClassName?: string;
    /** Callback when row is clicked */
    onRowClick?: (row: Row<T>) => void;
    /** Callback when row is double-clicked */
    onRowDoubleClick?: (row: Row<T>) => void;
    /** Callback when selection changes */
    onSelectionChange?: (selectedRows: T[]) => void;
    /** Callback when sorting changes */
    onSortingChange?: (sorting: SortingState) => void;
    /** Initial sorting state */
    initialSorting?: SortingState;
    /** Global filter value */
    globalFilter?: string;
    /** Force virtualization on/off */
    forceVirtualization?: boolean;
    /** Loading state */
    loading?: boolean;
    /** Empty state content */
    emptyContent?: ReactNode;
    /** Get unique row id */
    getRowId?: (row: T, index: number) => string;
    /** Column visibility state */
    columnVisibility?: VisibilityState;
    /** ARIA label */
    'aria-label'?: string;
    /** Sticky header */
    stickyHeader?: boolean;
    /** Header height for sticky positioning */
    headerHeight?: number;
}
/**
 * A high-performance virtualized table component
 */
declare function VirtualizedTableInner<T>({ data, columns, enableSorting, enableFiltering, enableRowSelection, enableMultiRowSelection, height, estimateRowHeight, overscan, className, tableClassName, headerClassName, rowClassName, cellClassName, onRowClick, onRowDoubleClick, onSelectionChange, onSortingChange, initialSorting, globalFilter, forceVirtualization, loading, emptyContent, getRowId, columnVisibility, 'aria-label': ariaLabel, stickyHeader, headerHeight, }: VirtualizedTableProps<T>): import("react/jsx-runtime").JSX.Element;
declare namespace VirtualizedTableInner {
    var displayName: string;
}
export declare const VirtualizedTable: typeof VirtualizedTableInner;
/**
 * Utility type for creating column definitions with better type inference
 */
export type TypedColumnDef<T> = ColumnDef<T, unknown>;
/**
 * Helper to create a simple text column
 */
export declare function createTextColumn<T>(id: keyof T & string, header: string, options?: Partial<ColumnDef<T, unknown>>): ColumnDef<T, unknown>;
/**
 * Helper to create a selection column
 */
export declare function createSelectionColumn<T>(): ColumnDef<T, unknown>;
export {};
//# sourceMappingURL=VirtualizedTable.d.ts.map