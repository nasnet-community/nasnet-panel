/**
 * useChangeSetMutations Hook
 *
 * Hooks for change set mutation operations: create, update, validate, apply, etc.
 * Follows the Apply-Confirm-Merge pattern for state synchronization.
 *
 * @module @nasnet/api-client/queries/change-set
 * @see NAS-4.14: Implement Change Sets (Atomic Multi-Resource Operations)
 */

import {
  useMutation,
  type ApolloError,
  type ApolloCache,
} from '@apollo/client';
import { gql } from '@apollo/client';
import { useCallback } from 'react';
import type {
  ChangeSet,
  ChangeSetItem,
  ChangeSetStatus,
  ChangeOperation,
  ChangeSetValidationResult,
  ResourceCategory,
} from '@nasnet/core/types';
import {
  CHANGE_SET_FULL_FRAGMENT,
  CHANGE_SET_VALIDATION_RESULT_FRAGMENT,
} from './fragments';

// ============================================================================
// Types
// ============================================================================

/**
 * Input for creating a new change set.
 */
export interface CreateChangeSetInput {
  routerId: string;
  name: string;
  description?: string;
  source?: string;
}

/**
 * Input for adding an item to a change set.
 */
export interface ChangeSetItemInput {
  resourceType: string;
  resourceCategory: ResourceCategory;
  resourceUuid?: string;
  name: string;
  description?: string;
  operation: ChangeOperation;
  configuration: Record<string, unknown>;
  previousState?: Record<string, unknown>;
  dependencies?: string[];
}

/**
 * Input for updating an item in a change set.
 */
export interface UpdateChangeSetItemInput {
  name?: string;
  description?: string;
  configuration?: Record<string, unknown>;
  dependencies?: string[];
}

/**
 * Options for apply mutation.
 */
