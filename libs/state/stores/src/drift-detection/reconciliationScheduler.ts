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
import {
  ResourcePriority,
  getResourcePriority,
  DriftStatus,
  type DriftResult,
} from './types';
import { detectResourceDrift } from './useDriftDetection';

// =============================================================================
// Types
// =============================================================================

/**
 * Callback when drift is detected
 */
export type DriftCallback = (
  resourceUuid: string,
  result: DriftResult
) => void;

/**
 * Callback to fetch fresh resource data
 */
export type ResourceFetcher = (
  resourceUuids: string[]
) => Promise<Resource[]>;

/**
 * Connection status provider
 */
export type ConnectionStatusProvider = () => boolean;

/**
 * Scheduled resource entry
 */
interface ScheduledResource {
  uuid: string;
  type: string;
  priority: ResourcePriority;
  nextCheck: number;
  lastResult?: DriftResult;
}

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

// =============================================================================
// Reconciliation Scheduler Class
// =============================================================================

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
export class ReconciliationScheduler {
  private resources: Map<string, ScheduledResource> = new Map();
  private timerId: ReturnType<typeof setInterval> | null = null;
  private isRunning = false;
  private lastBatchTime = 0;

  private readonly onDriftDetected?: DriftCallback;
  private readonly onDriftResolved?: DriftCallback;
  private readonly onError?: (resourceUuid: string, error: Error) => void;
  private readonly resourceFetcher: ResourceFetcher;
  private readonly isOnline: ConnectionStatusProvider;
  private readonly batchSize: number;
  private readonly minBatchInterval: number;

  constructor(options: ReconciliationSchedulerOptions) {
    this.onDriftDetected = options.onDriftDetected;
    this.onDriftResolved = options.onDriftResolved;
    this.onError = options.onError;
    this.resourceFetcher = options.resourceFetcher;
    this.isOnline = options.isOnline ?? (() => true);
    this.batchSize = options.batchSize ?? 10;
    this.minBatchInterval = options.minBatchInterval ?? 1000;
  }

  // ===========================================================================
  // Registration
  // ===========================================================================

  /**
   * Register a resource for reconciliation polling
   */
  register(resource: Resource): void {
    const priority = getResourcePriority(resource.type);

    this.resources.set(resource.uuid, {
      uuid: resource.uuid,
      type: resource.type,
      priority,
      nextCheck: Date.now() + priority, // First check after priority interval
    });
  }

  /**
   * Register multiple resources
   */
  registerMany(resources: Resource[]): void {
    for (const resource of resources) {
      this.register(resource);
    }
  }

  /**
   * Unregister a resource
   */
  unregister(resourceUuid: string): void {
    this.resources.delete(resourceUuid);
  }

  /**
   * Clear all registered resources
   */
  clear(): void {
    this.resources.clear();
  }

  // ===========================================================================
  // Scheduling
  // ===========================================================================

  /**
   * Schedule immediate check for a resource
   * Useful after detecting external changes
   */
  scheduleImmediateCheck(resourceUuid: string): void {
    const resource = this.resources.get(resourceUuid);
    if (resource) {
      resource.nextCheck = 0; // Check on next tick
    }
  }

  /**
   * Schedule immediate check for multiple resources
   */
  scheduleImmediateCheckMany(resourceUuids: string[]): void {
    for (const uuid of resourceUuids) {
      this.scheduleImmediateCheck(uuid);
    }
  }

  /**
   * Get resources due for checking
   */
  private getDueResources(): ScheduledResource[] {
    const now = Date.now();
    const due: ScheduledResource[] = [];

    for (const resource of this.resources.values()) {
      if (resource.nextCheck <= now) {
        due.push(resource);
      }
    }

    // Sort by next check time (most overdue first)
    due.sort((a, b) => a.nextCheck - b.nextCheck);

    // Limit to batch size
    return due.slice(0, this.batchSize);
  }

  // ===========================================================================
  // Execution
  // ===========================================================================

  /**
   * Start the scheduler
   */
  start(): void {
    if (this.isRunning) return;

    this.isRunning = true;
    this.tick(); // Initial tick

    // Schedule periodic ticks (every minute minimum)
    this.timerId = setInterval(() => this.tick(), 60 * 1000);
  }

