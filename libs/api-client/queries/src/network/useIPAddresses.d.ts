/**
 * Hook to fetch and subscribe to the IP address list
 * Provides real-time updates via GraphQL subscription
 *
 * @param routerId - Router ID to fetch IP addresses for
 * @param interfaceId - Optional interface ID to filter by specific interface
 * @returns IP address list data, loading state, error, and refetch function
 */
export declare function useIPAddresses(routerId: string, interfaceId?: string): {
    ipAddresses: any;
    loading: boolean;
    error: import("@apollo/client").ApolloError | undefined;
    refetch: (variables?: Partial<import("@apollo/client").OperationVariables> | undefined) => Promise<import("@apollo/client").ApolloQueryResult<any>>;
};
/**
 * Hook to fetch a single IP address by ID
 * Useful for detail views
 *
 * @param routerId - Router ID
 * @param ipAddressId - IP address ID to fetch
 * @returns IP address data, loading state, error, and refetch function
 */
export declare function useIPAddressDetail(routerId: string, ipAddressId: string): {
    ipAddress: any;
    loading: boolean;
    error: import("@apollo/client").ApolloError | undefined;
    refetch: (variables?: Partial<import("@apollo/client").OperationVariables> | undefined) => Promise<import("@apollo/client").ApolloQueryResult<any>>;
};
/**
 * Hook to check for IP address conflicts
 * Used during form validation to prevent duplicate IPs and subnet overlaps
 *
 * @param routerId - Router ID
 * @param address - CIDR address to check (e.g., "192.168.1.1/24")
 * @param interfaceId - Optional interface ID for the address
 * @param excludeId - Optional IP address ID to exclude from conflict check (for updates)
 * @param enabled - Whether to run the query (default: true)
 * @returns Conflict result, loading state, error
 */
export declare function useCheckIPConflict(routerId: string, address: string, interfaceId?: string, excludeId?: string, enabled?: boolean): {
    conflictResult: any;
    hasConflict: any;
    loading: boolean;
    error: import("@apollo/client").ApolloError | undefined;
};
/**
 * Hook to fetch dependencies for an IP address
 * Used before deletion to show warning about dependent resources
 *
 * @param routerId - Router ID
 * @param ipAddressId - IP address ID to check dependencies for
 * @param enabled - Whether to run the query (default: false, lazy-loaded)
 * @returns Dependency information, loading state, error
 */
export declare function useIPAddressDependencies(routerId: string, ipAddressId: string, enabled?: boolean): {
    dependencies: any;
    canDelete: any;
    loading: boolean;
    error: import("@apollo/client").ApolloError | undefined;
    refetch: (variables?: Partial<import("@apollo/client").OperationVariables> | undefined) => Promise<import("@apollo/client").ApolloQueryResult<any>>;
};
//# sourceMappingURL=useIPAddresses.d.ts.map