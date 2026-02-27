/**
 * useChangeSetMutations Hook
 *
 * Hooks for change set mutation operations: create, update, validate, apply, etc.
 * Follows the Apply-Confirm-Merge pattern for state synchronization.
 *
 * @module @nasnet/api-client/queries/change-set
 * @see NAS-4.14: Implement Change Sets (Atomic Multi-Resource Operations)
 */
import { type ApolloError } from '@apollo/client';
import type {
  ChangeSet,
  ChangeSetStatus,
  ChangeOperation,
  ChangeSetValidationResult,
  ResourceCategory,
} from '@nasnet/core/types';
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
export declare function useCreateChangeSet(): {
  mutate: (input: CreateChangeSetInput) => Promise<ChangeSet>;
  loading: boolean;
  error: ApolloError | undefined;
  reset: () => void;
};
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
export declare function useAddChangeSetItem(): {
  mutate: (
    changeSetId: string,
    input: ChangeSetItemInput
  ) => Promise<{
    changeSet: ChangeSet;
    itemId: string;
  }>;
  loading: boolean;
  error: ApolloError | undefined;
  reset: () => void;
};
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
export declare function useUpdateChangeSetItem(): {
  mutate: (
    changeSetId: string,
    itemId: string,
    input: UpdateChangeSetItemInput
  ) => Promise<ChangeSet>;
  loading: boolean;
  error: ApolloError | undefined;
  reset: () => void;
};
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
export declare function useRemoveChangeSetItem(): {
  mutate: (changeSetId: string, itemId: string) => Promise<ChangeSet>;
  loading: boolean;
  error: ApolloError | undefined;
  reset: () => void;
};
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
export declare function useValidateChangeSet(): {
  mutate: (changeSetId: string) => Promise<{
    changeSet: ChangeSet;
    validation: ChangeSetValidationResult;
  }>;
  loading: boolean;
  error: ApolloError | undefined;
  reset: () => void;
};
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
export declare function useApplyChangeSet(): {
  mutate: (
    changeSetId: string,
    options?: ApplyChangeSetOptions
  ) => Promise<{
    changeSetId: string;
    status: ChangeSetStatus;
  }>;
  loading: boolean;
  error: ApolloError | undefined;
  reset: () => void;
};
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
export declare function useCancelChangeSet(): {
  mutate: (changeSetId: string) => Promise<{
    changeSet: ChangeSet;
    success: boolean;
  }>;
  loading: boolean;
  error: ApolloError | undefined;
  reset: () => void;
};
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
export declare function useRollbackChangeSet(): {
  mutate: (changeSetId: string) => Promise<{
    changeSet: ChangeSet;
    success: boolean;
    failedItems: string[];
  }>;
  loading: boolean;
  error: ApolloError | undefined;
  reset: () => void;
};
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
export declare function useDeleteChangeSet(): {
  mutate: (changeSetId: string) => Promise<{
    success: boolean;
  }>;
  loading: boolean;
  error: ApolloError | undefined;
  reset: () => void;
};
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
export declare function useChangeSetOperations(): {
  create: (input: CreateChangeSetInput) => Promise<ChangeSet>;
  addItem: (
    changeSetId: string,
    input: ChangeSetItemInput
  ) => Promise<{
    changeSet: ChangeSet;
    itemId: string;
  }>;
  updateItem: (
    changeSetId: string,
    itemId: string,
    input: UpdateChangeSetItemInput
  ) => Promise<ChangeSet>;
  removeItem: (changeSetId: string, itemId: string) => Promise<ChangeSet>;
  validate: (changeSetId: string) => Promise<{
    changeSet: ChangeSet;
    validation: ChangeSetValidationResult;
  }>;
  apply: (
    changeSetId: string,
    options?: ApplyChangeSetOptions
  ) => Promise<{
    changeSetId: string;
    status: ChangeSetStatus;
  }>;
  cancel: (changeSetId: string) => Promise<{
    changeSet: ChangeSet;
    success: boolean;
  }>;
  rollback: (changeSetId: string) => Promise<{
    changeSet: ChangeSet;
    success: boolean;
    failedItems: string[];
  }>;
  delete: (changeSetId: string) => Promise<{
    success: boolean;
  }>;
  isLoading: boolean;
};
declare const _default: {
  useCreateChangeSet: typeof useCreateChangeSet;
  useAddChangeSetItem: typeof useAddChangeSetItem;
  useUpdateChangeSetItem: typeof useUpdateChangeSetItem;
  useRemoveChangeSetItem: typeof useRemoveChangeSetItem;
  useValidateChangeSet: typeof useValidateChangeSet;
  useApplyChangeSet: typeof useApplyChangeSet;
  useCancelChangeSet: typeof useCancelChangeSet;
  useRollbackChangeSet: typeof useRollbackChangeSet;
  useDeleteChangeSet: typeof useDeleteChangeSet;
  useChangeSetOperations: typeof useChangeSetOperations;
};
export default _default;
//# sourceMappingURL=useChangeSetMutations.d.ts.map
