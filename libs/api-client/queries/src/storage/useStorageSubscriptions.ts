import { useSubscription } from '@apollo/client';
import {
  SUBSCRIBE_STORAGE_MOUNT_CHANGED,
  SUBSCRIBE_STORAGE_SPACE_CHANGED,
} from './storage.graphql';
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
export function useStorageMountChanged(
  path?: string,
  onMountChanged?: (event: StorageMountEvent) => void
) {
  const { data, loading, error } = useSubscription(
    SUBSCRIBE_STORAGE_MOUNT_CHANGED,
    {
      variables: { path },
      onData: ({ data: subscriptionData }) => {
        if (subscriptionData?.storageMountChanged && onMountChanged) {
          onMountChanged(subscriptionData.storageMountChanged);
        }
      },
    }
  );

  return {
    event: data?.storageMountChanged as StorageMountEvent | undefined,
    loading,
    error,
  };
}

/**
 * Hook to subscribe to storage space threshold events.
 * Emits when storage usage crosses 80%, 90%, or 95% thresholds.
 *
 * @param path - Optional path filter (if not provided, all storage events)
 * @param onSpaceChanged - Callback when storage space crosses threshold
 * @returns Subscription data and state
 */
export function useStorageSpaceChanged(
  path?: string,
  onSpaceChanged?: (event: StorageSpaceEvent) => void
) {
  const { data, loading, error } = useSubscription(
    SUBSCRIBE_STORAGE_SPACE_CHANGED,
    {
      variables: { path },
      onData: ({ data: subscriptionData }) => {
        if (subscriptionData?.storageSpaceChanged && onSpaceChanged) {
          onSpaceChanged(subscriptionData.storageSpaceChanged);
        }
      },
    }
  );

  return {
    event: data?.storageSpaceChanged as StorageSpaceEvent | undefined,
    loading,
    error,
  };
}

/**
 * Combined hook for monitoring both mount and space events.
 * Useful for comprehensive storage monitoring.
 *
 * @param options - Configuration options
 * @returns Both subscription states
 */
export function useStorageMonitoring(options?: {
  path?: string;
  onMountChanged?: (event: StorageMountEvent) => void;
  onSpaceChanged?: (event: StorageSpaceEvent) => void;
}) {
  const mountSubscription = useStorageMountChanged(
    options?.path,
    options?.onMountChanged
  );
  const spaceSubscription = useStorageSpaceChanged(
    options?.path,
    options?.onSpaceChanged
  );

  return {
    mount: mountSubscription,
    space: spaceSubscription,
    loading: mountSubscription.loading || spaceSubscription.loading,
    error: mountSubscription.error || spaceSubscription.error,
  };
}
