import { useMutation } from '@apollo/client';
import { CLEANUP_ORPHANED_VLANS, GET_VLAN_ALLOCATIONS, GET_VLAN_POOL_STATUS } from './vlan.graphql';

/**
 * Hook to clean up orphaned VLAN allocations
 *
 * Finds allocations referencing missing or deleting instances and marks them
 * as RELEASED. Automatically refetches allocations and pool status after cleanup.
 *
 * Useful for:
 * - Recovering from crashes or unclean shutdowns
 * - Debugging allocation issues
 * - Manual cleanup outside of normal reconciliation
 *
 * @returns Mutation function, loading state, error, and cleanup result
 *
 * @example
 * ```tsx
 * const { cleanupOrphanedVLANs, loading, cleanupCount } = useCleanupOrphanedVLANs();
 *
 * const handleCleanup = async () => {
 *   try {
 *     await cleanupOrphanedVLANs('router-123');
 *     console.log(`Cleaned up ${cleanupCount} orphaned VLANs`);
 *   } catch (error) {
 *     console.error('Cleanup failed:', error);
 *   }
 * };
 * ```
 */
export function useCleanupOrphanedVLANs() {
  const [cleanupMutation, { data, loading, error }] = useMutation(CLEANUP_ORPHANED_VLANS, {
    // Refetch allocations and pool status after cleanup
    refetchQueries: [GET_VLAN_ALLOCATIONS, GET_VLAN_POOL_STATUS],
    // Wait for refetch to complete before resolving
    awaitRefetchQueries: true,
  });

  /**
   * Execute cleanup for a specific router
   * @param routerID - Router ID to clean up orphans for
   * @returns Promise resolving to the number of allocations cleaned up
   */
  const cleanupOrphanedVLANs = async (routerID: string): Promise<number> => {
    const result = await cleanupMutation({ variables: { routerID } });
    return result.data?.cleanupOrphanedVLANs ?? 0;
  };

  const cleanupCount = data?.cleanupOrphanedVLANs as number | undefined;

  return {
    cleanupOrphanedVLANs,
    loading,
    error,
    cleanupCount,
  };
}
