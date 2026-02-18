/**
 * API Client Queries
 * TanStack Query hooks for all API endpoints
 */

export * from './alerts';
export * from './router';
export * from './wireless';
export * from './firewall';
export * from './dhcp';
export * from './dns';
export * from './vpn';
export * from './system';
export * from './discovery';
export * from './batch';
export * from './resources';
// Re-export change-set but hide conflicting names (MutationResult, SubscriptionResult)
export {
  useChangeSet,
  useLazyChangeSet,
  useChangeSets,
  useActiveChangeSets,
  usePendingChangeSetsCount,
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
  useChangeSetProgressSubscription,
  useChangeSetStatusSubscription,
  useChangeSetSubscriptions,
  useApplyWithProgress,
} from './change-set';
export type {
  ChangeSetSummary,
  ListChangeSetsOptions,
  GetChangeSetOptions,
  CreateChangeSetInput,
  ChangeSetItemInput,
  UpdateChangeSetItemInput,
  ApplyChangeSetOptions,
  CurrentItemInfo,
  ChangeSetProgressEvent,
  ChangeSetStatusEvent,
  UseChangeSetProgressOptions,
  UseChangeSetStatusOptions,
  UseChangeSetSubscriptionsOptions,
} from './change-set';
export * from './diagnostics';
export * from './network';
export * from './services';
export * from './notifications';
export * from './storage';
export * from './oui';
export * from './wan';
