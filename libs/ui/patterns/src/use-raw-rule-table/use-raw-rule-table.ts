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

import { useState, useMemo, useCallback } from 'react';
import type { RawRule, RawAction, RawChain } from '@nasnet/core/types';

// ============================================================================
// Types
// ============================================================================

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
  searchTerm?: string;  // Search by comment, address, port
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
  // Filtered and sorted data
  data: RawRule[];

  // Sorting
  sortBy: SortableColumn;
  sortDirection: SortDirection;
  setSortBy: (column: SortableColumn) => void;
  toggleSort: (column: SortableColumn) => void;

  // Filtering
  filters: RawRuleFilters;
  setFilters: (filters: Partial<RawRuleFilters>) => void;
  clearFilters: () => void;
  hasActiveFilters: boolean;

  // Drag-drop reordering
  reorder: (fromIndex: number, toIndex: number) => void;
  isDragging: boolean;
  setIsDragging: (dragging: boolean) => void;
  draggedItemId: string | null;
  setDraggedItemId: (id: string | null) => void;

  // Selection (for bulk operations)
  selectedIds: Set<string>;
  toggleSelection: (id: string) => void;
  selectAll: () => void;
  clearSelection: () => void;
  isSelected: (id: string) => boolean;
  hasSelection: boolean;

  // Column definitions
  columns: ColumnDef<RawRule>[];

  // Counts
  totalCount: number;
  filteredCount: number;
}

// ============================================================================
// Default Values
// ============================================================================

const DEFAULT_FILTERS: RawRuleFilters = {
  action: 'all',
  protocol: 'all',
  status: 'all',
  chain: 'all',
  searchTerm: '',
};

const DEFAULT_COLUMNS: ColumnDef<RawRule>[] = [
  {
    id: 'order',
    header: '#',
    accessor: 'order',
    sortable: true,
    width: '60px',
  },
  {
    id: 'chain',
    header: 'Chain',
    accessor: 'chain',
    sortable: true,
    width: '120px',
  },
  {
    id: 'action',
    header: 'Action',
    accessor: 'action',
    sortable: true,
    width: '120px',
  },
  {
    id: 'protocol',
    header: 'Protocol',
    accessor: 'protocol',
    sortable: true,
    width: '100px',
  },
  {
    id: 'matchers',
    header: 'Matchers',
    accessor: (row) => {
      const matchers: string[] = [];
      if (row.srcAddress) matchers.push(`src:${row.srcAddress}`);
      if (row.dstAddress) matchers.push(`dst:${row.dstAddress}`);
      if (row.srcPort) matchers.push(`sport:${row.srcPort}`);
      if (row.dstPort) matchers.push(`dport:${row.dstPort}`);
      if (row.inInterface) matchers.push(`in:${row.inInterface}`);
      if (row.outInterface) matchers.push(`out:${row.outInterface}`);
      return matchers.join(', ') || '-';
    },
    sortable: false,
    width: '300px',
  },
  {
    id: 'counters',
    header: 'Counters',
    accessor: (row) => {
      if (!row.packets && !row.bytes) return '-';
      return `${row.packets || 0} pkts / ${row.bytes || 0} bytes`;
    },
    sortable: false,
    width: '150px',
  },
  {
    id: 'comment',
    header: 'Comment',
    accessor: 'comment',
    sortable: false,
    width: '200px',
  },
];