  /**
   * Stop the scheduler
   */
  stop(): void {
    this.isRunning = false;

    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  /**
   * Check if scheduler is running
   */
  get running(): boolean {
    return this.isRunning;
  }

  /**
   * Get registered resource count
   */
  get resourceCount(): number {
    return this.resources.size;
  }

  /**
   * Main tick function - processes due resources
   */
  private async tick(): Promise<void> {
    // Skip if not online
    if (!this.isOnline()) {
      return;
    }

    // Rate limiting
    const now = Date.now();
    if (now - this.lastBatchTime < this.minBatchInterval) {
      return;
    }
    this.lastBatchTime = now;

    // Get due resources
    const dueResources = this.getDueResources();
    if (dueResources.length === 0) {
      return;
    }

    // Fetch fresh data and check drift
    await this.processBatch(dueResources);
  }

  /**
   * Process a batch of resources
   */
  private async processBatch(scheduled: ScheduledResource[]): Promise<void> {
    const uuids = scheduled.map((r) => r.uuid);

    try {
      // Fetch fresh resource data
      const resources = await this.resourceFetcher(uuids);
      const resourceMap = new Map(resources.map((r) => [r.uuid, r]));

      // Process each resource
      for (const entry of scheduled) {
        const resource = resourceMap.get(entry.uuid);

        if (!resource) {
          // Resource no longer exists
          this.resources.delete(entry.uuid);
          continue;
        }

        try {
          const result = detectResourceDrift(resource);

          // Check for status changes
          const previousStatus = entry.lastResult?.status;
          const currentStatus = result.status;

          if (currentStatus === DriftStatus.DRIFTED) {
            this.onDriftDetected?.(entry.uuid, result);
          } else if (
            previousStatus === DriftStatus.DRIFTED &&
            currentStatus === DriftStatus.SYNCED
          ) {
            this.onDriftResolved?.(entry.uuid, result);
          }

          // Update entry
          entry.lastResult = result;
          entry.nextCheck = Date.now() + entry.priority;
        } catch (error) {
          this.onError?.(
            entry.uuid,
            error instanceof Error ? error : new Error(String(error))
          );
          // Retry after normal interval on error
          entry.nextCheck = Date.now() + entry.priority;
        }
      }
    } catch (error) {
      // Batch fetch failed - reschedule all for retry
      const retryDelay = 30 * 1000; // 30 seconds
      for (const entry of scheduled) {
        entry.nextCheck = Date.now() + retryDelay;
      }

      // Report error for first resource as representative
      if (scheduled.length > 0) {
        this.onError?.(
          scheduled[0].uuid,
          error instanceof Error ? error : new Error(String(error))
        );
      }
    }
  }

  // ===========================================================================
  // Status
  // ===========================================================================

  /**
   * Get drift status for all registered resources
   */
  getAllDriftStatus(): Map<string, DriftResult | undefined> {
    const status = new Map<string, DriftResult | undefined>();

    for (const [uuid, entry] of this.resources) {
      status.set(uuid, entry.lastResult);
    }

    return status;
  }

  /**
   * Get resources that have drift
   */
  getDriftedResources(): string[] {
    const drifted: string[] = [];

    for (const [uuid, entry] of this.resources) {
      if (entry.lastResult?.status === DriftStatus.DRIFTED) {
        drifted.push(uuid);
      }
    }

    return drifted;
  }

  /**
   * Get count of resources by drift status
   */
  getDriftCounts(): Record<DriftStatus, number> {
    const counts: Record<DriftStatus, number> = {
      [DriftStatus.SYNCED]: 0,
      [DriftStatus.DRIFTED]: 0,
      [DriftStatus.ERROR]: 0,
      [DriftStatus.CHECKING]: 0,
      [DriftStatus.PENDING]: 0,
    };

    for (const entry of this.resources.values()) {
      const status = entry.lastResult?.status ?? DriftStatus.PENDING;
      counts[status]++;
    }

    return counts;
  }
}

// =============================================================================
// Singleton Instance (Optional)
// =============================================================================

let defaultScheduler: ReconciliationScheduler | null = null;

/**
 * Get or create the default scheduler instance
 */
export function getDefaultScheduler(
  options?: ReconciliationSchedulerOptions
): ReconciliationScheduler {
  if (!defaultScheduler && options) {
    defaultScheduler = new ReconciliationScheduler(options);
  }

  if (!defaultScheduler) {
    throw new Error(
      'ReconciliationScheduler not initialized. Call with options first.'
    );
  }

  return defaultScheduler;
}

/**
 * Initialize the default scheduler
 */
export function initializeScheduler(
  options: ReconciliationSchedulerOptions
): ReconciliationScheduler {
  if (defaultScheduler) {
    defaultScheduler.stop();
  }

  defaultScheduler = new ReconciliationScheduler(options);
  return defaultScheduler;
}

/**
 * Destroy the default scheduler
 */
export function destroyScheduler(): void {
  if (defaultScheduler) {
    defaultScheduler.stop();
    defaultScheduler = null;
  }
}
