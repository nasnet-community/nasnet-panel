/**
 * Counter History Storage - IndexedDB storage for firewall rule counter history
 *
 * Stores historical counter data for trend analysis and visualization.
 * Enables historical chart visualization and performance trending for firewall rules.
 *
 * Features:
 * - 7-day retention with automatic cleanup
 * - Composite indexes for efficient querying
 * - CSV export for data analysis
 * - Batch insert for performance
 *
 * @example
 * ```typescript
 * const storage = counterHistoryStorage;
 * await storage.init();
 * await storage.saveCounterSnapshot([...entries]);
 * const history = await storage.getCounterHistory(routerId, ruleId);
 * ```
 *
 * @see Docs/architecture/frontend-architecture.md (Data persistence layer)
 */
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
/**
 * Counter History Storage Service
 *
 * Manages persistent storage of firewall rule counter snapshots using IndexedDB.
 * Enables trend visualization and historical analysis of rule activity.
 *
 * @internal
 */
export declare class CounterHistoryStorage {
    private db;
    private readonly DB_NAME;
    private readonly DB_VERSION;
    private readonly STORE_NAME;
    private readonly RETENTION_DAYS;
    /**
     * Initialize the IndexedDB database
     * Creates object store and indexes on first run
     *
     * @throws Error if initialization fails
     */
    init(): Promise<void>;
    /**
     * Save counter snapshots in batch
     * More efficient than individual inserts
     *
     * @param entries - Array of counter history entries to save
     * @throws Error if database is not initialized
     */
    saveCounterSnapshot(entries: CounterHistoryEntry[]): Promise<void>;
    /**
     * Get counter history for a specific rule
     *
     * @param routerId - Router ID
     * @param ruleId - Firewall rule ID
     * @param startTime - Unix timestamp (ms) to start from (default: 7 days ago)
     * @returns Array of counter history entries, sorted by timestamp ascending
     */
    getCounterHistory(routerId: string, ruleId: string, startTime?: number): Promise<CounterHistoryEntry[]>;
    /**
     * Clean up entries older than retention period (7 days)
     *
     * @returns Number of entries deleted
     */
    cleanupOldEntries(): Promise<number>;
    /**
     * Export counter history to CSV format
     * Useful for external analysis tools
     *
     * @param routerId - Router ID
     * @param ruleId - Firewall rule ID
     * @param startTime - Unix timestamp (ms) to start from (default: 7 days ago)
     * @returns CSV string with headers: timestamp,packets,bytes
     */
    exportToCsv(routerId: string, ruleId: string, startTime?: number): Promise<string>;
    /**
     * Get storage statistics
     *
     * @returns Total number of entries in storage
     */
    getStats(): Promise<{
        totalEntries: number;
    }>;
    /**
     * Clear all counter history
     * Useful for testing or troubleshooting
     */
    clearAll(): Promise<void>;
    /**
     * Close the database connection
     * Call when shutting down the application
     */
    close(): void;
}
/**
 * Singleton instance for global access
 *
 * Initialize once on app startup and reuse throughout the application:
 * ```typescript
 * await counterHistoryStorage.init();
 * ```
 *
 * @see CounterHistoryStorage for usage examples
 */
export declare const counterHistoryStorage: CounterHistoryStorage;
//# sourceMappingURL=counterHistoryStorage.d.ts.map