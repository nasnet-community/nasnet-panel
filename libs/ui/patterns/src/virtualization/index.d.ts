/**
 * Virtualization Utilities
 *
 * High-performance list and table virtualization components using TanStack Virtual.
 * These components automatically enable virtualization for large datasets.
 *
 * @example
 * ```tsx
 * import {
 *   VirtualizedList,
 *   VirtualizedTable,
 *   useVirtualList,
 *   VIRTUALIZATION_THRESHOLD,
 * } from '@nasnet/ui/patterns';
 *
 * // List virtualization
 * <VirtualizedList
 *   items={items}
 *   estimateSize={48}
 *   renderItem={({ item }) => <ItemRow item={item} />}
 * />
 *
 * // Table virtualization
 * <VirtualizedTable
 *   data={data}
 *   columns={columns}
 *   enableSorting
 * />
 * ```
 */
export { useVirtualList, useScrollRestoration, VIRTUALIZATION_THRESHOLD, DEFAULT_OVERSCAN, ROW_HEIGHTS, type UseVirtualListOptions, type UseVirtualListReturn, } from './useVirtualList';
export { VirtualizedList, type VirtualizedListProps, type VirtualizedListItemProps, } from './VirtualizedList';
export { VirtualizedTable, TABLE_VIRTUALIZATION_THRESHOLD, TABLE_ROW_HEIGHTS, createTextColumn, createSelectionColumn, type VirtualizedTableProps, type TypedColumnDef, } from './VirtualizedTable';
//# sourceMappingURL=index.d.ts.map