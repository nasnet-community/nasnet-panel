import type { InterfaceType } from '@nasnet/api-client/generated';
/**
 * Hook to fetch and subscribe to the interface list
 * Provides real-time updates via GraphQL subscription
 *
 * @param routerId - Router ID to fetch interfaces for
 * @param type - Optional interface type filter
 * @returns Interface list data, loading state, error, and refetch function
 */
export declare function useInterfaceList(routerId: string, type?: InterfaceType): {
    interfaces: any;
    totalCount: any;
    pageInfo: any;
    loading: boolean;
    error: import("@apollo/client").ApolloError | undefined;
    refetch: (variables?: Partial<import("@apollo/client").OperationVariables> | undefined) => Promise<import("@apollo/client").ApolloQueryResult<any>>;
};
/**
 * Hook to fetch a single interface by ID
 * Useful for detail views
 *
 * @param routerId - Router ID
 * @param interfaceId - Interface ID to fetch
 * @returns Interface data, loading state, error, and refetch function
 */
export declare function useInterfaceDetail(routerId: string, interfaceId: string): {
    interface: any;
    loading: boolean;
    error: import("@apollo/client").ApolloError | undefined;
    refetch: (variables?: Partial<import("@apollo/client").OperationVariables> | undefined) => Promise<import("@apollo/client").ApolloQueryResult<any>>;
};
//# sourceMappingURL=useInterfaceList.d.ts.map