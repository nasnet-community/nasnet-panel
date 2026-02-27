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
export declare function useCleanupOrphanedVLANs(): {
  cleanupOrphanedVLANs: (routerID: string) => Promise<number>;
  loading: boolean;
  error: import('@apollo/client').ApolloError | undefined;
  cleanupCount: number | undefined;
};
//# sourceMappingURL=useCleanupOrphanedVLANs.d.ts.map
