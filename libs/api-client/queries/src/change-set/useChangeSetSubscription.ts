/**
 * useChangeSetSubscription Hook
 *
 * Hooks for subscribing to real-time change set progress updates via WebSocket.
 *
 * @module @nasnet/api-client/queries/change-set
 * @see NAS-4.14: Implement Change Sets (Atomic Multi-Resource Operations)
 */

import { useSubscription, type ApolloError } from '@apollo/client';
import { gql } from '@apollo/client';
import { useCallback, useRef } from 'react';
import type {
  ChangeSetStatus,
  ChangeOperation,
  ChangeSetItemStatus,
  ChangeSetError,
} from '@nasnet/core/types';
import {
  CHANGE_SET_PROGRESS_EVENT_FRAGMENT,
  CHANGE_SET_STATUS_EVENT_FRAGMENT,
} from './fragments';

// ============================================================================
// Types
// ============================================================================

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

// ============================================================================
// Subscriptions
// ============================================================================

const CHANGE_SET_PROGRESS_SUBSCRIPTION = gql`
  subscription ChangeSetProgress($changeSetId: ID!) {
    changeSetProgress(changeSetId: $changeSetId) {
      ...ChangeSetProgressEvent
    }
  }
  ${CHANGE_SET_PROGRESS_EVENT_FRAGMENT}
`;

const CHANGE_SET_STATUS_CHANGED_SUBSCRIPTION = gql`
  subscription ChangeSetStatusChanged($routerId: ID!) {
    changeSetStatusChanged(routerId: $routerId) {
      ...ChangeSetStatusEvent
    }
  }
  ${CHANGE_SET_STATUS_EVENT_FRAGMENT}
`;

// ============================================================================
// Hook Implementations
// ============================================================================

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
export function useChangeSetProgressSubscription(
  changeSetId: string | undefined,
  options: UseChangeSetProgressOptions = {}
): SubscriptionResult<ChangeSetProgressEvent> {
  const { skip = false, onProgress, onComplete, onError, onSubscriptionError } = options;

  // Track if we've completed to avoid duplicate callbacks
  const completedRef = useRef(false);

  const { data, loading, error } = useSubscription(CHANGE_SET_PROGRESS_SUBSCRIPTION, {
    variables: { changeSetId },
    skip: skip || !changeSetId,
    onData: ({ data: eventData }) => {
      if (!eventData?.data?.changeSetProgress) return;

      const event: ChangeSetProgressEvent = eventData.data.changeSetProgress;

      // Call progress callback
      onProgress?.(event);

      // Check for completion
      if (event.status === 'COMPLETED' && !completedRef.current) {
        completedRef.current = true;
        onComplete?.(event);
      }

      // Check for errors
      if (
        (event.status === 'FAILED' ||
          event.status === 'PARTIAL_FAILURE' ||
          event.status === 'ROLLED_BACK') &&
        !completedRef.current
      ) {
        completedRef.current = true;
        onError?.(event);
      }
    },
    onError: (err) => {
      onSubscriptionError?.(err);
    },
  });

  const eventData: ChangeSetProgressEvent | undefined = data?.changeSetProgress
    ? {
        changeSetId: data.changeSetProgress.changeSetId,
        status: data.changeSetProgress.status,
        currentItem: data.changeSetProgress.currentItem,
        appliedCount: data.changeSetProgress.appliedCount,
        totalCount: data.changeSetProgress.totalCount,
        progressPercent: data.changeSetProgress.progressPercent,
        estimatedRemainingMs: data.changeSetProgress.estimatedRemainingMs,
        error: data.changeSetProgress.error,
        timestamp: data.changeSetProgress.timestamp,
      }
    : undefined;

  return {
    data: eventData,
    loading,
    error,
    isConnected: !skip && !!changeSetId && !error,
  };
}

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
export function useChangeSetStatusSubscription(
  routerId: string | undefined,
  options: UseChangeSetStatusOptions = {}
): SubscriptionResult<ChangeSetStatusEvent> {
  const { skip = false, onStatusChange, onSubscriptionError } = options;

  const { data, loading, error } = useSubscription(
    CHANGE_SET_STATUS_CHANGED_SUBSCRIPTION,
    {
      variables: { routerId },
      skip: skip || !routerId,
      onData: ({ data: eventData }) => {
        if (!eventData?.data?.changeSetStatusChanged || !onStatusChange) return;

        const event: ChangeSetStatusEvent = eventData.data.changeSetStatusChanged;
        onStatusChange(event);
      },
      onError: (err) => {
        onSubscriptionError?.(err);
      },
    }
  );

  return {
    data: data?.changeSetStatusChanged,
    loading,
    error,
    isConnected: !skip && !!routerId && !error,
  };
}

