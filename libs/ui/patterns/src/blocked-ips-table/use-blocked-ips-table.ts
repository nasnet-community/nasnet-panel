/**
 * useBlockedIPsTable Hook
 *
 * Headless hook for BlockedIPsTable pattern component.
 * Provides filtering, sorting, and selection logic for blocked IPs data.
 *
 * @see ADR-018: Headless Platform Presenters
 * @see [Headless + Platform Presenters Pattern](../PLATFORM_PRESENTER_GUIDE.md)
 */

import { useMemo, useCallback, useState } from 'react';

import type {
  BlockedIP,
  BlockedIPFilter,
  BlockedIPSort,
  BlockedIPSortField,
  SortDirection,
} from './types';

export interface UseBlockedIPsTableOptions {
  /** Blocked IP entries to display */
  blockedIPs: BlockedIP[];

  /** Initial filter state */
  initialFilter?: Partial<BlockedIPFilter>;

  /** Initial sort state */
  initialSort?: BlockedIPSort;

  /** Callback when refresh is triggered */
  onRefresh?: () => void;
}

export interface UseBlockedIPsTableReturn {
  // Filtered and sorted data
  filteredBlockedIPs: BlockedIP[];
  totalCount: number;
  filteredCount: number;

  // Filter state
  filter: BlockedIPFilter;
  setFilter: (filter: Partial<BlockedIPFilter>) => void;
  clearFilter: () => void;
  hasActiveFilter: boolean;

  // Sort state
  sort: BlockedIPSort;
  setSort: (field: BlockedIPSortField) => void;
  toggleSortDirection: () => void;

  // Selection state
  selectedIPs: string[];
  toggleSelection: (address: string) => void;
  selectAll: () => void;
  clearSelection: () => void;
  isSelected: (address: string) => boolean;
  hasSelection: boolean;

  // Refresh
  refresh: () => void;
}

/**
 * Default filter values
 */
const DEFAULT_FILTER: BlockedIPFilter = {
  ipAddress: '',
  list: 'all',
};

/**
 * Default sort configuration (sort by lastBlocked descending)
 */