// ============================================================================
// Hook Implementation
// ============================================================================

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
export function useRawRuleTable(
  options: UseRawRuleTableOptions
): UseRawRuleTableReturn {
  const {
    data: rawData,
    initialSortBy = 'order',
    initialSortDirection = 'asc',
    initialFilters = {},
    enableSelection = false,
  } = options;

  // ========================================
  // State
  // ========================================

  const [sortBy, setSortByState] = useState<SortableColumn>(initialSortBy);
  const [sortDirection, setSortDirection] = useState<SortDirection>(initialSortDirection);
  const [filters, setFiltersState] = useState<RawRuleFilters>({
    ...DEFAULT_FILTERS,
    ...initialFilters,
  });
  const [isDragging, setIsDragging] = useState(false);
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // ========================================
  // Filtering Logic
  // ========================================

  const filteredData = useMemo(() => {
    let result = [...rawData];

    // Filter by action
    if (filters.action && filters.action !== 'all') {
      result = result.filter((rule) => rule.action === filters.action);
    }

    // Filter by protocol
    if (filters.protocol && filters.protocol !== 'all') {
      result = result.filter((rule) => rule.protocol === filters.protocol);
    }

    // Filter by status (enabled/disabled)
    if (filters.status && filters.status !== 'all') {
      const isDisabled = filters.status === 'disabled';
      result = result.filter((rule) => rule.disabled === isDisabled);
    }

    // Filter by chain
    if (filters.chain && filters.chain !== 'all') {
      result = result.filter((rule) => rule.chain === filters.chain);
    }

    // Filter by search term (comment, address, port)
    if (filters.searchTerm && filters.searchTerm.trim() !== '') {
      const term = filters.searchTerm.toLowerCase();
      result = result.filter((rule) => {
        return (
          rule.comment?.toLowerCase().includes(term) ||
          rule.srcAddress?.toLowerCase().includes(term) ||
          rule.dstAddress?.toLowerCase().includes(term) ||
          rule.srcPort?.toLowerCase().includes(term) ||
          rule.dstPort?.toLowerCase().includes(term) ||
          rule.inInterface?.toLowerCase().includes(term) ||
          rule.outInterface?.toLowerCase().includes(term)
        );
      });
    }

    return result;
  }, [rawData, filters]);

  // ========================================
  // Sorting Logic
  // ========================================

  const sortedData = useMemo(() => {
    const result = [...filteredData];

    result.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortBy) {
        case 'order':
          aValue = a.order ?? 0;
          bValue = b.order ?? 0;
          break;
        case 'chain':
          aValue = a.chain;
          bValue = b.chain;
          break;
        case 'action':
          aValue = a.action;
          bValue = b.action;
          break;
        case 'protocol':
          aValue = a.protocol ?? '';
          bValue = b.protocol ?? '';
          break;
        case 'packets':
          aValue = a.packets ?? 0;
          bValue = b.packets ?? 0;
          break;
        case 'bytes':
          aValue = a.bytes ?? 0;
          bValue = b.bytes ?? 0;
          break;
        default:
          return 0;
      }

      // Handle string vs number comparison
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
    });

    return result;
  }, [filteredData, sortBy, sortDirection]);

  // ========================================
  // Handlers
  // ========================================

  const setSortBy = useCallback((column: SortableColumn) => {
    setSortByState(column);
  }, []);

  const toggleSort = useCallback((column: SortableColumn) => {
    setSortByState((prev) => {
      if (prev === column) {
        // Toggle direction
        setSortDirection((dir) => (dir === 'asc' ? 'desc' : 'asc'));
        return prev;
      } else {
        // New column, default to asc
        setSortDirection('asc');
        return column;
      }
    });
  }, []);

  const setFilters = useCallback((newFilters: Partial<RawRuleFilters>) => {
    setFiltersState((prev) => ({
      ...prev,
      ...newFilters,
    }));
  }, []);

  const clearFilters = useCallback(() => {
    setFiltersState(DEFAULT_FILTERS);
  }, []);

  const hasActiveFilters = useMemo(() => {
    return (
      (filters.action !== 'all' && filters.action !== undefined) ||
      (filters.protocol !== 'all' && filters.protocol !== undefined) ||
      (filters.status !== 'all' && filters.status !== undefined) ||
      (filters.chain !== 'all' && filters.chain !== undefined) ||
      (filters.searchTerm !== '' && filters.searchTerm !== undefined)
    );
  }, [filters]);

  const reorder = useCallback(
    (fromIndex: number, toIndex: number) => {
      // This is just state management - actual API call happens in parent
      const result = Array.from(sortedData);
      const [removed] = result.splice(fromIndex, 1);
      result.splice(toIndex, 0, removed);

      // Update order property
      result.forEach((rule, index) => {
        rule.order = index;
      });
    },
    [sortedData]
  );

  // ========================================
  // Selection Handlers (for bulk operations)
  // ========================================

  const toggleSelection = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    const allIds = new Set(sortedData.map((rule) => rule.id || '').filter(Boolean));
    setSelectedIds(allIds);
  }, [sortedData]);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const isSelected = useCallback(
    (id: string) => {
      return selectedIds.has(id);
    },
    [selectedIds]
  );

  const hasSelection = useMemo(() => {
    return selectedIds.size > 0;
  }, [selectedIds]);

  // ========================================
  // Return
  // ========================================

  return {
    data: sortedData,
    sortBy,
    sortDirection,
    setSortBy,
    toggleSort,
    filters,
    setFilters,
    clearFilters,
    hasActiveFilters,
    reorder,
    isDragging,
    setIsDragging,
    draggedItemId,
    setDraggedItemId,
    selectedIds,
    toggleSelection,
    selectAll,
    clearSelection,
    isSelected,
    hasSelection,
    columns: DEFAULT_COLUMNS,
    totalCount: rawData.length,
    filteredCount: filteredData.length,
  };
}
