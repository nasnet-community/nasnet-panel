/**
 * Storage threshold status
 */
export type StorageThresholdStatus = 'NORMAL' | 'LOW' | 'CRITICAL' | 'FULL';
/**
 * Storage breakdown for a specific location (flash or external)
 */
export interface StorageBreakdown {
  totalBytes: string;
  usedBytes: string;
  availableBytes: string;
  contents: string;
  usagePercent: number;
  locationType: 'FLASH' | 'EXTERNAL' | 'UNKNOWN';
  thresholdStatus: StorageThresholdStatus;
}
/**
 * Per-feature storage usage details
 */
export interface FeatureStorageUsage {
  featureId: string;
  featureName: string;
  binarySize: string;
  dataSize: string;
  configSize: string;
  logsSize: string;
  totalSize: string;
  location: string;
  instanceCount: number;
}
/**
 * Comprehensive storage usage breakdown
 */
export interface StorageUsage {
  flash: StorageBreakdown;
  external: StorageBreakdown | null;
  features: FeatureStorageUsage[];
  totalUsedBytes: string;
  totalCapacityBytes: string;
  calculatedAt: string;
}
/**
 * Hook to fetch comprehensive storage usage breakdown.
 * Shows flash vs external usage and per-feature breakdown.
 *
 * @param routerId - Optional router ID (defaults to current router)
 * @param options - Apollo query options
 * @returns Storage usage data, loading state, error
 */
export declare function useStorageUsage(
  routerId?: string,
  options?: {
    pollInterval?: number;
    skip?: boolean;
  }
): {
  usage: StorageUsage | undefined;
  loading: boolean;
  error: import('@apollo/client').ApolloError | undefined;
  refetch: (
    variables?: Partial<import('@apollo/client').OperationVariables> | undefined
  ) => Promise<import('@apollo/client').ApolloQueryResult<any>>;
};
//# sourceMappingURL=useStorageUsage.d.ts.map
