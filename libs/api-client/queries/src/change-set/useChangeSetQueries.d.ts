/**
 * useChangeSetQueries Hook
 *
 * Hooks for fetching change set data from the GraphQL API.
 *
 * @module @nasnet/api-client/queries/change-set
 * @see NAS-4.14: Implement Change Sets (Atomic Multi-Resource Operations)
 */
import { type ApolloError } from '@apollo/client';
import type { ChangeSet, ChangeSetStatus } from '@nasnet/core/types';
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
export declare function useChangeSet(
  routerId: string | undefined,
  changeSetId: string | undefined,
  options?: GetChangeSetOptions
): {
  changeSet: ChangeSet | undefined;
  loading: boolean;
  error: ApolloError | undefined;
  refetch: () => Promise<void>;
};
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
export declare function useLazyChangeSet(): {
  fetch: (routerId: string, changeSetId: string) => Promise<ChangeSet | undefined>;
  changeSet: ChangeSet | undefined;
  loading: boolean;
  error: ApolloError | undefined;
};
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
export declare function useChangeSets(
  routerId: string | undefined,
  options?: ListChangeSetsOptions
): {
  changeSets: ChangeSetSummary[];
  loading: boolean;
  error: ApolloError | undefined;
  refetch: () => Promise<void>;
};
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
export declare function useActiveChangeSets(
  routerId: string | undefined,
  options?: {
    skip?: boolean;
    pollInterval?: number;
  }
): {
  changeSets: ChangeSetSummary[];
  hasActive: boolean;
  loading: boolean;
  error: ApolloError | undefined;
};
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
export declare function usePendingChangeSetsCount(routerId: string | undefined): {
  count: number;
  isLoading: boolean;
};
declare const _default: {
  useChangeSet: typeof useChangeSet;
  useLazyChangeSet: typeof useLazyChangeSet;
  useChangeSets: typeof useChangeSets;
  useActiveChangeSets: typeof useActiveChangeSets;
  usePendingChangeSetsCount: typeof usePendingChangeSetsCount;
};
export default _default;
//# sourceMappingURL=useChangeSetQueries.d.ts.map
