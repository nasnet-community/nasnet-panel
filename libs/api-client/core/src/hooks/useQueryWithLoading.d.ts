/**
 * useQueryWithLoading Hook
 *
 * Enhanced Apollo Client useQuery hook with loading state differentiation.
 * Distinguishes between initial loading and background revalidation.
 *
 * @module @nasnet/api-client/core/hooks
 */
import { DocumentNode } from '@apollo/client';
import type { QueryHookOptions, QueryResult, TypedDocumentNode, OperationVariables } from '@apollo/client';
export interface QueryWithLoadingState<TData> {
    /** True during initial load (no data yet) */
    isInitialLoading: boolean;
    /** True during background revalidation (has stale data) */
    isRevalidating: boolean;
    /** True if data is stale and being refreshed */
    isStale: boolean;
    /** True if any loading is happening */
    isLoading: boolean;
    /** Timestamp of last successful fetch */
    lastUpdated: Date | null;
}
export interface UseQueryWithLoadingResult<TData, TVariables extends OperationVariables> extends QueryResult<TData, TVariables>, QueryWithLoadingState<TData> {
}
/**
 * Enhanced useQuery hook that differentiates loading states.
 *
 * Provides additional state properties:
 * - `isInitialLoading`: True when loading and no data exists yet
 * - `isRevalidating`: True when refreshing but data already exists
 * - `isStale`: True when data is from cache and being refreshed
 * - `lastUpdated`: Timestamp of last successful fetch
 *
 * @example
 * ```tsx
 * function ResourceList() {
 *   const {
 *     data,
 *     isInitialLoading,
 *     isRevalidating,
 *     isStale,
 *   } = useQueryWithLoading(GET_RESOURCES);
 *
 *   // Show skeleton during initial load
 *   if (isInitialLoading) {
 *     return <ResourceListSkeleton />;
 *   }
 *
 *   return (
 *     <div>
 *       {isRevalidating && <RefreshIndicator />}
 *       {isStale && <StaleDataBadge />}
 *       <ResourceTable data={data.resources} />
 *     </div>
 *   );
 * }
 * ```
 */
export declare function useQueryWithLoading<TData = unknown, TVariables extends OperationVariables = OperationVariables>(query: DocumentNode | TypedDocumentNode<TData, TVariables>, options?: QueryHookOptions<TData, TVariables>): UseQueryWithLoadingResult<TData, TVariables>;
//# sourceMappingURL=useQueryWithLoading.d.ts.map