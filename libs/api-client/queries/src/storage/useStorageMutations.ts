import { useMutation, useApolloClient } from '@apollo/client';
import {
  CONFIGURE_EXTERNAL_STORAGE,
  RESET_EXTERNAL_STORAGE,
  SCAN_STORAGE,
  GET_STORAGE_CONFIG,
  GET_STORAGE_INFO,
  GET_STORAGE_USAGE,
} from './storage.graphql';
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
  errors: Array<{ message: string; path: string[] }> | null;
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
  errors: Array<{ message: string; path: string[] }> | null;
}

/**
 * Payload for scanStorage mutation
 */
export interface ScanStoragePayload {
  storageInfo: StorageInfo[];
  newStorageCount: number;
  errors: Array<{ message: string; path: string[] }> | null;
}

/**
 * Hook providing all storage management mutations
 *
 * @returns Storage mutation functions and their states
 */
export function useStorageMutations() {
  const client = useApolloClient();

  const [configureStorage, configureMutation] = useMutation(
    CONFIGURE_EXTERNAL_STORAGE,
    {
      refetchQueries: [
        GET_STORAGE_CONFIG,
        GET_STORAGE_INFO,
        GET_STORAGE_USAGE,
      ],
      // Optimistic update for immediate UI feedback
      optimisticResponse: (variables) => ({
        configureExternalStorage: {
          __typename: 'ConfigureExternalStoragePayload',
          config: {
            __typename: 'StorageConfig',
            enabled: variables.input.enabled ?? true,
            path: variables.input.path,
            storageInfo: null,
            updatedAt: new Date().toISOString(),
            isAvailable: false, // Will be updated after validation
          },
          storageInfo: null,
          errors: null,
        },
      }),
    }
  );

  const [resetStorage, resetMutation] = useMutation(RESET_EXTERNAL_STORAGE, {
    refetchQueries: [GET_STORAGE_CONFIG, GET_STORAGE_INFO, GET_STORAGE_USAGE],
    onCompleted: () => {
      // Invalidate cache after reset
      client.refetchQueries({
        include: [GET_STORAGE_CONFIG, GET_STORAGE_USAGE],
      });
    },
  });

  const [scanStorage, scanMutation] = useMutation(SCAN_STORAGE, {
    refetchQueries: [GET_STORAGE_INFO],
  });

  return {
    /**
     * Configure external storage path for service binaries.
     * Validates path exists and is writable.
     */
    configureStorage: async (input: ConfigureExternalStorageInput) => {
      const result = await configureStorage({ variables: { input } });
      return result.data
        ?.configureExternalStorage as ConfigureExternalStoragePayload;
    },

    /**
     * Reset external storage configuration to use flash only.
     * Optionally migrates existing binaries back to flash.
     */
    resetStorage: async (input?: ResetExternalStorageInput) => {
      const result = await resetStorage({ variables: { input } });
      return result.data
        ?.resetExternalStorage as ResetExternalStoragePayload;
    },

    /**
     * Manually trigger storage detection scan.
     * Useful for detecting newly mounted storage.
     */
    scanStorage: async () => {
      const result = await scanStorage();
      return result.data?.scanStorage as ScanStoragePayload;
    },

    loading: {
      configure: configureMutation.loading,
      reset: resetMutation.loading,
      scan: scanMutation.loading,
    },

    errors: {
      configure: configureMutation.error,
      reset: resetMutation.error,
      scan: scanMutation.error,
    },
  };
}
