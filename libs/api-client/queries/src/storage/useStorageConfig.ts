import { useQuery } from '@apollo/client';
import { GET_STORAGE_CONFIG } from './storage.graphql';
import type { StorageInfo } from './useStorageInfo';

/**
 * External storage configuration state
 */
export interface StorageConfig {
  enabled: boolean;
  path: string | null;
  storageInfo: StorageInfo | null;
  updatedAt: string;
  isAvailable: boolean;
}

/**
 * Hook to fetch current external storage configuration.
 * Returns enabled state and configured path.
 *
 * @param options - Apollo query options
 * @returns Storage config data, loading state, error
 */
export function useStorageConfig(options?: {
  pollInterval?: number;
  skip?: boolean;
}) {
  const { data, loading, error, refetch } = useQuery(GET_STORAGE_CONFIG, {
    fetchPolicy: 'cache-first',
    pollInterval: options?.pollInterval || 0,
    skip: options?.skip,
  });

  return {
    config: data?.storageConfig as StorageConfig | undefined,
    loading,
    error,
    refetch,
  };
}
