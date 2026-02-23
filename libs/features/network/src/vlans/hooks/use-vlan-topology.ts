import { useCallback, useMemo } from 'react';
import { useVlans } from '@nasnet/api-client/queries';

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
export function useVlanTopology(routerId: string) {
  const { vlans, loading, error, refetch } = useVlans(routerId);

  // Build topology: group VLANs by parent interface
  const topology = useMemo<VlanTopologyInterface[]>(() => {
    const interfaceMap = new Map<string, VlanTopologyInterface>();

    vlans.forEach((vlan: any) => {
      const parentId = vlan.interface.id;

      if (!interfaceMap.has(parentId)) {
        interfaceMap.set(parentId, {
          id: vlan.interface.id,
          name: vlan.interface.name,
          type: vlan.interface.type,
          vlans: [],
        });
      }

      interfaceMap.get(parentId)!.vlans.push({
        id: vlan.id,
        name: vlan.name,
        vlanId: vlan.vlanId,
        isDisabled: vlan.disabled,
        isRunning: vlan.running,
        mtu: vlan.mtu,
        comment: vlan.comment,
      });
    });

    // Sort VLANs within each interface by VLAN ID
    interfaceMap.forEach((iface) => {
      iface.vlans.sort((a, b) => a.vlanId - b.vlanId);
    });

    // Return as array sorted by interface name
    return Array.from(interfaceMap.values()).sort((a, b) =>
      a.name.localeCompare(b.name)
    );
  }, [vlans]);

  // Calculate statistics
  const stats = useMemo(() => {
    const totalVlans = vlans.length;
    const runningVlans = vlans.filter((v: any) => v.isRunning && !v.isDisabled).length;
    const disabledVlans = vlans.filter((v: any) => v.isDisabled).length;
    const parentInterfaces = topology.length;

    return {
      totalVlans,
      runningVlans,
      disabledVlans,
      parentInterfaces,
    };
  }, [vlans, topology]);

  const handleRefetch = useCallback(() => {
    refetch();
  }, [refetch]);

  return {
    topology,
    stats,
    isLoading: loading,
    error,
    onRefetch: handleRefetch,
  };
}

export type UseVlanTopologyReturn = ReturnType<typeof useVlanTopology>;
