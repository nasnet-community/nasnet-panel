/**
 * useResourceSubscription Hook
 *
 * Hooks for subscribing to real-time resource updates via WebSocket.
 * Supports runtime metrics, state changes, and validation events.
 *
 * @module @nasnet/api-client/queries/resources
 */
import { type ApolloError } from '@apollo/client';
import type { RuntimeState, ResourceLifecycleState } from '@nasnet/core/types';
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
export declare function useResourceRuntimeSubscription(uuid: string | undefined, options?: UseResourceRuntimeSubscriptionOptions): SubscriptionResult<RuntimeUpdateEvent>;
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
export declare function useResourceStateSubscription(uuid: string | undefined, options?: UseResourceStateSubscriptionOptions): SubscriptionResult<StateChangeEvent>;
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
export declare function useResourceValidationSubscription(uuid: string | undefined, options?: {
    skip?: boolean;
    onProgress?: (event: ValidationEvent) => void;
}): SubscriptionResult<ValidationEvent>;
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
export declare function useResourcesRuntimeSubscription(uuids: string[], options?: {
    skip?: boolean;
    onUpdate?: (uuid: string, runtime: RuntimeState) => void;
}): {
    data: Map<string, RuntimeState>;
    loading: boolean;
    error: ApolloError | undefined;
    isConnected: boolean;
};
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
export declare function useResourceSubscriptions(uuid: string | undefined, options?: UseResourceSubscriptionsOptions): {
    runtime: SubscriptionResult<RuntimeUpdateEvent>;
    stateChange: SubscriptionResult<StateChangeEvent>;
    validation: SubscriptionResult<ValidationEvent>;
    isConnected: boolean;
};
export default useResourceRuntimeSubscription;
//# sourceMappingURL=useResourceSubscription.d.ts.map