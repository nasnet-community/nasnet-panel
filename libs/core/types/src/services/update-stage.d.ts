/**
 * Update Stage Types
 *
 * Update progress stages for service instance updates.
 * Used to track the lifecycle of update operations.
 *
 * @module @nasnet/core/types/services
 */
/**
 * Update progress stages
 *
 * Represents the different stages an update can be in:
 * - PENDING: Update queued, waiting to start
 * - DOWNLOADING: Fetching update binary
 * - VERIFYING: Verifying download integrity
 * - STOPPING: Shutting down current instance
 * - INSTALLING: Extracting and installing new version
 * - STARTING: Launching updated instance
 * - HEALTH_CHECK: Verifying instance is healthy
 * - COMPLETE: Update finished successfully
 * - FAILED: Update failed during process
 * - ROLLED_BACK: Update rolled back after failure
 */
export type UpdateStage = 'PENDING' | 'DOWNLOADING' | 'VERIFYING' | 'STOPPING' | 'INSTALLING' | 'STARTING' | 'HEALTH_CHECK' | 'COMPLETE' | 'FAILED' | 'ROLLED_BACK';
//# sourceMappingURL=update-stage.d.ts.map