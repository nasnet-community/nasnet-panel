/**
 * @nasnet/api-client/core
 *
 * API client module providing:
 * - Axios-based HTTP client with interceptors for REST endpoints
 * - Apollo Client for GraphQL with subscriptions support
 */

// ============================================================================
// AXIOS CLIENT (REST)
// ============================================================================

// Client factory and instance
export { createApiClient, apiClient } from './client';
export type { ApiClientConfig } from './client';

// Router proxy client (rosproxy backend)
export {
  makeRouterOSRequest,
  createProxyQueryFn,
  createProxyMutationFn,
} from './router-proxy';
export type {
  RouterOSRequestOptions,
  RouterOSResponse,
} from './router-proxy';

// Types
export type {
  ApiResponse,
  ApiErrorResponse,
  StoredCredentials,
  RetryConfig,
} from './types';
export { ApiError } from './types';

// Interceptors and utilities
export {
  authInterceptor,
  storeCredentials,
  clearCredentials,
  errorInterceptor,
  retryInterceptor,
} from './interceptors';

// ============================================================================
// APOLLO CLIENT (GRAPHQL)
// ============================================================================

// Main Apollo exports
export {
  apolloClient,
  apolloCache,
  ApolloProvider,
  MockApolloProvider,
  // Links for testing/customization
  authLink,
  errorLink,
  retryLink,
  wsClient,
  // Cache persistence
  initializeCachePersistence,
  clearPersistedCache,
  getPersistedCacheSize,
  // Offline detection
  setupOfflineDetector,
  useOfflineDetector,
  isOffline,
  isDegraded,
  // Offline mutation queue
  OfflineMutationQueue,
  offlineQueue,
  setupAutoReplay,
} from './apollo';

// Apollo types
export type {
  CachePersistConfig,
  OfflineDetectorConfig,
  QueuedMutation,
  OfflineQueueConfig,
} from './apollo';

// ============================================================================
// ERROR HANDLING (NAS-4.15)
// ============================================================================

// Error message utilities
export {
  getErrorMessage,
  getErrorInfo,
  getErrorCategory,
  getErrorSeverity,
  getErrorAction,
  isRecoverableError,
  isAuthError,
  isNetworkError,
  isValidationError,
} from './utils';
export type { ErrorCategory, ErrorSeverity, ErrorInfo } from './utils';

// Error logging utilities
export {
  logError,
  logGraphQLError,
  logNetworkError,
  logComponentError,
  flushErrorBuffer,
  getErrorBufferSize,
} from './utils';
export type { ErrorLogEntry, ErrorLogInput } from './utils';

// GraphQL error handling hook
export {
  useGraphQLError,
  isApolloError,
  getApolloErrorCode,
} from './hooks';
export type {
  ProcessedError,
  UseGraphQLErrorReturn,
  UseGraphQLErrorOptions,
} from './hooks';