// ============================================================================
// Combined Subscription Hook
// ============================================================================

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
export function useChangeSetSubscriptions(
  changeSetId: string | undefined,
  routerId: string | undefined,
  options: UseChangeSetSubscriptionsOptions = {}
): {
  progress: SubscriptionResult<ChangeSetProgressEvent>;
  statusChange: SubscriptionResult<ChangeSetStatusEvent>;
  isConnected: boolean;
} {
  const {
    progress: subscribeProgress = true,
    statusChanges: subscribeStatusChanges = false,
    skip = false,
    onProgress,
    onComplete,
    onError,
    onStatusChange,
  } = options;

  const progressResult = useChangeSetProgressSubscription(changeSetId, {
    skip: skip || !subscribeProgress,
    onProgress,
    onComplete,
    onError,
  });

  const statusResult = useChangeSetStatusSubscription(routerId, {
    skip: skip || !subscribeStatusChanges,
    onStatusChange,
  });

  const isConnected = progressResult.isConnected || statusResult.isConnected;

  return {
    progress: progressResult,
    statusChange: statusResult,
    isConnected,
  };
}

// ============================================================================
// Utility Hooks
// ============================================================================

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
export function useApplyWithProgress(
  changeSetId: string | undefined,
  options: {
    onComplete?: () => void;
    onError?: (error: ChangeSetError | ApolloError) => void;
  } = {}
): {
  apply: () => Promise<void>;
  progress: ChangeSetProgressEvent | undefined;
  isApplying: boolean;
  isComplete: boolean;
  error: ChangeSetError | ApolloError | undefined;
  reset: () => void;
} {
  const { onComplete, onError } = options;

  // Track apply state
  const isApplyingRef = useRef(false);
  const isCompleteRef = useRef(false);
  const errorRef = useRef<ChangeSetError | ApolloError | undefined>(undefined);

  // Import mutation dynamically to avoid circular deps
  const { useApplyChangeSet } = require('./useChangeSetMutations');
  const { mutate: applyMutation, loading: applyLoading, error: mutationError } = useApplyChangeSet();

  // Subscribe to progress
  const { data: progress } = useChangeSetProgressSubscription(changeSetId, {
    skip: !isApplyingRef.current,
    onComplete: (event) => {
      isApplyingRef.current = false;
      isCompleteRef.current = true;
      onComplete?.();
    },
    onError: (event) => {
      isApplyingRef.current = false;
      if (event.error) {
        errorRef.current = event.error as ChangeSetError;
        onError?.(event.error as ChangeSetError);
      }
    },
  });

  const apply = useCallback(async () => {
    if (!changeSetId) return;

    isApplyingRef.current = true;
    isCompleteRef.current = false;
    errorRef.current = undefined;

    try {
      await applyMutation(changeSetId);
    } catch (err) {
      isApplyingRef.current = false;
      errorRef.current = err as ApolloError;
      onError?.(err as ApolloError);
    }
  }, [changeSetId, applyMutation, onError]);

  const reset = useCallback(() => {
    isApplyingRef.current = false;
    isCompleteRef.current = false;
    errorRef.current = undefined;
  }, []);

  return {
    apply,
    progress,
    isApplying: isApplyingRef.current || applyLoading,
    isComplete: isCompleteRef.current,
    error: errorRef.current || mutationError,
    reset,
  };
}

export default {
  useChangeSetProgressSubscription,
  useChangeSetStatusSubscription,
  useChangeSetSubscriptions,
  useApplyWithProgress,
};
