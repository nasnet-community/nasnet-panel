/**
 * External Storage Management API Client
 *
 * This module provides React hooks for managing external storage (USB/disk)
 * for service binaries and data on MikroTik routers.
 *
 * ## Usage
 *
 * ### Viewing Storage Information
 * ```tsx
 * import { useStorageInfo } from '@nasnet/api-client/queries/storage';
 *
 * const { storageInfo, loading, error } = useStorageInfo();
 *
 * // Display flash and external storage
 * storageInfo.forEach(storage => {
 *   console.log(`${storage.path}: ${storage.usagePercent}% used`);
 * });
 * ```
 *
 * ### Monitoring Storage Usage
 * ```tsx
 * import { useStorageUsage } from '@nasnet/api-client/queries/storage';
 *
 * const { usage, loading } = useStorageUsage('router-1');
 *
 * if (usage) {
 *   console.log(`Flash: ${usage.flash.usagePercent}% used`);
 *   console.log(`External: ${usage.external?.usagePercent}% used`);
 * }
 * ```
 *
 * ### Configuring External Storage
 * ```tsx
 * import { useStorageMutations } from '@nasnet/api-client/queries/storage';
 *
 * const { configureStorage, loading } = useStorageMutations();
 *
 * await configureStorage({
 *   path: '/usb1',
 *   enabled: true,
 * });
 * ```
 *
 * ### Monitoring Storage Events
 * ```tsx
 * import { useStorageMonitoring } from '@nasnet/api-client/queries/storage';
 *
 * const { mount, space } = useStorageMonitoring({
 *   onMountChanged: (event) => {
 *     if ('featuresRestored' in event) {
 *       toast.success(`Storage mounted: ${event.featuresRestored} features restored`);
 *     } else {
 *       toast.warning(`Storage unmounted: ${event.featuresAffected} features affected`);
 *     }
 *   },
 *   onSpaceChanged: (event) => {
 *     if (event.status === 'CRITICAL') {
 *       toast.error(`Storage ${event.path} is ${event.usagePercent}% full!`);
 *     }
 *   },
 * });
 * ```
 */
export { useStorageInfo } from './useStorageInfo';
export type { StorageInfo } from './useStorageInfo';
export { useStorageUsage } from './useStorageUsage';
export type { StorageUsage, StorageBreakdown, FeatureStorageUsage, StorageThresholdStatus, } from './useStorageUsage';
export { useStorageConfig } from './useStorageConfig';
export type { StorageConfig } from './useStorageConfig';
export { useStorageMutations } from './useStorageMutations';
export type { ConfigureExternalStorageInput, ConfigureExternalStoragePayload, ResetExternalStorageInput, ResetExternalStoragePayload, ScanStoragePayload, } from './useStorageMutations';
export { useStorageMountChanged, useStorageSpaceChanged, useStorageMonitoring, } from './useStorageSubscriptions';
export type { StorageMountEvent, StorageMountedEvent, StorageUnmountedEvent, StorageSpaceEvent, } from './useStorageSubscriptions';
export { storageKeys } from './queryKeys';
export { GET_STORAGE_INFO, GET_STORAGE_USAGE, GET_STORAGE_CONFIG, GET_UNAVAILABLE_FEATURES, CONFIGURE_EXTERNAL_STORAGE, RESET_EXTERNAL_STORAGE, SCAN_STORAGE, SUBSCRIBE_STORAGE_MOUNT_CHANGED, SUBSCRIBE_STORAGE_SPACE_CHANGED, } from './storage.graphql';
//# sourceMappingURL=index.d.ts.map