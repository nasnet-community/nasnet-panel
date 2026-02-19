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

export interface DataTableColumn<T> {
  key: keyof T | string;
  header: React.ReactNode;
  cell?: (item: T, index: number) => React.ReactNode;
  className?: string;
  headerClassName?: string;
}

export interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  data: T[];
  keyExtractor?: (item: T, index: number) => string | number;
  emptyMessage?: string;
  className?: string;
  isLoading?: boolean;
  onRowClick?: (item: T, index: number) => void;
}

function DataTableInner<T extends Record<string, unknown>>({
  columns,
  data,
  keyExtractor,
  emptyMessage = 'No data available',
  className,
  isLoading = false,
  onRowClick,
}: DataTableProps<T>) {
  const getRowKey = (item: T, index: number): string | number => {
    if (keyExtractor) {
      return keyExtractor(item, index);
    }
    if ('id' in item) {
      return item.id as string | number;
    }
    return index;
  };

  const getCellValue = (item: T, column: DataTableColumn<T>, index: number): React.ReactNode => {
    if (column.cell) {
      return column.cell(item, index);
    }
    const key = column.key as keyof T;
    const value = item[key];
    if (value === null || value === undefined) {
      return '-';
    }
    return String(value);
  };

  return (
    <div className={cn('rounded-card-sm md:rounded-card-lg border border-border overflow-hidden', className)}>
      <Table aria-label="Data table">
        <TableHeader>
          <TableRow className="bg-muted border-b border-border hover:bg-muted">
            {columns.map((column, index) => (
              <TableHead
                key={String(column.key) + index}
                scope="col"
                className={cn('text-muted-foreground font-semibold', column.headerClassName)}
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
                className="h-24 text-center text-muted-foreground"
              >
                Loading...
              </TableCell>
            </TableRow>
          ) : data.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={columns.length}
                className="h-24 text-center text-muted-foreground"
              >
                {emptyMessage}
              </TableCell>
            </TableRow>
          ) : (
            data.map((item, rowIndex) => (
              <TableRow
                key={getRowKey(item, rowIndex)}
                onClick={onRowClick ? () => onRowClick(item, rowIndex) : undefined}
                className={onRowClick ? 'cursor-pointer' : undefined}
              >
                {columns.map((column, colIndex) => (
                  <TableCell
                    key={String(column.key) + colIndex}
                    className={column.className}
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

const DataTable = React.memo(DataTableInner) as typeof DataTableInner & {
  displayName?: string;
};
DataTable.displayName = 'DataTable';

export { DataTable };
