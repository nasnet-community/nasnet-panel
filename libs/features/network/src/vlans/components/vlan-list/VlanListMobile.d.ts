import type { UseVlanListReturn } from '../../hooks/use-vlan-list';
export interface VlanListMobileProps extends UseVlanListReturn {
    routerId: string;
}
/**
 * VlanListMobile - Mobile-optimized presenter for VLAN list.
 * Displays VLANs as cards with 44px touch targets and progressive disclosure.
 * Mobile: single-column layout, bottom sheet for filters, swipe actions.
 *
 * @param props - Component props from useVlanList hook and parent
 */
export declare function VlanListMobile({ vlans, loading, error, searchQuery, setSearchQuery, parentInterfaceFilter, setParentInterfaceFilter, clearFilters, setSelectedVlanId, handleDelete, refetch, allVlans, }: VlanListMobileProps): import("react/jsx-runtime").JSX.Element;
export declare namespace VlanListMobile {
    var displayName: string;
}
//# sourceMappingURL=VlanListMobile.d.ts.map