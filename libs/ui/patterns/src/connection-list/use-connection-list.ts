/**
 * useConnectionList Hook
 *
 * Headless hook for ConnectionList pattern component.
 * Provides filtering, sorting, and auto-refresh control for connection tracking data.
 *
 * @see ADR-018: Headless Platform Presenters
 */

import { useMemo, useCallback, useState } from 'react';

import type {
  ConnectionEntry,
  ConnectionFilter,
  ConnectionSort,
  ConnectionSortField,
  SortDirection,
} from './types';

export interface UseConnectionListOptions {
  /** Connection entries to display */
  connections: ConnectionEntry[];

  /** Initial filter state */
  initialFilter?: Partial<ConnectionFilter>;

  /** Initial sort state */
  initialSort?: ConnectionSort;

  /** Auto-refresh interval in milliseconds */
  refreshInterval?: number;

  /** Callback when refresh is triggered */
  onRefresh?: () => void;
}

export interface UseConnectionListReturn {
  // Filtered and sorted data
  filteredConnections: ConnectionEntry[];
  totalCount: number;
  filteredCount: number;

  // Filter state
  filter: ConnectionFilter;
  setFilter: (filter: Partial<ConnectionFilter>) => void;
  clearFilter: () => void;
  hasActiveFilter: boolean;

  // Sort state
  sort: ConnectionSort;
  setSort: (field: ConnectionSortField) => void;
  toggleSortDirection: () => void;

  // Auto-refresh control
  isPaused: boolean;
  togglePause: () => void;
  refresh: () => void;
}

/**
 * Default filter values
 */
const DEFAULT_FILTER: ConnectionFilter = {
  ipAddress: '',
  port: undefined,
  protocol: 'all',
  state: 'all',
};

/**
 * Default sort configuration
 */
const DEFAULT_SORT: ConnectionSort = {
  field: 'timeout',
  direction: 'desc',
};

/**
 * Wildcard IP matching
 * Supports patterns like "192.168.1.*" to match all IPs in that subnet
 */
function matchesWildcardIP(ip: string, pattern: string): boolean {
  if (!pattern || pattern.trim() === '') {
    return true;
  }

  // Escape regex special characters except *
  const escapedPattern = pattern
    .split('*')
    .map((part) => part.replace(/[.+?^${}()|[\]\\]/g, '\\$&'))
    .join('.*');

  const regex = new RegExp(`^${escapedPattern}$`);
  return regex.test(ip);
}

/**
 * Filter connections based on criteria
 */
function filterConnections(
  connections: ConnectionEntry[],
  filter: ConnectionFilter
): ConnectionEntry[] {
  return connections.filter((conn) => {
    // IP filter (matches source or destination with wildcard support)
    if (filter.ipAddress && filter.ipAddress.trim() !== '') {
      const ipPattern = filter.ipAddress.trim();
      const matchesSrc = matchesWildcardIP(conn.srcAddress, ipPattern);
      const matchesDst = matchesWildcardIP(conn.dstAddress, ipPattern);

      if (!matchesSrc && !matchesDst) {
        return false;
      }
    }

    // Port filter (matches source or destination)
    if (filter.port !== undefined) {
      const portMatches =
        conn.srcPort === filter.port || conn.dstPort === filter.port;

      if (!portMatches) {
        return false;
      }
    }

    // Protocol filter
    if (filter.protocol && filter.protocol !== 'all') {
      if (conn.protocol !== filter.protocol) {
        return false;
      }
    }

    // State filter
    if (filter.state && filter.state !== 'all') {
      if (conn.state !== filter.state) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Sort connections by field and direction
 */
function sortConnections(
  connections: ConnectionEntry[],
  sort: ConnectionSort
): ConnectionEntry[] {
  const { field, direction } = sort;
  const multiplier = direction === 'asc' ? 1 : -1;

  return [...connections].sort((a, b) => {
    const aVal = a[field];
    const bVal = b[field];

    // Handle undefined values (push to end)
    if (aVal === undefined && bVal === undefined) return 0;
    if (aVal === undefined) return 1;
    if (bVal === undefined) return -1;

    // String comparison
    if (typeof aVal === 'string' && typeof bVal === 'string') {
      return multiplier * aVal.localeCompare(bVal);
    }

    // Numeric comparison
    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return multiplier * (aVal - bVal);
    }

    return 0;
  });
}

/**
 * Headless hook for connection list logic
 */
export function useConnectionList(
  options: UseConnectionListOptions
): UseConnectionListReturn {
  const {
    connections,
    initialFilter = {},
    initialSort = DEFAULT_SORT,
    onRefresh,
  } = options;

  // Filter state
  const [filter, setFilterState] = useState<ConnectionFilter>({
    ...DEFAULT_FILTER,
    ...initialFilter,
  });

  // Sort state
  const [sort, setSortState] = useState<ConnectionSort>(initialSort);

  // Pause state
  const [isPaused, setIsPaused] = useState(false);

  // Filter connections (memoized)
  const filteredConnections = useMemo(() => {
    const filtered = filterConnections(connections, filter);
    return sortConnections(filtered, sort);
  }, [connections, filter, sort]);

  // Check if filter is active
  const hasActiveFilter = useMemo(() => {
    return (
      (filter.ipAddress !== undefined && filter.ipAddress.trim() !== '') ||
      filter.port !== undefined ||
      (filter.protocol !== undefined && filter.protocol !== 'all') ||
      (filter.state !== undefined && filter.state !== 'all')
    );
  }, [filter]);

  // Update filter
  const setFilter = useCallback((newFilter: Partial<ConnectionFilter>) => {
    setFilterState((prev) => ({ ...prev, ...newFilter }));
  }, []);

  // Clear filter
  const clearFilter = useCallback(() => {
    setFilterState(DEFAULT_FILTER);
  }, []);

  // Set sort field (toggles direction if same field)
  const setSort = useCallback(
    (field: ConnectionSortField) => {
      setSortState((prev) => {
        if (prev.field === field) {
          // Toggle direction
          return {
            field,
            direction: prev.direction === 'asc' ? 'desc' : 'asc',
          };
        }
        // New field, default to descending
        return { field, direction: 'desc' };
      });
    },
    []
  );

  // Toggle sort direction
  const toggleSortDirection = useCallback(() => {
    setSortState((prev) => ({
      ...prev,
      direction: prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  }, []);

  // Toggle pause
  const togglePause = useCallback(() => {
    setIsPaused((prev) => !prev);
  }, []);

  // Refresh callback
  const refresh = useCallback(() => {
    onRefresh?.();
  }, [onRefresh]);

  return {
    // Data
    filteredConnections,
    totalCount: connections.length,
    filteredCount: filteredConnections.length,

    // Filter
    filter,
    setFilter,
    clearFilter,
    hasActiveFilter,

    // Sort
    sort,
    setSort,
    toggleSortDirection,

    // Refresh control
    isPaused,
    togglePause,
    refresh,
  };
}
