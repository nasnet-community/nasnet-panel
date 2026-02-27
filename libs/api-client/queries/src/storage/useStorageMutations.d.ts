import type { StorageConfig } from './useStorageConfig';
import type { StorageInfo } from './useStorageInfo';
/**
 * Input for configuring external storage
 */
export interface ConfigureExternalStorageInput {
  path: string;
  enabled?: boolean;
}
/**
 * Payload for configureExternalStorage mutation
 */
export interface ConfigureExternalStoragePayload {
  config: StorageConfig | null;
  storageInfo: StorageInfo | null;
  errors: Array<{
    message: string;
    path: string[];
  }> | null;
}
/**
 * Input for resetting external storage
 */
export interface ResetExternalStorageInput {
  migrateToFlash?: boolean;
}
/**
 * Payload for resetExternalStorage mutation
 */
export interface ResetExternalStoragePayload {
  success: boolean;
  featuresMigrated: number;
  errors: Array<{
    message: string;
    path: string[];
  }> | null;
}
/**
 * Payload for scanStorage mutation
 */
export interface ScanStoragePayload {
  storageInfo: StorageInfo[];
  newStorageCount: number;
  errors: Array<{
    message: string;
    path: string[];
  }> | null;
}
/**
 * Hook providing all storage management mutations
 *
 * @returns Storage mutation functions and their states
 */
export declare function useStorageMutations(): {
  /**
   * Configure external storage path for service binaries.
   * Validates path exists and is writable.
   */
  configureStorage: (
    input: ConfigureExternalStorageInput
  ) => Promise<ConfigureExternalStoragePayload>;
  /**
   * Reset external storage configuration to use flash only.
   * Optionally migrates existing binaries back to flash.
   */
  resetStorage: (input?: ResetExternalStorageInput) => Promise<ResetExternalStoragePayload>;
  /**
   * Manually trigger storage detection scan.
   * Useful for detecting newly mounted storage.
   */
  scanStorage: () => Promise<ScanStoragePayload>;
  loading: {
    configure: boolean;
    reset: boolean;
    scan: boolean;
  };
  errors: {
    configure: import('@apollo/client').ApolloError | undefined;
    reset: import('@apollo/client').ApolloError | undefined;
    scan: import('@apollo/client').ApolloError | undefined;
  };
};
//# sourceMappingURL=useStorageMutations.d.ts.map
