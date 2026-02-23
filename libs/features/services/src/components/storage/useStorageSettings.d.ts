import type { StorageConfig, StorageInfo, StorageUsage } from '@nasnet/api-client/queries';
/**
 * Headless hook for storage settings business logic.
 * Manages external storage configuration, usage monitoring, and user actions.
 *
 * @description Provides computed state for storage detection, usage percentages, and
 * action handlers for storage configuration lifecycle. All state is computed using
 * useMemo for stable references. Returns 30+ properties organized by category.
 *
 * @example
 * ```tsx
 * function StorageSettings() {
 *   const {
 *     isStorageDetected,
 *     isStorageDisconnected,
 *     handleEnableStorage,
 *     externalMounts,
 *   } = useStorageSettings();
 *
 *   if (!isStorageDetected) {
 *     return <div>No external storage detected</div>;
 *   }
 *
 *   return (
 *     <button onClick={() => handleEnableStorage(externalMounts[0].path)}>
 *       Enable Storage
 *     </button>
 *   );
 * }
 * ```
 */
export declare function useStorageSettings(): {
    allStorageInfo: StorageInfo[];
    externalMounts: StorageInfo[];
    flashStorage: StorageInfo | undefined;
    usage: StorageUsage | undefined;
    config: StorageConfig | undefined;
    isStorageDetected: boolean;
    isStorageConfigured: boolean;
    isStorageConnected: boolean;
    isStorageDisconnected: boolean;
    usagePercent: number;
    flashUsagePercent: number;
    isSpaceWarning: boolean;
    isSpaceCritical: boolean;
    isSpaceFull: boolean;
    isFlashSpaceWarning: boolean;
    isFlashSpaceCritical: boolean;
    isFlashSpaceFull: boolean;
    showCommon: boolean;
    setShowCommon: import("react").Dispatch<import("react").SetStateAction<boolean>>;
    showAdvanced: boolean;
    setShowAdvanced: import("react").Dispatch<import("react").SetStateAction<boolean>>;
    handleEnableStorage: (path: string) => Promise<void>;
    handleDisableStorage: (migrateToFlash?: boolean) => Promise<void>;
    handleScanStorage: () => Promise<void>;
    loading: boolean;
    configuring: boolean;
    scanning: boolean;
    error: import("@apollo/client").ApolloError | undefined;
    refetch: () => Promise<void>;
};
/**
 * Type for the hook return value
 */
export type UseStorageSettingsReturn = ReturnType<typeof useStorageSettings>;
//# sourceMappingURL=useStorageSettings.d.ts.map