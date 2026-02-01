/**
 * Apollo Cache Persistence
 *
 * Persists Apollo cache to IndexedDB for offline support.
 * Uses localforage for cross-browser IndexedDB abstraction.
 *
 * @module @nasnet/api-client/core/apollo
 */

import { InMemoryCache } from '@apollo/client';
import { persistCache, LocalStorageWrapper } from 'apollo3-cache-persist';
import localforage from 'localforage';

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

const DEFAULT_CONFIG: Required<CachePersistConfig> = {
  maxSize: 5 * 1024 * 1024, // 5MB
  debounce: 1000, // 1 second
  key: 'nasnet-apollo-cache',
  debug: import.meta.env.DEV,
};

/**
 * Configure localforage for IndexedDB storage.
 * Uses IndexedDB as primary driver with fallback to localStorage.
 */
function configureStorage(): typeof localforage {
  localforage.config({
    driver: [localforage.INDEXEDDB, localforage.LOCALSTORAGE],
    name: 'nasnet-apollo-cache',
    storeName: 'apollo_cache',
    description: 'Apollo Client cache persistence for offline support',
  });

  return localforage;
}

/**
 * Localforage-based storage wrapper for apollo3-cache-persist.
 * Implements the PersistedData storage interface.
 */
class LocalForageWrapper {
  private storage: typeof localforage;
  private key: string;

  constructor(storage: typeof localforage, key: string) {
    this.storage = storage;
    this.key = key;
  }

  async getItem(key: string): Promise<string | null> {
    try {
      return await this.storage.getItem(`${this.key}-${key}`);
    } catch (error) {
      console.error('[Cache Persist] Error reading from storage:', error);
      return null;
    }
  }

  async setItem(key: string, value: string): Promise<void> {
    try {
      await this.storage.setItem(`${this.key}-${key}`, value);
    } catch (error) {
      console.error('[Cache Persist] Error writing to storage:', error);
    }
  }

  async removeItem(key: string): Promise<void> {
    try {
      await this.storage.removeItem(`${this.key}-${key}`);
    } catch (error) {
      console.error('[Cache Persist] Error removing from storage:', error);
    }
  }
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
export async function initializeCachePersistence(
  cache: InMemoryCache,
  config: CachePersistConfig = {}
): Promise<void> {
  const { maxSize, debounce, key, debug } = { ...DEFAULT_CONFIG, ...config };

  if (typeof window === 'undefined') {
    // SSR - skip persistence
    if (debug) {
      console.log('[Cache Persist] Skipping persistence in SSR environment');
    }
    return;
  }

  const storage = configureStorage();
  const wrapper = new LocalForageWrapper(storage, key);

  try {
    await persistCache({
      cache,
      storage: wrapper as unknown as LocalStorageWrapper,
      maxSize,
      debounce,
      debug,
    });

    if (debug) {
      console.log('[Cache Persist] Cache restored successfully');
    }
  } catch (error) {
    console.error('[Cache Persist] Failed to restore cache:', error);

    // Clear corrupted cache and continue
    try {
      await clearPersistedCache(key);
      if (debug) {
        console.log('[Cache Persist] Cleared corrupted cache');
      }
    } catch {
      // Ignore errors during cleanup
    }
  }
}

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
export async function clearPersistedCache(
  key = DEFAULT_CONFIG.key
): Promise<void> {
  if (typeof window === 'undefined') {
    return;
  }

  const storage = configureStorage();

  try {
    const keys = await storage.keys();
    const cacheKeys = keys.filter((k) => k.startsWith(`${key}-`));

    await Promise.all(cacheKeys.map((k) => storage.removeItem(k)));
  } catch (error) {
    console.error('[Cache Persist] Failed to clear cache:', error);
  }
}

/**
 * Get the size of persisted cache in bytes.
 *
 * @param key - Storage key prefix (default: 'nasnet-apollo-cache')
 * @returns Cache size in bytes
 */
export async function getPersistedCacheSize(
  key = DEFAULT_CONFIG.key
): Promise<number> {
  if (typeof window === 'undefined') {
    return 0;
  }

  const storage = configureStorage();

  try {
    const keys = await storage.keys();
    const cacheKeys = keys.filter((k) => k.startsWith(`${key}-`));

    let totalSize = 0;
    for (const cacheKey of cacheKeys) {
      const value = await storage.getItem(cacheKey);
      if (typeof value === 'string') {
        totalSize += value.length * 2; // UTF-16 characters are 2 bytes
      }
    }

    return totalSize;
  } catch (error) {
    console.error('[Cache Persist] Failed to get cache size:', error);
    return 0;
  }
}
