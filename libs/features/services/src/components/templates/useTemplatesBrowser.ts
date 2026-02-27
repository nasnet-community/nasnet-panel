/**
 * useTemplatesBrowser Hook
 *
 * @description Headless hook for templates browser with filtering and sorting.
 * Manages filter state, fetches templates, and applies client-side filtering and sorting.
 */

import { useState, useMemo, useCallback } from 'react';
import { useServiceTemplates } from '@nasnet/api-client/queries';
import type { ServiceTemplate } from '@nasnet/api-client/generated';

import { DEFAULT_FILTERS } from './types';
import type { TemplateBrowserFilters, TemplateSortBy } from './types';

/**
 * Return type for useTemplatesBrowser hook
 */
export interface UseTemplatesBrowserReturn {
  /** Filtered and sorted templates */
  templates: ServiceTemplate[];
  /** Loading state */
  loading: boolean;
  /** Error state */
  error: Error | undefined;
  /** Current filters */
  filters: TemplateBrowserFilters;
  /** Update filters */
  updateFilters: (filters: Partial<TemplateBrowserFilters>) => void;
  /** Reset filters to defaults */
  resetFilters: () => void;
  /** Whether any filters are active */
  hasActiveFilters: boolean;
  /** Refetch templates */
  refetch: () => void;
}

/**
 * Sort templates by the specified field
 */
function sortTemplates(templates: ServiceTemplate[], sortBy: TemplateSortBy): ServiceTemplate[] {
  const sorted = [...templates];

  switch (sortBy) {
    case 'name':
      sorted.sort((a, b) => a.name.localeCompare(b.name));
      break;
    case 'updated':
      sorted.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      break;
    case 'category':
      sorted.sort((a, b) => a.category.localeCompare(b.category));
      break;
    case 'services':
      sorted.sort((a, b) => b.services.length - a.services.length);
      break;
    default:
      break;
  }

  return sorted;
}

/**
 * Headless hook for templates browser
 *
 * Manages filter state, fetches templates, and applies client-side
 * filtering and sorting.
 *
 * @param routerId - The router ID to fetch templates for
 * @returns Hook state with templates, filters, and update functions
 *
 * @example
 * ```tsx
 * const {
 *   templates,
 *   loading,
 *   filters,
 *   updateFilters,
 *   hasActiveFilters,
 * } = useTemplatesBrowser('router-1');
 * ```
 */
export function useTemplatesBrowser(routerId: string): UseTemplatesBrowserReturn {
  const [filters, setFilters] = useState<TemplateBrowserFilters>(DEFAULT_FILTERS);

  // Fetch templates with API hook
  const {
    templates: rawTemplates,
    loading,
    error,
    refetch,
  } = useServiceTemplates({
    routerID: routerId,
    category: filters.category || undefined,
    scope: filters.scope || undefined,
    searchQuery: filters.searchQuery,
    includeBuiltIn: filters.showBuiltIn,
    includeCustom: filters.showCustom,
  });

  // Apply client-side sorting
  const sortedTemplates = useMemo(
    () => sortTemplates(rawTemplates, filters.sortBy),
    [rawTemplates, filters.sortBy]
  );

  // Update filters (partial update)
  const updateFilters = useCallback((updates: Partial<TemplateBrowserFilters>) => {
    setFilters((prev) => ({ ...prev, ...updates }));
  }, []);

  // Reset filters to defaults
  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
  }, []);

  // Check if any filters are active
  const hasActiveFilters = useMemo(() => {
    return (
      filters.searchQuery !== DEFAULT_FILTERS.searchQuery ||
      filters.category !== DEFAULT_FILTERS.category ||
      filters.scope !== DEFAULT_FILTERS.scope ||
      filters.showBuiltIn !== DEFAULT_FILTERS.showBuiltIn ||
      filters.showCustom !== DEFAULT_FILTERS.showCustom ||
      filters.sortBy !== DEFAULT_FILTERS.sortBy
    );
  }, [filters]);

  return {
    templates: sortedTemplates,
    loading,
    error,
    filters,
    updateFilters,
    resetFilters,
    hasActiveFilters,
    refetch,
  };
}
