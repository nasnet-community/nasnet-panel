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
export declare const useNetworkStore: import('zustand').UseBoundStore<
  Omit<import('zustand').StoreApi<NetworkStore>, 'setState'> & {
    setState<
      A extends
        | string
        | {
            type: string;
          },
    >(
      partial:
        | NetworkStore
        | Partial<NetworkStore>
        | ((state: NetworkStore) => NetworkStore | Partial<NetworkStore>),
      replace?: boolean | undefined,
      action?: A | undefined
    ): void;
  }
>;
/**
 * Selector for checking if the app is fully connected
 * (online + reachable + WebSocket connected)
 */
export declare const selectIsFullyConnected: (state: NetworkStore) => boolean;
/**
 * Selector for checking if the app is in degraded mode
 * (online but backend issues)
 */
export declare const selectIsDegraded: (state: NetworkStore) => boolean;
/**
 * Selector for checking if the app is completely offline
 */
export declare const selectIsOffline: (state: NetworkStore) => boolean;
/**
 * Selector for network quality (NAS-4.15)
 */
export declare const selectNetworkQuality: (state: NetworkStore) => NetworkQuality;
/**
 * Selector for latency (NAS-4.15)
 */
export declare const selectLatency: (state: NetworkStore) => number | null;
/**
 * Selector for was offline flag (NAS-4.15)
 */
export declare const selectWasOffline: (state: NetworkStore) => boolean;
/**
 * Selector for last error (NAS-4.15)
 */
export declare const selectLastError: (state: NetworkStore) => string | null;
/**
 * Get network store state outside of React
 */
export declare const getNetworkState: () => NetworkStore;
/**
 * Subscribe to network store changes outside of React
 */
export declare const subscribeNetworkState: (
  listener: (state: NetworkStore, prevState: NetworkStore) => void
) => () => void;
//# sourceMappingURL=network.store.d.ts.map
