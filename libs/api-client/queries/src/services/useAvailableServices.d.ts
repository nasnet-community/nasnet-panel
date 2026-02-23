/**
 * Available service from the Feature Marketplace
 */
export interface AvailableService {
    id: string;
    name: string;
    description: string;
    version: string;
    category: string;
    author: string;
    license: string;
    homepage?: string;
    icon?: string;
    tags: string[];
    architectures: string[];
    minRouterOSVersion?: string;
    requiredPackages: string[];
    requiredPorts: number[];
    requiredMemoryMB: number;
    requiredDiskMB: number;
    dockerImage: string;
    dockerTag: string;
    defaultConfig?: unknown;
    configSchema?: unknown;
}
/**
 * Hook to fetch available services from the Feature Marketplace
 *
 * Services catalog is relatively static, so uses long staleTime.
 *
 * @param category - Optional category filter
 * @param architecture - Optional architecture filter
 * @returns Available services data, loading state, error
 */
export declare function useAvailableServices(category?: string, architecture?: string): {
    services: AvailableService[];
    loading: boolean;
    error: import("@apollo/client").ApolloError | undefined;
    refetch: (variables?: Partial<import("@apollo/client").OperationVariables> | undefined) => Promise<import("@apollo/client").ApolloQueryResult<any>>;
};
//# sourceMappingURL=useAvailableServices.d.ts.map