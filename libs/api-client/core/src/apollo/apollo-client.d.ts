/**
 * Apollo Client Configuration
 *
 * Main Apollo Client instance with complete link chain:
 * - Error handling with centralized logging
 * - Automatic retry with exponential backoff
 * - Authentication header injection
 * - WebSocket subscriptions support
 * - Normalized cache with possibleTypes for union/interface resolution
 *
 * @module @nasnet/api-client/core/apollo
 */
import { ApolloClient, InMemoryCache, NormalizedCacheObject } from '@apollo/client';
/**
 * In-memory cache configuration.
 *
 * Features:
 * - possibleTypes for union/interface resolution (Node, Connection, Edge)
 * - Type policies for custom caching behavior
 * - Field policies for pagination and normalized updates
 */
declare const cache: InMemoryCache;
/**
 * Apollo Client instance.
 *
 * Default options:
 * - watchQuery: cache-and-network for fresh data with cache fallback
 * - query: cache-first for efficiency
 * - mutate: errorPolicy: all to handle partial errors
 *
 * Usage:
 * ```tsx
 * import { apolloClient } from '@nasnet/api-client/core';
 *
 * // Direct query (outside React)
 * const result = await apolloClient.query({ query: GET_ROUTER });
 *
 * // In React, use with ApolloProvider
 * <ApolloProvider client={apolloClient}>
 *   <App />
 * </ApolloProvider>
 * ```
 */
export declare const apolloClient: ApolloClient<NormalizedCacheObject>;
export { cache as apolloCache };
//# sourceMappingURL=apollo-client.d.ts.map
