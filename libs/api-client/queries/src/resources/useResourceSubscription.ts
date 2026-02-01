/**
 * useResourceSubscription Hook
 *
 * Hooks for subscribing to real-time resource updates via WebSocket.
 * Supports runtime metrics, state changes, and validation events.
 *
 * @module @nasnet/api-client/queries/resources
 */

import { useSubscription, type ApolloError } from '@apollo/client';
import { gql } from '@apollo/client';
import { useCallback, useEffect, useRef } from 'react';
import type {
  Resource,
  RuntimeState,
  ResourceLifecycleState,
} from '@nasnet/core/types';

// ============================================================================
// Types
// ============================================================================

/**
 * Runtime update event from subscription.
 */
export interface RuntimeUpdateEvent {
  uuid: string;
  runtime: RuntimeState;
  timestamp: string;
}

/**
 * State change event from subscription.
 */
export interface StateChangeEvent {
  uuid: string;
  previousState: ResourceLifecycleState;
  newState: ResourceLifecycleState;
  triggeredBy: string;
  timestamp: string;
  message?: string;
}

/**
 * Validation event from subscription.
 */
export interface ValidationEvent {
  uuid: string;
  stage: 'SYNTAX' | 'SEMANTIC' | 'DEPENDENCY' | 'PLATFORM' | 'CONFLICT' | 'SECURITY' | 'FINAL';
  isComplete: boolean;
  hasErrors: boolean;
  hasWarnings: boolean;
  timestamp: string;
}

/**
 * Options for runtime subscription.
 */
export interface UseResourceRuntimeSubscriptionOptions {
  /** Skip subscription */
  skip?: boolean;
  /** Callback when runtime updates */
  onUpdate?: (event: RuntimeUpdateEvent) => void;
  /** Callback on subscription error */
  onError?: (error: ApolloError) => void;
  /** Throttle updates in milliseconds */
  throttleMs?: number;
}

/**
 * Options for state change subscription.
 */
