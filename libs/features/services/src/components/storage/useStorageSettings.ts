import { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import {
  useStorageInfo,
  useStorageUsage,
  useStorageConfig,
  useStorageMutations,
} from '@nasnet/api-client/queries';
import type {
  StorageInfo,
  StorageUsage,
  StorageConfig,
} from '@nasnet/api-client/queries';

/**
 * Headless hook for storage settings business logic.
 * Manages external storage configuration, usage monitoring, and user actions.
 *
 * @example
 * ```tsx
 * function StorageSettings() {
 *   const {
 *     isStorageDetected,
 *     isStorageDisconnected,
 *     handleEnableStorage,
 *     mounts,
 *   } = useStorageSettings();
 *
 *   if (!isStorageDetected) {
 *     return <div>No external storage detected</div>;
 *   }
 *
 *   return (
 *     <button onClick={() => handleEnableStorage(mounts[0].path)}>
 *       Enable Storage
 *     </button>
 *   );
 * }
 * ```
 */
export function useStorageSettings() {
  // =============================================================================
  // Data Fetching
  // =============================================================================

  const { storageInfo: allStorageInfo, loading: loadingInfo, error: errorInfo, refetch: refetchInfo } = useStorageInfo();
  const { usage, loading: loadingUsage, refetch: refetchUsage } = useStorageUsage();
  const { config, loading: loadingConfig, refetch: refetchConfig } = useStorageConfig();
  const { configureStorage, resetStorage, scanStorage, loading: mutationLoading } = useStorageMutations();

  // =============================================================================
  // Progressive Disclosure State
  // =============================================================================

  const [showCommon, setShowCommon] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // =============================================================================
  // Computed State
  // =============================================================================

  /**
   * External storage mounts only (excludes flash)
   */
  const externalMounts = useMemo(() => {
    return allStorageInfo.filter(info => info.locationType === 'EXTERNAL');
  }, [allStorageInfo]);

  /**
   * Flash storage info
   */
  const flashStorage = useMemo(() => {
    return allStorageInfo.find(info => info.locationType === 'FLASH');
  }, [allStorageInfo]);

  /**
   * Whether any external storage is detected
   */
  const isStorageDetected = externalMounts.length > 0;

  /**
   * Whether external storage is configured
   */
  const isStorageConfigured = Boolean(config?.enabled && config?.path);

  /**
   * Whether configured storage is currently connected
   */
  const isStorageConnected = useMemo(() => {
    if (!isStorageConfigured || !config?.path) return false;
    return externalMounts.some(mount => mount.path === config.path && mount.mounted);
  }, [isStorageConfigured, config?.path, externalMounts]);

  /**
   * Whether configured storage is disconnected
   */
  const isStorageDisconnected = isStorageConfigured && !isStorageConnected;

  /**
   * Current storage usage percentage (uses BigInt for precision)
   */
  const usagePercent = useMemo(() => {
    if (!config?.storageInfo) return 0;
    try {
      const total = BigInt(config.storageInfo.totalBytes);
      const used = BigInt(config.storageInfo.usedBytes);
      if (total === 0n) return 0;
      return Number((used * 100n) / total);
    } catch {
      return 0;
    }
  }, [config?.storageInfo]);

  /**
   * Flash usage percentage
   */
  const flashUsagePercent = useMemo(() => {
    if (!flashStorage) return 0;
    try {
      const total = BigInt(flashStorage.totalBytes);
      const used = BigInt(flashStorage.usedBytes);
      if (total === 0n) return 0;
      return Number((used * 100n) / total);
    } catch {
      return 0;
    }
  }, [flashStorage]);

  /**
   * Storage space warning levels
   */
  const isSpaceWarning = usagePercent >= 80 && usagePercent < 90;
  const isSpaceCritical = usagePercent >= 90 && usagePercent < 95;
  const isSpaceFull = usagePercent >= 95;

  /**
   * Flash space warning levels
   */
  const isFlashSpaceWarning = flashUsagePercent >= 80 && flashUsagePercent < 90;
  const isFlashSpaceCritical = flashUsagePercent >= 90 && flashUsagePercent < 95;
  const isFlashSpaceFull = flashUsagePercent >= 95;

  // =============================================================================
  // Actions
  // =============================================================================

  /**
   * Enable external storage at specified path
   */
  const handleEnableStorage = useCallback(
    async (path: string) => {
      try {
        const result = await configureStorage({ path, enabled: true });

        if (result?.errors && result.errors.length > 0) {
          toast.error(`Failed to enable storage: ${result.errors[0].message}`);
          return;
        }

        toast.success(`External storage enabled: ${path}`);
        await Promise.all([refetchInfo(), refetchUsage(), refetchConfig()]);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        toast.error(`Failed to enable storage: ${message}`);
      }
    },
    [configureStorage, refetchInfo, refetchUsage, refetchConfig]
  );

  /**
   * Disable external storage (switch back to flash)
   */
  const handleDisableStorage = useCallback(
    async (migrateToFlash = false) => {
      try {
        const result = await resetStorage({ migrateToFlash });

        if (result?.errors && result.errors.length > 0) {
          toast.error(`Failed to disable storage: ${result.errors[0].message}`);
          return;
        }

        if (result?.featuresMigrated && result.featuresMigrated > 0) {
          toast.success(`External storage disabled. ${result.featuresMigrated} features migrated to flash.`);
        } else {
          toast.info('External storage disabled');
        }

        await Promise.all([refetchInfo(), refetchUsage(), refetchConfig()]);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        toast.error(`Failed to disable storage: ${message}`);
      }
    },
    [resetStorage, refetchInfo, refetchUsage, refetchConfig]
  );

  /**
   * Manually scan for storage devices
   */
  const handleScanStorage = useCallback(async () => {
    try {
      const result = await scanStorage();

      if (result?.errors && result.errors.length > 0) {
        toast.error(`Scan failed: ${result.errors[0].message}`);
        return;
      }

      if (result?.newStorageCount && result.newStorageCount > 0) {
        toast.success(`Found ${result.newStorageCount} new storage device(s)`);
      } else {
        toast.info('No new storage devices found');
      }

      await refetchInfo();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      toast.error(`Scan failed: ${message}`);
    }
  }, [scanStorage, refetchInfo]);

  // =============================================================================
  // Side Effects
  // =============================================================================

  /**
   * Show persistent toast when storage disconnects
   */
  useEffect(() => {
    if (isStorageDisconnected) {
      toast.error('External storage disconnected! Services may be unavailable.', {
        duration: Infinity, // Persistent until dismissed or reconnected
        id: 'storage-disconnect',
      });
    }
  }, [isStorageDisconnected]);

  /**
   * Auto-dismiss disconnect toast when storage reconnects
   */
  useEffect(() => {
    if (!isStorageDisconnected) {
      toast.dismiss('storage-disconnect');
    }
  }, [isStorageDisconnected]);

  // =============================================================================
  // Return Value
  // =============================================================================

  return {
    // Raw data
    allStorageInfo,
    externalMounts,
    flashStorage,
    usage,
    config,

    // Computed state
    isStorageDetected,
    isStorageConfigured,
    isStorageConnected,
    isStorageDisconnected,
    usagePercent,
    flashUsagePercent,
    isSpaceWarning,
    isSpaceCritical,
    isSpaceFull,
    isFlashSpaceWarning,
    isFlashSpaceCritical,
    isFlashSpaceFull,

    // Progressive disclosure
    showCommon,
    setShowCommon,
    showAdvanced,
    setShowAdvanced,

    // Actions
    handleEnableStorage,
    handleDisableStorage,
    handleScanStorage,

    // Loading/error states
    loading: loadingInfo || loadingUsage || loadingConfig,
    configuring: mutationLoading.configure || mutationLoading.reset,
    scanning: mutationLoading.scan,
    error: errorInfo,

    // Refetch functions
    refetch: useCallback(async () => {
      await Promise.all([refetchInfo(), refetchUsage(), refetchConfig()]);
    }, [refetchInfo, refetchUsage, refetchConfig]),
  };
}

/**
 * Type for the hook return value
 */
export type UseStorageSettingsReturn = ReturnType<typeof useStorageSettings>;
