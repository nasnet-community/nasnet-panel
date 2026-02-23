/**
 * @description VLAN Topology Interface node in the hierarchy
 */
export interface VlanTopologyInterface {
    id: string;
    name: string;
    type: string;
    vlans: VlanTopologyVlan[];
}
/**
 * @description Individual VLAN within a topology interface
 */
export interface VlanTopologyVlan {
    id: string;
    name: string;
    vlanId: number;
    isDisabled: boolean;
    isRunning: boolean;
    mtu: number | null;
    comment: string | null;
}
/**
 * @description Hook to build VLAN topology data structure
 *
 * Organizes VLANs by their parent interfaces for hierarchical visualization
 * with memoized topology building and statistics calculation.
 *
 * @param routerId - Router ID to fetch VLANs for
 * @returns Object with topology, stats, loading, error, and refetch function
 * @example
 * const { topology, stats, loading } = useVlanTopology('router-1');
 */
export declare function useVlanTopology(routerId: string): {
    topology: VlanTopologyInterface[];
    stats: {
        totalVlans: any;
        runningVlans: any;
        disabledVlans: any;
        parentInterfaces: number;
    };
    isLoading: boolean;
    error: import("@apollo/client").ApolloError | undefined;
    onRefetch: () => void;
};
export type UseVlanTopologyReturn = ReturnType<typeof useVlanTopology>;
//# sourceMappingURL=use-vlan-topology.d.ts.map