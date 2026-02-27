/**
 * useMutationWithLoading Hook
 *
 * Enhanced Apollo Client useMutation hook with loading state tracking.
 * Provides clear loading state for button spinners and disabling.
 *
 * @module @nasnet/api-client/core/hooks
 */

import { useMutation, DocumentNode } from '@apollo/client';
import type {
  MutationHookOptions,
  MutationTuple,
  TypedDocumentNode,
  OperationVariables,
  ApolloError,
  FetchResult,
} from '@apollo/client';
import { useCallback, useState } from 'react';

// ============================================================================
// Types
// ============================================================================

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

export interface UseMutationWithLoadingResult<TData, TVariables extends OperationVariables>
  extends MutationWithLoadingState {
  /** Execute the mutation */
  mutate: (variables?: TVariables) => Promise<FetchResult<TData>>;
  /** Raw mutation tuple for advanced usage */
  mutationTuple: MutationTuple<TData, TVariables>;
  /** Mutation result data */
  data: TData | null | undefined;
}

// ============================================================================
// useMutationWithLoading Hook
// ============================================================================

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
export function useMutationWithLoading<
  TData = unknown,
  TVariables extends OperationVariables = OperationVariables,
>(
  mutation: DocumentNode | TypedDocumentNode<TData, TVariables>,
  options?: MutationHookOptions<TData, TVariables>
): UseMutationWithLoadingResult<TData, TVariables> {
  const [isSuccess, setIsSuccess] = useState(false);
  const [isError, setIsError] = useState(false);

  const mutationTuple = useMutation(mutation, {
    ...options,
    onCompleted: (data, clientOptions) => {
      setIsSuccess(true);
      setIsError(false);
      options?.onCompleted?.(data, clientOptions);
    },
    onError: (error, clientOptions) => {
      setIsSuccess(false);
      setIsError(true);
      options?.onError?.(error, clientOptions);
    },
  });

  const [executeMutation, { loading, error, data }] = mutationTuple;

  const mutate = useCallback(
    async (variables?: TVariables) => {
      setIsSuccess(false);
      setIsError(false);
      return executeMutation({ variables });
    },
    [executeMutation]
  );

  const reset = useCallback(() => {
    setIsSuccess(false);
    setIsError(false);
  }, []);

  return {
    mutate,
    mutationTuple,
    isLoading: loading,
    isSuccess,
    isError,
    error: error ?? null,
    data,
    reset,
  };
}

// ============================================================================
// Optimistic UI helper
// ============================================================================

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
export function createOptimisticOptions<TData, TVariables extends OperationVariables>(config: {
  optimisticResponse: OptimisticResponse<TData>;
  cacheUpdate?: (
    cache: Parameters<NonNullable<MutationHookOptions<TData, TVariables>['update']>>[0],
    data: TData
  ) => void;
}): Partial<MutationHookOptions<TData, TVariables>> {
  return {
    optimisticResponse: config.optimisticResponse as any,
    update:
      config.cacheUpdate ?
        (cache: any, { data }: any) => {
          if (data) {
            config.cacheUpdate!(cache, data as TData);
          }
        }
      : undefined,
  };
}
