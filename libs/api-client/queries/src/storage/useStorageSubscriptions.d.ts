import type { StorageInfo } from './useStorageInfo';
import type { StorageThresholdStatus } from './useStorageUsage';
/**
 * Storage mounted event
 */
export interface StorageMountedEvent {
    path: string;
    storageInfo: StorageInfo;
    featuresRestored: number;
    timestamp: string;
}
/**
 * Storage unmounted event
 */
export interface StorageUnmountedEvent {
    path: string;
    featuresAffected: number;
    affectedFeatureIds: string[];
    timestamp: string;
}
/**
 * Union type for storage mount events
 */
export type StorageMountEvent = StorageMountedEvent | StorageUnmountedEvent;
/**
 * Storage space threshold event
 */
export interface StorageSpaceEvent {
    path: string;
    status: StorageThresholdStatus;
    previousStatus: StorageThresholdStatus;
    usagePercent: number;
    availableBytes: string;
    timestamp: string;
}
/**
 * Hook to subscribe to storage mount/unmount events.
 * Emits when external storage becomes available or unavailable.
 *
 * @param path - Optional path filter (if not provided, all storage events)
 * @param onMountChanged - Callback when storage mount status changes
 * @returns Subscription data and state
 */
export declare function useStorageMountChanged(path?: string, onMountChanged?: (event: StorageMountEvent) => void): {
    event: StorageMountEvent | undefined;
    loading: boolean;
    error: import("@apollo/client").ApolloError | undefined;
};
/**
 * Hook to subscribe to storage space threshold events.
 * Emits when storage usage crosses 80%, 90%, or 95% thresholds.
 *
 * @param path - Optional path filter (if not provided, all storage events)
 * @param onSpaceChanged - Callback when storage space crosses threshold
 * @returns Subscription data and state
 */
export declare function useStorageSpaceChanged(path?: string, onSpaceChanged?: (event: StorageSpaceEvent) => void): {
    event: StorageSpaceEvent | undefined;
    loading: boolean;
    error: import("@apollo/client").ApolloError | undefined;
};
/**
 * Combined hook for monitoring both mount and space events.
 * Useful for comprehensive storage monitoring.
 *
 * @param options - Configuration options
 * @returns Both subscription states
 */
export declare function useStorageMonitoring(options?: {
    path?: string;
    onMountChanged?: (event: StorageMountEvent) => void;
    onSpaceChanged?: (event: StorageSpaceEvent) => void;
}): {
    mount: {
        event: StorageMountEvent | undefined;
        loading: boolean;
        error: import("@apollo/client").ApolloError | undefined;
    };
    space: {
        event: StorageSpaceEvent | undefined;
        loading: boolean;
        error: import("@apollo/client").ApolloError | undefined;
    };
    loading: boolean;
    error: import("@apollo/client").ApolloError | undefined;
};
//# sourceMappingURL=useStorageSubscriptions.d.ts.map