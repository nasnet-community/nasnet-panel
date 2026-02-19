/**
 * useResourceList Hook
 *
 * Hook for fetching paginated lists of resources with filtering and sorting.
 * Optimized for list views with selective layer loading.
 *
 * @module @nasnet/api-client/queries/resources
 */

import { useQuery, type ApolloError } from '@apollo/client';
import { gql } from '@apollo/client';
import { useMemo, useCallback } from 'react';
import type {
  Resource,
  ResourceCategory,
  ResourceLifecycleState,
} from '@nasnet/core/types';
import {
  RESOURCE_LIST_ITEM_FRAGMENT,
  RESOURCE_CARD_FRAGMENT,
} from './fragments';

// ============================================================================
// Types
// ============================================================================

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

// ============================================================================
// Queries
// ============================================================================

/**
 * List view query - minimal fields for performance.
 */
const RESOURCES_LIST_QUERY = gql`
  query GetResourcesList(
    $routerId: ID!
    $category: ResourceCategory
    $type: String
    $state: ResourceLifecycleState
    $first: Int
    $after: String
    $filter: ResourceFilterInput
    $sort: ResourceSortInput
  ) {
    resources(
      routerId: $routerId
      category: $category
      type: $type
      state: $state
      first: $first
      after: $after
      filter: $filter
      sort: $sort
    ) {
      edges {
        cursor
        node {
          ...ResourceListItem
        }
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
      totalCount
    }
  }
  ${RESOURCE_LIST_ITEM_FRAGMENT}
`;

/**
 * Card view query - includes configuration and more runtime data.
 */
const RESOURCES_CARD_QUERY = gql`
  query GetResourcesCard(
    $routerId: ID!
    $category: ResourceCategory
    $type: String
    $state: ResourceLifecycleState
    $first: Int
    $after: String
    $filter: ResourceFilterInput
    $sort: ResourceSortInput
  ) {
    resources(
      routerId: $routerId
      category: $category
      type: $type
      state: $state
      first: $first
      after: $after
      filter: $filter
      sort: $sort
    ) {
      edges {
        cursor
        node {
          ...ResourceCard
        }
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
      totalCount
    }
  }
  ${RESOURCE_CARD_FRAGMENT}
`;

// ============================================================================
// Hook Implementation
// ============================================================================

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
export function useResourceList<TConfig = unknown>(
  options: UseResourceListOptions = {}
): UseResourceListResult<TConfig> {
  const {
    filter = {},
    sort,
    pagination = { first: 20 },
    mode = 'list',
    skip = false,
    pollInterval = 0,
    fetchPolicy = 'cache-and-network',
  } = options;

  // Select query based on mode
  const query = mode === 'card' ? RESOURCES_CARD_QUERY : RESOURCES_LIST_QUERY;

  // Stabilize dependencies to prevent unnecessary re-renders.
  // Object references for filter/sort/pagination change every render;
  // serializing to a key lets useMemo compare by value instead.
  const filterKey = JSON.stringify(filter);
  const sortKey = JSON.stringify(sort);
  const paginationKey = JSON.stringify(pagination);

  // Build variables
  const variables = useMemo(() => ({
    routerId: filter.routerId || '',
    category: filter.category,
    type: filter.type,
    state: filter.state,
    first: pagination.first,
    after: pagination.after,
    last: pagination.last,
    before: pagination.before,
    filter: {
      tags: filter.tags,
      health: filter.health,
      isRunning: filter.isRunning,
      isFavorite: filter.isFavorite,
      isPinned: filter.isPinned,
      search: filter.search,
    },
    sort: sort ? { field: sort.field, direction: sort.direction } : undefined,
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [filterKey, sortKey, paginationKey]);

  // Execute query
  const {
    data,
    loading,
    error,
    refetch,
    fetchMore: apolloFetchMore,
  } = useQuery(query, {
    variables,
    skip: skip || !filter.routerId,
    pollInterval,
    fetchPolicy,
    notifyOnNetworkStatusChange: true,
  });

  // Extract data from connection
  const resources = useMemo((): Resource<TConfig>[] => {
    if (!data?.resources?.edges) return [];
    return data.resources.edges.map(
      (edge: { node: Resource<TConfig> }) => edge.node
    );
  }, [data?.resources?.edges]);

  const pageInfo = useMemo((): PageInfo => {
    return data?.resources?.pageInfo ?? {
      hasNextPage: false,
      hasPreviousPage: false,
    };
  }, [data?.resources?.pageInfo]);

  const totalCount = data?.resources?.totalCount ?? 0;

  // Fetch more for infinite scroll
  const fetchMore = useCallback(async () => {
    if (!pageInfo.hasNextPage || !pageInfo.endCursor) return;

    await apolloFetchMore({
      variables: {
        after: pageInfo.endCursor,
      },
      updateQuery: (prev, { fetchMoreResult }) => {
        if (!fetchMoreResult) return prev;

        return {
          resources: {
            ...fetchMoreResult.resources,
            edges: [
              ...(prev.resources?.edges ?? []),
              ...fetchMoreResult.resources.edges,
            ],
          },
        };
      },
    });
  }, [apolloFetchMore, pageInfo.hasNextPage, pageInfo.endCursor]);

  return {
    resources,
    totalCount,
    pageInfo,
    loading,
    error,
    refetch: async () => {
      await refetch();
    },
    fetchMore,
    hasMore: pageInfo.hasNextPage,
    filter,
  };
}

// ============================================================================
// Convenience Hooks
// ============================================================================

/**
 * Hook for fetching resources by category.
 */
export function useResourcesByCategory<TConfig = unknown>(
  routerId: string,
  category: ResourceCategory,
  options: Omit<UseResourceListOptions, 'filter'> = {}
): UseResourceListResult<TConfig> {
  return useResourceList<TConfig>({
    ...options,
    filter: { routerId, category },
  });
}

/**
 * Hook for fetching resources by type.
 */
export function useResourcesByType<TConfig = unknown>(
  routerId: string,
  type: string,
  options: Omit<UseResourceListOptions, 'filter'> = {}
): UseResourceListResult<TConfig> {
  return useResourceList<TConfig>({
    ...options,
    filter: { routerId, type },
  });
}

/**
 * Hook for fetching favorite resources.
 */
export function useFavoriteResources<TConfig = unknown>(
  routerId: string,
  options: Omit<UseResourceListOptions, 'filter'> = {}
): UseResourceListResult<TConfig> {
  return useResourceList<TConfig>({
    ...options,
    filter: { routerId, isFavorite: true },
  });
}

/**
 * Hook for fetching resources with errors.
 */
export function useResourcesWithErrors<TConfig = unknown>(
  routerId: string,
  options: Omit<UseResourceListOptions, 'filter'> = {}
): UseResourceListResult<TConfig> {
  return useResourceList<TConfig>({
    ...options,
    filter: { routerId, state: 'ERROR' as ResourceLifecycleState },
  });
}

/**
 * Hook for searching resources.
 */
export function useResourceSearch<TConfig = unknown>(
  routerId: string,
  searchQuery: string,
  options: Omit<UseResourceListOptions, 'filter'> = {}
): UseResourceListResult<TConfig> {
  return useResourceList<TConfig>({
    ...options,
    filter: { routerId, search: searchQuery },
    skip: !searchQuery || searchQuery.length < 2,
  });
}

export default useResourceList;
