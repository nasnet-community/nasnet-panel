/**
 * Apollo error handling link.
 *
 * Handles:
 * - GraphQL errors: Validation, authentication, business logic errors
 * - Network errors: Connectivity issues, timeouts, HTTP errors
 *
 * GraphQL Error Codes:
 * - UNAUTHENTICATED: Clears auth store, redirects to login
 * - FORBIDDEN: User lacks permission for operation
 * - NOT_FOUND: Requested resource doesn't exist
 * - VALIDATION_FAILED: Input validation errors
 *
 * HTTP Status Codes:
 * - 401 Unauthorized: Clears auth store, redirects to login
 * - 403 Forbidden: Shows permission denied notification
 *
 * Integration:
 * - useAuthStore: Cleared on 401/UNAUTHENTICATED
 * - useNotificationStore: Shows error toasts
 * - Custom events: auth:expired, network:error
 *
 * Usage:
 * ```ts
 * import { ApolloClient, from } from '@apollo/client';
 * import { errorLink } from './apollo-error-link';
 *
 * const client = new ApolloClient({
 *   link: from([errorLink, authLink, httpLink]),
 *   cache: new InMemoryCache(),
 * });
 * ```
 */
export declare const errorLink: import('@apollo/client').ApolloLink;
/**
 * Create error link with custom handlers.
 *
 * Use this when you need custom error handling logic.
 *
 * @param onAuthError - Custom auth error handler
 * @param onNetworkError - Custom network error handler
 * @returns Apollo error link
 */
export declare function createErrorLink(options: {
  onAuthError?: (message: string) => void;
  onNetworkError?: (error: Error) => void;
}): import('@apollo/client').ApolloLink;
//# sourceMappingURL=apollo-error-link.d.ts.map
