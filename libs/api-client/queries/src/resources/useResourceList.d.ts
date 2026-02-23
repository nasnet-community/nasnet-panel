/**
 * useResourceList Hook
 *
 * Hook for fetching paginated lists of resources with filtering and sorting.
 * Optimized for list views with selective layer loading.
 *
 * @module @nasnet/api-client/queries/resources
 */
import { type ApolloError } from '@apollo/client';
import type { Resource, ResourceCategory, ResourceLifecycleState } from '@nasnet/core/types';
/**
 * Filter options for resource list queries.
 */
export interface ResourceListFilter {
    /** Router ID to scope resources */
    routerId?: string;
    /** Filter by resource category */
    category?: ResourceCategory;
    /** Filter by resource type (e.g., 'wireguard-client', 'lan-network') */
    type?: string;
    /** Filter by lifecycle state */
    state?: ResourceLifecycleState;
    /** Filter by tags (any match) */
    tags?: string[];
    /** Filter by runtime health */
    health?: 'HEALTHY' | 'DEGRADED' | 'CRITICAL' | 'UNKNOWN';
    /** Filter by running state */
    isRunning?: boolean;
    /** Filter favorites only */
    isFavorite?: boolean;
    /** Filter pinned only */
    isPinned?: boolean;
    /** Search query for text matching */
    search?: string;
}
/**
 * Sort options for resource list queries.
 */
export interface ResourceListSort {
    /** Field to sort by */
    field: 'id' | 'type' | 'state' | 'updatedAt' | 'createdAt' | 'health';
    /** Sort direction */
    direction: 'ASC' | 'DESC';
}
/**
 * Pagination options for resource list queries.
 */
export interface ResourceListPagination {
    /** Number of items per page */
    first?: number;
    /** Cursor for next page */
    after?: string;
    /** Number of items from end */
    last?: number;
    /** Cursor for previous page */
    before?: string;
}
/**
 * Display mode affects which fragment is used.
 */
export type ResourceListMode = 'list' | 'card' | 'table';
/**
 * Options for useResourceList hook.
 */
export interface UseResourceListOptions {
    /** Filter options */
    filter?: ResourceListFilter;
    /** Sort options */
    sort?: ResourceListSort;
    /** Pagination options */
    pagination?: ResourceListPagination;
    /** Display mode determines layer selection */
    mode?: ResourceListMode;
    /** Skip query execution */
    skip?: boolean;
    /** Polling interval in milliseconds */
    pollInterval?: number;
    /** Fetch policy */
    fetchPolicy?: 'cache-first' | 'cache-and-network' | 'network-only';
}
/**
 * Page info for relay-style pagination.
 */
export interface PageInfo {
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    startCursor?: string;
    endCursor?: string;
}
/**
 * Return type for useResourceList hook.
 */
export interface UseResourceListResult<TConfig = unknown> {
    /** List of resources */
    resources: Resource<TConfig>[];
    /** Total count of resources matching filter */
    totalCount: number;
    /** Pagination info */
    pageInfo: PageInfo;
    /** Loading state */
    loading: boolean;
    /** Error state */
    error: ApolloError | undefined;
    /** Refetch with same options */
    refetch: () => Promise<void>;
    /** Fetch next page */
    fetchMore: () => Promise<void>;
    /** Whether more data is available */
    hasMore: boolean;
    /** Current filter state */
    filter: ResourceListFilter | undefined;
}
/**
 * Hook for fetching paginated resource lists.
 *
 * @example
 * ```tsx
 * // List all VPN resources for a router
 * const { resources, loading, hasMore, fetchMore } = useResourceList({
 *   filter: { routerId: 'router-1', category: 'VPN' },
 *   pagination: { first: 20 },
 * });
 *
 * // Card view with sorting
 * const { resources } = useResourceList({
 *   filter: { routerId: 'router-1' },
 *   sort: { field: 'updatedAt', direction: 'DESC' },
 *   mode: 'card',
 * });
 * ```
 */
export declare function useResourceList<TConfig = unknown>(options?: UseResourceListOptions): UseResourceListResult<TConfig>;
/**
 * Hook for fetching resources by category.
 */
export declare function useResourcesByCategory<TConfig = unknown>(routerId: string, category: ResourceCategory, options?: Omit<UseResourceListOptions, 'filter'>): UseResourceListResult<TConfig>;
/**
 * Hook for fetching resources by type.
 */
export declare function useResourcesByType<TConfig = unknown>(routerId: string, type: string, options?: Omit<UseResourceListOptions, 'filter'>): UseResourceListResult<TConfig>;
/**
 * Hook for fetching favorite resources.
 */
export declare function useFavoriteResources<TConfig = unknown>(routerId: string, options?: Omit<UseResourceListOptions, 'filter'>): UseResourceListResult<TConfig>;
/**
 * Hook for fetching resources with errors.
 */
export declare function useResourcesWithErrors<TConfig = unknown>(routerId: string, options?: Omit<UseResourceListOptions, 'filter'>): UseResourceListResult<TConfig>;
/**
 * Hook for searching resources.
 */
export declare function useResourceSearch<TConfig = unknown>(routerId: string, searchQuery: string, options?: Omit<UseResourceListOptions, 'filter'>): UseResourceListResult<TConfig>;
export default useResourceList;
//# sourceMappingURL=useResourceList.d.ts.map