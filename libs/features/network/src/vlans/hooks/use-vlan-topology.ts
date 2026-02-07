import { useMemo } from 'react';
import { useVlans } from '@nasnet/api-client/queries';

/**
 * VLAN Topology Node Types
 */
export interface VlanTopologyInterface {
  id: string;
  name: string;
  type: string;
  vlans: VlanTopologyVlan[];
}

export interface VlanTopologyVlan {
  id: string;
  name: string;
  vlanId: number;
  disabled: boolean;
  running: boolean;
  mtu: number | null;
  comment: string | null;
}

/**
 * Hook to build VLAN topology data structure
 *
 * Organizes VLANs by their parent interfaces for hierarchical visualization.
 *
 * @param routerId - Router ID to fetch VLANs for
 * @returns Topology data grouped by parent interface
 */
export function useVlanTopology(routerId: string) {
  const { vlans, loading, error, refetch } = useVlans(routerId);

  // Build topology: group VLANs by parent interface
  const topology = useMemo<VlanTopologyInterface[]>(() => {
    const interfaceMap = new Map<string, VlanTopologyInterface>();

    vlans.forEach((vlan) => {
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
        disabled: vlan.disabled,
        running: vlan.running,
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
    const runningVlans = vlans.filter((v) => v.running && !v.disabled).length;
    const disabledVlans = vlans.filter((v) => v.disabled).length;
    const parentInterfaces = topology.length;

    return {
      totalVlans,
      runningVlans,
      disabledVlans,
      parentInterfaces,
    };
  }, [vlans, topology]);

  return {
    topology,
    stats,
    loading,
    error,
    refetch,
  };
}

export type UseVlanTopologyReturn = ReturnType<typeof useVlanTopology>;
