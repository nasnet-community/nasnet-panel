/**
 * Apollo Cache Persistence
 *
 * Persists Apollo cache to IndexedDB for offline support.
 * Uses localforage for cross-browser IndexedDB abstraction.
 *
 * @module @nasnet/api-client/core/apollo
 */
import { InMemoryCache } from '@apollo/client';
/**
 * Configuration for cache persistence
 */
export interface CachePersistConfig {
  /** Maximum cache size in bytes (default: 5MB) */
  maxSize?: number;
  /** Debounce delay in milliseconds before writing to storage (default: 1000ms) */
  debounce?: number;
  /** Storage key for the cache (default: 'apollo-cache-persist') */
  key?: string;
  /** Whether to log debug information (default: false in production) */
  debug?: boolean;
}
/**
 * Initialize cache persistence.
 *
 * Should be called before the first Apollo query to ensure
 * the cache is hydrated from storage.
 *
 * @param cache - The Apollo InMemoryCache instance
 * @param config - Optional configuration
 * @returns Promise that resolves when cache is restored
 *
 * @example
 * ```tsx
 * // In your app initialization
 * import { apolloCache } from '@nasnet/api-client/core';
 * import { initializeCachePersistence } from '@nasnet/api-client/core';
 *
 * async function initApp() {
 *   // Restore cache before rendering
 *   await initializeCachePersistence(apolloCache);
 *
 *   // Now render the app
 *   ReactDOM.render(<App />, document.getElementById('root'));
 * }
 * ```
 */
export declare function initializeCachePersistence(
  cache: InMemoryCache,
  config?: CachePersistConfig
): Promise<void>;
/**
 * Clear persisted cache from storage.
 *
 * @param key - Storage key prefix (default: 'nasnet-apollo-cache')
 *
 * @example
 * ```ts
 * // Clear cache on logout
 * await clearPersistedCache();
 * apolloClient.clearStore();
 * ```
 */
export declare function clearPersistedCache(key?: string): Promise<void>;
/**
 * Get the size of persisted cache in bytes.
 *
 * @param key - Storage key prefix (default: 'nasnet-apollo-cache')
 * @returns Cache size in bytes
 */
export declare function getPersistedCacheSize(key?: string): Promise<number>;
//# sourceMappingURL=apollo-cache-persist.d.ts.map