const DEFAULT_SORT: BlockedIPSort = {
  field: 'lastBlocked',
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
 * Filter blocked IPs based on criteria
 */
function filterBlockedIPs(
  blockedIPs: BlockedIP[],
  filter: BlockedIPFilter
): BlockedIP[] {
  return blockedIPs.filter((entry) => {
    // IP filter (wildcard support)
    if (filter.ipAddress && filter.ipAddress.trim() !== '') {
      const ipPattern = filter.ipAddress.trim();
      if (!matchesWildcardIP(entry.address, ipPattern)) {
        return false;
      }
    }

    // List filter
    if (filter.list && filter.list !== 'all') {
      if (entry.list !== filter.list) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Sort blocked IPs by field and direction
 */
function sortBlockedIPs(
  blockedIPs: BlockedIP[],
  sort: BlockedIPSort
): BlockedIP[] {
  const { field, direction } = sort;
  const multiplier = direction === 'asc' ? 1 : -1;

  return [...blockedIPs].sort((a, b) => {
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

    // Date comparison
    if (aVal instanceof Date && bVal instanceof Date) {
      return multiplier * (aVal.getTime() - bVal.getTime());
    }

    return 0;
  });
}

/**
 * Headless hook for blocked IPs table logic.
 *
 * Manages filtering by IP address (wildcard support) and list,
 * sorting by any field with direction toggle, and multi-select functionality.
 *
 * @param options - Configuration options for the table hook
 * @returns Object containing filtered data, filter controls, sort controls, selection controls, and refresh function
 *
 * @example
 * ```tsx
 * const table = useBlockedIPsTable({
 *   blockedIPs: dhcpLeases,
 *   initialFilter: { list: 'blacklist' },
 *   initialSort: { field: 'lastBlocked', direction: 'desc' },
 *   onRefresh: () => refetchBlockedIPs(),
 * });
 *
 * return (
 *   <div>
 *     <input
 *       value={table.filter.ipAddress}
 *       onChange={(e) => table.setFilter({ ipAddress: e.target.value })}
 *       placeholder="Filter by IP (supports 192.168.1.*)"
 *     />
 *     <table>
 *       <tbody>
 *         {table.filteredBlockedIPs.map((ip) => (
 *           <tr
 *             key={ip.address}
 *             onClick={() => table.toggleSelection(ip.address)}
 *           >
 *             <td>
 *               <Checkbox checked={table.isSelected(ip.address)} />
 *             </td>
 *             <td>{ip.address}</td>
 *             <td>{ip.list}</td>
 *           </tr>
 *         ))}
 *       </tbody>
 *     </table>
 *     <p>Showing {table.filteredCount} of {table.totalCount} IPs</p>
 *   </div>
 * );
 * ```
 */
export function useBlockedIPsTable(
  options: UseBlockedIPsTableOptions
): UseBlockedIPsTableReturn {
  const {
    blockedIPs,
    initialFilter = {},
    initialSort = DEFAULT_SORT,
    onRefresh,
  } = options;

  // Filter state
  const [filter, setFilterState] = useState<BlockedIPFilter>({
    ...DEFAULT_FILTER,
    ...initialFilter,
  });

  // Sort state
  const [sort, setSortState] = useState<BlockedIPSort>(initialSort);

  // Selection state
  const [selectedIPs, setSelectedIPs] = useState<string[]>([]);

  // Filter and sort blocked IPs (memoized)
  const filteredBlockedIPs = useMemo(() => {
    const filtered = filterBlockedIPs(blockedIPs, filter);
    return sortBlockedIPs(filtered, sort);
  }, [blockedIPs, filter, sort]);

  // Check if filter is active
  const hasActiveFilter = useMemo(() => {
    return (
      (filter.ipAddress !== undefined && filter.ipAddress.trim() !== '') ||
      (filter.list !== undefined && filter.list !== 'all')
    );
  }, [filter]);

  // Update filter
  const setFilter = useCallback((newFilter: Partial<BlockedIPFilter>) => {
    setFilterState((prev) => ({ ...prev, ...newFilter }));
  }, []);

  // Clear filter
  const clearFilter = useCallback(() => {
    setFilterState(DEFAULT_FILTER);
  }, []);

  // Set sort field (toggles direction if same field)
  const setSort = useCallback(
    (field: BlockedIPSortField) => {
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

  // Toggle IP selection
  const toggleSelection = useCallback((address: string) => {
    setSelectedIPs((prev) => {
      if (prev.includes(address)) {
        return prev.filter((ip) => ip !== address);
      }
      return [...prev, address];
    });
  }, []);

  // Select all filtered IPs
  const selectAll = useCallback(() => {
    setSelectedIPs(filteredBlockedIPs.map((entry) => entry.address));
  }, [filteredBlockedIPs]);

  // Clear selection
  const clearSelection = useCallback(() => {
    setSelectedIPs([]);
  }, []);

  // Check if IP is selected
  const isSelected = useCallback(
    (address: string) => selectedIPs.includes(address),
    [selectedIPs]
  );

  // Check if any IPs are selected
  const hasSelection = selectedIPs.length > 0;

  // Refresh callback
  const refresh = useCallback(() => {
    onRefresh?.();
  }, [onRefresh]);

  return {
    // Data
    filteredBlockedIPs,
    totalCount: blockedIPs.length,
    filteredCount: filteredBlockedIPs.length,

    // Filter
    filter,
    setFilter,
    clearFilter,
    hasActiveFilter,

    // Sort
    sort,
    setSort,
    toggleSortDirection,

    // Selection
    selectedIPs,
    toggleSelection,
    selectAll,
    clearSelection,
    isSelected,
    hasSelection,

    // Refresh
    refresh,
  };
}
