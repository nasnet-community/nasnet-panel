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
export declare const resourceKeys: {
  /** Root key for all resource queries */
  all: readonly ['resources'];
  /** All resources for a specific router */
  byRouter: (routerId: string) => readonly ['resources', 'router', string];
  /** Single resource by UUID */
  byUuid: (
    routerId: string,
    uuid: string
  ) => readonly ['resources', 'router', string, 'uuid', string];
  /** Resources filtered by category */
  byCategory: (
    routerId: string,
    category: ResourceCategory
  ) => readonly ['resources', 'router', string, 'category', ResourceCategory];
  /** Resources filtered by type */
  byType: (
    routerId: string,
    type: string
  ) => readonly ['resources', 'router', string, 'type', string];
  /** Resources filtered by state */
  byState: (
    routerId: string,
    state: ResourceLifecycleState
  ) => readonly ['resources', 'router', string, 'state', ResourceLifecycleState];
  /** Resource with specific layers */
  layers: (
    routerId: string,
    uuid: string,
    layers: string[]
  ) => readonly ['resources', 'router', string, 'uuid', string, 'layers', string];
  /** Composite resource (with children) */
  composite: (
    routerId: string,
    uuid: string
  ) => readonly ['resources', 'router', string, 'uuid', string, 'composite'];
  /** Resource relationships */
  relationships: (
    routerId: string,
    uuid: string
  ) => readonly ['resources', 'router', string, 'uuid', string, 'relationships'];
  /** Resource list with filters */
  list: (
    routerId: string,
    filters?: ResourceListFilters
  ) =>
    | readonly string[]
    | readonly [
        ...string[],
        ResourceCategory | undefined,
        string | undefined,
        ResourceLifecycleState | undefined,
        number | undefined,
        string | undefined,
      ];
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
export declare const resourceInvalidations: {
  /** Invalidate all resources for a router */
  router: (routerId: string) => readonly ['resources', 'router', string];
  /** Invalidate a specific resource */
  resource: (
    routerId: string,
    uuid: string
  ) => readonly ['resources', 'router', string, 'uuid', string];
  /** Invalidate all resources of a category */
  category: (
    routerId: string,
    category: ResourceCategory
  ) => readonly ['resources', 'router', string, 'category', ResourceCategory];
};
//# sourceMappingURL=queryKeys.d.ts.map
