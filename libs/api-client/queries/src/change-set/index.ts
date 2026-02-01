/**
 * Change Set API Client Hooks
 *
 * Apollo Client hooks for change set operations, queries, and subscriptions.
 * @module @nasnet/api-client/queries/change-set
 * @see NAS-4.14: Implement Change Sets (Atomic Multi-Resource Operations)
 */

// ===== GraphQL Fragments =====
export * from './fragments';

// ===== Query Keys =====
export * from './queryKeys';

// ===== Query Hooks =====
export {
  useChangeSet,
  useLazyChangeSet,
  useChangeSets,
  useActiveChangeSets,
  usePendingChangeSetsCount,
  type ChangeSetSummary,
  type ListChangeSetsOptions,
  type GetChangeSetOptions,
} from './useChangeSetQueries';

// ===== Mutation Hooks =====
export {
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
  type CreateChangeSetInput,
  type ChangeSetItemInput,
  type UpdateChangeSetItemInput,
  type ApplyChangeSetOptions,
  type MutationResult,
} from './useChangeSetMutations';

// ===== Subscription Hooks =====
export {
  useChangeSetProgressSubscription,
  useChangeSetStatusSubscription,
  useChangeSetSubscriptions,
  useApplyWithProgress,
  type CurrentItemInfo,
  type ChangeSetProgressEvent,
  type ChangeSetStatusEvent,
  type UseChangeSetProgressOptions,
  type UseChangeSetStatusOptions,
  type UseChangeSetSubscriptionsOptions,
  type SubscriptionResult,
} from './useChangeSetSubscription';
