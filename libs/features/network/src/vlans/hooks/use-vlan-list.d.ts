/**
 * Headless hook for VLAN list logic
 *
 * @description
 * Manages VLAN selection, filtering, sorting, and CRUD operations.
 * All business logic lives here; presenters call this hook and render the results.
 *
 * Features:
 * - Fetch VLANs via GraphQL (useVlans hook)
 * - Filter by search query, parent interface, and VLAN ID range
 * - Batch selection and bulk operations
 * - Delete with toast notification and refetch
 * - Memoized filtered results
 * - useCallback on all action handlers for stable references
 *
 * @param routerId - Router ID to fetch VLANs for
 * @returns Headless hook state and action handlers
 *
 * @example
 * ```tsx
 * const vlanList = useVlanList(routerId);
 * return (
 *   <>
 *     <input
 *       value={vlanList.searchQuery}
 *       onChange={(e) => vlanList.setSearchQuery(e.target.value)}
 *     />
 *     {vlanList.vlans.map(v => (
 *       <VlanCard
 *         key={v.id}
 *         vlan={v}
 *         isSelected={vlanList.selectedIds.has(v.id)}
 *         onToggle={() => vlanList.toggleSelection(v.id)}
 *         onDelete={() => vlanList.handleDelete(v.id)}
 *       />
 *     ))}
 *   </>
 * );
 * ```
 */
export declare function useVlanList(routerId: string): {
    vlans: any;
    allVlans: any;
    loading: boolean;
    error: import("@apollo/client").ApolloError | undefined;
    selectedIds: Set<string>;
    setSelectedIds: import("react").Dispatch<import("react").SetStateAction<Set<string>>>;
    toggleSelection: (id: string) => void;
    selectAll: () => void;
    clearSelection: () => void;
    searchQuery: string;
    setSearchQuery: import("react").Dispatch<import("react").SetStateAction<string>>;
    parentInterfaceFilter: string | null;
    setParentInterfaceFilter: import("react").Dispatch<import("react").SetStateAction<string | null>>;
    vlanIdRangeFilter: {
        min?: number;
        max?: number;
    } | null;
    setVlanIdRangeFilter: import("react").Dispatch<import("react").SetStateAction<{
        min?: number;
        max?: number;
    } | null>>;
    clearFilters: () => void;
    handleDelete: (id: string) => Promise<void>;
    refetch: (variables?: Partial<import("@apollo/client").OperationVariables> | undefined) => Promise<import("@apollo/client").ApolloQueryResult<any>>;
    selectedVlanId: string | null;
    setSelectedVlanId: import("react").Dispatch<import("react").SetStateAction<string | null>>;
};
export type UseVlanListReturn = ReturnType<typeof useVlanList>;
//# sourceMappingURL=use-vlan-list.d.ts.map