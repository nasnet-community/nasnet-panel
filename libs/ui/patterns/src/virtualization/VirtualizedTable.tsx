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

import React, {
  useRef,
  useState,
  useCallback,
  useMemo,
  type ReactNode,
  type CSSProperties,
} from 'react';

import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
  type Row,
  type Header,
  type Cell,
  type RowSelectionState,
  type VisibilityState,
} from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';

import { cn } from '@nasnet/ui/primitives';

/**
 * Virtualization threshold - tables with more rows than this will be virtualized
 */
export const TABLE_VIRTUALIZATION_THRESHOLD = 50;

/**
 * Default row heights by platform
 */
export const TABLE_ROW_HEIGHTS = {
  mobile: 56,
  tablet: 48,
  desktop: 40,
} as const;

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
export function VirtualizedTable<T>({
  data,
  columns,
  enableSorting = false,
  enableFiltering = false,
  enableRowSelection = false,
  enableMultiRowSelection = true,
  height = '100%',
  estimateRowHeight = TABLE_ROW_HEIGHTS.desktop,
  overscan = 10,
  className,
  tableClassName,
  headerClassName,
  rowClassName,
  cellClassName,
  onRowClick,
  onRowDoubleClick,
  onSelectionChange,
  onSortingChange,
  initialSorting = [],
  globalFilter,
  forceVirtualization,
  loading = false,
  emptyContent,
  getRowId,
  columnVisibility,
  'aria-label': ariaLabel,
  stickyHeader = true,
  headerHeight = 40,
}: VirtualizedTableProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Table state
  const [sorting, setSorting] = useState<SortingState>(initialSorting);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  // Create table instance
  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
      rowSelection,
      globalFilter,
      columnVisibility,
    },
    onSortingChange: (updater) => {
      const newSorting = typeof updater === 'function' ? updater(sorting) : updater;
      setSorting(newSorting);
      onSortingChange?.(newSorting);
    },
    onColumnFiltersChange: setColumnFilters,
    onRowSelectionChange: (updater) => {
      const newSelection = typeof updater === 'function' ? updater(rowSelection) : updater;
      setRowSelection(newSelection);

      // Notify about selection changes
      if (onSelectionChange) {
        const selectedRows = Object.keys(newSelection)
          .filter((key) => newSelection[key])
          .map((key) => {
            const row = table.getRow(key);
            return row?.original;
          })
          .filter(Boolean) as T[];
        onSelectionChange(selectedRows);
      }
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: enableSorting ? getSortedRowModel() : undefined,
    getFilteredRowModel: enableFiltering ? getFilteredRowModel() : undefined,
    enableRowSelection,
    enableMultiRowSelection,
    getRowId,
  });

  const { rows } = table.getRowModel();
  const headerGroups = table.getHeaderGroups();

  // Determine if virtualization should be active
  const shouldVirtualize = forceVirtualization ?? rows.length > TABLE_VIRTUALIZATION_THRESHOLD;

  // Row virtualizer
  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => containerRef.current,
    estimateSize: () => estimateRowHeight,
    overscan,
    enabled: shouldVirtualize,
  });

  const virtualRows = virtualizer.getVirtualItems();
  const totalSize = virtualizer.getTotalSize();

  // Padding for virtualization positioning
  const paddingTop = virtualRows.length > 0 ? virtualRows[0]?.start ?? 0 : 0;
  const paddingBottom =
    virtualRows.length > 0
      ? totalSize - (virtualRows[virtualRows.length - 1]?.end ?? 0)
      : 0;

  // Handle row click
  const handleRowClick = useCallback(
    (row: Row<T>, event: React.MouseEvent) => {
      if (onRowClick) {
        onRowClick(row);
      }

      // Toggle selection on click if enabled
      if (enableRowSelection && !event.defaultPrevented) {
        row.toggleSelected(!row.getIsSelected());
      }
    },
    [onRowClick, enableRowSelection]
  );

  // Get row class
  const getRowClassName = useCallback(
    (row: Row<T>) => {
      if (typeof rowClassName === 'function') {
        return rowClassName(row);
      }
      return rowClassName;
    },
    [rowClassName]
  );

  // Render header
  const renderHeader = useCallback(
    (header: Header<T, unknown>) => {
      const isSortable = enableSorting && header.column.getCanSort();
      const sortDirection = header.column.getIsSorted();

      return (
        <th
          key={header.id}
          className={cn(
            'px-4 py-2 text-left text-sm font-medium text-muted-foreground border-b',
            isSortable && 'cursor-pointer select-none hover:bg-muted/50',
            headerClassName
          )}
          style={{
            width: header.getSize(),
            minWidth: header.getSize(),
          }}
          onClick={isSortable ? header.column.getToggleSortingHandler() : undefined}
          colSpan={header.colSpan}
        >
          <div className="flex items-center gap-2">
            {header.isPlaceholder
              ? null
              : flexRender(header.column.columnDef.header, header.getContext())}
            {isSortable && (
              <span className="text-xs">
                {sortDirection === 'asc' ? '↑' : sortDirection === 'desc' ? '↓' : '↕'}
              </span>
            )}
          </div>
        </th>
      );
    },
    [enableSorting, headerClassName]
  );

  // Render cell
  const renderCell = useCallback(
    (cell: Cell<T, unknown>) => {
      return (
        <td
          key={cell.id}
          className={cn('px-4 py-2 text-sm border-b', cellClassName)}
          style={{
            width: cell.column.getSize(),
            minWidth: cell.column.getSize(),
          }}
        >
          {flexRender(cell.column.columnDef.cell, cell.getContext())}
        </td>
      );
    },
    [cellClassName]
  );

  // Render row
  const renderRow = useCallback(
    (row: Row<T>, style?: CSSProperties) => {
      const isSelected = row.getIsSelected();

      return (
        <tr
          key={row.id}
          className={cn(
            'border-b transition-colors',
            isSelected && 'bg-primary/10',
            onRowClick && 'cursor-pointer hover:bg-muted/50',
            getRowClassName(row)
          )}
          style={style}
          onClick={(e) => handleRowClick(row, e)}
          onDoubleClick={onRowDoubleClick ? () => onRowDoubleClick(row) : undefined}
          data-state={isSelected ? 'selected' : undefined}
          aria-selected={isSelected}
        >
          {row.getVisibleCells().map(renderCell)}
        </tr>
      );
    },
    [handleRowClick, onRowDoubleClick, getRowClassName, renderCell]
  );

  // Loading state
  if (loading) {
    return (
      <div
        ref={containerRef}
        className={cn('overflow-auto', className)}
        style={{ height }}
        aria-busy="true"
      >
        <div className="flex items-center justify-center h-full">
          <div className="animate-pulse text-muted-foreground">Loading...</div>
        </div>
      </div>
    );
  }

  // Empty state
  if (rows.length === 0) {
    return (
      <div
        ref={containerRef}
        className={cn('overflow-auto', className)}
        style={{ height }}
        aria-label={ariaLabel}
      >
        {/* Still render header */}
        <table className={cn('w-full border-collapse', tableClassName)}>
          <thead className={stickyHeader ? 'sticky top-0 z-10 bg-background' : undefined}>
            {headerGroups.map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map(renderHeader)}
              </tr>
            ))}
          </thead>
        </table>
        {emptyContent || (
          <div className="flex items-center justify-center h-32 text-muted-foreground">
            No data to display
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={cn('overflow-auto', className)}
      style={{ height }}
      role="grid"
      aria-label={ariaLabel}
      aria-rowcount={rows.length}
    >
      <table className={cn('w-full border-collapse', tableClassName)}>
        {/* Header */}
        <thead
          className={cn(stickyHeader && 'sticky z-10 bg-background')}
          style={stickyHeader ? { top: 0 } : undefined}
        >
          {headerGroups.map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map(renderHeader)}
            </tr>
          ))}
        </thead>

        {/* Body */}
        <tbody>
          {shouldVirtualize ? (
            <>
              {/* Top padding for virtualization */}
              {paddingTop > 0 && (
                <tr>
                  <td style={{ height: paddingTop }} colSpan={columns.length} />
                </tr>
              )}

              {/* Virtualized rows */}
              {virtualRows.map((virtualRow) => {
                const row = rows[virtualRow.index];
                return renderRow(row, {
                  height: virtualRow.size,
                });
              })}

              {/* Bottom padding for virtualization */}
              {paddingBottom > 0 && (
                <tr>
                  <td style={{ height: paddingBottom }} colSpan={columns.length} />
                </tr>
              )}
            </>
          ) : (
            // Non-virtualized rendering for small datasets
            rows.map((row) => renderRow(row))
          )}
        </tbody>
      </table>
    </div>
  );
}

VirtualizedTable.displayName = 'VirtualizedTable';

/**
 * Utility type for creating column definitions with better type inference
 */
export type TypedColumnDef<T> = ColumnDef<T, unknown>;

/**
 * Helper to create a simple text column
 */
export function createTextColumn<T>(
  id: keyof T & string,
  header: string,
  options?: Partial<ColumnDef<T, unknown>>
): ColumnDef<T, unknown> {
  return {
    id,
    accessorKey: id,
    header,
    cell: (info) => String(info.getValue() ?? ''),
    ...options,
  };
}

/**
 * Helper to create a selection column
 */
export function createSelectionColumn<T>(): ColumnDef<T, unknown> {
  return {
    id: 'select',
    header: ({ table }) => (
      <input
        type="checkbox"
        checked={table.getIsAllRowsSelected()}
        onChange={table.getToggleAllRowsSelectedHandler()}
        aria-label="Select all rows"
      />
    ),
    cell: ({ row }) => (
      <input
        type="checkbox"
        checked={row.getIsSelected()}
        onChange={row.getToggleSelectedHandler()}
        onClick={(e) => e.stopPropagation()}
        aria-label={`Select row ${row.index + 1}`}
      />
    ),
    size: 40,
    enableSorting: false,
  };
}
