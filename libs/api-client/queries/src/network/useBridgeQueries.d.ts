/**
 * Hook to fetch the list of bridges on a router
 * Provides real-time updates for bridge configuration changes
 *
 * @param routerId - Router ID to fetch bridges for
 * @returns Bridge list data, loading state, error, and refetch function
 *
 * @example
 * ```tsx
 * const { bridges, loading, error, refetch } = useBridges('router-1');
 * ```
 */
export declare function useBridges(routerId: string): {
    bridges: any;
    loading: boolean;
    error: import("@apollo/client").ApolloError | undefined;
    refetch: (variables?: Partial<import("@apollo/client").OperationVariables> | undefined) => Promise<import("@apollo/client").ApolloQueryResult<any>>;
};
/**
 * Hook to fetch detailed information for a single bridge
 * Includes ports, VLANs, and STP status
 * Subscribes to real-time STP status and port changes
 *
 * @param uuid - Bridge UUID to fetch
 * @returns Bridge data with real-time updates, loading state, error, and refetch function
 *
 * @example
 * ```tsx
 * const { bridge, loading, error, refetch } = useBridgeDetail('bridge-uuid');
 * ```
 */
export declare function useBridgeDetail(uuid: string): {
    bridge: any;
    loading: boolean;
    error: import("@apollo/client").ApolloError | undefined;
    refetch: (variables?: Partial<import("@apollo/client").OperationVariables> | undefined) => Promise<import("@apollo/client").ApolloQueryResult<any>>;
};
/**
 * Hook to fetch bridge ports for a specific bridge
 * Subscribes to real-time port changes
 *
 * @param bridgeId - Bridge ID to fetch ports for
 * @returns Bridge ports data with real-time updates, loading state, error, and refetch function
 *
 * @example
 * ```tsx
 * const { ports, loading, error, refetch } = useBridgePorts('bridge-uuid');
 * ```
 */
export declare function useBridgePorts(bridgeId: string): {
    ports: any;
    loading: boolean;
    error: import("@apollo/client").ApolloError | undefined;
    refetch: (variables?: Partial<import("@apollo/client").OperationVariables> | undefined) => Promise<import("@apollo/client").ApolloQueryResult<any>>;
};
/**
 * Hook to fetch bridge VLANs for a specific bridge
 *
 * @param bridgeId - Bridge ID to fetch VLANs for
 * @returns Bridge VLANs data, loading state, error, and refetch function
 *
 * @example
 * ```tsx
 * const { vlans, loading, error, refetch } = useBridgeVlans('bridge-uuid');
 * ```
 */
export declare function useBridgeVlans(bridgeId: string): {
    vlans: any;
    loading: boolean;
    error: import("@apollo/client").ApolloError | undefined;
    refetch: (variables?: Partial<import("@apollo/client").OperationVariables> | undefined) => Promise<import("@apollo/client").ApolloQueryResult<any>>;
};
/**
 * Hook to fetch interfaces available to add to a bridge
 * Returns interfaces that are not currently members of any bridge
 *
 * @param routerId - Router ID to fetch available interfaces for
 * @returns Available interfaces data, loading state, error, and refetch function
 *
 * @example
 * ```tsx
 * const { interfaces, loading, error, refetch } = useAvailableInterfacesForBridge('router-1');
 * ```
 */
export declare function useAvailableInterfacesForBridge(routerId: string): {
    interfaces: any;
    loading: boolean;
    error: import("@apollo/client").ApolloError | undefined;
    refetch: (variables?: Partial<import("@apollo/client").OperationVariables> | undefined) => Promise<import("@apollo/client").ApolloQueryResult<any>>;
};
/**
 * Hook to subscribe to STP status changes for a bridge
 * Provides real-time STP topology updates
 *
 * @param bridgeId - Bridge ID to subscribe to
 * @returns STP status data with real-time updates and error state
 *
 * @example
 * ```tsx
 * const { stpStatus, error } = useBridgeStpStatus('bridge-uuid');
 * ```
 */
export declare function useBridgeStpStatus(bridgeId: string): {
    stpStatus: any;
    error: import("@apollo/client").ApolloError | undefined;
};
//# sourceMappingURL=useBridgeQueries.d.ts.map