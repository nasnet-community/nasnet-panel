/**
 * Counter History Storage - IndexedDB storage for firewall rule counter history
 *
 * Story: Counter Visualization Feature
 * Stores historical counter data for trend analysis and visualization
 *
 * Features:
 * - 7-day retention with automatic cleanup
 * - Composite indexes for efficient querying
 * - CSV export for data analysis
 * - Batch insert for performance
 */

import { openDB, DBSchema, IDBPDatabase } from 'idb';

/**
 * Counter history entry
 * Stores a snapshot of a firewall rule's counter values at a specific time
 */
export interface CounterHistoryEntry {
  /** Composite key: `${routerId}-${ruleId}-${timestamp}` */
  id: string;

  /** Firewall rule ID */
  ruleId: string;

  /** Router ID that owns this rule */
  routerId: string;

  /** Unix timestamp (milliseconds) when counter was captured */
  timestamp: number;

  /** Packet count at this timestamp */
  packets: number;

  /** Byte count at this timestamp */
  bytes: number;
}

/**
 * IndexedDB schema for counter history
 */
interface CounterHistoryDB extends DBSchema {
  counterHistory: {
    key: string;
    value: CounterHistoryEntry;
    indexes: {
      /** Composite index for querying by router + rule */
      'by-router-rule': [string, string];
      /** Index for timestamp-based queries and cleanup */
      'by-timestamp': number;
    };
  };
}

/**
 * Counter History Storage Service
 *
 * Manages persistent storage of firewall rule counter snapshots using IndexedDB.
 * Enables trend visualization and historical analysis of rule activity.
 *
 * Usage:
 * ```typescript
 * await counterHistoryStorage.init();
 * await counterHistoryStorage.saveCounterSnapshot([...entries]);
 * const history = await counterHistoryStorage.getCounterHistory(routerId, ruleId, startTime);
 * ```
 */
export class CounterHistoryStorage {
  private db: IDBPDatabase<CounterHistoryDB> | null = null;
  private readonly dbName = 'nasnet-counter-history';
  private readonly dbVersion = 1;
  private readonly storeName = 'counterHistory';
  private readonly retentionDays = 7;

  /**
   * Initialize the IndexedDB database
   * Creates object store and indexes on first run
   */
  async init(): Promise<void> {
    if (this.db) {
      return; // Already initialized
    }

    this.db = await openDB<CounterHistoryDB>(this.dbName, this.dbVersion, {
      upgrade(db) {
        // Create object store with composite key
        const store = db.createObjectStore('counterHistory', { keyPath: 'id' });

        // Composite index for efficient router+rule queries
        store.createIndex('by-router-rule', ['routerId', 'ruleId'], {
          unique: false,
        });

        // Timestamp index for cleanup and time-range queries
        store.createIndex('by-timestamp', 'timestamp', { unique: false });
      },
    });
  }

  /**
   * Save counter snapshots in batch
   * More efficient than individual inserts
   *
   * @param entries - Array of counter history entries to save
   * @throws Error if database is not initialized
   */
  async saveCounterSnapshot(entries: CounterHistoryEntry[]): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized. Call init() first.');
    }

    if (entries.length === 0) {
      return; // Nothing to save
    }

    // Use a single transaction for all inserts
    const tx = this.db.transaction(this.storeName, 'readwrite');
    const store = tx.objectStore(this.storeName);

    // Insert all entries
    await Promise.all(entries.map((entry) => store.put(entry)));

    // Wait for transaction to complete
    await tx.done;
  }

  /**
   * Get counter history for a specific rule
   *
   * @param routerId - Router ID
   * @param ruleId - Firewall rule ID
   * @param startTime - Unix timestamp (ms) to start from (default: 7 days ago)
   * @returns Array of counter history entries, sorted by timestamp ascending
   */
  async getCounterHistory(
    routerId: string,
    ruleId: string,
    startTime?: number
  ): Promise<CounterHistoryEntry[]> {
    if (!this.db) {
      throw new Error('Database not initialized. Call init() first.');
    }

    // Default to 7 days ago if not specified
    const start = startTime ?? Date.now() - this.retentionDays * 24 * 60 * 60 * 1000;

    const tx = this.db.transaction(this.storeName, 'readonly');
    const index = tx.objectStore(this.storeName).index('by-router-rule');

    // Query by composite key [routerId, ruleId]
    const allEntries = await index.getAll([routerId, ruleId]);

    // Filter by start time and sort by timestamp
    const filteredEntries = allEntries
      .filter((entry) => entry.timestamp >= start)
      .sort((a, b) => a.timestamp - b.timestamp);

    return filteredEntries;
  }

  /**
   * Clean up entries older than retention period (7 days)
   *
   * @returns Number of entries deleted
   */
  async cleanupOldEntries(): Promise<number> {
    if (!this.db) {
      throw new Error('Database not initialized. Call init() first.');
    }

    const cutoffTime = Date.now() - this.retentionDays * 24 * 60 * 60 * 1000;

    const tx = this.db.transaction(this.storeName, 'readwrite');
    const index = tx.objectStore(this.storeName).index('by-timestamp');

    let deletedCount = 0;

    // Iterate through entries older than cutoff
    let cursor = await index.openCursor(IDBKeyRange.upperBound(cutoffTime));

    while (cursor) {
      await cursor.delete();
      deletedCount++;
      cursor = await cursor.continue();
    }

    await tx.done;

    return deletedCount;
  }

  /**
   * Export counter history to CSV format
   * Useful for external analysis tools
   *
   * @param routerId - Router ID
   * @param ruleId - Firewall rule ID
   * @param startTime - Unix timestamp (ms) to start from (default: 7 days ago)
   * @returns CSV string with headers: timestamp,packets,bytes
   */
  async exportToCsv(routerId: string, ruleId: string, startTime?: number): Promise<string> {
    const entries = await this.getCounterHistory(routerId, ruleId, startTime);

    if (entries.length === 0) {
      return 'timestamp,packets,bytes\n'; // Empty CSV with headers
    }

    // CSV header
    const header = 'timestamp,packets,bytes\n';

    // CSV rows
    const rows = entries
      .map((entry) => {
        // Format timestamp as ISO 8601
        const timestamp = new Date(entry.timestamp).toISOString();
        return `${timestamp},${entry.packets},${entry.bytes}`;
      })
      .join('\n');

    return header + rows;
  }

  /**
   * Get storage statistics
   *
   * @returns Total number of entries in storage
   */
  async getStats(): Promise<{ totalEntries: number }> {
    if (!this.db) {
      throw new Error('Database not initialized. Call init() first.');
    }

    const tx = this.db.transaction(this.storeName, 'readonly');
    const store = tx.objectStore(this.storeName);
    const totalEntries = await store.count();

    return { totalEntries };
  }

  /**
   * Clear all counter history
   * Useful for testing or troubleshooting
   */
  async clearAll(): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized. Call init() first.');
    }

    const tx = this.db.transaction(this.storeName, 'readwrite');
    await tx.objectStore(this.storeName).clear();
    await tx.done;
  }

  /**
   * Close the database connection
   * Call when shutting down the application
   */
  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}

/**
 * Singleton instance for global access
 * Initialize once and reuse throughout the application
 */
export const counterHistoryStorage = new CounterHistoryStorage();
