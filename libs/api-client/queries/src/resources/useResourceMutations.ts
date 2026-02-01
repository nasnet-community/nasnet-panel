/**
 * useResourceMutations Hook
 *
 * Hooks for resource mutation operations: create, update, validate, apply, etc.
 * Follows the Apply-Confirm-Merge pattern for state synchronization.
 *
 * @module @nasnet/api-client/queries/resources
 */

import {
  useMutation,
  type ApolloError,
  type MutationHookOptions,
} from '@apollo/client';
import { gql } from '@apollo/client';
import { useCallback } from 'react';
import type {
  Resource,
  ResourceCategory,
  ResourceLifecycleState,
  ValidationResult,
} from '@nasnet/core/types';
import { RESOURCE_DETAIL_FRAGMENT, RESOURCE_VALIDATION_FRAGMENT } from './fragments';
import { resourceKeys, resourceInvalidations } from './queryKeys';

// ============================================================================
// Types
// ============================================================================

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

// ============================================================================
// Mutations
// ============================================================================

const CREATE_RESOURCE_MUTATION = gql`
  mutation CreateResource($input: CreateResourceInput!) {
    createResource(input: $input) {
      ...ResourceDetail
    }
  }
  ${RESOURCE_DETAIL_FRAGMENT}
`;

const UPDATE_RESOURCE_MUTATION = gql`
  mutation UpdateResource($input: UpdateResourceInput!) {
    updateResource(input: $input) {
      ...ResourceDetail
    }
  }
  ${RESOURCE_DETAIL_FRAGMENT}
`;

const DELETE_RESOURCE_MUTATION = gql`
  mutation DeleteResource($uuid: ULID!) {
    deleteResource(uuid: $uuid)
  }
`;

const VALIDATE_RESOURCE_MUTATION = gql`
  mutation ValidateResource($uuid: ULID!) {
    validateResource(uuid: $uuid) {
      ...ResourceValidation
    }
  }
  ${RESOURCE_VALIDATION_FRAGMENT}
`;

const APPLY_RESOURCE_MUTATION = gql`
  mutation ApplyResource($uuid: ULID!, $force: Boolean) {
    applyResource(uuid: $uuid, force: $force) {
      ...ResourceDetail
    }
  }
  ${RESOURCE_DETAIL_FRAGMENT}
`;

const SYNC_RESOURCE_MUTATION = gql`
  mutation SyncResource($uuid: ULID!) {
    syncResource(uuid: $uuid) {
      ...ResourceDetail
    }
  }
  ${RESOURCE_DETAIL_FRAGMENT}
`;

const REVERT_RESOURCE_MUTATION = gql`
  mutation RevertResource($uuid: ULID!) {
    revertResource(uuid: $uuid) {
      ...ResourceDetail
    }
  }
  ${RESOURCE_DETAIL_FRAGMENT}
`;

const ARCHIVE_RESOURCE_MUTATION = gql`
  mutation ArchiveResource($uuid: ULID!) {
    archiveResource(uuid: $uuid) {
      uuid
      metadata {
        state
      }
    }
  }
`;

const RESTORE_RESOURCE_MUTATION = gql`
  mutation RestoreResource($uuid: ULID!) {
    restoreResource(uuid: $uuid) {
      ...ResourceDetail
    }
  }
  ${RESOURCE_DETAIL_FRAGMENT}
`;

const CLONE_RESOURCE_MUTATION = gql`
  mutation CloneResource($uuid: ULID!, $newId: String) {
    cloneResource(uuid: $uuid, newId: $newId) {
      ...ResourceDetail
    }
  }
  ${RESOURCE_DETAIL_FRAGMENT}
`;

const BATCH_APPLY_MUTATION = gql`
  mutation BatchApplyResources($uuids: [ULID!]!, $force: Boolean) {
    batchApplyResources(uuids: $uuids, force: $force) {
      successful {
        uuid
        metadata {
          state
        }
      }
      failed {
        uuid
        error
      }
    }
  }
`;

