/**
 * Apollo Client Module
 *
 * Exports Apollo Client configuration, provider, and utilities.
 *
 * @module @nasnet/api-client/core/apollo
 */
export { apolloClient, apolloCache } from './apollo-client';
export { authLink } from './apollo-auth-link';
export { errorLink } from './apollo-error-link';
export { retryLink } from './apollo-retry-link';
export { wsClient } from './apollo-ws-client';
export { ApolloProvider } from './apollo-provider';
export { initializeCachePersistence, clearPersistedCache, getPersistedCacheSize, } from './apollo-cache-persist';
export type { CachePersistConfig } from './apollo-cache-persist';
export { setupOfflineDetector, useOfflineDetector, isOffline, isDegraded, } from './offline-detector';
export type { OfflineDetectorConfig } from './offline-detector';
export { OfflineMutationQueue, offlineQueue, setupAutoReplay, } from './offline-queue';
export type { QueuedMutation, OfflineQueueConfig, } from './offline-queue';
//# sourceMappingURL=index.d.ts.map