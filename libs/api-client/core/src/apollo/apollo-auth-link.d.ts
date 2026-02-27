/**
 * Apollo Authentication Link
 *
 * Injects authentication headers into GraphQL requests:
 * - X-Router-Id: Current router identifier
 * - Authorization: Bearer JWT token OR Basic auth from stored credentials
 *
 * @module @nasnet/api-client/core/apollo
 * @see NAS-4.9: Implement Connection & Auth Stores
 */
/**
 * Apollo authentication context link.
 *
 * Injects router ID and authentication into request headers.
 * Uses Zustand stores to get current context:
 * - useAuthStore for JWT tokens
 * - useConnectionStore for router-specific credentials
 *
 * Headers added:
 * - X-Router-Id: Current router ID for backend routing
 * - Authorization: Bearer JWT token OR Basic auth
 *
 * Usage:
 * ```ts
 * import { ApolloClient, from } from '@apollo/client';
 * import { authLink } from './apollo-auth-link';
 *
 * const client = new ApolloClient({
 *   link: from([authLink, httpLink]),
 *   cache: new InMemoryCache(),
 * });
 * ```
 */
export declare const authLink: import('@apollo/client').ApolloLink;
/**
 * Create auth link with custom token getter.
 *
 * Use this when you need custom token retrieval logic.
 *
 * @param getToken - Custom token getter function
 * @returns Apollo context link
 */
export declare function createAuthLink(
  getToken: () => string | null
): import('@apollo/client').ApolloLink;
//# sourceMappingURL=apollo-auth-link.d.ts.map
