/**
 * useRouteList - Headless Hook
 * NAS-6.5: Static Route Management
 *
 * Manages state and logic for RouteList component.
 * Provides filtering, sorting, and action handlers.
 */

import { useState, useMemo, useCallback } from 'react';
import { useRoutes } from '@nasnet/api-client/queries';
import type { Route } from '@nasnet/api-client/generated';

import type {
  RouteFilters,
  RouteSortOptions,
  RouteListProps,
} from './types';

export interface UseRouteListOptions {
  /** Router ID to fetch routes from */
  routerId: string;
  /** Initial filters */
  initialFilters?: Partial<RouteFilters>;
  /** Initial sort options */
  initialSortOptions?: RouteSortOptions;
  /** Callback when route is edited */
  onEdit?: (route: Route) => void;
  /** Callback when route is deleted */
  onDelete?: (route: Route) => void;
  /** Callback when route disabled state is toggled */
  onToggleDisabled?: (route: Route) => void;
  /** Poll interval in milliseconds (default: 10000) */
  pollInterval?: number;
}

export interface UseRouteListReturn
  extends Omit<RouteListProps, 'routerId'> {
  /** Refetch routes from server */
  refetch: () => void;
}

/**
 * Headless hook for RouteList component
 *
 * Encapsulates all business logic for route list management including:
 * - Fetching routes from API
 * - Managing filters and sort state
 * - Computing available routing tables
 * - Handling route actions
 */
export function useRouteList({
  routerId,
  initialFilters = {},
  initialSortOptions = { field: 'destination', direction: 'asc' },
  onEdit,
  onDelete,
  onToggleDisabled,
  pollInterval = 10000,
}: UseRouteListOptions): UseRouteListReturn {
  // Filter state
  const [filters, setFilters] = useState<RouteFilters>({
    table: initialFilters.table,
    type: initialFilters.type,
    searchText: initialFilters.searchText || '',
    activeOnly: initialFilters.activeOnly || false,
  });

  // Sort state
  const [sortOptions, setSortOptions] = useState<RouteSortOptions>(initialSortOptions);

  // Fetch routes using Apollo Client hook
  const {
    routes,
    loading,
    error,
    availableTables,
    refetch,
  } = useRoutes(routerId, {
    table: filters.table,
    type: filters.type,
    pollInterval,
  });

  // Handle filter changes
  const handleFiltersChange = useCallback((newFilters: RouteFilters) => {
    setFilters(newFilters);
  }, []);

  // Handle sort changes
  const handleSortChange = useCallback((newSortOptions: RouteSortOptions) => {
    setSortOptions(newSortOptions);
  }, []);

  // Handle route edit
  const handleEdit = useCallback(
    (route: Route) => {
      if (onEdit) {
        onEdit(route);
      }
    },
    [onEdit]
  );

  // Handle route delete
  const handleDelete = useCallback(
    (route: Route) => {
      if (onDelete) {
        onDelete(route);
      }
    },
    [onDelete]
  );

  // Handle toggle disabled
  const handleToggleDisabled = useCallback(
    (route: Route) => {
      if (onToggleDisabled) {
        onToggleDisabled(route);
      }
    },
    [onToggleDisabled]
  );

  // Handle refresh
  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  return {
    routes,
    loading,
    error: error?.message,
    filters,
    sortOptions,
    availableTables,
    onFiltersChange: handleFiltersChange,
    onSortChange: handleSortChange,
    onEdit: handleEdit,
    onDelete: handleDelete,
    onToggleDisabled: handleToggleDisabled,
    onRefresh: handleRefresh,
    refetch,
  };
}
