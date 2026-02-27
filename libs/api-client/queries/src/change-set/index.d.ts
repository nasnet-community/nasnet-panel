/**
 * Change Set API Client Hooks
 *
 * Apollo Client hooks for change set operations, queries, and subscriptions.
 * @module @nasnet/api-client/queries/change-set
 * @see NAS-4.14: Implement Change Sets (Atomic Multi-Resource Operations)
 */
export * from './fragments';
export * from './queryKeys';
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
//# sourceMappingURL=index.d.ts.map
