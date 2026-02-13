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

import { useState, useMemo } from 'react';
import type { PortKnockSequence } from '@nasnet/core/types';

// ============================================================================
// Types
// ============================================================================

/**
 * Sort column options
 */
export type SortColumn =
  | 'name'
  | 'protectedPort'
  | 'knockCount'
  | 'status'
  | 'recentAccess';

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

// ============================================================================
// Hook Options
// ============================================================================

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

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * Headless hook for port knock sequence table logic
 */
export function usePortKnockSequenceTable(
  options: UsePortKnockSequenceTableOptions
): UsePortKnockSequenceTableReturn {
  const {
    sequences,
    defaultSortBy = 'name',
    defaultSortDirection = 'asc',
    defaultFilters = {},
  } = options;

  // State
  const [sortBy, setSortByState] = useState<SortColumn>(defaultSortBy);
  const [sortDirection, setSortDirection] = useState<SortDirection>(defaultSortDirection);
  const [filters, setFiltersState] = useState<SequenceFilters>(defaultFilters);

  /**
   * Set sort column and optionally direction
   */
  const setSortBy = (column: SortColumn, direction?: SortDirection) => {
    setSortByState(column);
    if (direction) {
      setSortDirection(direction);
    }
  };

  /**
   * Toggle sort direction for current column
   */
  const toggleSort = (column: SortColumn) => {
    if (sortBy === column) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortByState(column);
      setSortDirection('asc');
    }
  };

  /**
   * Set filters
   */
  const setFilters = (newFilters: SequenceFilters) => {
    setFiltersState(newFilters);
  };

  /**
   * Filter data
   */
  const filteredData = useMemo(() => {
    let result = [...sequences];

    // Filter by enabled status
    if (filters.enabled !== undefined) {
      result = result.filter((seq) => seq.enabled === filters.enabled);
    }

    // Filter by search term (name)
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter((seq) =>
        seq.name.toLowerCase().includes(searchLower)
      );
    }

    return result;
  }, [sequences, filters]);

  /**
   * Sort data
   */
  const sortedData = useMemo(() => {
    const result = [...filteredData];

    result.sort((a, b) => {
      let aValue: string | number | boolean;
      let bValue: string | number | boolean;

      switch (sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'protectedPort':
          aValue = a.protectedPort;
          bValue = b.protectedPort;
          break;
        case 'knockCount':
          aValue = a.knockPorts.length;
          bValue = b.knockPorts.length;
          break;
        case 'status':
          aValue = a.enabled ? 1 : 0;
          bValue = b.enabled ? 1 : 0;
          break;
        case 'recentAccess':
          aValue = a.recentAccessCount || 0;
          bValue = b.recentAccessCount || 0;
          break;
        default:
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
      }

      // Compare values
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }

      return 0;
    });

    return result;
  }, [filteredData, sortBy, sortDirection]);

  /**
   * Column definitions
   */
  const columns: ColumnDef[] = useMemo(
    () => [
      {
        id: 'name',
        label: 'Name',
        sortable: true,
        accessor: (row) => row.name,
      },
      {
        id: 'protectedPort',
        label: 'Protected Port',
        sortable: true,
        accessor: (row) => `${row.protectedProtocol.toUpperCase()}:${row.protectedPort}`,
      },
      {
        id: 'knockCount',
        label: 'Knock Ports',
        sortable: true,
        accessor: (row) => row.knockPorts.length,
      },
      {
        id: 'status',
        label: 'Status',
        sortable: true,
        accessor: (row) => row.enabled,
      },
      {
        id: 'recentAccess',
        label: 'Recent Access (24h)',
        sortable: true,
        accessor: (row) => row.recentAccessCount || 0,
      },
    ],
    []
  );

  return {
    data: sortedData,
    sortBy,
    sortDirection,
    setSortBy,
    filters,
    setFilters,
    columns,
    toggleSort,
  };
}
