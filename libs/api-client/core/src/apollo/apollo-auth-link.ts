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

import { setContext } from '@apollo/client/link/context';
import { useConnectionStore, useAuthStore, getAuthToken } from '@nasnet/state/stores';

/**
 * Get stored credentials from sessionStorage.
 * Credentials are stored per-router for security isolation.
 *
 * @param routerId - The router ID to get credentials for
 * @returns Credentials object or null if not found
 */
function getStoredCredentials(
  routerId: string | null
): { username: string; password: string } | null {
  if (!routerId) return null;

  try {
    const stored = sessionStorage.getItem(`router-credentials-${routerId}`);
    if (!stored) return null;

    const parsed = JSON.parse(stored);
    if (typeof parsed.username === 'string' && typeof parsed.password === 'string') {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Get the appropriate authorization header.
 *
 * Priority:
 * 1. JWT Bearer token from auth store (if valid)
 * 2. Basic auth from stored router credentials
 *
 * @param routerId - Current router ID
 * @returns Authorization header value or undefined
 */
function getAuthorizationHeader(routerId: string | null): string | undefined {
  // First, try JWT token from auth store
  const jwtToken = getAuthToken();
  if (jwtToken) {
    return `Bearer ${jwtToken}`;
  }

  // Fall back to Basic auth from router credentials
  const credentials = getStoredCredentials(routerId);
  if (credentials) {
    return `Basic ${btoa(`${credentials.username}:${credentials.password}`)}`;
  }

  return undefined;
}

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
export const authLink = setContext((_, { headers }) => {
  const { currentRouterId } = useConnectionStore.getState();
  const authorization = getAuthorizationHeader(currentRouterId);

  return {
    headers: {
      ...headers,
      'X-Router-Id': currentRouterId || '',
      ...(authorization && { Authorization: authorization }),
    },
  };
});

/**
 * Create auth link with custom token getter.
 *
 * Use this when you need custom token retrieval logic.
 *
 * @param getToken - Custom token getter function
 * @returns Apollo context link
 */
export function createAuthLink(getToken: () => string | null) {
  return setContext((_, { headers }) => {
    const { currentRouterId } = useConnectionStore.getState();
    const token = getToken();

    return {
      headers: {
        ...headers,
        'X-Router-Id': currentRouterId || '',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    };
  });
}
