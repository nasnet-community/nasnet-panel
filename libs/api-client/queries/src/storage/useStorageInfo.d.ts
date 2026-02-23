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
export declare function useStorageInfo(options?: {
    pollInterval?: number;
    skip?: boolean;
}): {
    storageInfo: StorageInfo[];
    loading: boolean;
    error: import("@apollo/client").ApolloError | undefined;
    refetch: (variables?: Partial<import("@apollo/client").OperationVariables> | undefined) => Promise<import("@apollo/client").ApolloQueryResult<any>>;
};
//# sourceMappingURL=useStorageInfo.d.ts.map