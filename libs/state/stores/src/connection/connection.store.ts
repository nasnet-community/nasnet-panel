/// <reference types="vite/client" />

/**
 * Connection State Store
 *
 * Manages WebSocket connection status, per-router connections, and reconnection logic.
 * Part of Layer 2 (UI State) in the Four-Layer State Architecture.
 *
 * Features:
 * - WebSocket status tracking (connecting, connected, disconnected, error)
 * - Per-router connection status with protocol tracking
 * - Latency/quality metrics with debounce
 * - Exponential backoff reconnection (max 10 attempts)
 * - Integration with notification store for status toasts
 * - Redux DevTools integration
 * - Selective persistence (only activeRouterId)
 *
 * @see NAS-4.9: Implement Connection & Auth Stores
 * @see Docs/architecture/frontend-architecture.md#state-management
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

// ===== Types =====

/**
 * WebSocket connection status
 */
export type WebSocketStatus =
  | 'connecting'
  | 'connected'
  | 'disconnected'
  | 'error';

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
  // ===== WebSocket Status =====

  /**
   * Global WebSocket connection status
   */
  wsStatus: WebSocketStatus;

  /**
   * WebSocket error message (null if no error)
   */
  wsError: string | null;

  // ===== Per-Router Connections =====

  /**
   * Map of router ID to connection info
   */
  routers: Record<string, RouterConnection>;

  /**
   * Currently active router ID (null if none selected)
   */
  activeRouterId: string | null;

  // ===== Reconnection State =====

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

  // ===== Legacy Compatibility =====
  // These maintain backward compatibility with existing code

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
  // ===== WebSocket Status Actions =====

  /**
   * Set WebSocket status with optional error message
   *
   * @param status - New WebSocket status
   * @param error - Optional error message
   */
  setWsStatus: (status: WebSocketStatus, error?: string) => void;

  // ===== Router Connection Actions =====

  /**
   * Set or update a router's connection info
   *
   * @param routerId - Router identifier
   * @param connection - Partial connection info to merge
   */
  setRouterConnection: (
    routerId: string,
    connection: Partial<Omit<RouterConnection, 'routerId'>>
  ) => void;

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

  // ===== Reconnection Actions =====

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

  // ===== Legacy Compatibility Actions =====

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

