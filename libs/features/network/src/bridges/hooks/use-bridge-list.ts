import { useState, useMemo, useCallback } from 'react';
import {
  useBridges,
  useDeleteBridge,
  useUndoBridgeOperation,
} from '@nasnet/api-client/queries';
import { toast } from 'sonner';

/**
 * Headless hook for bridge list logic
 * Manages bridge selection, filtering, and undo operations
 *
 * @param routerId - Router ID to fetch bridges for
 */
export function useBridgeList(routerId: string) {
  const { bridges, loading, error, refetch } = useBridges(routerId);
  const [deleteBridge] = useDeleteBridge();
  const [undoBridgeOperation] = useUndoBridgeOperation();

  // Local state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [protocolFilter, setProtocolFilter] = useState<string | null>(null);
  const [vlanFilteringFilter, setVlanFilteringFilter] = useState<boolean | null>(null);
  const [selectedBridgeId, setSelectedBridgeId] = useState<string | null>(null);

  // Filtered bridges
  const filteredBridges = useMemo(() => {
    return bridges
      .filter((bridge) =>
        bridge.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
      .filter((bridge) => !protocolFilter || bridge.protocol === protocolFilter)
      .filter(
        (bridge) =>
          vlanFilteringFilter === null ||
          bridge.vlanFiltering === vlanFilteringFilter
      );
  }, [bridges, searchQuery, protocolFilter, vlanFilteringFilter]);

  // Handle bridge deletion with undo toast
  const handleDelete = useCallback(
    async (uuid: string) => {
      try {
        const result = await deleteBridge({
          variables: { uuid },
        });

        if (result.data?.deleteBridge?.success) {
          const operationId = result.data.deleteBridge.operationId;

          // Show success toast with undo button
          toast.success('Bridge deleted', {
            duration: 10000, // 10 seconds
            action: operationId
              ? {
                  label: 'Undo',
                  onClick: async () => {
                    try {
                      await undoBridgeOperation({
                        variables: { operationId },
                      });
                      toast.success('Bridge restored');
                    } catch (err) {
                      toast.error('Failed to undo deletion');
                    }
                  },
                }
              : undefined,
          });
        } else {
          // Show error messages
          const errors = result.data?.deleteBridge?.errors || [];
          errors.forEach((err) => toast.error(err.message));
        }
      } catch (err) {
        toast.error('Failed to delete bridge');
      }
    },
    [deleteBridge, undoBridgeOperation]
  );

  // Clear selection
  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  // Toggle selection
  const toggleSelection = useCallback((uuid: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(uuid)) {
        next.delete(uuid);
      } else {
        next.add(uuid);
      }
      return next;
    });
  }, []);

  // Select all
  const selectAll = useCallback(() => {
    setSelectedIds(new Set(filteredBridges.map((b) => b.uuid)));
  }, [filteredBridges]);

  return {
    // Data
    bridges: filteredBridges,
    allBridges: bridges,
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
    protocolFilter,
    setProtocolFilter,
    vlanFilteringFilter,
    setVlanFilteringFilter,

    // Actions
    handleDelete,
    refetch,

    // Detail panel
    selectedBridgeId,
    setSelectedBridgeId,
  };
}

export type UseBridgeListReturn = ReturnType<typeof useBridgeList>;
