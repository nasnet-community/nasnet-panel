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
export declare function useStorageConfig(options?: {
    pollInterval?: number;
    skip?: boolean;
}): {
    config: StorageConfig | undefined;
    loading: boolean;
    error: import("@apollo/client").ApolloError | undefined;
    refetch: (variables?: Partial<import("@apollo/client").OperationVariables> | undefined) => Promise<import("@apollo/client").ApolloQueryResult<any>>;
};
//# sourceMappingURL=useStorageConfig.d.ts.map