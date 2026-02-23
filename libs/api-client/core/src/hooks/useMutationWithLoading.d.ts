/**
 * useMutationWithLoading Hook
 *
 * Enhanced Apollo Client useMutation hook with loading state tracking.
 * Provides clear loading state for button spinners and disabling.
 *
 * @module @nasnet/api-client/core/hooks
 */
import { DocumentNode } from '@apollo/client';
import type { MutationHookOptions, MutationTuple, TypedDocumentNode, OperationVariables, ApolloError, FetchResult } from '@apollo/client';
export interface MutationWithLoadingState {
    /** True while mutation is in progress */
    isLoading: boolean;
    /** True if mutation was successful */
    isSuccess: boolean;
    /** True if mutation failed */
    isError: boolean;
    /** Error from the mutation */
    error: ApolloError | null;
    /** Reset the mutation state */
    reset: () => void;
}
export interface UseMutationWithLoadingResult<TData, TVariables extends OperationVariables> extends MutationWithLoadingState {
    /** Execute the mutation */
    mutate: (variables?: TVariables) => Promise<FetchResult<TData>>;
    /** Raw mutation tuple for advanced usage */
    mutationTuple: MutationTuple<TData, TVariables>;
    /** Mutation result data */
    data: TData | null | undefined;
}
/**
 * Enhanced useMutation hook with clear loading states.
 *
 * Provides:
 * - `isLoading`: True while mutation is executing
 * - `isSuccess`: True after successful mutation
 * - `isError`: True after failed mutation
 * - `mutate`: Simplified mutation function
 * - `reset`: Reset state to initial
 *
 * @example
 * ```tsx
 * function SaveButton() {
 *   const { mutate, isLoading, isSuccess, error } = useMutationWithLoading(
 *     SAVE_CONFIG,
 *     {
 *       onCompleted: () => toast.success('Saved!'),
 *       onError: (err) => toast.error(err.message),
 *     }
 *   );
 *
 *   return (
 *     <Button
 *       onClick={() => mutate({ config })}
 *       isLoading={isLoading}
 *       loadingText="Saving..."
 *     >
 *       Save Configuration
 *     </Button>
 *   );
 * }
 * ```
 *
 * @example
 * ```tsx
 * // With optimistic updates
 * const { mutate, isLoading } = useMutationWithLoading(UPDATE_ITEM, {
 *   optimisticResponse: {
 *     updateItem: { ...item, name: newName },
 *   },
 *   update: (cache, { data }) => {
 *     // Update cache with new data
 *   },
 * });
 * ```
 */
export declare function useMutationWithLoading<TData = unknown, TVariables extends OperationVariables = OperationVariables>(mutation: DocumentNode | TypedDocumentNode<TData, TVariables>, options?: MutationHookOptions<TData, TVariables>): UseMutationWithLoadingResult<TData, TVariables>;
/**
 * Helper type for creating optimistic responses.
 */
export type OptimisticResponse<TData> = TData | ((vars: OperationVariables) => TData);
/**
 * Creates options for optimistic mutation with automatic cache update.
 *
 * @example
 * ```tsx
 * const { mutate } = useMutationWithLoading(
 *   TOGGLE_FAVORITE,
 *   createOptimisticOptions({
 *     optimisticResponse: (vars) => ({
 *       toggleFavorite: { id: vars.id, isFavorite: !vars.isFavorite },
 *     }),
 *     cacheUpdate: (cache, data) => {
 *       // Update normalized cache
 *     },
 *   })
 * );
 * ```
 */
export declare function createOptimisticOptions<TData, TVariables extends OperationVariables>(config: {
    optimisticResponse: OptimisticResponse<TData>;
    cacheUpdate?: (cache: Parameters<NonNullable<MutationHookOptions<TData, TVariables>['update']>>[0], data: TData) => void;
}): Partial<MutationHookOptions<TData, TVariables>>;
//# sourceMappingURL=useMutationWithLoading.d.ts.map