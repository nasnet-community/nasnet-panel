/**
 * Resource Query Keys
 *
 * Hierarchical query keys for resources following TanStack Query best practices.
 * Used for cache invalidation and query coordination.
 */

import type { ResourceCategory, ResourceLifecycleState } from '@nasnet/core/types';

/**
 * Query keys for resource-related queries
 */
export const resourceKeys = {
  /** Root key for all resource queries */
  all: ['resources'] as const,

  /** All resources for a specific router */
  byRouter: (routerId: string) => [...resourceKeys.all, 'router', routerId] as const,

  /** Single resource by UUID */
  byUuid: (routerId: string, uuid: string) =>
    [...resourceKeys.byRouter(routerId), 'uuid', uuid] as const,

  /** Resources filtered by category */
  byCategory: (routerId: string, category: ResourceCategory) =>
    [...resourceKeys.byRouter(routerId), 'category', category] as const,

  /** Resources filtered by type */
  byType: (routerId: string, type: string) =>
    [...resourceKeys.byRouter(routerId), 'type', type] as const,

  /** Resources filtered by state */
  byState: (routerId: string, state: ResourceLifecycleState) =>
    [...resourceKeys.byRouter(routerId), 'state', state] as const,

  /** Resource with specific layers */
  layers: (routerId: string, uuid: string, layers: string[]) =>
    [...resourceKeys.byUuid(routerId, uuid), 'layers', layers.sort().join(',')] as const,

  /** Composite resource (with children) */
  composite: (routerId: string, uuid: string) =>
    [...resourceKeys.byUuid(routerId, uuid), 'composite'] as const,

  /** Resource relationships */
  relationships: (routerId: string, uuid: string) =>
    [...resourceKeys.byUuid(routerId, uuid), 'relationships'] as const,

  /** Resource list with filters */
  list: (routerId: string, filters?: ResourceListFilters) => {
    const base = [...resourceKeys.byRouter(routerId), 'list'];
    if (!filters) return base as readonly string[];
    return [
      ...base,
      filters.category,
      filters.type,
      filters.state,
      filters.first,
      filters.after,
    ] as const;
  },
};

/**
 * Filter parameters for resource list queries
 */
export interface ResourceListFilters {
  category?: ResourceCategory;
  type?: string;
  state?: ResourceLifecycleState;
  first?: number;
  after?: string;
}

/**
 * Invalidation helpers
 */
export const resourceInvalidations = {
  /** Invalidate all resources for a router */
  router: (routerId: string) => resourceKeys.byRouter(routerId),

  /** Invalidate a specific resource */
  resource: (routerId: string, uuid: string) => resourceKeys.byUuid(routerId, uuid),

  /** Invalidate all resources of a category */
  category: (routerId: string, category: ResourceCategory) =>
    resourceKeys.byCategory(routerId, category),
};