const UPDATE_RESOURCE_METADATA_MUTATION = gql`
  mutation UpdateResourceMetadata($uuid: ULID!, $metadata: ResourceMetadataInput!) {
    updateResourceMetadata(uuid: $uuid, metadata: $metadata) {
      uuid
      metadata {
        tags
        description
        notes
        isFavorite
        isPinned
        updatedAt
        updatedBy
      }
    }
  }
`;

// ============================================================================
// Hook Implementations
// ============================================================================

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
export function useCreateResource<TConfig = unknown>() {
  const [mutation, { loading, error, reset }] = useMutation(CREATE_RESOURCE_MUTATION, {
    update(cache, { data }) {
      // Invalidate resource lists for the router
      // Apollo will refetch on next access
    },
  });

  const mutate = useCallback(
    async (input: CreateResourceInput): Promise<Resource<TConfig>> => {
      const result = await mutation({ variables: { input } });
      return result.data.createResource;
    },
    [mutation]
  );

  return { mutate, loading, error, reset };
}

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
export function useUpdateResource<TConfig = unknown>() {
  const [mutation, { loading, error, reset }] = useMutation(UPDATE_RESOURCE_MUTATION, {
    optimisticResponse: ({ input }) => ({
      updateResource: {
        __typename: 'Resource',
        uuid: input.uuid,
        ...input.configuration && { configuration: input.configuration },
        ...input.metadata && { metadata: input.metadata },
      },
    }),
  });

  const mutate = useCallback(
    async (input: UpdateResourceInput): Promise<Resource<TConfig>> => {
      const result = await mutation({ variables: { input } });
      return result.data.updateResource;
    },
    [mutation]
  );

  return { mutate, loading, error, reset };
}

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
export function useDeleteResource() {
  const [mutation, { loading, error, reset }] = useMutation(DELETE_RESOURCE_MUTATION, {
    update(cache, { data }, { variables }) {
      // Remove from cache
      cache.evict({ id: cache.identify({ __typename: 'Resource', uuid: variables?.uuid }) });
      cache.gc();
    },
  });

  const mutate = useCallback(
    async (uuid: string): Promise<boolean> => {
      const result = await mutation({ variables: { uuid } });
      return result.data.deleteResource;
    },
    [mutation]
  );

  return { mutate, loading, error, reset };
}

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
export function useValidateResource() {
  const [mutation, { loading, error, reset }] = useMutation(VALIDATE_RESOURCE_MUTATION);

  const mutate = useCallback(
    async (uuid: string): Promise<Resource & { validation: ValidationResult }> => {
      const result = await mutation({ variables: { uuid } });
      return result.data.validateResource;
    },
    [mutation]
  );

  return { mutate, loading, error, reset };
}

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
export function useApplyResource<TConfig = unknown>() {
  const [mutation, { loading, error, reset }] = useMutation(APPLY_RESOURCE_MUTATION);

  const mutate = useCallback(
    async (uuid: string, options: ApplyResourceOptions = {}): Promise<Resource<TConfig>> => {
      const { force = false, onSuccess, onError } = options;

      try {
        const result = await mutation({ variables: { uuid, force } });
        onSuccess?.();
        return result.data.applyResource;
      } catch (err) {
        onError?.(err as ApolloError);
        throw err;
      }
    },
    [mutation]
  );

  return { mutate, loading, error, reset };
}

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
export function useSyncResource<TConfig = unknown>() {
  const [mutation, { loading, error, reset }] = useMutation(SYNC_RESOURCE_MUTATION);

  const mutate = useCallback(
    async (uuid: string): Promise<Resource<TConfig>> => {
      const result = await mutation({ variables: { uuid } });
      return result.data.syncResource;
    },
    [mutation]
  );

  return { mutate, loading, error, reset };
}

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
export function useRevertResource<TConfig = unknown>() {
  const [mutation, { loading, error, reset }] = useMutation(REVERT_RESOURCE_MUTATION);

  const mutate = useCallback(
    async (uuid: string): Promise<Resource<TConfig>> => {
      const result = await mutation({ variables: { uuid } });
      return result.data.revertResource;
    },
    [mutation]
  );

  return { mutate, loading, error, reset };
}

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
export function useArchiveResource() {
  const [mutation, { loading, error, reset }] = useMutation(ARCHIVE_RESOURCE_MUTATION);

  const mutate = useCallback(
    async (uuid: string): Promise<{ uuid: string; state: ResourceLifecycleState }> => {
      const result = await mutation({ variables: { uuid } });
      return {
        uuid: result.data.archiveResource.uuid,
        state: result.data.archiveResource.metadata.state,
      };
    },
    [mutation]
  );

  return { mutate, loading, error, reset };
}

