/**
 * API Client Hooks
 *
 * Enhanced hooks for GraphQL operations with loading states.
 *
 * @see NAS-4.15: Implement Error Boundaries & Global Error Handling
 * @see NAS-4.16: Implement Loading States & Skeleton UI
 */
export { useGraphQLError, isApolloError, getApolloErrorCode, } from './useGraphQLError';
export type { ProcessedError, UseGraphQLErrorReturn, UseGraphQLErrorOptions, } from './useGraphQLError';
export { useQueryWithLoading } from './useQueryWithLoading';
export type { QueryWithLoadingState, UseQueryWithLoadingResult, } from './useQueryWithLoading';
export { useMutationWithLoading, createOptimisticOptions, } from './useMutationWithLoading';
export type { MutationWithLoadingState, UseMutationWithLoadingResult, OptimisticResponse, } from './useMutationWithLoading';
//# sourceMappingURL=index.d.ts.map