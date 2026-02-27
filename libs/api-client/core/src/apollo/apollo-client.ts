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

import {
  ApolloClient,
  InMemoryCache,
  split,
  from,
  HttpLink,
  NormalizedCacheObject,
} from '@apollo/client';
import { getMainDefinition } from '@apollo/client/utilities';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { possibleTypesResult } from '@nasnet/api-client/generated';
import { authLink } from './apollo-auth-link';
import { errorLink } from './apollo-error-link';
import { retryLink } from './apollo-retry-link';
import { wsClient } from './apollo-ws-client';

/**
 * HTTP link for queries and mutations.
 * Points to the /graphql endpoint on the same origin.
 */
const httpLink = new HttpLink({
  uri: '/graphql',
  credentials: 'include', // Send cookies for session auth
});

/**
 * WebSocket link for subscriptions.
 * Uses graphql-ws transport with automatic reconnection.
 */
const wsLink = new GraphQLWsLink(wsClient);

/**
 * Split link that routes operations based on type:
 * - Subscriptions → WebSocket (wsLink)
 * - Queries/Mutations → HTTP (httpLink with auth)
 */
const splitLink = split(
  ({ query }) => {
    const definition = getMainDefinition(query);
    return definition.kind === 'OperationDefinition' && definition.operation === 'subscription';
  },
  wsLink,
  authLink.concat(httpLink)
);

/**
 * Complete link chain.
 *
 * Request flow:
 * Request → errorLink → retryLink → splitLink → (auth + http) or ws → Server
 *
 * - errorLink: Catches and logs all errors
 * - retryLink: Retries failed network requests
 * - splitLink: Routes to WS or HTTP based on operation type
 */
const link = from([errorLink, retryLink, splitLink]);

/**
 * In-memory cache configuration.
 *
 * Features:
 * - possibleTypes for union/interface resolution (Node, Connection, Edge)
 * - Type policies for custom caching behavior
 * - Field policies for pagination and normalized updates
 */
const cache = new InMemoryCache({
  possibleTypes: possibleTypesResult.possibleTypes,
  typePolicies: {
    Query: {
      fields: {
        // Routers connection with pagination
        routers: {
          keyArgs: ['filter'],
          merge(existing, incoming, { args }) {
            // Simple replace for now, can be enhanced for infinite scroll
            return incoming;
          },
        },
        // Resources connection with pagination
        resources: {
          keyArgs: ['routerId', 'category', 'type', 'state'],
          merge(existing, incoming) {
            return incoming;
          },
        },
      },
    },
    Router: {
      // Use id as cache key
      keyFields: ['id'],
      fields: {
        // Merge runtime updates without replacing entire object
        status: {
          merge: true,
        },
      },
    },

    // =========================================================================
    // Universal State v2 Resource Type Policies
    // Reference: ADR-012 - Universal State v2
    // =========================================================================

    /**
     * Base Resource type policy.
     * All resources are normalized by UUID (ULID).
     * Runtime and telemetry layers are merged (not replaced) on updates
     * to preserve real-time data continuity.
     */
    Resource: {
      keyFields: ['uuid'],
      fields: {
        // Layer 4: Runtime - merge updates to preserve metrics continuity
        runtime: {
          merge(existing, incoming) {
            return { ...existing, ...incoming };
          },
        },
        // Layer 5: Telemetry - merge to append historical data
        telemetry: {
          merge(existing, incoming) {
            if (!existing) return incoming;
            if (!incoming) return existing;
            return {
              ...existing,
              ...incoming,
              // Append bandwidth history
              bandwidthHistory: [
                ...(existing.bandwidthHistory ?? []),
                ...(incoming.bandwidthHistory ?? []),
              ].slice(-288), // Keep last 24h (5min intervals)
              // Keep latest hourly stats
              hourlyStats: incoming.hourlyStats ?? existing.hourlyStats,
              // Keep latest daily stats
              dailyStats: incoming.dailyStats ?? existing.dailyStats,
            };
          },
        },
        // Layer 3: Deployment - full replacement on apply
        deployment: {
          merge: false,
        },
        // Layer 2: Validation - full replacement on validation
        validation: {
          merge: false,
        },
      },
    },

    // Concrete resource types inherit Resource policies
    WireGuardClient: {
      keyFields: ['uuid'],
      fields: {
        runtime: {
          merge(existing, incoming) {
            return { ...existing, ...incoming };
          },
        },
      },
    },
    LANNetwork: {
      keyFields: ['uuid'],
      fields: {
        runtime: {
          merge(existing, incoming) {
            return { ...existing, ...incoming };
          },
        },
      },
    },
    WANLink: {
      keyFields: ['uuid'],
      fields: {
        runtime: {
          merge(existing, incoming) {
            return { ...existing, ...incoming };
          },
        },
      },
    },
    FirewallRuleResource: {
      keyFields: ['uuid'],
    },
    DHCPServerResource: {
      keyFields: ['uuid'],
    },
    BridgeResource: {
      keyFields: ['uuid'],
    },
    RouteResource: {
      keyFields: ['uuid'],
    },
    FeatureResource: {
      keyFields: ['uuid'],
      fields: {
        runtime: {
          merge(existing, incoming) {
            return { ...existing, ...incoming };
          },
        },
      },
    },

    // Validation result - always replace
    ValidationResult: {
      merge: false,
    },

    // Deployment state - always replace
    DeploymentState: {
      merge: false,
    },

    // Runtime state - merge for real-time updates
    RuntimeState: {
      merge: true,
    },

    // Resource metadata - merge to preserve local UI state
    ResourceMetadata: {
      merge: true,
    },
  },
});

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
export const apolloClient: ApolloClient<NormalizedCacheObject> = new ApolloClient({
  link,
  cache,
  defaultOptions: {
    watchQuery: {
      // Return cached data immediately, then update with network
      fetchPolicy: 'cache-and-network',
      // After initial fetch, use cache to avoid redundant network requests on re-render
      nextFetchPolicy: 'cache-first',
      // Return partial data even if some fields errored
      errorPolicy: 'all',
    },
    query: {
      // Use cache if available, otherwise fetch
      fetchPolicy: 'cache-first',
      errorPolicy: 'all',
    },
    mutate: {
      // Return partial data on error
      errorPolicy: 'all',
    },
  },
  // Enable React DevTools integration in development
  connectToDevTools: import.meta.env.DEV,
});

// Export cache for direct access (cache persistence, etc.)
export { cache as apolloCache };
