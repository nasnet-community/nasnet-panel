/**
 * useInstanceManager Hook
 *
 * Headless hook containing all business logic for InstanceManager.
 * Platform presenters consume this hook for shared state and behavior.
 *
 * @see ADR-018: Headless Platform Presenters
 */

import { useMemo, useCallback } from 'react';

import type {
  InstanceManagerProps,
  InstanceFilters,
  InstanceSort,
  BulkOperation,
  BulkAction,
} from './types';
import type { Service } from '../service-card/types';

/**
 * Return type for useInstanceManager hook
 */
export interface UseInstanceManagerReturn {
  // Filtered and sorted instances
  filteredInstances: Service[];
  totalCount: number;
  filteredCount: number;

  // Selection
  selectedIds: string[];
  selectedCount: number;
  allSelected: boolean;
  someSelected: boolean;

  // Filters
  activeFilters: InstanceFilters;
  hasActiveFilters: boolean;

  // Sort
  activeSort: InstanceSort;

  // Bulk actions
  availableBulkActions: BulkAction[];
  canPerformBulkOperation: boolean;

  // Event handlers (stable references)
  handleSelectAll: () => void;
  handleClearSelection: () => void;
  handleToggleSelection: (id: string) => void;
  handleInstanceClick: (instance: Service) => void;
  handleBulkOperation: (operation: BulkOperation) => void;
  handleFilterChange: (filters: Partial<InstanceFilters>) => void;
  handleSortChange: (field: InstanceSort['field']) => void;
  handleClearFilters: () => void;
}

/**
 * Default filters
 */
const DEFAULT_FILTERS: InstanceFilters = {
  search: '',
  category: 'all',
  status: 'all',
};

/**
 * Default sort
 */
const DEFAULT_SORT: InstanceSort = {
  field: 'name',
  direction: 'asc',
};

/**
 * Filter instances based on criteria
 */
function filterInstances(instances: Service[], filters: InstanceFilters): Service[] {
  let filtered = instances;

  // Search filter
  if (filters.search) {
    const searchLower = filters.search.toLowerCase();
    filtered = filtered.filter(
      (instance) =>
        instance.name.toLowerCase().includes(searchLower) ||
        instance.description?.toLowerCase().includes(searchLower)
    );
  }

  // Category filter
  if (filters.category !== 'all') {
    filtered = filtered.filter((instance) => instance.category === filters.category);
  }

  // Status filter
  if (filters.status !== 'all') {
    filtered = filtered.filter((instance) => instance.status === filters.status);
  }

  return filtered;
}

/**
 * Sort instances
 */
function sortInstances(instances: Service[], sort: InstanceSort): Service[] {
  return [...instances].sort((a, b) => {
    let comparison = 0;

    switch (sort.field) {
      case 'name':
        comparison = a.name.localeCompare(b.name);
        break;
      case 'status':
        comparison = a.status.localeCompare(b.status);
        break;
      case 'category':
        comparison = a.category.localeCompare(b.category);
        break;
      case 'cpu':
        comparison = (a.metrics?.cpu || 0) - (b.metrics?.cpu || 0);
        break;
      case 'memory':
        comparison = (a.metrics?.memory || 0) - (b.metrics?.memory || 0);
        break;
    }

    return sort.direction === 'asc' ? comparison : -comparison;
  });
}

/**
 * Get available bulk actions based on selection
 */
function getAvailableBulkActions(instances: Service[], selectedIds: string[]): BulkAction[] {
  if (selectedIds.length === 0) return [];

  const selectedInstances = instances.filter((i) => selectedIds.includes(i.id));
  const allRunning = selectedInstances.every((i) => i.status === 'running');
  const allStopped = selectedInstances.every(
    (i) => i.status === 'stopped' || i.status === 'installed'
  );
  const anyRunning = selectedInstances.some((i) => i.status === 'running');

  const actions: BulkAction[] = [];

  if (allStopped) {
    actions.push({
      operation: 'start',
      label: `Start (${selectedIds.length})`,
      variant: 'default',
    });
  }

  if (allRunning) {
    actions.push({
      operation: 'stop',
      label: `Stop (${selectedIds.length})`,
      variant: 'secondary',
    });
  }

  if (anyRunning) {
    actions.push({
      operation: 'restart',
      label: `Restart (${selectedIds.length})`,
      variant: 'secondary',
    });
  }

  actions.push({
    operation: 'delete',
    label: `Delete (${selectedIds.length})`,
    variant: 'destructive',
    requiresConfirmation: true,
  });

  return actions;
}