// ===== Store Implementation =====

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
export const useConnectionStore = create<ConnectionState & ConnectionActions>()(
  devtools(
    persist(
      (set, get) => ({
        // ===== Initial State =====
        wsStatus: 'disconnected',
        wsError: null,
        routers: {},
        activeRouterId: null,
        reconnectAttempts: 0,
        maxReconnectAttempts: 10,
        isReconnecting: false,

        // Legacy compatibility
        state: 'disconnected',
        lastConnectedAt: null,
        currentRouterId: null,
        currentRouterIp: null,

        // ===== WebSocket Status Actions =====

        setWsStatus: (status, error) =>
          set(
            {
              wsStatus: status,
              wsError: error ?? null,
              isReconnecting: status === 'connecting',
              // Legacy compatibility mapping
              state:
                status === 'connected'
                  ? 'connected'
                  : status === 'connecting'
                    ? 'reconnecting'
                    : 'disconnected',
            },
            false,
            `setWsStatus/${status}`
          ),

        // ===== Router Connection Actions =====

        setRouterConnection: (routerId, connection) =>
          set(
            (state) => ({
              routers: {
                ...state.routers,
                [routerId]: {
                  routerId,
                  status: state.routers[routerId]?.status ?? 'disconnected',
                  protocol: state.routers[routerId]?.protocol ?? 'rest',
                  latencyMs: state.routers[routerId]?.latencyMs ?? null,
                  lastConnected: state.routers[routerId]?.lastConnected ?? null,
                  lastError: state.routers[routerId]?.lastError ?? null,
                  ...connection,
                },
              },
            }),
            false,
            `setRouterConnection/${routerId}`
          ),

        setActiveRouter: (routerId) =>
          set(
            {
              activeRouterId: routerId,
              currentRouterId: routerId, // Legacy compatibility
            },
            false,
            `setActiveRouter/${routerId}`
          ),

        updateLatency: (routerId, latencyMs) =>
          set(
            (state) => ({
              routers: {
                ...state.routers,
                [routerId]: {
                  ...state.routers[routerId],
                  routerId,
                  status: state.routers[routerId]?.status ?? 'connected',
                  protocol: state.routers[routerId]?.protocol ?? 'rest',
                  latencyMs,
                  lastConnected: state.routers[routerId]?.lastConnected ?? null,
                  lastError: state.routers[routerId]?.lastError ?? null,
                },
              },
            }),
            false,
            `updateLatency/${routerId}`
          ),

        // ===== Reconnection Actions =====

        incrementReconnectAttempts: () =>
          set(
            (state) => ({
              reconnectAttempts: state.reconnectAttempts + 1,
            }),
            false,
            'incrementReconnectAttempts'
          ),

        resetReconnection: () =>
          set(
            {
              reconnectAttempts: 0,
              isReconnecting: false,
            },
            false,
            'resetReconnection'
          ),

        hasExceededMaxAttempts: () => {
          const { reconnectAttempts, maxReconnectAttempts } = get();
          return reconnectAttempts >= maxReconnectAttempts;
        },

        // ===== Legacy Compatibility Actions =====

        setConnected: () =>
          set(
            {
              state: 'connected',
              wsStatus: 'connected',
              lastConnectedAt: new Date(),
              isReconnecting: false,
              wsError: null,
            },
            false,
            'setConnected'
          ),

        setDisconnected: () =>
          set(
            {
              state: 'disconnected',
              wsStatus: 'disconnected',
            },
            false,
            'setDisconnected'
          ),

        setReconnecting: () =>
          set(
            {
              state: 'reconnecting',
              wsStatus: 'connecting',
              isReconnecting: true,
            },
            false,
            'setReconnecting'
          ),

        setCurrentRouter: (id, ip) =>
          set(
            (state) => ({
              currentRouterId: id,
              currentRouterIp: ip,
              activeRouterId: id,
              state: 'connected',
              wsStatus: 'connected',
              lastConnectedAt: new Date(),
              isReconnecting: false,
              routers: {
                ...state.routers,
                [id]: {
                  routerId: id,
                  status: 'connected',
                  protocol: state.routers[id]?.protocol ?? 'rest',
                  latencyMs: state.routers[id]?.latencyMs ?? null,
                  lastConnected: new Date(),
                  lastError: null,
                },
              },
            }),
            false,
            `setCurrentRouter/${id}`
          ),

        clearCurrentRouter: () =>
          set(
            {
              currentRouterId: null,
              currentRouterIp: null,
              activeRouterId: null,
              state: 'disconnected',
              wsStatus: 'disconnected',
            },
            false,
            'clearCurrentRouter'
          ),
      }),
      {
        name: 'connection-storage',
        // Only persist activeRouterId across sessions
        partialize: (state) => ({
          activeRouterId: state.activeRouterId,
        }),
      }
    ),
    {
      name: 'connection-store',
      enabled:
        typeof window !== 'undefined' &&
        (typeof import.meta !== 'undefined' ? import.meta.env?.DEV !== false : true),
    }
  )
);

// ===== Selectors =====

/**
 * Select WebSocket status
 */
export const selectWsStatus = (state: ConnectionState) => state.wsStatus;

/**
 * Select whether currently connected
 */
export const selectIsConnected = (state: ConnectionState) =>
  state.wsStatus === 'connected';

/**
 * Select whether currently reconnecting
 */
export const selectIsReconnecting = (state: ConnectionState) =>
  state.isReconnecting;

/**
 * Select active router ID
 */
export const selectActiveRouterId = (state: ConnectionState) =>
  state.activeRouterId;

/**
 * Select active router connection info
 */
export const selectActiveRouterConnection = (
  state: ConnectionState
): RouterConnection | null => {
  if (!state.activeRouterId) return null;
  return state.routers[state.activeRouterId] ?? null;
};

/**
 * Select reconnection attempts
 */
export const selectReconnectAttempts = (state: ConnectionState) =>
  state.reconnectAttempts;

/**
 * Select whether max reconnection attempts exceeded
 */
export const selectHasExceededMaxAttempts = (state: ConnectionState) =>
  state.reconnectAttempts >= state.maxReconnectAttempts;

// ===== Helper Functions =====

/**
 * Get connection store state outside of React
 */
export const getConnectionState = () => useConnectionStore.getState();

/**
 * Subscribe to connection store changes outside of React
 */
export const subscribeConnectionState = useConnectionStore.subscribe;

// ===== Type Exports =====

// Types are already exported inline above

// Re-export legacy type for backward compatibility
export type ConnectionStateType = 'connected' | 'disconnected' | 'reconnecting';
