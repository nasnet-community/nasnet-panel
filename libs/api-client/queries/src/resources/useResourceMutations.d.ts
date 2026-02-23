/**
 * useResourceMutations Hook
 *
 * Hooks for resource mutation operations: create, update, validate, apply, etc.
 * Follows the Apply-Confirm-Merge pattern for state synchronization.
 *
 * @module @nasnet/api-client/queries/resources
 */
import { type ApolloError } from '@apollo/client';
import type { Resource, ResourceCategory, ResourceLifecycleState, ValidationResult } from '@nasnet/core/types';
/**
 * Input for creating a new resource.
 */
export interface CreateResourceInput {
    routerId: string;
    type: string;
    category: ResourceCategory;
    configuration: Record<string, unknown>;
    metadata?: {
        tags?: string[];
        description?: string;
        notes?: string;
    };
}
/**
 * Input for updating a resource.
 */
export interface UpdateResourceInput {
    uuid: string;
    configuration?: Record<string, unknown>;
    metadata?: {
        tags?: string[];
        description?: string;
        notes?: string;
        isFavorite?: boolean;
        isPinned?: boolean;
    };
}
/**
 * Options for apply mutation.
 */
export interface ApplyResourceOptions {
    /** Force apply even with warnings */
    force?: boolean;
    /** Skip validation (use with caution) */
    skipValidation?: boolean;
    /** Callback on successful apply */
    onSuccess?: () => void;
    /** Callback on apply error */
    onError?: (error: ApolloError) => void;
}
/**
 * Result from mutation hooks.
 */
export interface MutationResult<TData, TVariables> {
    /** Execute the mutation */
    mutate: (variables: TVariables) => Promise<TData>;
    /** Loading state */
    loading: boolean;
    /** Error state */
    error: ApolloError | undefined;
    /** Reset mutation state */
    reset: () => void;
}
/**
 * Hook for creating a new resource.
 *
 * @example
 * ```tsx
 * const { mutate: createResource, loading } = useCreateResource();
 *
 * const handleCreate = async () => {
 *   const resource = await createResource({
 *     routerId: 'router-1',
 *     type: 'wireguard-client',
 *     category: 'VPN',
 *     configuration: { name: 'my-vpn', ... },
 *   });
 *   console.log('Created:', resource.uuid);
 * };
 * ```
 */
export declare function useCreateResource<TConfig = unknown>(): {
    mutate: (input: CreateResourceInput) => Promise<Resource<TConfig>>;
    loading: boolean;
    error: ApolloError | undefined;
    reset: () => void;
};
/**
 * Hook for updating a resource configuration or metadata.
 *
 * @example
 * ```tsx
 * const { mutate: updateResource } = useUpdateResource();
 *
 * await updateResource({
 *   uuid: resource.uuid,
 *   configuration: { ...resource.configuration, name: 'new-name' },
 * });
 * ```
 */
export declare function useUpdateResource<TConfig = unknown>(): {
    mutate: (input: UpdateResourceInput) => Promise<Resource<TConfig>>;
    loading: boolean;
    error: ApolloError | undefined;
    reset: () => void;
};
/**
 * Hook for deleting a resource.
 *
 * @example
 * ```tsx
 * const { mutate: deleteResource, loading } = useDeleteResource();
 *
 * const handleDelete = async () => {
 *   await deleteResource(resource.uuid);
 *   toast.success('Resource deleted');
 * };
 * ```
 */
export declare function useDeleteResource(): {
    mutate: (uuid: string) => Promise<boolean>;
    loading: boolean;
    error: ApolloError | undefined;
    reset: () => void;
};
/**
 * Hook for validating a resource before applying.
 *
 * @example
 * ```tsx
 * const { mutate: validateResource } = useValidateResource();
 *
 * const validation = await validateResource(resource.uuid);
 * if (validation.canApply) {
 *   // Proceed to apply
 * } else {
 *   // Show validation errors
 *   console.log(validation.errors);
 * }
 * ```
 */
export declare function useValidateResource(): {
    mutate: (uuid: string) => Promise<Resource & {
        validation: ValidationResult;
    }>;
    loading: boolean;
    error: ApolloError | undefined;
    reset: () => void;
};
/**
 * Hook for applying a resource to the router.
 * Follows Apply-Confirm-Merge pattern.
 *
 * @example
 * ```tsx
 * const { mutate: applyResource, loading } = useApplyResource();
 *
 * // With validation first
 * const result = await applyResource(resource.uuid);
 *
 * // Force apply (skip warnings)
 * const result = await applyResource(resource.uuid, { force: true });
 * ```
 */
export declare function useApplyResource<TConfig = unknown>(): {
    mutate: (uuid: string, options?: ApplyResourceOptions) => Promise<Resource<TConfig>>;
    loading: boolean;
    error: ApolloError | undefined;
    reset: () => void;
};
/**
 * Hook for syncing a resource from the router.
 * Pulls current state from router and updates local resource.
 *
 * @example
 * ```tsx
 * const { mutate: syncResource } = useSyncResource();
 *
 * // After detecting drift
 * const synced = await syncResource(resource.uuid);
 * ```
 */
