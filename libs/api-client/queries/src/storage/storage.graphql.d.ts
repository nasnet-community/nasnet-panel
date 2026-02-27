/**
 * GraphQL documents for External Storage Management
 * NAS-8.20: USB/disk storage for service binaries and data
 */
/**
 * List all detected storage locations (flash and external).
 * Scans known RouterOS mount points and returns availability.
 */
export declare const GET_STORAGE_INFO: import('graphql').DocumentNode;
/**
 * Get comprehensive storage usage breakdown.
 * Shows flash vs external usage and per-feature breakdown.
 */
export declare const GET_STORAGE_USAGE: import('graphql').DocumentNode;
/**
 * Get current external storage configuration.
 * Returns enabled state and configured path.
 */
export declare const GET_STORAGE_CONFIG: import('graphql').DocumentNode;
/**
 * Get list of features affected by storage disconnection.
 * Returns features marked as unavailable due to missing storage.
 */
export declare const GET_UNAVAILABLE_FEATURES: import('graphql').DocumentNode;
/**
 * Configure external storage path for service binaries.
 * Validates path exists and is writable, then persists to settings.
 */
export declare const CONFIGURE_EXTERNAL_STORAGE: import('graphql').DocumentNode;
/**
 * Reset external storage configuration to use flash only.
 * Optionally migrates existing binaries back to flash.
 */
export declare const RESET_EXTERNAL_STORAGE: import('graphql').DocumentNode;
/**
 * Manually trigger storage detection scan.
 * Useful for detecting newly mounted storage without restart.
 */
export declare const SCAN_STORAGE: import('graphql').DocumentNode;
/**
 * Subscribe to storage mount/unmount events.
 * Emits when external storage becomes available or unavailable.
 */
export declare const SUBSCRIBE_STORAGE_MOUNT_CHANGED: import('graphql').DocumentNode;
/**
 * Subscribe to storage space threshold events.
 * Emits when storage usage crosses 80%, 90%, or 95% thresholds.
 */
export declare const SUBSCRIBE_STORAGE_SPACE_CHANGED: import('graphql').DocumentNode;
//# sourceMappingURL=storage.graphql.d.ts.map
