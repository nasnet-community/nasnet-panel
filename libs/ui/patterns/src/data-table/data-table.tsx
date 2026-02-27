/**
 * DataTable Component
 *
 * Generic, typed data table component with column definitions and custom cell rendering.
 * Supports loading states, empty states, and clickable rows.
 *
 * @module @nasnet/ui/patterns/data-table
 */

import * as React from 'react';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  cn,
} from '@nasnet/ui/primitives';

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
function DataTableInner<T extends Record<string, unknown>>({
  columns,
  data,
  keyExtractor,
  emptyMessage = 'No data available',
  className,
  isLoading = false,
  onRowClick,
}: DataTableProps<T>) {
  const getRowKey = React.useCallback(
    (item: T, index: number): string | number => {
      if (keyExtractor) {
        return keyExtractor(item, index);
      }
      if ('id' in item) {
        return item.id as string | number;
      }
      return index;
    },
    [keyExtractor]
  );

  const getCellValue = React.useCallback(
    (item: T, column: DataTableColumn<T>, index: number): React.ReactNode => {
      if (column.cell) {
        return column.cell(item, index);
      }
      const key = column.key as keyof T;
      const value = item[key];
      if (value === null || value === undefined) {
        return '-';
      }
      return String(value);
    },
    []
  );

  const handleRowClick = React.useCallback(
    (item: T, index: number) => {
      if (onRowClick) {
        onRowClick(item, index);
      }
    },
    [onRowClick]
  );

  return (
    <div className={cn('bg-card border border-border rounded-[var(--semantic-radius-card)] overflow-hidden', className)}>
      <Table aria-label="Data table">
        <TableHeader>
          <TableRow className="bg-muted border-b border-border hover:bg-muted">
            {columns.map((column, index) => (
              <TableHead
                key={String(column.key) + index}
                scope="col"
                className={cn(
                  'px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground',
                  column.headerClassName
                )}
              >
                {column.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell
                colSpan={columns.length}
                className="h-24 text-center text-muted-foreground py-12"
              >
                Loading...
              </TableCell>
            </TableRow>
          ) : data.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={columns.length}
                className="text-center text-muted-foreground py-12"
              >
                {emptyMessage}
              </TableCell>
            </TableRow>
          ) : (
            data.map((item, rowIndex) => (
              <TableRow
                key={getRowKey(item, rowIndex)}
                onClick={() => handleRowClick(item, rowIndex)}
                className={cn(
                  'h-10 border-b border-border hover:bg-muted/50 transition-colors duration-150',
                  onRowClick && 'cursor-pointer',
                  'data-[selected]:bg-primary/5'
                )}
              >
                {columns.map((column, colIndex) => (
                  <TableCell
                    key={String(column.key) + colIndex}
                    className={cn('px-4 py-2 text-sm text-foreground', column.className)}
                  >
                    {getCellValue(item, column, rowIndex)}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}

/**
 * DataTable - Generic, typed data table component
 *
 * Renders a responsive data table with column-based API.
 * Supports custom cell renderers, loading states, empty states, and row click handlers.
 */
const DataTable = React.memo(DataTableInner) as typeof DataTableInner & {
  displayName: string;
};
DataTable.displayName = 'DataTable';

export { DataTable };
