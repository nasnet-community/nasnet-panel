import { useState, useMemo, useCallback } from 'react';
import {
  useVlans,
  useDeleteVlan,
} from '@nasnet/api-client/queries';
import { toast } from 'sonner';

/**
 * Headless hook for VLAN list logic
 * Manages VLAN selection, filtering, sorting, and CRUD operations
 *
 * @param routerId - Router ID to fetch VLANs for
 */
export function useVlanList(routerId: string) {
  const { vlans, loading, error, refetch } = useVlans(routerId);
  const { deleteVlan } = useDeleteVlan(routerId);

  // Local state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [parentInterfaceFilter, setParentInterfaceFilter] = useState<string | null>(null);
  const [vlanIdRangeFilter, setVlanIdRangeFilter] = useState<{ min?: number; max?: number } | null>(null);
  const [selectedVlanId, setSelectedVlanId] = useState<string | null>(null);

  // Filtered VLANs
  const filteredVlans = useMemo(() => {
    return vlans
      .filter((vlan) =>
        vlan.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
      .filter((vlan) =>
        !parentInterfaceFilter || vlan.interface.id === parentInterfaceFilter
      )
      .filter((vlan) => {
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
          // Show success toast with 10-second duration
          toast.success('VLAN deleted', {
            duration: 10000,
            description: 'VLAN interface has been removed from the router',
          });

          // Refetch to update the list
          refetch();
        } else {
          // Show error messages
          const errors = result.data?.errors || [];
          errors.forEach((err) => toast.error(err.message));
        }
      } catch (err) {
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
    setSelectedIds(new Set(filteredVlans.map((v) => v.id)));
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
