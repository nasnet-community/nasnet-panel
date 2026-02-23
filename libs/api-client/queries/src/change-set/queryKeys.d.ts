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
export declare const changeSetKeys: {
    /** All change set queries */
    readonly all: readonly ["changeSets"];
    /** List of change sets for a router */
    readonly lists: () => readonly ["changeSets", "list"];
    /** List with specific filters */
    readonly list: (routerId: string, filters?: {
        status?: string;
        includeCompleted?: boolean;
    }) => readonly ["changeSets", "list", string, {
        status?: string;
        includeCompleted?: boolean;
    } | undefined];
    /** All detail queries */
    readonly details: () => readonly ["changeSets", "detail"];
    /** Specific change set detail */
    readonly detail: (routerId: string, changeSetId: string) => readonly ["changeSets", "detail", string, string];
    /** Validation results */
    readonly validation: (changeSetId: string) => readonly ["changeSets", "validation", string];
};
/**
 * Cache invalidation helpers for change sets.
 */
export declare const changeSetInvalidations: {
    /** Invalidate all change sets for a router */
    readonly router: (routerId: string) => {
        refetchQueries: {
            query: string;
            variables: {
                routerId: string;
            };
        }[];
    };
    /** Invalidate a specific change set */
    readonly changeSet: (changeSetId: string) => {
        refetchQueries: string[];
        update: (cache: {
            evict: (opts: {
                id: string;
            }) => void;
            gc: () => void;
        }) => void;
    };
};
//# sourceMappingURL=queryKeys.d.ts.map