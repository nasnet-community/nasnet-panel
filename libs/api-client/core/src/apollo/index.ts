/**
 * Apollo Client Module
 *
 * Exports Apollo Client configuration, provider, and utilities.
 *
 * @module @nasnet/api-client/core/apollo
 */

// Main client and cache
export { apolloClient, apolloCache } from './apollo-client';

// Link components (for testing and customization)
export { authLink } from './apollo-auth-link';
export { errorLink } from './apollo-error-link';
export { retryLink } from './apollo-retry-link';
export { wsClient } from './apollo-ws-client';

// Provider
export { ApolloProvider } from './apollo-provider';

// Cache persistence
export {
  initializeCachePersistence,
  clearPersistedCache,
  getPersistedCacheSize,
} from './apollo-cache-persist';
export type { CachePersistConfig } from './apollo-cache-persist';

// Offline detection
export {
  setupOfflineDetector,
  useOfflineDetector,
  isOffline,
  isDegraded,
} from './offline-detector';
export type { OfflineDetectorConfig } from './offline-detector';

// Offline mutation queue
export {
  OfflineMutationQueue,
  offlineQueue,
  setupAutoReplay,
} from './offline-queue';
export type {
  QueuedMutation,
  OfflineQueueConfig,
} from './offline-queue';
