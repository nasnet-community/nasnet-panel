/**
 * DataTable Component
 *
 * Generic, typed data table component with column definitions and custom cell rendering.
 * Supports loading states, empty states, and clickable rows.
 *
 * @module @nasnet/ui/patterns/data-table
 */
import * as React from 'react';
/**
 * Column definition for DataTable
 *
 * @template T The data type for the table row
 */
export interface DataTableColumn<T> {
    /** Key from the data object or custom identifier */
    key: keyof T | string;
    /** Header display text or JSX */
    header: React.ReactNode;
    /** Optional custom cell renderer */
    cell?: (item: T, index: number) => React.ReactNode;
    /** Additional CSS classes for cell content */
    className?: string;
    /** Additional CSS classes for header cell */
    headerClassName?: string;
}
/**
 * Props for DataTable component
 *
 * @template T The data type for table rows
 */
export interface DataTableProps<T> {
    /** Column definitions */
    columns: DataTableColumn<T>[];
    /** Array of row data */
    data: T[];
    /** Optional function to extract unique key from row data */
    keyExtractor?: (item: T, index: number) => string | number;
    /** Message shown when no data is available */
    emptyMessage?: string;
    /** Additional CSS classes for the table wrapper */
    className?: string;
    /** Whether to show loading state */
    isLoading?: boolean;
    /** Callback fired when a row is clicked */
    onRowClick?: (item: T, index: number) => void;
}
/**
 * Internal DataTable implementation
 *
 * @example
 * ```tsx
 * const columns: DataTableColumn<User>[] = [
 *   { key: 'name', header: 'Name' },
 *   { key: 'status', header: 'Status', cell: (user) => <StatusBadge status={user.status} /> },
 * ];
 *
 * <DataTable
 *   columns={columns}
 *   data={users}
 *   keyExtractor={(user) => user.id}
 *   onRowClick={(user) => navigate(`/users/${user.id}`)}
 * />
 * ```
 */
declare function DataTableInner<T extends Record<string, unknown>>({ columns, data, keyExtractor, emptyMessage, className, isLoading, onRowClick, }: DataTableProps<T>): import("react/jsx-runtime").JSX.Element;
/**
 * DataTable - Generic, typed data table component
 *
 * Renders a responsive data table with column-based API.
 * Supports custom cell renderers, loading states, empty states, and row click handlers.
 */
declare const DataTable: typeof DataTableInner & {
    displayName: string;
};
export { DataTable };
//# sourceMappingURL=data-table.d.ts.map