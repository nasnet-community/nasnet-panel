/**
 * useChangeSetQueries Hook
 *
 * Hooks for fetching change set data from the GraphQL API.
 *
 * @module @nasnet/api-client/queries/change-set
 * @see NAS-4.14: Implement Change Sets (Atomic Multi-Resource Operations)
 */

import { useQuery, useLazyQuery, type ApolloError } from '@apollo/client';
import { gql } from '@apollo/client';
import type {
  ChangeSet,
  ChangeSetStatus,
} from '@nasnet/core/types';
import {
  CHANGE_SET_FULL_FRAGMENT,
  CHANGE_SET_SUMMARY_FRAGMENT,
} from './fragments';

// ============================================================================
// Types
// ============================================================================

/**
 * Summary of a change set for list displays.
 */
export interface ChangeSetSummary {
  id: string;
  name: string;
  status: ChangeSetStatus;
  operationCounts: {
    create: number;
    update: number;
    delete: number;
  };
  totalItems: number;
  createdAt: string;
  hasErrors: boolean;
  hasWarnings: boolean;
}

/**
 * Options for listing change sets.
 */
export interface ListChangeSetsOptions {
  /** Filter by status */
  status?: ChangeSetStatus;
  /** Include completed/failed change sets (default: false) */
  includeCompleted?: boolean;
  /** Skip the query */
  skip?: boolean;
  /** Poll interval in milliseconds */
  pollInterval?: number;
}

/**
 * Options for fetching a single change set.
 */
export interface GetChangeSetOptions {
  /** Skip the query */
  skip?: boolean;
  /** Poll interval in milliseconds */
  pollInterval?: number;
  /** Fetch policy */
  fetchPolicy?: 'cache-first' | 'network-only' | 'cache-and-network';
}

// ============================================================================
// Queries
// ============================================================================

const GET_CHANGE_SET_QUERY = gql`
  query GetChangeSet($id: ID!, $routerId: ID!) {
    changeSet(id: $id, routerId: $routerId) {
      ...ChangeSetFull
    }
  }
  ${CHANGE_SET_FULL_FRAGMENT}
`;

const LIST_CHANGE_SETS_QUERY = gql`
  query ListChangeSets(
    $routerId: ID!
    $status: ChangeSetStatus
    $includeCompleted: Boolean
  ) {
    changeSets(
      routerId: $routerId
      status: $status
      includeCompleted: $includeCompleted
    ) {
      ...ChangeSetSummary
    }
  }
  ${CHANGE_SET_SUMMARY_FRAGMENT}
`;

// ============================================================================
// Hook Implementations
// ============================================================================

/**
 * Fetch a single change set by ID.
 *
 * @example
 * ```tsx
 * const { changeSet, loading, error, refetch } = useChangeSet(
 *   routerId,
 *   changeSetId
 * );
 *
 * if (loading) return <Skeleton />;
 * if (error) return <Error message={error.message} />;
 *
 * return <ChangeSetDetail changeSet={changeSet} />;
 * ```
 */
export function useChangeSet(
  routerId: string | undefined,
  changeSetId: string | undefined,
  options: GetChangeSetOptions = {}
): {
  changeSet: ChangeSet | undefined;
  loading: boolean;
  error: ApolloError | undefined;
  refetch: () => Promise<void>;
} {
  const { skip = false, pollInterval, fetchPolicy = 'cache-first' } = options;

  const { data, loading, error, refetch } = useQuery(GET_CHANGE_SET_QUERY, {
    variables: { id: changeSetId, routerId },
    skip: skip || !routerId || !changeSetId,
    pollInterval,
    fetchPolicy,
  });

  return {
    changeSet: data?.changeSet,
    loading,
    error,
    refetch: async () => {
      await refetch();
    },
  };
}

/**
 * Lazy version of useChangeSet for on-demand fetching.
 *
 * @example
 * ```tsx
 * const { fetch, changeSet, loading } = useLazyChangeSet();
 *
 * const handleSelect = async (id: string) => {
 *   const result = await fetch(routerId, id);
 *   console.log('Selected:', result);
 * };
 * ```
 */
export function useLazyChangeSet(): {
  fetch: (routerId: string, changeSetId: string) => Promise<ChangeSet | undefined>;
  changeSet: ChangeSet | undefined;
  loading: boolean;
  error: ApolloError | undefined;
} {
  const [fetchQuery, { data, loading, error }] = useLazyQuery(GET_CHANGE_SET_QUERY);

  const fetch = async (routerId: string, changeSetId: string): Promise<ChangeSet | undefined> => {
    const result = await fetchQuery({ variables: { id: changeSetId, routerId } });
    return result.data?.changeSet;
  };

  return {
    fetch,
    changeSet: data?.changeSet,
    loading,
    error,
  };
}

/**
 * List change sets for a router.
 *
 * @example
 * ```tsx
 * const { changeSets, loading, refetch } = useChangeSets(routerId, {
 *   status: 'DRAFT',
 *   includeCompleted: false,
 * });
 *
 * return (
 *   <ChangeSetList
 *     items={changeSets}
 *     isLoading={loading}
 *     onRefresh={refetch}
 *   />
 * );
 * ```
 */
export function useChangeSets(
  routerId: string | undefined,
  options: ListChangeSetsOptions = {}
): {
  changeSets: ChangeSetSummary[];
  loading: boolean;
  error: ApolloError | undefined;
  refetch: () => Promise<void>;
} {
  const { status, includeCompleted = false, skip = false, pollInterval } = options;

  const { data, loading, error, refetch } = useQuery(LIST_CHANGE_SETS_QUERY, {
    variables: { routerId, status, includeCompleted },
    skip: skip || !routerId,
    pollInterval,
  });

  return {
    changeSets: data?.changeSets ?? [],
    loading,
    error,
    refetch: async () => {
      await refetch();
    },
  };
}

/**
 * List active (non-completed) change sets for a router.
 * Convenience wrapper around useChangeSets.
 *
 * @example
 * ```tsx
 * const { changeSets, hasActive } = useActiveChangeSets(routerId);
 *
 * if (hasActive) {
 *   showChangeSetIndicator();
 * }
 * ```
 */
export function useActiveChangeSets(
  routerId: string | undefined,
  options: { skip?: boolean; pollInterval?: number } = {}
): {
  changeSets: ChangeSetSummary[];
  hasActive: boolean;
  loading: boolean;
  error: ApolloError | undefined;
} {
  const result = useChangeSets(routerId, {
    ...options,
    includeCompleted: false,
  });

  return {
    ...result,
    hasActive: result.changeSets.length > 0,
  };
}

/**
 * Get count of pending changes for a router.
 * Useful for badge indicators.
 *
 * @example
 * ```tsx
 * const { count, isLoading } = usePendingChangeSetsCount(routerId);
 *
 * return (
 *   <NavItem badge={count > 0 ? count : undefined}>
 *     Change Sets
 *   </NavItem>
 * );
 * ```
 */
export function usePendingChangeSetsCount(
  routerId: string | undefined
): {
  count: number;
  isLoading: boolean;
} {
  const { changeSets, loading } = useChangeSets(routerId, {
    includeCompleted: false,
  });

  const pendingCount = changeSets.filter(
    (cs) => cs.status === 'DRAFT' || cs.status === 'READY'
  ).length;

  return {
    count: pendingCount,
    isLoading: loading,
  };
}

export default {
  useChangeSet,
  useLazyChangeSet,
  useChangeSets,
  useActiveChangeSets,
  usePendingChangeSetsCount,
};
