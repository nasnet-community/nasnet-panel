/**
 * useChangeSetSubscription Hook
 *
 * Hooks for subscribing to real-time change set progress updates via WebSocket.
 *
 * @module @nasnet/api-client/queries/change-set
 * @see NAS-4.14: Implement Change Sets (Atomic Multi-Resource Operations)
 */
import { type ApolloError } from '@apollo/client';
import type {
  ChangeSetStatus,
  ChangeOperation,
  ChangeSetItemStatus,
  ChangeSetError,
} from '@nasnet/core/types';
/**
 * Current item info during apply progress.
 */
export interface CurrentItemInfo {
  id: string;
  name: string;
  operation: ChangeOperation;
  status: ChangeSetItemStatus;
}
/**
 * Progress event from subscription.
 */
export interface ChangeSetProgressEvent {
  changeSetId: string;
  status: ChangeSetStatus;
  currentItem: CurrentItemInfo | null;
  appliedCount: number;
  totalCount: number;
  progressPercent: number;
  estimatedRemainingMs: number | null;
  error: ChangeSetError | null;
  timestamp: string;
}
/**
 * Status change event from subscription.
 */
export interface ChangeSetStatusEvent {
  changeSetId: string;
  previousStatus: ChangeSetStatus;
  newStatus: ChangeSetStatus;
  error: ChangeSetError | null;
  timestamp: string;
}
/**
 * Options for progress subscription.
 */
export interface UseChangeSetProgressOptions {
  /** Skip subscription */
  skip?: boolean;
  /** Callback when progress updates */
  onProgress?: (event: ChangeSetProgressEvent) => void;
  /** Callback when apply completes */
  onComplete?: (event: ChangeSetProgressEvent) => void;
  /** Callback on apply error/failure */
  onError?: (event: ChangeSetProgressEvent) => void;
  /** Callback on subscription error */
  onSubscriptionError?: (error: ApolloError) => void;
}
/**
 * Options for status subscription.
 */
export interface UseChangeSetStatusOptions {
  /** Skip subscription */
  skip?: boolean;
  /** Callback when status changes */
  onStatusChange?: (event: ChangeSetStatusEvent) => void;
  /** Callback on subscription error */
  onSubscriptionError?: (error: ApolloError) => void;
}
/**
 * Return type for subscription hooks.
 */
export interface SubscriptionResult<T> {
  /** Latest event data */
  data: T | undefined;
  /** Loading state (true until first event) */
  loading: boolean;
  /** Subscription error */
  error: ApolloError | undefined;
  /** Whether subscription is active */
  isConnected: boolean;
}
/**
 * Subscribe to change set apply progress.
 * Receives real-time updates during the apply operation.
 *
 * @example
 * ```tsx
 * const { data, isConnected } = useChangeSetProgressSubscription(changeSetId, {
 *   onProgress: (event) => {
 *     setProgress(event.progressPercent);
 *     setCurrentItem(event.currentItem);
 *   },
 *   onComplete: () => {
 *     toast.success('All changes applied!');
 *     navigate('/dashboard');
 *   },
 *   onError: (event) => {
 *     toast.error(`Apply failed: ${event.error?.message}`);
 *   },
 * });
 *
 * return (
 *   <ApplyProgress
 *     progress={data?.progressPercent ?? 0}
 *     currentItem={data?.currentItem}
 *     isConnected={isConnected}
 *   />
 * );
 * ```
 */
export declare function useChangeSetProgressSubscription(
  changeSetId: string | undefined,
  options?: UseChangeSetProgressOptions
): SubscriptionResult<ChangeSetProgressEvent>;
/**
 * Subscribe to change set status changes for a router.
 * Useful for showing notifications when any change set transitions.
 *
 * @example
 * ```tsx
 * useChangeSetStatusSubscription(routerId, {
 *   onStatusChange: (event) => {
 *     if (event.newStatus === 'COMPLETED') {
 *       toast.success('Change set applied successfully');
 *       refetchData();
 *     } else if (event.newStatus === 'FAILED') {
 *       toast.error('Change set failed');
 *     }
 *   },
 * });
 * ```
 */
export declare function useChangeSetStatusSubscription(
  routerId: string | undefined,
  options?: UseChangeSetStatusOptions
): SubscriptionResult<ChangeSetStatusEvent>;
/**
 * Options for combined change set subscription.
 */
export interface UseChangeSetSubscriptionsOptions {
  /** Subscribe to apply progress */
  progress?: boolean;
  /** Subscribe to status changes for router */
  statusChanges?: boolean;
  /** Skip all subscriptions */
  skip?: boolean;
  /** Callbacks */
  onProgress?: (event: ChangeSetProgressEvent) => void;
  onComplete?: (event: ChangeSetProgressEvent) => void;
  onError?: (event: ChangeSetProgressEvent) => void;
  onStatusChange?: (event: ChangeSetStatusEvent) => void;
}
/**
 * Combined subscription hook for change set events.
 *
 * @example
 * ```tsx
 * const { progress, isConnected } = useChangeSetSubscriptions(changeSetId, routerId, {
 *   progress: isApplying,
 *   statusChanges: true,
 *   onComplete: () => refetchChangesets(),
 *   onStatusChange: (e) => console.log('Status:', e.newStatus),
 * });
 * ```
 */
export declare function useChangeSetSubscriptions(
  changeSetId: string | undefined,
  routerId: string | undefined,
  options?: UseChangeSetSubscriptionsOptions
): {
  progress: SubscriptionResult<ChangeSetProgressEvent>;
  statusChange: SubscriptionResult<ChangeSetStatusEvent>;
  isConnected: boolean;
};
/**
 * Hook that combines apply mutation with progress subscription.
 * Provides a complete apply workflow.
 *
 * @example
 * ```tsx
 * const { apply, progress, isApplying, isComplete, error } = useApplyWithProgress();
 *
 * const handleApply = async () => {
 *   await apply(changeSetId);
 *   // Progress updates will stream in
 * };
 *
 * return (
 *   <div>
 *     <Button onClick={handleApply} disabled={isApplying}>
 *       {isApplying ? 'Applying...' : 'Apply Changes'}
 *     </Button>
 *     {isApplying && (
 *       <ApplyProgress
 *         progress={progress?.progressPercent ?? 0}
 *         currentItem={progress?.currentItem}
 *       />
 *     )}
 *   </div>
 * );
 * ```
 */
export declare function useApplyWithProgress(
  changeSetId: string | undefined,
  options?: {
    onComplete?: () => void;
    onError?: (error: ChangeSetError | ApolloError) => void;
  }
): {
  apply: () => Promise<void>;
  progress: ChangeSetProgressEvent | undefined;
  isApplying: boolean;
  isComplete: boolean;
  error: ChangeSetError | ApolloError | undefined;
  reset: () => void;
};
declare const _default: {
  useChangeSetProgressSubscription: typeof useChangeSetProgressSubscription;
  useChangeSetStatusSubscription: typeof useChangeSetStatusSubscription;
  useChangeSetSubscriptions: typeof useChangeSetSubscriptions;
  useApplyWithProgress: typeof useApplyWithProgress;
};
export default _default;
//# sourceMappingURL=useChangeSetSubscription.d.ts.map
