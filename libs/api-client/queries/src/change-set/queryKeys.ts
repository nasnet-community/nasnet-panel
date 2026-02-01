/**
 * Change Set Query Keys
 *
 * Query key factory for Apollo Client cache management.
 * @module @nasnet/api-client/queries/change-set
 * @see NAS-4.14: Implement Change Sets (Atomic Multi-Resource Operations)
 */

/**
 * Query key factory for change sets.
 *
 * @example
 * ```ts
 * // Get all change sets for a router
 * changeSetKeys.list('router-1')
 *
 * // Get a specific change set
 * changeSetKeys.detail('router-1', 'changeset-id')
 *
 * // Invalidate all change sets for a router
 * client.cache.evict({ fieldName: 'changeSets', args: { routerId: 'router-1' } });
 * ```
 */
export const changeSetKeys = {
  /** All change set queries */
  all: ['changeSets'] as const,

  /** List of change sets for a router */
  lists: () => [...changeSetKeys.all, 'list'] as const,

  /** List with specific filters */
  list: (routerId: string, filters?: { status?: string; includeCompleted?: boolean }) =>
    [...changeSetKeys.lists(), routerId, filters] as const,

  /** All detail queries */
  details: () => [...changeSetKeys.all, 'detail'] as const,

  /** Specific change set detail */
  detail: (routerId: string, changeSetId: string) =>
    [...changeSetKeys.details(), routerId, changeSetId] as const,

  /** Validation results */
  validation: (changeSetId: string) =>
    [...changeSetKeys.all, 'validation', changeSetId] as const,
} as const;

/**
 * Cache invalidation helpers for change sets.
 */
export const changeSetInvalidations = {
  /** Invalidate all change sets for a router */
  router: (routerId: string) => ({
    refetchQueries: [
      {
        query: 'changeSets', // Will be replaced with actual query
        variables: { routerId },
      },
    ],
  }),

  /** Invalidate a specific change set */
  changeSet: (changeSetId: string) => ({
    // Apollo will refetch queries containing this ID
    refetchQueries: ['changeSet'],
    // Clear from cache
    update: (cache: { evict: (opts: { id: string }) => void; gc: () => void }) => {
      cache.evict({ id: `ChangeSet:${changeSetId}` });
      cache.gc();
    },
  }),
} as const;
