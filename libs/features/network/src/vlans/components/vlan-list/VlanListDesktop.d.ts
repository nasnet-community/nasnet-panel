import type { UseVlanListReturn } from '../../hooks/use-vlan-list';
export interface VlanListDesktopProps extends UseVlanListReturn {
    routerId: string;
}
/**
 * VlanListDesktop - Desktop-optimized presenter for VLAN list.
 * Displays VLANs in a dense DataTable with full details visible.
 * Desktop: fixed sidebar (never horizontal scroll), all columns visible.
 *
 * @param props - Component props from useVlanList hook and parent
 */
export declare function VlanListDesktop({ vlans, loading: isLoading, error: hasError, selectedIds, toggleSelection, selectAll, clearSelection, searchQuery, setSearchQuery, parentInterfaceFilter, setParentInterfaceFilter, vlanIdRangeFilter, setVlanIdRangeFilter, clearFilters, setSelectedVlanId, handleDelete, refetch, allVlans, }: VlanListDesktopProps): import("react/jsx-runtime").JSX.Element;
export declare namespace VlanListDesktop {
    var displayName: string;
}
//# sourceMappingURL=VlanListDesktop.d.ts.map