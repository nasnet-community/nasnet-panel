/// <reference types="vite/client" />

/**
 * Network State Store
 *
 * Zustand store for tracking network connectivity status.
 * Monitors browser online state, backend reachability, and WebSocket connection.
 *
 * Features:
 * - Browser online/offline event handling
 * - Network quality assessment (excellent/good/poor/offline)
 * - Automatic network status listeners
 * - Integration with notification store
 *
 * @module @nasnet/state/stores/connection
 * @see NAS-4.15: Implement Error Boundaries & Global Error Handling
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

/**
 * Network quality levels
 */
export type NetworkQuality = 'excellent' | 'good' | 'poor' | 'offline';

/**
 * Network connectivity state
 */
export interface NetworkState {
  /** Browser reports online via navigator.onLine */
  isOnline: boolean;

  /** Backend health endpoint is reachable */
  isRouterReachable: boolean;

  /** WebSocket subscription connection is active */
  isRouterConnected: boolean;

  /** Timestamp of last successful API request */
  lastSuccessfulRequest: Date | null;

  /** Number of reconnection attempts since last successful connection */
  reconnectAttempts: number;

  // ===== NAS-4.15 Additions =====

  /** Whether the app was recently offline (for showing "back online" message) */
  wasOffline: boolean;

  /** Network quality assessment */
  quality: NetworkQuality;

  /** Last known latency to backend (ms) */
  latencyMs: number | null;

  /** Last network error message */
  lastError: string | null;

  /** Timestamp of last network error */
  lastErrorTime: Date | null;

  /** Whether network listeners are initialized */
  listenersInitialized: boolean;
}

/**
 * Network state actions
 */
export interface NetworkActions {
  /** Update browser online status */
  setOnline: (online: boolean) => void;

  /** Update backend reachability status */
  setRouterReachable: (reachable: boolean) => void;

  /** Update WebSocket connection status */
  setRouterConnected: (connected: boolean) => void;

  /** Record a successful request (resets reconnect attempts) */
  recordSuccessfulRequest: () => void;

  /** Increment reconnect attempt counter */
  incrementReconnectAttempts: () => void;

  /** Reset reconnect attempts (on successful connection) */
  resetReconnectAttempts: () => void;

  // ===== NAS-4.15 Additions =====

  /** Set network quality */
  setQuality: (quality: NetworkQuality) => void;

  /** Update latency measurement */
  updateLatency: (latencyMs: number) => void;

  /** Record a network error */
  recordNetworkError: (error: string) => void;

  /** Clear the "was offline" flag */
  clearWasOffline: () => void;

  /** Initialize network event listeners */
  initializeListeners: () => void;

  /** Clean up network event listeners */
  cleanupListeners: () => void;
}

/**
 * Combined network store type
 */
export type NetworkStore = NetworkState & NetworkActions;

/**
 * Module-scoped storage for network event handlers (avoids polluting window)
 */
let networkHandlers: { online: () => void; offline: () => void } | null = null;

/**
 * Determine network quality based on latency
 */
function getQualityFromLatency(latencyMs: number | null, isOnline: boolean): NetworkQuality {
  if (!isOnline) return 'offline';
  if (latencyMs === null) return 'good'; // Unknown, assume good
  if (latencyMs < 100) return 'excellent';
  if (latencyMs < 300) return 'good';
  return 'poor';
}

/**
 * Zustand store for network connectivity state.
 *
 * This store tracks three levels of connectivity:
 * 1. Browser online state (navigator.onLine)
 * 2. Backend reachability (API health checks)
 * 3. WebSocket connection (real-time subscriptions)
 *
 * The offline-detector module integrates with this store to provide
 * automatic status updates based on network events.
 *
 * @example
 * ```tsx
 * // In a component
 * const { isOnline, isRouterReachable, isRouterConnected } = useNetworkStore();
 *
 * if (!isOnline) {
 *   return <OfflineBanner />;
 * }
 *
 * if (!isRouterReachable) {
 *   return <BackendUnavailableBanner />;
 * }
 *
 * if (!isRouterConnected) {
 *   return <ReconnectingBanner />;
 * }
 * ```
 *
 * @example
 * ```ts
 * // In Apollo error link
 * import { useNetworkStore } from '@nasnet/state/stores';
 *
 * onError(({ networkError }) => {
 *   if (networkError) {
 *     useNetworkStore.getState().setRouterReachable(false);
 *     useNetworkStore.getState().recordNetworkError(networkError.message);
 *   }
 * });
 * ```
 */
