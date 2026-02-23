/**
 * Hook to fetch DNS cache statistics with automatic polling
 * Provides cache metrics including entries, size, hit rate, and top domains
 *
 * @param deviceId - Device/router ID to fetch cache stats for
 * @param enabled - Whether to enable polling (default: true)
 * @returns Cache stats data, loading state, error, and refetch function
 *
 * @example
 * ```tsx
 * const { data, loading, error, refetch } = useDnsCacheStats('router-1');
 *
 * // Disable polling when not on screen
 * const { data } = useDnsCacheStats('router-1', false);
 * ```
 */
export declare function useDnsCacheStats(deviceId: string, enabled?: boolean): {
    cacheStats: any;
    loading: boolean;
    error: import("@apollo/client").ApolloError | undefined;
    refetch: (variables?: Partial<import("@apollo/client").OperationVariables> | undefined) => Promise<import("@apollo/client").ApolloQueryResult<any>>;
};
//# sourceMappingURL=useDnsCacheStats.d.ts.map