/**
 * API Client Hooks
 *
 * Enhanced hooks for GraphQL operations with loading states.
 *
 * @see NAS-4.15: Implement Error Boundaries & Global Error Handling
 * @see NAS-4.16: Implement Loading States & Skeleton UI
 */

// GraphQL Error Hook - Component-level error handling
export { useGraphQLError, isApolloError, getApolloErrorCode } from './useGraphQLError';
export type {
  ProcessedError,
  UseGraphQLErrorReturn,
  UseGraphQLErrorOptions,
} from './useGraphQLError';

// Query with Loading States - Differentiated loading states
export { useQueryWithLoading } from './useQueryWithLoading';
export type { QueryWithLoadingState, UseQueryWithLoadingResult } from './useQueryWithLoading';

// Mutation with Loading States - Clear loading/success/error states
export { useMutationWithLoading, createOptimisticOptions } from './useMutationWithLoading';
export type {
  MutationWithLoadingState,
  UseMutationWithLoadingResult,
  OptimisticResponse,
} from './useMutationWithLoading';
