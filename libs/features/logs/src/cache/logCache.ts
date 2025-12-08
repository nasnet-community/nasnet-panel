/**
 * Log Cache - IndexedDB storage for offline log access
 * Epic 0.8: System Logs - Local Log Caching
 */

import type { LogEntry } from '@nasnet/core/types';

const DB_NAME = 'nasnet-logs';
const DB_VERSION = 1;
const STORE_NAME = 'logs';
const DEFAULT_TTL_DAYS = 7;

/**
 * Log cache entry with metadata
 */
export interface CachedLogEntry extends LogEntry {
  routerIp: string;
  cachedAt: number;
  expiresAt: number;
}

/**
 * Log cache configuration
 */
export interface LogCacheConfig {
  ttlDays: number;
  maxEntries: number;
}

const defaultConfig: LogCacheConfig = {
  ttlDays: DEFAULT_TTL_DAYS,
  maxEntries: 10000,
};

/**
 * Opens the IndexedDB database
 */
async function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('routerIp', 'routerIp', { unique: false });
        store.createIndex('timestamp', 'timestamp', { unique: false });
        store.createIndex('topic', 'topic', { unique: false });
        store.createIndex('severity', 'severity', { unique: false });
        store.createIndex('expiresAt', 'expiresAt', { unique: false });
      }
    };
  });
}

/**
 * Log cache class for managing cached log entries
 */
export class LogCache {
  private config: LogCacheConfig;
  private db: IDBDatabase | null = null;

  constructor(config: Partial<LogCacheConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
  }

  /**
   * Initialize the cache (open database)
   */
  async init(): Promise<void> {
    if (!this.db) {
      this.db = await openDatabase();
    }
  }

  /**
   * Store log entries in the cache
   */
  async storeLogs(routerIp: string, logs: LogEntry[]): Promise<void> {
    await this.init();
    if (!this.db) return;

    const now = Date.now();
    const expiresAt = now + this.config.ttlDays * 24 * 60 * 60 * 1000;

    const transaction = this.db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    for (const log of logs) {
      const cachedEntry: CachedLogEntry = {
        ...log,
        routerIp,
        cachedAt: now,
        expiresAt,
      };
      store.put(cachedEntry);
    }

    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  /**
   * Retrieve cached logs for a router
   */
  async getLogs(routerIp: string, limit = 100): Promise<CachedLogEntry[]> {
    await this.init();
    if (!this.db) return [];

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const index = store.index('routerIp');
      const request = index.getAll(routerIp, limit);

      request.onsuccess = () => {
        const now = Date.now();
        const validLogs = (request.result as CachedLogEntry[]).filter(
          (log) => log.expiresAt > now
        );
        // Sort by timestamp descending
        validLogs.sort(
          (a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
        resolve(validLogs.slice(0, limit));
      };
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Clear expired entries from the cache
   */
  async cleanupExpired(): Promise<number> {
    await this.init();
    if (!this.db) return 0;

    const now = Date.now();
    let deletedCount = 0;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const index = store.index('expiresAt');
      const range = IDBKeyRange.upperBound(now);
      const request = index.openCursor(range);

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
        if (cursor) {
          cursor.delete();
          deletedCount++;
          cursor.continue();
        }
      };

      transaction.oncomplete = () => resolve(deletedCount);
      transaction.onerror = () => reject(transaction.error);
    });
  }

  /**
   * Clear all cached logs
   */
  async clearAll(): Promise<void> {
    await this.init();
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<{
    totalEntries: number;
    oldestEntry: Date | null;
    newestEntry: Date | null;
  }> {
    await this.init();
    if (!this.db)
      return { totalEntries: 0, oldestEntry: null, newestEntry: null };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const countRequest = store.count();

      countRequest.onsuccess = () => {
        const totalEntries = countRequest.result;

        if (totalEntries === 0) {
          resolve({ totalEntries: 0, oldestEntry: null, newestEntry: null });
          return;
        }

        const index = store.index('timestamp');

        // Get oldest
        const oldestRequest = index.openCursor(null, 'next');
        let oldestEntry: Date | null = null;
        let newestEntry: Date | null = null;

        oldestRequest.onsuccess = (event) => {
          const cursor = (event.target as IDBRequest<IDBCursorWithValue>)
            .result;
          if (cursor) {
            oldestEntry = new Date(cursor.value.timestamp);
          }

          // Get newest
          const newestRequest = index.openCursor(null, 'prev');
          newestRequest.onsuccess = (event) => {
            const cursor = (event.target as IDBRequest<IDBCursorWithValue>)
              .result;
            if (cursor) {
              newestEntry = new Date(cursor.value.timestamp);
            }
            resolve({ totalEntries, oldestEntry, newestEntry });
          };
        };
      };

      countRequest.onerror = () => reject(countRequest.error);
    });
  }

  /**
   * Close the database connection
   */
  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}

// Singleton instance
let cacheInstance: LogCache | null = null;

/**
 * Get the shared log cache instance
 */
export function getLogCache(config?: Partial<LogCacheConfig>): LogCache {
  if (!cacheInstance) {
    cacheInstance = new LogCache(config);
  }
  return cacheInstance;
}






