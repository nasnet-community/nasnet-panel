/**
 * @nasnet/api-client/core
 *
 * API client module providing:
 * - Axios-based HTTP client with interceptors for REST endpoints
 * - Apollo Client for GraphQL with subscriptions support
 */
export { createApiClient, apiClient } from './client';
export type { ApiClientConfig } from './client';
export { makeRouterOSRequest, createProxyQueryFn, createProxyMutationFn, } from './router-proxy';
export type { RouterOSRequestOptions, RouterOSResponse, } from './router-proxy';
export type { ApiResponse, ApiErrorResponse, StoredCredentials, RetryConfig, } from './types';
export { ApiError } from './types';
export { authInterceptor, storeCredentials, clearCredentials, errorInterceptor, retryInterceptor, } from './interceptors';
export { apolloClient, apolloCache, ApolloProvider, MockApolloProvider, authLink, errorLink, retryLink, wsClient, initializeCachePersistence, clearPersistedCache, getPersistedCacheSize, setupOfflineDetector, useOfflineDetector, isOffline, isDegraded, OfflineMutationQueue, offlineQueue, setupAutoReplay, } from './apollo';
export type { CachePersistConfig, OfflineDetectorConfig, QueuedMutation, OfflineQueueConfig, } from './apollo';
export { getErrorMessage, getErrorInfo, getErrorCategory, getErrorSeverity, getErrorAction, isRecoverableError, isAuthError, isNetworkError, isValidationError, } from './utils';
export type { ErrorCategory, ErrorSeverity, ErrorInfo } from './utils';
export { logError, logGraphQLError, logNetworkError, logComponentError, flushErrorBuffer, getErrorBufferSize, } from './utils';
export type { ErrorLogEntry, ErrorLogInput } from './utils';
export { useGraphQLError, isApolloError, getApolloErrorCode, } from './hooks';
export type { ProcessedError, UseGraphQLErrorReturn, UseGraphQLErrorOptions, } from './hooks';
//# sourceMappingURL=index.d.ts.map