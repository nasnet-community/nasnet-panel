/**
 * Offline Mutation Queue
 *
 * Queues mutations when offline and replays them when connectivity is restored.
 * Uses IndexedDB for persistence across page reloads.
 *
 * @module @nasnet/api-client/core/apollo
 */
import { DocumentNode, ApolloClient, NormalizedCacheObject } from '@apollo/client';
/**
 * Queued mutation entry
 */
export interface QueuedMutation {
  /** Unique identifier for the mutation */
  id: string;
  /** GraphQL mutation document */
  mutation: DocumentNode;
  /** Mutation variables */
  variables: Record<string, unknown>;
  /** Timestamp when the mutation was queued */
  timestamp: Date;
  /** Number of replay attempts */
  retryCount: number;
  /** Operation name from the mutation */
  operationName: string;
  /** Optional optimistic response for UI updates */
  optimisticResponse?: unknown;
}
/**
 * Configuration for the offline queue
 */
export interface OfflineQueueConfig {
  /** Maximum number of queued mutations (default: 50) */
  maxQueueSize?: number;
  /** Maximum retry attempts per mutation (default: 3) */
  maxRetries?: number;
  /** Delay between retry attempts in ms (default: 1000) */
  retryDelay?: number;
  /** Storage key prefix (default: 'nasnet-offline-queue') */
  storageKey?: string;
}
/**
 * Offline Mutation Queue
 *
 * Manages a queue of mutations that are executed when offline.
 * Mutations are persisted to IndexedDB and replayed when connectivity
 * is restored.
 *
 * Features:
 * - Automatic queue persistence across page reloads
 * - FIFO replay order (oldest mutations first)
 * - Retry with configurable attempts
 * - Max queue size limit
 * - Last-write-wins conflict resolution
 *
 * @example
 * ```tsx
 * // Create queue instance
 * const queue = new OfflineMutationQueue({ maxQueueSize: 50 });
 *
 * // Enqueue a mutation when offline
 * if (isOffline()) {
 *   await queue.enqueue(UPDATE_ROUTER, { id: '1', name: 'New Name' });
 * }
 *
 * // Replay all mutations when back online
 * await queue.replayAll(apolloClient);
 * ```
 */
export declare class OfflineMutationQueue {
  private config;
  private storage;
  private queue;
  private isReplaying;
  constructor(config?: OfflineQueueConfig);
  /**
   * Load queue from persistent storage
   */
  private loadFromStorage;
  /**
   * Save queue to persistent storage
   */
  private saveToStorage;
  /**
   * Enqueue a mutation for later execution.
   *
   * @param mutation - GraphQL mutation document
   * @param variables - Mutation variables
   * @param optimisticResponse - Optional optimistic response
   * @throws Error if queue is full
   */
  enqueue(
    mutation: DocumentNode,
    variables: Record<string, unknown>,
    optimisticResponse?: unknown
  ): Promise<string>;
  /**
   * Remove a mutation from the queue.
   *
   * @param id - Mutation ID
   */
  remove(id: string): Promise<void>;
  /**
   * Replay all queued mutations in order.
   *
   * @param client - Apollo Client instance
   * @returns Number of successfully replayed mutations
   */
  replayAll(client: ApolloClient<NormalizedCacheObject>): Promise<number>;
  /**
   * Get current queue size.
   */
  size(): number;
  /**
   * Check if queue is empty.
   */
  isEmpty(): boolean;
  /**
   * Clear all queued mutations.
   */
  clear(): Promise<void>;
  /**
   * Get queue contents (for debugging/display).
   */
  getQueue(): ReadonlyArray<QueuedMutation>;
}
/**
 * Singleton instance of the offline queue.
 * Use this in your app for consistent queue management.
 */
export declare const offlineQueue: OfflineMutationQueue;
/**
 * Setup automatic replay when coming back online.
 *
 * @param client - Apollo Client instance
 * @returns Cleanup function
 */
export declare function setupAutoReplay(client: ApolloClient<NormalizedCacheObject>): () => void;
//# sourceMappingURL=offline-queue.d.ts.map