export interface ApplyChangeSetOptions {
  /** Callback when apply starts */
  onStart?: () => void;
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

const CREATE_CHANGE_SET_MUTATION = gql`
  mutation CreateChangeSet($input: CreateChangeSetInput!) {
    createChangeSet(input: $input) {
      changeSet {
        ...ChangeSetFull
      }
      errors {
        message
        code
        field
      }
    }
  }
  ${CHANGE_SET_FULL_FRAGMENT}
`;

const ADD_CHANGE_SET_ITEM_MUTATION = gql`
  mutation AddChangeSetItem($changeSetId: ID!, $input: ChangeSetItemInput!) {
    addChangeSetItem(changeSetId: $changeSetId, input: $input) {
      changeSet {
        ...ChangeSetFull
      }
      itemId
      errors {
        message
        code
        field
      }
    }
  }
  ${CHANGE_SET_FULL_FRAGMENT}
`;

const UPDATE_CHANGE_SET_ITEM_MUTATION = gql`
  mutation UpdateChangeSetItem(
    $changeSetId: ID!
    $itemId: ID!
    $input: UpdateChangeSetItemInput!
  ) {
    updateChangeSetItem(changeSetId: $changeSetId, itemId: $itemId, input: $input) {
      changeSet {
        ...ChangeSetFull
      }
      errors {
        message
        code
        field
      }
    }
  }
  ${CHANGE_SET_FULL_FRAGMENT}
`;

const REMOVE_CHANGE_SET_ITEM_MUTATION = gql`
  mutation RemoveChangeSetItem($changeSetId: ID!, $itemId: ID!) {
    removeChangeSetItem(changeSetId: $changeSetId, itemId: $itemId) {
      changeSet {
        ...ChangeSetFull
      }
      errors {
        message
        code
        field
      }
    }
  }
  ${CHANGE_SET_FULL_FRAGMENT}
`;

const VALIDATE_CHANGE_SET_MUTATION = gql`
  mutation ValidateChangeSet($changeSetId: ID!) {
    validateChangeSet(changeSetId: $changeSetId) {
      changeSet {
        ...ChangeSetFull
      }
      validation {
        ...ChangeSetValidationResult
      }
      errors {
        message
        code
        field
      }
    }
  }
  ${CHANGE_SET_FULL_FRAGMENT}
  ${CHANGE_SET_VALIDATION_RESULT_FRAGMENT}
`;

const APPLY_CHANGE_SET_MUTATION = gql`
  mutation ApplyChangeSet($changeSetId: ID!) {
    applyChangeSet(changeSetId: $changeSetId) {
      changeSetId
      status
      errors {
        message
        code
        field
      }
    }
  }
`;

const CANCEL_CHANGE_SET_MUTATION = gql`
  mutation CancelChangeSet($changeSetId: ID!) {
    cancelChangeSet(changeSetId: $changeSetId) {
      changeSet {
        ...ChangeSetFull
      }
      success
      errors {
        message
        code
        field
      }
    }
  }
  ${CHANGE_SET_FULL_FRAGMENT}
`;

const ROLLBACK_CHANGE_SET_MUTATION = gql`
  mutation RollbackChangeSet($changeSetId: ID!) {
    rollbackChangeSet(changeSetId: $changeSetId) {
      changeSet {
        ...ChangeSetFull
      }
      success
      failedItems
      errors {
        message
        code
        field
      }
    }
  }
  ${CHANGE_SET_FULL_FRAGMENT}
`;

const DELETE_CHANGE_SET_MUTATION = gql`
  mutation DeleteChangeSet($changeSetId: ID!) {
    deleteChangeSet(changeSetId: $changeSetId) {
      success
      errors {
        message
        code
        field
      }
    }
  }
`;

// ============================================================================
// Hook Implementations
// ============================================================================

/**
 * Hook for creating a new change set.
 *
 * @example
 * ```tsx
 * const { mutate: createChangeSet, loading } = useCreateChangeSet();
 *
 * const handleCreate = async () => {
 *   const result = await createChangeSet({
 *     routerId: 'router-1',
 *     name: 'Setup Guest Network',
 *     description: 'Create bridge, DHCP, and firewall rules for guest network',
 *     source: 'guest-network-wizard',
 *   });
 *   navigate(`/change-sets/${result.id}`);
 * };
 * ```
 */
export function useCreateChangeSet() {
  const [mutation, { loading, error, reset }] = useMutation(CREATE_CHANGE_SET_MUTATION);

  const mutate = useCallback(
    async (input: CreateChangeSetInput): Promise<ChangeSet> => {
      const result = await mutation({ variables: { input } });
      if (result.data?.createChangeSet?.errors?.length > 0) {
        throw new Error(result.data.createChangeSet.errors[0].message);
      }
      return result.data.createChangeSet.changeSet;
    },
    [mutation]
  );

  return { mutate, loading, error, reset };
}

/**
 * Hook for adding an item to a change set.
 *
 * @example
 * ```tsx
 * const { mutate: addItem, loading } = useAddChangeSetItem();
 *
 * const handleAddBridge = async () => {
 *   const result = await addItem(changeSetId, {
 *     resourceType: 'interface-bridge',
 *     resourceCategory: 'NETWORKING',
 *     name: 'guest-bridge',
 *     operation: 'CREATE',
 *     configuration: { name: 'guest-bridge', comment: 'Guest network bridge' },
 *   });
 *   console.log('Added item:', result.itemId);
 * };
 * ```
 */
export function useAddChangeSetItem() {
  const [mutation, { loading, error, reset }] = useMutation(ADD_CHANGE_SET_ITEM_MUTATION);

  const mutate = useCallback(
    async (
      changeSetId: string,
      input: ChangeSetItemInput
    ): Promise<{ changeSet: ChangeSet; itemId: string }> => {
      const result = await mutation({ variables: { changeSetId, input } });
      if (result.data?.addChangeSetItem?.errors?.length > 0) {
        throw new Error(result.data.addChangeSetItem.errors[0].message);
      }
      return {
        changeSet: result.data.addChangeSetItem.changeSet,
        itemId: result.data.addChangeSetItem.itemId,
      };
    },
    [mutation]
  );

  return { mutate, loading, error, reset };
}

/**
 * Hook for updating an item in a change set.
 *
 * @example
 * ```tsx
 * const { mutate: updateItem } = useUpdateChangeSetItem();
 *
 * await updateItem(changeSetId, itemId, {
 *   configuration: { ...item.configuration, comment: 'Updated comment' },
 * });
 * ```
 */
export function useUpdateChangeSetItem() {
  const [mutation, { loading, error, reset }] = useMutation(UPDATE_CHANGE_SET_ITEM_MUTATION);

  const mutate = useCallback(
    async (
      changeSetId: string,
      itemId: string,
      input: UpdateChangeSetItemInput
    ): Promise<ChangeSet> => {
      const result = await mutation({ variables: { changeSetId, itemId, input } });
      if (result.data?.updateChangeSetItem?.errors?.length > 0) {
        throw new Error(result.data.updateChangeSetItem.errors[0].message);
      }
      return result.data.updateChangeSetItem.changeSet;
    },
    [mutation]
  );

  return { mutate, loading, error, reset };
}

/**
 * Hook for removing an item from a change set.
 *
 * @example
 * ```tsx
 * const { mutate: removeItem, loading } = useRemoveChangeSetItem();
 *
 * const handleRemove = async (itemId: string) => {
 *   await removeItem(changeSetId, itemId);
 *   toast.success('Item removed');
 * };
 * ```
 */
export function useRemoveChangeSetItem() {
  const [mutation, { loading, error, reset }] = useMutation(REMOVE_CHANGE_SET_ITEM_MUTATION);

  const mutate = useCallback(
    async (changeSetId: string, itemId: string): Promise<ChangeSet> => {
      const result = await mutation({ variables: { changeSetId, itemId } });
      if (result.data?.removeChangeSetItem?.errors?.length > 0) {
        throw new Error(result.data.removeChangeSetItem.errors[0].message);
      }
      return result.data.removeChangeSetItem.changeSet;
    },
    [mutation]
  );

  return { mutate, loading, error, reset };
}

/**
 * Hook for validating a change set before applying.
 *
 * @example
 * ```tsx
 * const { mutate: validateChangeSet, loading } = useValidateChangeSet();
 *
 * const handleValidate = async () => {
 *   const result = await validateChangeSet(changeSetId);
 *   if (result.validation.canApply) {
 *     setReadyToApply(true);
 *   } else {
 *     showValidationErrors(result.validation.errors);
 *   }
 * };
 * ```
 */
export function useValidateChangeSet() {
  const [mutation, { loading, error, reset }] = useMutation(VALIDATE_CHANGE_SET_MUTATION);

  const mutate = useCallback(
    async (
      changeSetId: string
    ): Promise<{ changeSet: ChangeSet; validation: ChangeSetValidationResult }> => {
      const result = await mutation({ variables: { changeSetId } });
      if (result.data?.validateChangeSet?.errors?.length > 0) {
        throw new Error(result.data.validateChangeSet.errors[0].message);
      }
      return {
        changeSet: result.data.validateChangeSet.changeSet,
        validation: result.data.validateChangeSet.validation,
      };
    },
    [mutation]
  );

  return { mutate, loading, error, reset };
}

/**
 * Hook for applying a change set atomically.
 * Use with useChangeSetProgressSubscription for real-time updates.
 *
 * @example
 * ```tsx
 * const { mutate: applyChangeSet, loading } = useApplyChangeSet();
 *
 * const handleApply = async () => {
 *   try {
 *     const result = await applyChangeSet(changeSetId, {
 *       onStart: () => setIsApplying(true),
 *       onSuccess: () => toast.success('Changes applied successfully!'),
 *       onError: (e) => toast.error(`Apply failed: ${e.message}`),
 *     });
 *     console.log('Apply started, status:', result.status);
 *   } catch (err) {
 *     // Handle error
 *   }
 * };
 * ```
 */
export function useApplyChangeSet() {
  const [mutation, { loading, error, reset }] = useMutation(APPLY_CHANGE_SET_MUTATION);

  const mutate = useCallback(
    async (
      changeSetId: string,
      options: ApplyChangeSetOptions = {}
    ): Promise<{ changeSetId: string; status: ChangeSetStatus }> => {
      const { onStart, onSuccess, onError } = options;

      try {
        onStart?.();
        const result = await mutation({ variables: { changeSetId } });

        if (result.data?.applyChangeSet?.errors?.length > 0) {
          const err = new Error(result.data.applyChangeSet.errors[0].message) as ApolloError;
          onError?.(err);
          throw err;
        }

        onSuccess?.();
        return {
          changeSetId: result.data.applyChangeSet.changeSetId,
          status: result.data.applyChangeSet.status,
        };
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
 * Hook for cancelling an in-progress change set application.
 *
 * @example
 * ```tsx
 * const { mutate: cancelChangeSet, loading } = useCancelChangeSet();
 *
 * const handleCancel = async () => {
 *   const result = await cancelChangeSet(changeSetId);
 *   if (result.success) {
 *     toast.info('Application cancelled');
 *   }
 * };
 * ```
 */
export function useCancelChangeSet() {
  const [mutation, { loading, error, reset }] = useMutation(CANCEL_CHANGE_SET_MUTATION);

  const mutate = useCallback(
    async (changeSetId: string): Promise<{ changeSet: ChangeSet; success: boolean }> => {
      const result = await mutation({ variables: { changeSetId } });
      if (result.data?.cancelChangeSet?.errors?.length > 0) {
        throw new Error(result.data.cancelChangeSet.errors[0].message);
      }
      return {
        changeSet: result.data.cancelChangeSet.changeSet,
        success: result.data.cancelChangeSet.success,
      };
    },
    [mutation]
  );

  return { mutate, loading, error, reset };
}

/**
 * Hook for rolling back a failed change set.
 *
 * @example
 * ```tsx
 * const { mutate: rollbackChangeSet, loading } = useRollbackChangeSet();
 *
 * const handleRollback = async () => {
 *   const result = await rollbackChangeSet(changeSetId);
 *   if (result.success) {
 *     toast.success('Rollback completed');
 *   } else {
 *     toast.warning(`Partial rollback. Failed items: ${result.failedItems.length}`);
 *   }
 * };
 * ```
 */
export function useRollbackChangeSet() {
  const [mutation, { loading, error, reset }] = useMutation(ROLLBACK_CHANGE_SET_MUTATION);

  const mutate = useCallback(
    async (
      changeSetId: string
    ): Promise<{ changeSet: ChangeSet; success: boolean; failedItems: string[] }> => {
      const result = await mutation({ variables: { changeSetId } });
      if (result.data?.rollbackChangeSet?.errors?.length > 0) {
        throw new Error(result.data.rollbackChangeSet.errors[0].message);
      }
      return {
        changeSet: result.data.rollbackChangeSet.changeSet,
        success: result.data.rollbackChangeSet.success,
        failedItems: result.data.rollbackChangeSet.failedItems ?? [],
      };
    },
    [mutation]
  );

  return { mutate, loading, error, reset };
}

/**
 * Hook for deleting a change set.
 * Can only delete change sets that are not currently applying.
 *
 * @example
 * ```tsx
 * const { mutate: deleteChangeSet, loading } = useDeleteChangeSet();
 *
 * const handleDelete = async () => {
 *   const result = await deleteChangeSet(changeSetId);
 *   if (result.success) {
 *     navigate('/change-sets');
 *     toast.success('Change set deleted');
 *   }
 * };
 * ```
 */
export function useDeleteChangeSet() {
  const [mutation, { loading, error, reset }] = useMutation(DELETE_CHANGE_SET_MUTATION, {
    update(cache, { data }, { variables }) {
      if (data?.deleteChangeSet?.success) {
        // Remove from cache
        cache.evict({ id: cache.identify({ __typename: 'ChangeSet', id: variables?.changeSetId }) });
        cache.gc();
      }
    },
  });

  const mutate = useCallback(
    async (changeSetId: string): Promise<{ success: boolean }> => {
      const result = await mutation({ variables: { changeSetId } });
      if (result.data?.deleteChangeSet?.errors?.length > 0) {
        throw new Error(result.data.deleteChangeSet.errors[0].message);
      }
      return {
        success: result.data.deleteChangeSet.success,
      };
    },
    [mutation]
  );

  return { mutate, loading, error, reset };
}

// ============================================================================
// Convenience Hooks
// ============================================================================

/**
 * Combined hook for common change set operations.
 *
 * @example
 * ```tsx
 * const ops = useChangeSetOperations();
 *
 * // Create and populate a change set
 * const cs = await ops.create({ routerId, name: 'My Changes' });
 * await ops.addItem(cs.id, { ... });
 * await ops.addItem(cs.id, { ... });
 * await ops.validate(cs.id);
 * await ops.apply(cs.id);
 * ```
 */
export function useChangeSetOperations() {
  const createMutation = useCreateChangeSet();
  const addItemMutation = useAddChangeSetItem();
  const updateItemMutation = useUpdateChangeSetItem();
  const removeItemMutation = useRemoveChangeSetItem();
  const validateMutation = useValidateChangeSet();
  const applyMutation = useApplyChangeSet();
  const cancelMutation = useCancelChangeSet();
  const rollbackMutation = useRollbackChangeSet();
  const deleteMutation = useDeleteChangeSet();

  return {
    create: createMutation.mutate,
    addItem: addItemMutation.mutate,
    updateItem: updateItemMutation.mutate,
    removeItem: removeItemMutation.mutate,
    validate: validateMutation.mutate,
    apply: applyMutation.mutate,
    cancel: cancelMutation.mutate,
    rollback: rollbackMutation.mutate,
    delete: deleteMutation.mutate,
    isLoading:
      createMutation.loading ||
      addItemMutation.loading ||
      updateItemMutation.loading ||
      removeItemMutation.loading ||
      validateMutation.loading ||
      applyMutation.loading ||
      cancelMutation.loading ||
      rollbackMutation.loading ||
      deleteMutation.loading,
  };
}

export default {
  useCreateChangeSet,
  useAddChangeSetItem,
  useUpdateChangeSetItem,
  useRemoveChangeSetItem,
  useValidateChangeSet,
  useApplyChangeSet,
  useCancelChangeSet,
  useRollbackChangeSet,
  useDeleteChangeSet,
  useChangeSetOperations,
};