/**
 * Headless hook for InstanceManager pattern
 *
 * Contains all business logic, state management, and computed values.
 * Event handlers are memoized for stable references.
 */
export function useInstanceManager(props: InstanceManagerProps): UseInstanceManagerReturn {
  const {
    instances,
    selectedIds = [],
    onSelectionChange,
    onInstanceClick,
    onBulkOperation,
    filters = DEFAULT_FILTERS,
    onFiltersChange,
    sort = DEFAULT_SORT,
    onSortChange,
  } = props;

  // Active filters and sort
  const activeFilters = useMemo(() => ({ ...DEFAULT_FILTERS, ...filters }), [filters]);
  const activeSort = useMemo(() => ({ ...DEFAULT_SORT, ...sort }), [sort]);

  // Filter and sort instances
  const filteredInstances = useMemo(() => {
    const filtered = filterInstances(instances, activeFilters);
    return sortInstances(filtered, activeSort);
  }, [instances, activeFilters, activeSort]);

  // Counts
  const totalCount = instances.length;
  const filteredCount = filteredInstances.length;
  const selectedCount = selectedIds.length;

  // Selection state
  const allSelected = useMemo(
    () => filteredCount > 0 && selectedIds.length === filteredCount,
    [filteredCount, selectedIds.length]
  );

  const someSelected = useMemo(
    () => selectedIds.length > 0 && !allSelected,
    [selectedIds.length, allSelected]
  );

  // Check if there are active filters
  const hasActiveFilters = useMemo(
    () =>
      activeFilters.search !== '' ||
      activeFilters.category !== 'all' ||
      activeFilters.status !== 'all',
    [activeFilters]
  );

  // Bulk actions
  const availableBulkActions = useMemo(
    () => getAvailableBulkActions(instances, selectedIds),
    [instances, selectedIds]
  );

  const canPerformBulkOperation = selectedIds.length > 0;

  // Event handlers with stable references
  const handleSelectAll = useCallback(() => {
    if (allSelected) {
      onSelectionChange?.([]);
    } else {
      onSelectionChange?.(filteredInstances.map((i) => i.id));
    }
  }, [allSelected, filteredInstances, onSelectionChange]);

  const handleClearSelection = useCallback(() => {
    onSelectionChange?.([]);
  }, [onSelectionChange]);

  const handleToggleSelection = useCallback(
    (id: string) => {
      const newSelection =
        selectedIds.includes(id) ? selectedIds.filter((i) => i !== id) : [...selectedIds, id];
      onSelectionChange?.(newSelection);
    },
    [selectedIds, onSelectionChange]
  );

  const handleInstanceClick = useCallback(
    (instance: Service) => {
      onInstanceClick?.(instance);
    },
    [onInstanceClick]
  );

  const handleBulkOperation = useCallback(
    (operation: BulkOperation) => {
      onBulkOperation?.(operation, selectedIds);
    },
    [onBulkOperation, selectedIds]
  );

  const handleFilterChange = useCallback(
    (partialFilters: Partial<InstanceFilters>) => {
      onFiltersChange?.({ ...activeFilters, ...partialFilters });
    },
    [activeFilters, onFiltersChange]
  );

  const handleSortChange = useCallback(
    (field: InstanceSort['field']) => {
      const newDirection =
        activeSort.field === field && activeSort.direction === 'asc' ? 'desc' : 'asc';
      onSortChange?.({ field, direction: newDirection });
    },
    [activeSort, onSortChange]
  );

  const handleClearFilters = useCallback(() => {
    onFiltersChange?.(DEFAULT_FILTERS);
  }, [onFiltersChange]);

  return {
    // Filtered and sorted instances
    filteredInstances,
    totalCount,
    filteredCount,

    // Selection
    selectedIds,
    selectedCount,
    allSelected,
    someSelected,

    // Filters
    activeFilters,
    hasActiveFilters,

    // Sort
    activeSort,

    // Bulk actions
    availableBulkActions,
    canPerformBulkOperation,

    // Event handlers
    handleSelectAll,
    handleClearSelection,
    handleToggleSelection,
    handleInstanceClick,
    handleBulkOperation,
    handleFilterChange,
    handleSortChange,
    handleClearFilters,
  };
}
