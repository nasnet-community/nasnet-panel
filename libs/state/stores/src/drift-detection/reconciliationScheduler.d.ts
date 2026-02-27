/**
 * Reconciliation Polling Scheduler
 *
 * Priority-based scheduler for periodic drift detection across resources.
 * Pauses when offline and supports immediate re-checks on resource changes.
 *
 * @see NAS-4.13: Implement Drift Detection Foundation
 * @see Docs/architecture/data-architecture.md#apply-confirm-merge-pattern
 */
import type { Resource } from '@nasnet/core/types';
import { DriftStatus, type DriftResult } from './types';
/**
 * Callback when drift is detected
 */
export type DriftCallback = (resourceUuid: string, result: DriftResult) => void;
/**
 * Callback to fetch fresh resource data
 */
export type ResourceFetcher = (resourceUuids: string[]) => Promise<Resource[]>;
/**
 * Connection status provider
 */
export type ConnectionStatusProvider = () => boolean;
/**
 * Scheduler options
 */
export interface ReconciliationSchedulerOptions {
  /** Callback when drift is detected */
  onDriftDetected?: DriftCallback;
  /** Callback when drift is resolved */
  onDriftResolved?: DriftCallback;
  /** Callback when error occurs during check */
  onError?: (resourceUuid: string, error: Error) => void;
  /** Function to fetch fresh resource data */
  resourceFetcher: ResourceFetcher;
  /** Function to check if online */
  isOnline?: ConnectionStatusProvider;
  /** Batch size for concurrent checks */
  batchSize?: number;
  /** Minimum interval between batches (ms) */
  minBatchInterval?: number;
}
/**
 * ReconciliationScheduler manages periodic drift checks for resources
 * based on their priority level.
 *
 * @example
 * ```ts
 * const scheduler = new ReconciliationScheduler({
 *   onDriftDetected: (uuid, result) => {
 *     console.log(`Drift detected for ${uuid}:`, result.driftedFields);
 *   },
 *   resourceFetcher: async (uuids) => {
 *     const result = await apolloClient.query({
 *       query: GET_RESOURCES,
 *       variables: { uuids },
 *     });
 *     return result.data.resources;
 *   },
 *   isOnline: () => connectionStore.getState().wsStatus === 'connected',
 * });
 *
 * // Register resources for monitoring
 * scheduler.register(myResource);
 *
 * // Start the scheduler
 * scheduler.start();
 *
 * // Trigger immediate check after external change
 * scheduler.scheduleImmediateCheck(myResource.uuid);
 *
 * // Stop when done
 * scheduler.stop();
 * ```
 */
export declare class ReconciliationScheduler {
  private resources;
  private timerId;
  private isRunning;
  private lastBatchTime;
  private readonly onDriftDetected?;
  private readonly onDriftResolved?;
  private readonly onError?;
  private readonly resourceFetcher;
  private readonly isOnline;
  private readonly batchSize;
  private readonly minBatchInterval;
  constructor(options: ReconciliationSchedulerOptions);
  /**
   * Register a resource for reconciliation polling
   */
  register(resource: Resource): void;
  /**
   * Register multiple resources
   */
  registerMany(resources: Resource[]): void;
  /**
   * Unregister a resource
   */
  unregister(resourceUuid: string): void;
  /**
   * Clear all registered resources
   */
  clear(): void;
  /**
   * Schedule immediate check for a resource
   * Useful after detecting external changes
   */
  scheduleImmediateCheck(resourceUuid: string): void;
  /**
   * Schedule immediate check for multiple resources
   */
  scheduleImmediateCheckMany(resourceUuids: string[]): void;
  /**
   * Get resources due for checking
   */
  private getDueResources;
  /**
   * Start the scheduler
   */
  start(): void;
  /**
   * Stop the scheduler
   */
  stop(): void;
  /**
   * Check if scheduler is running
   */
  get running(): boolean;
  /**
   * Get registered resource count
   */
  get resourceCount(): number;
  /**
   * Main tick function - processes due resources
   */
  private tick;
  /**
   * Process a batch of resources
   */
  private processBatch;
  /**
   * Get drift status for all registered resources
   */
  getAllDriftStatus(): Map<string, DriftResult | undefined>;
  /**
   * Get resources that have drift
   */
  getDriftedResources(): string[];
  /**
   * Get count of resources by drift status
   */
  getDriftCounts(): Record<DriftStatus, number>;
}
/**
 * Get or create the default scheduler instance
 */
export declare function getDefaultScheduler(
  options?: ReconciliationSchedulerOptions
): ReconciliationScheduler;
/**
 * Initialize the default scheduler
 */
export declare function initializeScheduler(
  options: ReconciliationSchedulerOptions
): ReconciliationScheduler;
/**
 * Destroy the default scheduler
 */
export declare function destroyScheduler(): void;
//# sourceMappingURL=reconciliationScheduler.d.ts.map