/**
 * Hook for restoring an archived resource.
 */
export function useRestoreResource<TConfig = unknown>() {
  const [mutation, { loading, error, reset }] = useMutation(RESTORE_RESOURCE_MUTATION);

  const mutate = useCallback(
    async (uuid: string): Promise<Resource<TConfig>> => {
      const result = await mutation({ variables: { uuid } });
      return result.data.restoreResource;
    },
    [mutation]
  );

  return { mutate, loading, error, reset };
}

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
export function useCloneResource<TConfig = unknown>() {
  const [mutation, { loading, error, reset }] = useMutation(CLONE_RESOURCE_MUTATION);

  const mutate = useCallback(
    async (uuid: string, newId?: string): Promise<Resource<TConfig>> => {
      const result = await mutation({ variables: { uuid, newId } });
      return result.data.cloneResource;
    },
    [mutation]
  );

  return { mutate, loading, error, reset };
}

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
export function useBatchApplyResources() {
  const [mutation, { loading, error, reset }] = useMutation(BATCH_APPLY_MUTATION);

  const mutate = useCallback(
    async (
      uuids: string[],
      force = false
    ): Promise<{
      successful: Array<{ uuid: string; state: ResourceLifecycleState }>;
      failed: Array<{ uuid: string; error: string }>;
    }> => {
      const result = await mutation({ variables: { uuids, force } });
      return result.data.batchApplyResources;
    },
    [mutation]
  );

  return { mutate, loading, error, reset };
}

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
export function useUpdateResourceMetadata() {
  const [mutation, { loading, error, reset }] = useMutation(UPDATE_RESOURCE_METADATA_MUTATION, {
    optimisticResponse: ({ uuid, metadata }) => ({
      updateResourceMetadata: {
        __typename: 'Resource',
        uuid,
        metadata: {
          __typename: 'ResourceMetadata',
          ...metadata,
          updatedAt: new Date().toISOString(),
          updatedBy: 'current-user', // Will be replaced by server
        },
      },
    }),
  });

  const mutate = useCallback(
    async (
      uuid: string,
      metadata: {
        tags?: string[];
        description?: string;
        notes?: string;
        isFavorite?: boolean;
        isPinned?: boolean;
      }
    ): Promise<{ uuid: string }> => {
      const result = await mutation({ variables: { uuid, metadata } });
      return result.data.updateResourceMetadata;
    },
    [mutation]
  );

  return { mutate, loading, error, reset };
}

// ============================================================================
// Convenience Hooks
// ============================================================================

/**
 * Hook for toggling resource favorite status.
 */
export function useToggleFavorite() {
  const { mutate: updateMetadata, loading, error } = useUpdateResourceMetadata();

  const toggle = useCallback(
    async (uuid: string, currentFavorite: boolean) => {
      return updateMetadata(uuid, { isFavorite: !currentFavorite });
    },
    [updateMetadata]
  );

  return { toggle, loading, error };
}

/**
 * Hook for toggling resource pinned status.
 */
export function useTogglePinned() {
  const { mutate: updateMetadata, loading, error } = useUpdateResourceMetadata();

  const toggle = useCallback(
    async (uuid: string, currentPinned: boolean) => {
      return updateMetadata(uuid, { isPinned: !currentPinned });
    },
    [updateMetadata]
  );

  return { toggle, loading, error };
}

export default {
  useCreateResource,
  useUpdateResource,
  useDeleteResource,
  useValidateResource,
  useApplyResource,
  useSyncResource,
  useRevertResource,
  useArchiveResource,
  useRestoreResource,
  useCloneResource,
  useBatchApplyResources,
  useUpdateResourceMetadata,
  useToggleFavorite,
  useTogglePinned,
};
