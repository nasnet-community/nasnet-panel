/**
 * WAN Subscription Hook
 *
 * Real-time WAN status and health updates via GraphQL subscriptions.
 * Story: NAS-6.8 - Implement WAN Link Configuration (Phase 5: Health Check)
 */
/**
 * WAN Status Change Event
 */
export interface WANStatusChangeEvent {
    routerId: string;
    wanInterfaceId: string;
    interfaceName: string;
    status: string;
    previousStatus: string;
    connectionType: string;
    publicIP?: string;
    gateway?: string;
    reason?: string;
    changedAt: string;
}
/**
 * WAN Health Change Event
 */
export interface WANHealthChangeEvent {
    routerId: string;
    wanInterfaceId: string;
    interfaceName: string;
    healthStatus: string;
    previousHealthStatus: string;
    target: string;
    latency?: number;
    packetLoss: number;
    consecutiveFailures: number;
    consecutiveSuccesses: number;
    lastCheckTime: string;
}
/**
 * Options for useWANStatusSubscription hook
 */
export interface UseWANStatusSubscriptionOptions {
    routerId: string;
    wanId?: string;
    onStatusChange?: (event: WANStatusChangeEvent) => void;
    skip?: boolean;
}
/**
 * Options for useWANHealthSubscription hook
 */
export interface UseWANHealthSubscriptionOptions {
    routerId: string;
    wanId?: string;
    onHealthChange?: (event: WANHealthChangeEvent) => void;
    skip?: boolean;
}
/**
 * Hook to subscribe to WAN status changes
 *
 * Manages real-time subscriptions to WAN interface status updates.
 * Automatically cleans up subscription on unmount.
 *
 * @example
 * ```tsx
 * const { data, loading, error } = useWANStatusSubscription({
 *   routerId: 'router-123',
 *   wanId: 'wan-1',
 *   onStatusChange: (event) => {
 *     console.log('Status changed:', event.status);
 *     // Update UI, show notification, etc.
 *   },
 * });
 * ```
 */
export declare function useWANStatusSubscription({ routerId, wanId, onStatusChange, skip, }: UseWANStatusSubscriptionOptions): {
    data: WANStatusChangeEvent | undefined;
    loading: boolean;
    error: import("@apollo/client").ApolloError | undefined;
};
export declare namespace useWANStatusSubscription {
    var displayName: string;
}
/**
 * Hook to subscribe to WAN health changes
 *
 * Manages real-time subscriptions to WAN health monitoring updates.
 * Includes latency, packet loss, and connectivity checks.
 *
 * @example
 * ```tsx
 * const { data, loading, error } = useWANHealthSubscription({
 *   routerId: 'router-123',
 *   wanId: 'wan-1',
 *   onHealthChange: (event) => {
 *     if (event.healthStatus === 'DOWN') {
 *       showNotification('WAN connection is down!');
 *     }
 *   },
 * });
 * ```
 */
export declare function useWANHealthSubscription({ routerId, wanId, onHealthChange, skip, }: UseWANHealthSubscriptionOptions): {
    data: WANHealthChangeEvent | undefined;
    loading: boolean;
    error: import("@apollo/client").ApolloError | undefined;
};
export declare namespace useWANHealthSubscription {
    var displayName: string;
}
/**
 * Combined hook for both status and health subscriptions
 *
 * Convenience hook that subscribes to both WAN status and health events simultaneously.
 *
 * @example
 * ```tsx
 * const { status, health } = useWANSubscription({
 *   routerId: 'router-123',
 *   wanId: 'wan-1',
 *   onStatusChange: (event) => console.log('Status:', event.status),
 *   onHealthChange: (event) => console.log('Health:', event.healthStatus),
 * });
 * ```
 */
export declare function useWANSubscription({ routerId, wanId, onStatusChange, onHealthChange, skip, }: UseWANStatusSubscriptionOptions & UseWANHealthSubscriptionOptions): {
    status: {
        data: WANStatusChangeEvent | undefined;
        loading: boolean;
        error: import("@apollo/client").ApolloError | undefined;
    };
    health: {
        data: WANHealthChangeEvent | undefined;
        loading: boolean;
        error: import("@apollo/client").ApolloError | undefined;
    };
};
export declare namespace useWANSubscription {
    var displayName: string;
}
/**
 * Get semantic color token for health status
 * @description Maps health status strings to design system color tokens
 * @param status Health status value (HEALTHY, DEGRADED, DOWN, UNKNOWN)
 * @returns Semantic color token (success, warning, destructive, muted)
 */
export declare const getHealthStatusColor: {
    (status: string): string;
    displayName: string;
};
/**
 * Get semantic color token for connection status
 * @description Maps connection status strings to design system color tokens
 * @param status Connection status value (CONNECTED, CONNECTING, DISCONNECTED, ERROR, DISABLED)
 * @returns Semantic color token (success, warning, destructive, muted)
 */
export declare const getConnectionStatusColor: {
    (status: string): string;
    displayName: string;
};
//# sourceMappingURL=useWANSubscription.d.ts.map