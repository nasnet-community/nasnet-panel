/**
 * Hook to create a new VLAN interface
 * Includes optimistic updates and cache invalidation
 *
 * @returns Mutation function, loading state, error, and data
 */
export declare function useCreateVlan(routerId: string): {
    createVlan: (input: {
        name: string;
        vlanId: number;
        interface: string;
        mtu?: number;
        comment?: string;
        disabled?: boolean;
    }) => Promise<import("@apollo/client").FetchResult<any>>;
    loading: boolean;
    error: import("@apollo/client").ApolloError | undefined;
    data: any;
};
/**
 * Hook to update an existing VLAN interface
 * Includes cache invalidation for affected queries
 *
 * @returns Mutation function, loading state, error, and data
 */
export declare function useUpdateVlan(routerId: string): {
    updateVlan: (id: string, input: {
        name: string;
        vlanId: number;
        interface: string;
        mtu?: number;
        comment?: string;
        disabled?: boolean;
    }) => Promise<import("@apollo/client").FetchResult<any>>;
    loading: boolean;
    error: import("@apollo/client").ApolloError | undefined;
    data: any;
};
/**
 * Hook to delete a VLAN interface
 * Includes optimistic cache update and confirmation handling
 *
 * @returns Mutation function, loading state, error, and data
 */
export declare function useDeleteVlan(routerId: string): {
    deleteVlan: (id: string) => Promise<import("@apollo/client").FetchResult<any>>;
    loading: boolean;
    error: import("@apollo/client").ApolloError | undefined;
    data: any;
};
/**
 * Hook to configure a bridge port for VLAN access or trunk mode
 * Supports both access mode (single untagged VLAN) and trunk mode (multiple tagged VLANs)
 *
 * @returns Mutation function, loading state, error, and data
 */
export declare function useConfigureVlanPort(routerId: string): {
    configureVlanPort: (portId: string, config: {
        mode: "access" | "trunk";
        pvid?: number;
        taggedVlanIds?: number[];
    }) => Promise<import("@apollo/client").FetchResult<any>>;
    loading: boolean;
    error: import("@apollo/client").ApolloError | undefined;
    data: any;
};
//# sourceMappingURL=useVlanMutations.d.ts.map