export const useNetworkStore = create<NetworkStore>()(
  devtools(
    (set, get) => ({
      // Initial state
      isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
      isRouterReachable: false,
      isRouterConnected: false,
      lastSuccessfulRequest: null,
      reconnectAttempts: 0,

      // NAS-4.15 additions
      wasOffline: false,
      quality: 'good',
      latencyMs: null,
      lastError: null,
      lastErrorTime: null,
      listenersInitialized: false,

      // Actions
      setOnline: (online) =>
        set(
          (state) => ({
            isOnline: online,
            quality: online ? getQualityFromLatency(state.latencyMs, online) : 'offline',
            // Track if we were offline when coming back online
            wasOffline: !state.isOnline && online ? true : state.wasOffline,
          }),
          false,
          `setOnline/${online}`
        ),

      setRouterReachable: (reachable) =>
        set(
          (state) => ({
            isRouterReachable: reachable,
            // Reset reconnect attempts on success
            reconnectAttempts: reachable ? 0 : state.reconnectAttempts,
          }),
          false,
          `setRouterReachable/${reachable}`
        ),

      setRouterConnected: (connected) =>
        set(
          (state) => ({
            isRouterConnected: connected,
            // Reset reconnect attempts on success
            reconnectAttempts: connected ? 0 : state.reconnectAttempts,
          }),
          false,
          `setRouterConnected/${connected}`
        ),

      recordSuccessfulRequest: () =>
        set(
          {
            lastSuccessfulRequest: new Date(),
            reconnectAttempts: 0,
            lastError: null,
          },
          false,
          'recordSuccessfulRequest'
        ),

      incrementReconnectAttempts: () =>
        set(
          (state) => ({
            reconnectAttempts: state.reconnectAttempts + 1,
          }),
          false,
          'incrementReconnectAttempts'
        ),

      resetReconnectAttempts: () =>
        set({ reconnectAttempts: 0 }, false, 'resetReconnectAttempts'),

      // NAS-4.15 actions
      setQuality: (quality) =>
        set({ quality }, false, `setQuality/${quality}`),

      updateLatency: (latencyMs) =>
        set(
          (state) => ({
            latencyMs,
            quality: getQualityFromLatency(latencyMs, state.isOnline),
          }),
          false,
          'updateLatency'
        ),

      recordNetworkError: (error) =>
        set(
          {
            lastError: error,
            lastErrorTime: new Date(),
          },
          false,
          'recordNetworkError'
        ),

      clearWasOffline: () =>
        set({ wasOffline: false }, false, 'clearWasOffline'),

      initializeListeners: () => {
        if (typeof window === 'undefined') return;
        if (get().listenersInitialized) return;

        const handleOnline = () => {
          get().setOnline(true);
        };

        const handleOffline = () => {
          get().setOnline(false);
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        // Store handlers in module scope for cleanup
        networkHandlers = { online: handleOnline, offline: handleOffline };

        set({ listenersInitialized: true }, false, 'initializeListeners');
      },

      cleanupListeners: () => {
        if (typeof window === 'undefined') return;

        if (networkHandlers) {
          window.removeEventListener('online', networkHandlers.online);
          window.removeEventListener('offline', networkHandlers.offline);
          networkHandlers = null;
        }

        set({ listenersInitialized: false }, false, 'cleanupListeners');
      },
    }),
    {
      name: 'network-store',
      enabled:
        typeof window !== 'undefined' &&
        (typeof import.meta !== 'undefined' ? import.meta.env?.DEV !== false : true),
    }
  )
);

/**
 * Selector for checking if the app is fully connected
 * (online + reachable + WebSocket connected)
 */
export const selectIsFullyConnected = (state: NetworkStore): boolean =>
  state.isOnline && state.isRouterReachable && state.isRouterConnected;

/**
 * Selector for checking if the app is in degraded mode
 * (online but backend issues)
 */
export const selectIsDegraded = (state: NetworkStore): boolean =>
  state.isOnline && (!state.isRouterReachable || !state.isRouterConnected);

/**
 * Selector for checking if the app is completely offline
 */
export const selectIsOffline = (state: NetworkStore): boolean => !state.isOnline;

/**
 * Selector for network quality (NAS-4.15)
 */
export const selectNetworkQuality = (state: NetworkStore): NetworkQuality => state.quality;

/**
 * Selector for latency (NAS-4.15)
 */
export const selectLatency = (state: NetworkStore): number | null => state.latencyMs;

/**
 * Selector for was offline flag (NAS-4.15)
 */
export const selectWasOffline = (state: NetworkStore): boolean => state.wasOffline;

/**
 * Selector for last error (NAS-4.15)
 */
export const selectLastError = (state: NetworkStore): string | null => state.lastError;

// ===== Helper Functions =====

/**
 * Get network store state outside of React
 */
export const getNetworkState = () => useNetworkStore.getState();

/**
 * Subscribe to network store changes outside of React
 */
export const subscribeNetworkState = useNetworkStore.subscribe;
