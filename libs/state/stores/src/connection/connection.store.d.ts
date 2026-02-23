/**
 * WebSocket connection status
 */
export type WebSocketStatus = 'connecting' | 'connected' | 'disconnected' | 'error';
/**
 * Protocol used for router communication
 */
export type Protocol = 'rest' | 'api' | 'ssh';
/**
 * Per-router connection information
 */
export interface RouterConnection {
    /**
     * Router identifier
     */
    routerId: string;
    /**
     * Connection status for this router
     */
    status: WebSocketStatus;
    /**
     * Communication protocol in use
     */
    protocol: Protocol;
    /**
     * Current latency in milliseconds (null if unknown)
     */
    latencyMs: number | null;
    /**
     * Timestamp of last successful connection
     */
    lastConnected: Date | null;
    /**
     * Last error message (null if no error)
     */
    lastError: string | null;
}
/**
 * Connection state interface
 */
export interface ConnectionState {
    /**
     * Global WebSocket connection status
     */
    wsStatus: WebSocketStatus;
    /**
     * WebSocket error message (null if no error)
     */
    wsError: string | null;
    /**
     * Map of router ID to connection info
     */
    routers: Record<string, RouterConnection>;
    /**
     * Currently active router ID (null if none selected)
     */
    activeRouterId: string | null;
    /**
     * Current number of reconnection attempts
     */
    reconnectAttempts: number;
    /**
     * Maximum reconnection attempts before showing manual retry
     */
    maxReconnectAttempts: number;
    /**
     * Whether currently attempting to reconnect
     */
    isReconnecting: boolean;
    /**
     * @deprecated Use wsStatus instead. Kept for backward compatibility.
     */
    state: 'connected' | 'disconnected' | 'reconnecting';
    /**
     * @deprecated Use routers[activeRouterId]?.lastConnected instead.
     */
    lastConnectedAt: Date | null;
    /**
     * @deprecated Use activeRouterId instead.
     */
    currentRouterId: string | null;
    /**
     * IP address of the current router
     */
    currentRouterIp: string | null;
}
/**
 * Connection actions interface
 */
export interface ConnectionActions {
    /**
     * Set WebSocket status with optional error message
     *
     * @param status - New WebSocket status
     * @param error - Optional error message
     */
    setWsStatus: (status: WebSocketStatus, error?: string) => void;
    /**
     * Set or update a router's connection info
     *
     * @param routerId - Router identifier
     * @param connection - Partial connection info to merge
     */
    setRouterConnection: (routerId: string, connection: Partial<Omit<RouterConnection, 'routerId'>>) => void;
    /**
     * Set the active router
     *
     * @param routerId - Router ID or null to clear
     */
    setActiveRouter: (routerId: string | null) => void;
    /**
     * Update latency for a router (debounced internally)
     *
     * @param routerId - Router identifier
     * @param latencyMs - Latency in milliseconds
     */
    updateLatency: (routerId: string, latencyMs: number) => void;
    /**
     * Increment reconnection attempt counter
     */
    incrementReconnectAttempts: () => void;
    /**
     * Reset reconnection state (call on successful connection)
     */
    resetReconnection: () => void;
    /**
     * Check if max reconnection attempts exceeded
     *
     * @returns true if exceeded max attempts
     */
    hasExceededMaxAttempts: () => boolean;
    /**
     * @deprecated Use setWsStatus('connected') instead.
     */
    setConnected: () => void;
    /**
     * @deprecated Use setWsStatus('disconnected') instead.
     */
    setDisconnected: () => void;
    /**
     * @deprecated Use setWsStatus('connecting') and set isReconnecting instead.
     */
    setReconnecting: () => void;
    /**
     * Set current router with IP (legacy + new)
     *
     * @param id - Router identifier
     * @param ip - Router IP address
     */
    setCurrentRouter: (id: string, ip: string) => void;
    /**
     * Clear current router (legacy + new)
     */
    clearCurrentRouter: () => void;
}
/**
 * Zustand store for connection state management.
 *
 * Usage with selectors (CRITICAL for performance):
 *
 * ```tsx
 * // ✅ GOOD: Only re-renders when wsStatus changes
 * const wsStatus = useConnectionStore(state => state.wsStatus);
 *
 * // ✅ GOOD: Select multiple fields with shallow comparison
 * import { shallow } from 'zustand/shallow';
 * const { wsStatus, isReconnecting } = useConnectionStore(
 *   state => ({ wsStatus: state.wsStatus, isReconnecting: state.isReconnecting }),
 *   shallow
 * );
 *
 * // ❌ BAD: Re-renders on ANY store change
 * const { wsStatus, routers } = useConnectionStore();
 * ```
 *
 * Integration:
 * - WebSocket lifecycle hooks update this store
 * - UI components (ConnectionIndicator, etc.) consume state
 * - Reconnection manager reads hasExceededMaxAttempts
 *
 * Persistence:
 * - Only activeRouterId persists to localStorage
 * - All other state resets on page reload
 *
 * DevTools:
 * - Integrated with Redux DevTools (store name: 'connection-store')
 */
export declare const useConnectionStore: import("zustand").UseBoundStore<Omit<Omit<import("zustand").StoreApi<ConnectionState & ConnectionActions>, "setState"> & {
    setState<A extends string | {
        type: string;
    }>(partial: (ConnectionState & ConnectionActions) | Partial<ConnectionState & ConnectionActions> | ((state: ConnectionState & ConnectionActions) => (ConnectionState & ConnectionActions) | Partial<ConnectionState & ConnectionActions>), replace?: boolean | undefined, action?: A | undefined): void;
}, "persist"> & {
    persist: {
        setOptions: (options: Partial<import("zustand/middleware").PersistOptions<ConnectionState & ConnectionActions, {
            activeRouterId: string | null;
        }>>) => void;
        clearStorage: () => void;
        rehydrate: () => Promise<void> | void;
        hasHydrated: () => boolean;
        onHydrate: (fn: (state: ConnectionState & ConnectionActions) => void) => () => void;
        onFinishHydration: (fn: (state: ConnectionState & ConnectionActions) => void) => () => void;
        getOptions: () => Partial<import("zustand/middleware").PersistOptions<ConnectionState & ConnectionActions, {
            activeRouterId: string | null;
        }>>;
    };
}>;
/**
 * Select WebSocket status
 */
export declare const selectWsStatus: (state: ConnectionState) => WebSocketStatus;
/**
 * Select whether currently connected
 */
export declare const selectIsConnected: (state: ConnectionState) => boolean;
/**
 * Select whether currently reconnecting
 */
export declare const selectIsReconnecting: (state: ConnectionState) => boolean;
/**
 * Select active router ID
 */
export declare const selectActiveRouterId: (state: ConnectionState) => string | null;
/**
 * Select active router connection info
 */
export declare const selectActiveRouterConnection: (state: ConnectionState) => RouterConnection | null;
/**
 * Select reconnection attempts
 */
export declare const selectReconnectAttempts: (state: ConnectionState) => number;
/**
 * Select whether max reconnection attempts exceeded
 */
export declare const selectHasExceededMaxAttempts: (state: ConnectionState) => boolean;
/**
 * Get connection store state outside of React
 */
export declare const getConnectionState: () => ConnectionState & ConnectionActions;
/**
 * Subscribe to connection store changes outside of React
 */
export declare const subscribeConnectionState: (listener: (state: ConnectionState & ConnectionActions, prevState: ConnectionState & ConnectionActions) => void) => () => void;
export type ConnectionStateType = 'connected' | 'disconnected' | 'reconnecting';
//# sourceMappingURL=connection.store.d.ts.map