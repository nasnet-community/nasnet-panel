import { useState, useMemo, useCallback } from 'react';
import { useVlans, useDeleteVlan } from '@nasnet/api-client/queries';
import { toast } from 'sonner';

/** Toast duration for deletion notification (10 seconds allows undo window) */
const DELETION_TOAST_DURATION_MS = 10000;

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
export function useVlanList(routerId: string) {
  const { vlans, loading, error, refetch } = useVlans(routerId);
  const { deleteVlan } = useDeleteVlan(routerId);

  // Local state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [parentInterfaceFilter, setParentInterfaceFilter] = useState<string | null>(null);
  const [vlanIdRangeFilter, setVlanIdRangeFilter] = useState<{ min?: number; max?: number } | null>(
    null
  );
  const [selectedVlanId, setSelectedVlanId] = useState<string | null>(null);

  // Filtered VLANs
  const filteredVlans = useMemo(() => {
    return vlans
      .filter((vlan: any) => vlan.name.toLowerCase().includes(searchQuery.toLowerCase()))
      .filter((vlan: any) => !parentInterfaceFilter || vlan.interface.id === parentInterfaceFilter)
      .filter((vlan: any) => {
        if (!vlanIdRangeFilter) return true;
        const { min, max } = vlanIdRangeFilter;
        if (min !== undefined && vlan.vlanId < min) return false;
        if (max !== undefined && vlan.vlanId > max) return false;
        return true;
      });
  }, [vlans, searchQuery, parentInterfaceFilter, vlanIdRangeFilter]);

  // Handle VLAN deletion with undo toast
  const handleDelete = useCallback(
    async (id: string) => {
      try {
        const result = await deleteVlan(id);

        if (result.data?.success) {
          // Show success toast with 10-second duration (allows undo window)
          toast.success('VLAN deleted', {
            duration: DELETION_TOAST_DURATION_MS,
            description: 'VLAN interface has been removed from the router',
          });

          // Refetch to update the list
          refetch();
        } else {
          // Show error messages
          const errors = result.data?.errors || [];
          errors.forEach((err: { message: string }) => toast.error(err.message));
        }
      } catch (err: unknown) {
        toast.error('Failed to delete VLAN');
      }
    },
    [deleteVlan, refetch]
  );

  // Clear selection
  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  // Toggle selection
  const toggleSelection = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  // Select all
  const selectAll = useCallback(() => {
    setSelectedIds(new Set(filteredVlans.map((v: any) => v.id)));
  }, [filteredVlans]);

  // Clear filters
  const clearFilters = useCallback(() => {
    setSearchQuery('');
    setParentInterfaceFilter(null);
    setVlanIdRangeFilter(null);
  }, []);

  return {
    // Data
    vlans: filteredVlans,
    allVlans: vlans,
    loading,
    error,

    // Selection
    selectedIds,
    setSelectedIds,
    toggleSelection,
    selectAll,
    clearSelection,

    // Filters
    searchQuery,
    setSearchQuery,
    parentInterfaceFilter,
    setParentInterfaceFilter,
    vlanIdRangeFilter,
    setVlanIdRangeFilter,
    clearFilters,

    // Actions
    handleDelete,
    refetch,

    // Detail panel
    selectedVlanId,
    setSelectedVlanId,
  };
}

export type UseVlanListReturn = ReturnType<typeof useVlanList>;