export declare function useSyncResource<TConfig = unknown>(): {
    mutate: (uuid: string) => Promise<Resource<TConfig>>;
    loading: boolean;
    error: ApolloError | undefined;
    reset: () => void;
};
/**
 * Hook for reverting a resource to last applied state.
 *
 * @example
 * ```tsx
 * const { mutate: revertResource } = useRevertResource();
 *
 * // Discard pending changes
 * await revertResource(resource.uuid);
 * ```
 */
export declare function useRevertResource<TConfig = unknown>(): {
    mutate: (uuid: string) => Promise<Resource<TConfig>>;
    loading: boolean;
    error: ApolloError | undefined;
    reset: () => void;
};
/**
 * Hook for archiving a resource.
 *
 * @example
 * ```tsx
 * const { mutate: archiveResource } = useArchiveResource();
 *
 * await archiveResource(resource.uuid);
 * toast.success('Resource archived');
 * ```
 */
export declare function useArchiveResource(): {
    mutate: (uuid: string) => Promise<{
        uuid: string;
        state: ResourceLifecycleState;
    }>;
    loading: boolean;
    error: ApolloError | undefined;
    reset: () => void;
};
/**
 * Hook for restoring an archived resource.
 */
export declare function useRestoreResource<TConfig = unknown>(): {
    mutate: (uuid: string) => Promise<Resource<TConfig>>;
    loading: boolean;
    error: ApolloError | undefined;
    reset: () => void;
};
/**
 * Hook for cloning a resource.
 *
 * @example
 * ```tsx
 * const { mutate: cloneResource } = useCloneResource();
 *
 * const clone = await cloneResource(resource.uuid, 'my-clone');
 * ```
 */
export declare function useCloneResource<TConfig = unknown>(): {
    mutate: (uuid: string, newId?: string) => Promise<Resource<TConfig>>;
    loading: boolean;
    error: ApolloError | undefined;
    reset: () => void;
};
/**
 * Hook for batch applying multiple resources.
 *
 * @example
 * ```tsx
 * const { mutate: batchApply } = useBatchApplyResources();
 *
 * const result = await batchApply(selectedUuids);
 * console.log(`${result.successful.length} succeeded, ${result.failed.length} failed`);
 * ```
 */
export declare function useBatchApplyResources(): {
    mutate: (uuids: string[], force?: boolean) => Promise<{
        successful: Array<{
            uuid: string;
            state: ResourceLifecycleState;
        }>;
        failed: Array<{
            uuid: string;
            error: string;
        }>;
    }>;
    loading: boolean;
    error: ApolloError | undefined;
    reset: () => void;
};
/**
 * Hook for updating only resource metadata (tags, description, favorites).
 *
 * @example
 * ```tsx
 * const { mutate: updateMetadata } = useUpdateResourceMetadata();
 *
 * // Toggle favorite
 * await updateMetadata(uuid, { isFavorite: !resource.metadata.isFavorite });
 *
 * // Add tag
 * await updateMetadata(uuid, { tags: [...resource.metadata.tags, 'new-tag'] });
 * ```
 */
export declare function useUpdateResourceMetadata(): {
    mutate: (uuid: string, metadata: {
        tags?: string[];
        description?: string;
        notes?: string;
        isFavorite?: boolean;
        isPinned?: boolean;
    }) => Promise<{
        uuid: string;
    }>;
    loading: boolean;
    error: ApolloError | undefined;
    reset: () => void;
};
/**
 * Hook for toggling resource favorite status.
 */
export declare function useToggleFavorite(): {
    toggle: (uuid: string, currentFavorite: boolean) => Promise<{
        uuid: string;
    }>;
    loading: boolean;
    error: ApolloError | undefined;
};
/**
 * Hook for toggling resource pinned status.
 */
export declare function useTogglePinned(): {
    toggle: (uuid: string, currentPinned: boolean) => Promise<{
        uuid: string;
    }>;
    loading: boolean;
    error: ApolloError | undefined;
};
declare const _default: {
    useCreateResource: typeof useCreateResource;
    useUpdateResource: typeof useUpdateResource;
    useDeleteResource: typeof useDeleteResource;
    useValidateResource: typeof useValidateResource;
    useApplyResource: typeof useApplyResource;
    useSyncResource: typeof useSyncResource;
    useRevertResource: typeof useRevertResource;
    useArchiveResource: typeof useArchiveResource;
    useRestoreResource: typeof useRestoreResource;
    useCloneResource: typeof useCloneResource;
    useBatchApplyResources: typeof useBatchApplyResources;
    useUpdateResourceMetadata: typeof useUpdateResourceMetadata;
    useToggleFavorite: typeof useToggleFavorite;
    useTogglePinned: typeof useTogglePinned;
};
export default _default;
//# sourceMappingURL=useResourceMutations.d.ts.map