export interface UseResourceStateSubscriptionOptions {
  /** Skip subscription */
  skip?: boolean;
  /** Callback when state changes */
  onStateChange?: (event: StateChangeEvent) => void;
  /** Callback on subscription error */
  onError?: (error: ApolloError) => void;
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

/**
 * Runtime metrics subscription.
 * Receives real-time runtime state updates including metrics, health, and uptime.
 */
const RESOURCE_RUNTIME_SUBSCRIPTION = gql`
  subscription ResourceRuntime($uuid: ULID!) {
    resourceRuntime(uuid: $uuid) {
      uuid
      runtime {
        isRunning
        health
        errorMessage
        metrics {
          bytesIn
          bytesOut
          packetsIn
          packetsOut
          errors
          drops
          throughputIn
          throughputOut
          custom
        }
        lastUpdated
        lastSuccessfulOperation
        activeConnections
        uptime
      }
    }
  }
`;

/**
 * State change subscription.
 * Receives notifications when resource lifecycle state changes.
 */
const RESOURCE_STATE_CHANGED_SUBSCRIPTION = gql`
  subscription ResourceStateChanged($uuid: ULID!) {
    resourceStateChanged(uuid: $uuid) {
      uuid
      previousState
      newState
      triggeredBy
      timestamp
      message
    }
  }
`;

/**
 * Validation progress subscription.
 * Receives validation stage completion events.
 */
const RESOURCE_VALIDATION_SUBSCRIPTION = gql`
  subscription ResourceValidation($uuid: ULID!) {
    resourceValidation(uuid: $uuid) {
      uuid
      stage
      isComplete
      hasErrors
      hasWarnings
      timestamp
    }
  }
`;

/**
 * Batch runtime subscription for multiple resources.
 */
const RESOURCES_RUNTIME_SUBSCRIPTION = gql`
  subscription ResourcesRuntime($uuids: [ULID!]!) {
    resourcesRuntime(uuids: $uuids) {
      uuid
      runtime {
        isRunning
        health
        metrics {
          bytesIn
          bytesOut
          throughputIn
          throughputOut
        }
        lastUpdated
        activeConnections
      }
    }
  }
`;

// ============================================================================
// Hook Implementations
// ============================================================================

/**
 * Subscribe to runtime updates for a single resource.
 *
 * @example
 * ```tsx
 * const { data, isConnected } = useResourceRuntimeSubscription(uuid, {
 *   onUpdate: (event) => console.log('Runtime updated:', event),
 *   throttleMs: 1000, // Throttle to 1 update per second
 * });
 *
 * if (data) {
 *   console.log('Current metrics:', data.runtime.metrics);
 * }
 * ```
 */
export function useResourceRuntimeSubscription(
  uuid: string | undefined,
  options: UseResourceRuntimeSubscriptionOptions = {}
): SubscriptionResult<RuntimeUpdateEvent> {
  const { skip = false, onUpdate, onError, throttleMs = 0 } = options;

  // Throttle tracking
  const lastUpdateRef = useRef<number>(0);
  const pendingUpdateRef = useRef<RuntimeUpdateEvent | null>(null);

  const { data, loading, error } = useSubscription(RESOURCE_RUNTIME_SUBSCRIPTION, {
    variables: { uuid },
    skip: skip || !uuid,
    onData: ({ data: eventData }) => {
      if (!eventData?.data?.resourceRuntime || !onUpdate) return;

      const event: RuntimeUpdateEvent = {
        uuid: eventData.data.resourceRuntime.uuid,
        runtime: eventData.data.resourceRuntime.runtime,
        timestamp: new Date().toISOString(),
      };

      // Apply throttling if configured
      if (throttleMs > 0) {
        const now = Date.now();
        if (now - lastUpdateRef.current < throttleMs) {
          pendingUpdateRef.current = event;
          return;
        }
        lastUpdateRef.current = now;
      }

      onUpdate(event);
    },
    onError: (err) => {
      onError?.(err);
    },
  });

  // Process pending throttled update
  useEffect(() => {
    if (throttleMs <= 0 || !pendingUpdateRef.current) return;

    const timer = setTimeout(() => {
      if (pendingUpdateRef.current && onUpdate) {
        onUpdate(pendingUpdateRef.current);
        pendingUpdateRef.current = null;
        lastUpdateRef.current = Date.now();
      }
    }, throttleMs);

    return () => clearTimeout(timer);
  }, [throttleMs, onUpdate]);

  const eventData: RuntimeUpdateEvent | undefined = data?.resourceRuntime
    ? {
        uuid: data.resourceRuntime.uuid,
        runtime: data.resourceRuntime.runtime,
        timestamp: new Date().toISOString(),
      }
    : undefined;

  return {
    data: eventData,
    loading,
    error,
    isConnected: !skip && !!uuid && !error,
  };
}

/**
 * Subscribe to state changes for a resource.
 *
 * @example
 * ```tsx
 * useResourceStateSubscription(uuid, {
 *   onStateChange: (event) => {
 *     toast.info(`Resource moved from ${event.previousState} to ${event.newState}`);
 *   },
 * });
 * ```
 */
export function useResourceStateSubscription(
  uuid: string | undefined,
  options: UseResourceStateSubscriptionOptions = {}
): SubscriptionResult<StateChangeEvent> {
  const { skip = false, onStateChange, onError } = options;

  const { data, loading, error } = useSubscription(
    RESOURCE_STATE_CHANGED_SUBSCRIPTION,
    {
      variables: { uuid },
      skip: skip || !uuid,
      onData: ({ data: eventData }) => {
        if (!eventData?.data?.resourceStateChanged || !onStateChange) return;

        const event: StateChangeEvent = eventData.data.resourceStateChanged;
        onStateChange(event);
      },
      onError: (err) => {
        onError?.(err);
      },
    }
  );

  return {
    data: data?.resourceStateChanged,
    loading,
    error,
    isConnected: !skip && !!uuid && !error,
  };
}

/**
 * Subscribe to validation progress for a resource.
 *
 * @example
 * ```tsx
 * const { data } = useResourceValidationSubscription(uuid, {
 *   skip: !isValidating,
 * });
 *
 * if (data?.stage === 'FINAL' && data?.isComplete) {
 *   console.log('Validation complete!');
 * }
 * ```
 */
export function useResourceValidationSubscription(
  uuid: string | undefined,
  options: { skip?: boolean; onProgress?: (event: ValidationEvent) => void } = {}
): SubscriptionResult<ValidationEvent> {
  const { skip = false, onProgress } = options;

  const { data, loading, error } = useSubscription(
    RESOURCE_VALIDATION_SUBSCRIPTION,
    {
      variables: { uuid },
      skip: skip || !uuid,
      onData: ({ data: eventData }) => {
        if (!eventData?.data?.resourceValidation || !onProgress) return;
        onProgress(eventData.data.resourceValidation);
      },
    }
  );

  return {
    data: data?.resourceValidation,
    loading,
    error,
    isConnected: !skip && !!uuid && !error,
  };
}

/**
 * Subscribe to runtime updates for multiple resources.
 * Useful for list views that need real-time status.
 *
 * @example
 * ```tsx
 * const uuids = resources.map(r => r.uuid);
 * const { data } = useResourcesRuntimeSubscription(uuids);
 *
 * // data is a map of uuid -> runtime state
 * const runtimeForResource = data?.[resourceUuid];
 * ```
 */
export function useResourcesRuntimeSubscription(
  uuids: string[],
  options: { skip?: boolean; onUpdate?: (uuid: string, runtime: RuntimeState) => void } = {}
): {
  data: Map<string, RuntimeState>;
  loading: boolean;
  error: ApolloError | undefined;
  isConnected: boolean;
} {
  const { skip = false, onUpdate } = options;
  const runtimeMapRef = useRef<Map<string, RuntimeState>>(new Map());

  const { data, loading, error } = useSubscription(RESOURCES_RUNTIME_SUBSCRIPTION, {
    variables: { uuids },
    skip: skip || uuids.length === 0,
    onData: ({ data: eventData }) => {
      if (!eventData?.data?.resourcesRuntime) return;

      const update = eventData.data.resourcesRuntime;
      runtimeMapRef.current.set(update.uuid, update.runtime);

      onUpdate?.(update.uuid, update.runtime);
    },
  });

  // Update map from latest data
  if (data?.resourcesRuntime) {
    runtimeMapRef.current.set(
      data.resourcesRuntime.uuid,
      data.resourcesRuntime.runtime
    );
  }

  return {
    data: runtimeMapRef.current,
    loading,
    error,
    isConnected: !skip && uuids.length > 0 && !error,
  };
}

// ============================================================================
// Combined Subscription Hook
// ============================================================================

/**
 * Options for combined resource subscription.
 */
export interface UseResourceSubscriptionsOptions {
  /** Subscribe to runtime updates */
  runtime?: boolean;
  /** Subscribe to state changes */
  stateChanges?: boolean;
  /** Subscribe to validation progress */
  validation?: boolean;
  /** Skip all subscriptions */
  skip?: boolean;
  /** Callbacks */
  onRuntimeUpdate?: (event: RuntimeUpdateEvent) => void;
  onStateChange?: (event: StateChangeEvent) => void;
  onValidationProgress?: (event: ValidationEvent) => void;
}

/**
 * Combined subscription hook for all resource events.
 *
 * @example
 * ```tsx
 * useResourceSubscriptions(uuid, {
 *   runtime: true,
 *   stateChanges: true,
 *   onRuntimeUpdate: (e) => updateMetrics(e.runtime.metrics),
 *   onStateChange: (e) => toast.info(`State: ${e.newState}`),
 * });
 * ```
 */
export function useResourceSubscriptions(
  uuid: string | undefined,
  options: UseResourceSubscriptionsOptions = {}
): {
  runtime: SubscriptionResult<RuntimeUpdateEvent>;
  stateChange: SubscriptionResult<StateChangeEvent>;
  validation: SubscriptionResult<ValidationEvent>;
  isConnected: boolean;
} {
  const {
    runtime: subscribeRuntime = true,
    stateChanges: subscribeStateChanges = false,
    validation: subscribeValidation = false,
    skip = false,
    onRuntimeUpdate,
    onStateChange,
    onValidationProgress,
  } = options;

  const runtimeResult = useResourceRuntimeSubscription(uuid, {
    skip: skip || !subscribeRuntime,
    onUpdate: onRuntimeUpdate,
  });

  const stateResult = useResourceStateSubscription(uuid, {
    skip: skip || !subscribeStateChanges,
    onStateChange,
  });

  const validationResult = useResourceValidationSubscription(uuid, {
    skip: skip || !subscribeValidation,
    onProgress: onValidationProgress,
  });

  const isConnected =
    runtimeResult.isConnected ||
    stateResult.isConnected ||
    validationResult.isConnected;

  return {
    runtime: runtimeResult,
    stateChange: stateResult,
    validation: validationResult,
    isConnected,
  };
}

export default useResourceRuntimeSubscription;
