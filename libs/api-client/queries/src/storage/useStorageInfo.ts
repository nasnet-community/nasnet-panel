import { useQuery } from '@apollo/client';
import { GET_STORAGE_INFO } from './storage.graphql';

/**
 * Storage location information (flash or external)
 */
export interface StorageInfo {
  path: string;
  totalBytes: string;
  availableBytes: string;
  usedBytes: string;
  filesystem: string;
  mounted: boolean;
  usagePercent: number;
  locationType: 'FLASH' | 'EXTERNAL' | 'UNKNOWN';
}

/**
 * Hook to fetch all detected storage locations (flash and external).
 * Scans known RouterOS mount points and returns availability.
 *
 * @param options - Apollo query options
 * @returns Storage info data, loading state, error
 */
export function useStorageInfo(options?: { pollInterval?: number; skip?: boolean }) {
  const { data, loading, error, refetch } = useQuery(GET_STORAGE_INFO, {
    fetchPolicy: 'cache-first',
    pollInterval: options?.pollInterval || 0,
    skip: options?.skip,
  });

  return {
    storageInfo: (data?.storageInfo || []) as StorageInfo[],
    loading,
    error,
    refetch,
  };
}
