/**
 * useServiceTemplates Hook
 *
 * Query hook for fetching service templates with filtering.
 */

import { useQuery } from '@apollo/client';
import type {
  QueryServiceTemplatesArgs,
  ServiceTemplate,
  ServiceTemplateCategory,
  TemplateScope,
} from '@nasnet/api-client/generated';

import { GET_SERVICE_TEMPLATES } from './templates.graphql';

/**
 * Options for useServiceTemplates hook
 */
export interface UseServiceTemplatesOptions {
  /**
   * Router ID (null for built-in templates only)
   */
  routerID?: string | null;

  /**
   * Filter by category
   */
  category?: ServiceTemplateCategory;

  /**
   * Filter by scope
   */
  scope?: TemplateScope;

  /**
   * Text search query (filters client-side by name, description, tags)
   */
  searchQuery?: string;

  /**
   * Whether to include built-in templates (default: true)
   */
  includeBuiltIn?: boolean;

  /**
   * Whether to include custom templates (default: true)
   */
  includeCustom?: boolean;
}

/**
 * Return type for useServiceTemplates hook
 */
export interface UseServiceTemplatesReturn {
  /**
   * Array of service templates
   */
  templates: ServiceTemplate[];

  /**
   * Loading state
   */
  loading: boolean;

  /**
   * Error object if query failed
   */
  error: Error | undefined;

  /**
   * Refetch function to manually reload data
   */
  refetch: () => Promise<unknown>;
}

/**
 * Hook to fetch service templates with filtering
 *
 * Templates are fetched with cache-first policy since they change infrequently.
 * Use refetch() to manually reload if needed.
 *
 * @example
 * ```tsx
 * const { templates, loading, error } = useServiceTemplates({
 *   routerID: 'router-1',
 *   category: 'PRIVACY',
 *   searchQuery: 'tor',
 * });
 * ```
 */
export function useServiceTemplates(
  options: UseServiceTemplatesOptions = {}
): UseServiceTemplatesReturn {
  const {
    routerID,
    category,
    scope,
    searchQuery,
    includeBuiltIn = true,
    includeCustom = true,
  } = options;

  const { data, loading, error, refetch } = useQuery<
    { serviceTemplates: ServiceTemplate[] },
    QueryServiceTemplatesArgs
  >(GET_SERVICE_TEMPLATES, {
    variables: {
      routerID: routerID || null,
      category: category || null,
      scope: scope || null,
    },
    fetchPolicy: 'cache-first',
    // Templates change infrequently, no need for polling
    pollInterval: 0,
  });

  // Client-side filtering
  let filteredTemplates = data?.serviceTemplates || [];

  // Filter by built-in/custom
  if (!includeBuiltIn) {
    filteredTemplates = filteredTemplates.filter((t) => !t.isBuiltIn);
  }
  if (!includeCustom) {
    filteredTemplates = filteredTemplates.filter((t) => t.isBuiltIn);
  }

  // Text search (name, description, tags)
  if (searchQuery && searchQuery.trim()) {
    const query = searchQuery.toLowerCase().trim();
    filteredTemplates = filteredTemplates.filter((template) => {
      const nameMatch = template.name.toLowerCase().includes(query);
      const descMatch = template.description.toLowerCase().includes(query);
      const tagsMatch = template.tags?.some((tag) => tag.toLowerCase().includes(query));
      return nameMatch || descMatch || tagsMatch;
    });
  }

  return {
    templates: filteredTemplates,
    loading,
    error: error ? new Error(error.message) : undefined,
    refetch,
  };
}
