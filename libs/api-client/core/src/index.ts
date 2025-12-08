/**
 * @nasnet/api-client/core
 * Axios-based HTTP client with interceptors for authentication, error handling, and retry logic
 */

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
