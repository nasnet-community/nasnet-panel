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

import { useState, useMemo, useCallback } from 'react';

import type { MangleRule, MangleAction } from '@nasnet/core/types';

// ============================================================================
// Types
// ============================================================================

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
  markName?: string;  // Search by mark name
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
  // Filtered and sorted data
  data: MangleRule[];

  // Sorting
  sortBy: SortableColumn;
  sortDirection: SortDirection;
  setSortBy: (column: SortableColumn) => void;
  toggleSort: (column: SortableColumn) => void;

  // Filtering
  filters: MangleRuleFilters;
  setFilters: (filters: Partial<MangleRuleFilters>) => void;
  clearFilters: () => void;
  hasActiveFilters: boolean;

  // Drag-drop reordering
  reorder: (fromIndex: number, toIndex: number) => void;
  isDragging: boolean;
  setIsDragging: (dragging: boolean) => void;
  draggedItemId: string | null;
  setDraggedItemId: (id: string | null) => void;

  // Column definitions
  columns: ColumnDef<MangleRule>[];

  // Counts
  totalCount: number;
  filteredCount: number;
}

// ============================================================================
// Default Values
// ============================================================================

const DEFAULT_FILTERS: MangleRuleFilters = {
  action: 'all',
  protocol: 'all',
  status: 'all',
  markName: '',
  chain: 'all',
};

const DEFAULT_COLUMNS: ColumnDef<MangleRule>[] = [
  {
    id: 'position',
    header: 'Position',
    accessor: 'position',
    sortable: true,
    width: '80px',
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
    width: '150px',
  },
  {
    id: 'markValue',
    header: 'Mark Value',
    accessor: (row) => row.newConnectionMark || row.newPacketMark || row.newRoutingMark || '-',
    sortable: false,
    width: '150px',
  },
  {
    id: 'matchers',
    header: 'Matchers',
    accessor: (row) => {
      const matchers: string[] = [];
      if (row.protocol) matchers.push(`proto:${row.protocol}`);
      if (row.srcAddress) matchers.push(`src:${row.srcAddress}`);
      if (row.dstAddress) matchers.push(`dst:${row.dstAddress}`);
      if (row.srcPort) matchers.push(`sport:${row.srcPort}`);
      if (row.dstPort) matchers.push(`dport:${row.dstPort}`);
      if (row.inInterface) matchers.push(`in:${row.inInterface}`);
      if (row.outInterface) matchers.push(`out:${row.outInterface}`);
      return matchers.length > 0 ? matchers.join(', ') : 'any';
    },
    sortable: false,
  },
  {
    id: 'packets',
    header: 'Packets',
    accessor: 'packets',
    sortable: true,
    width: '100px',
  },
  {
    id: 'bytes',
    header: 'Bytes',
    accessor: 'bytes',
    sortable: true,
    width: '100px',
  },
  {
    id: 'enabled',
    header: 'Enabled',
    accessor: (row) => !row.disabled,
    sortable: true,
    width: '80px',
  },
];

// ============================================================================
// Hook Implementation
// ============================================================================

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
export function useMangleRuleTable(options: UseMangleRuleTableOptions): UseMangleRuleTableReturn {
  const {
    data: rawData,
    initialSortBy = 'position',
    initialSortDirection = 'asc',
    initialFilters = {},
  } = options;

  // State
  const [sortBy, setSortByState] = useState<SortableColumn>(initialSortBy);
  const [sortDirection, setSortDirection] = useState<SortDirection>(initialSortDirection);
  const [filters, setFiltersState] = useState<MangleRuleFilters>({
    ...DEFAULT_FILTERS,
    ...initialFilters,
  });
  const [isDragging, setIsDragging] = useState(false);
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);

  // Derived state
  const hasActiveFilters = useMemo(() => {
    return (
      (filters.action !== 'all' && filters.action !== undefined) ||
      (filters.protocol !== 'all' && filters.protocol !== undefined) ||
      (filters.status !== 'all' && filters.status !== undefined) ||
      (filters.markName !== '' && filters.markName !== undefined) ||
      (filters.chain !== 'all' && filters.chain !== undefined)
    );
  }, [filters]);

  // Filter data
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
      const shouldBeDisabled = filters.status === 'disabled';
      result = result.filter((rule) => rule.disabled === shouldBeDisabled);
    }

    // Filter by mark name (search across all mark types)
    if (filters.markName && filters.markName.trim() !== '') {
      const searchTerm = filters.markName.toLowerCase();
      result = result.filter((rule) => {
        const marks = [
          rule.newConnectionMark,
          rule.newPacketMark,
          rule.newRoutingMark,
        ].filter(Boolean);
        return marks.some((mark) => mark?.toLowerCase().includes(searchTerm));
      });
    }

    // Filter by chain
    if (filters.chain && filters.chain !== 'all') {
      result = result.filter((rule) => rule.chain === filters.chain);
    }

    return result;
  }, [rawData, filters]);

  // Sort data
  const sortedData = useMemo(() => {
    const result = [...filteredData];

    result.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortBy) {
        case 'position':
          aValue = a.position ?? 999999;
          bValue = b.position ?? 999999;
          break;
        case 'chain':
          aValue = a.chain;
          bValue = b.chain;
          break;
        case 'action':
          aValue = a.action;
          bValue = b.action;
          break;
        case 'newConnectionMark':
          aValue = a.newConnectionMark ?? '';
          bValue = b.newConnectionMark ?? '';
          break;
        case 'newPacketMark':
          aValue = a.newPacketMark ?? '';
          bValue = b.newPacketMark ?? '';
          break;
        case 'newRoutingMark':
          aValue = a.newRoutingMark ?? '';
          bValue = b.newRoutingMark ?? '';
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

      // Handle string comparison
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      // Handle number comparison
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }

      return 0;
    });

    return result;
  }, [filteredData, sortBy, sortDirection]);

  // Actions
  const setSortBy = useCallback((column: SortableColumn) => {
    setSortByState((prev) => {
      if (prev === column) {
        // Toggle direction if same column
        setSortDirection((dir) => (dir === 'asc' ? 'desc' : 'asc'));
        return prev;
      } else {
        // New column, default to asc
        setSortDirection('asc');
        return column;
      }
    });
  }, []);

  const toggleSort = useCallback((column: SortableColumn) => {
    setSortBy(column);
  }, [setSortBy]);

  const setFilters = useCallback((newFilters: Partial<MangleRuleFilters>) => {
    setFiltersState((prev) => ({ ...prev, ...newFilters }));
  }, []);

  const clearFilters = useCallback(() => {
    setFiltersState(DEFAULT_FILTERS);
  }, []);

  const reorder = useCallback(
    (fromIndex: number, toIndex: number) => {
      // This is just state management - the actual reordering API call
      // should be handled by the component using useMoveMangleRule mutation
      console.log(`Reorder requested: ${fromIndex} -> ${toIndex}`);
    },
    []
  );

  return {
    // Data
    data: sortedData,

    // Sorting
    sortBy,
    sortDirection,
    setSortBy,
    toggleSort,

    // Filtering
    filters,
    setFilters,
    clearFilters,
    hasActiveFilters,

    // Drag-drop
    reorder,
    isDragging,
    setIsDragging,
    draggedItemId,
    setDraggedItemId,

    // Column definitions
    columns: DEFAULT_COLUMNS,

    // Counts
    totalCount: rawData.length,
    filteredCount: sortedData.length,
  };
}
