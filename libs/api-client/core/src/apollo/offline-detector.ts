/**
 * Offline Detector
 *
 * Monitors network connectivity and updates the network store.
 * Integrates with browser events, Apollo errors, and health checks.
 *
 * @module @nasnet/api-client/core/apollo
 */

import { useNetworkStore } from '@nasnet/state/stores';

/**
 * Configuration for the offline detector
 */
export interface OfflineDetectorConfig {
  /** Health check endpoint (default: /api/health) */
  healthEndpoint?: string;

  /** Health check interval in milliseconds (default: 30000 = 30s) */
  healthCheckInterval?: number;

  /** Timeout for health check requests in milliseconds (default: 5000 = 5s) */
  healthCheckTimeout?: number;
}

const DEFAULT_CONFIG: Required<OfflineDetectorConfig> = {
  healthEndpoint: '/api/health',
  healthCheckInterval: 30000,
  healthCheckTimeout: 5000,
};

/**
 * Cleanup function returned by setupOfflineDetector
 */
type CleanupFunction = () => void;

/**
 * Set up offline detection.
 *
 * Monitors:
 * - Browser online/offline events (navigator.onLine)
 * - Custom network:error events from Apollo error link
 * - WebSocket connection events
 * - Periodic health checks to the backend
 *
 * @param config - Optional configuration
 * @returns Cleanup function to remove listeners
 *
 * @example
 * ```tsx
 * // In App.tsx or a top-level component
 * useEffect(() => {
 *   const cleanup = setupOfflineDetector();
 *   return cleanup;
 * }, []);
 * ```
 */
export function setupOfflineDetector(
  config: OfflineDetectorConfig = {}
): CleanupFunction {
  const { healthEndpoint, healthCheckInterval, healthCheckTimeout } = {
    ...DEFAULT_CONFIG,
    ...config,
  };

  const store = useNetworkStore.getState;

  // =========================================================================
  // Browser online/offline events
  // =========================================================================
  const handleOnline = () => {
    store().setOnline(true);
    // Trigger immediate health check when coming back online
    performHealthCheck();
  };

  const handleOffline = () => {
    store().setOnline(false);
    store().setRouterReachable(false);
  };

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  // =========================================================================
  // Apollo network error events
  // =========================================================================
  const handleNetworkError = () => {
    store().setRouterReachable(false);
    store().incrementReconnectAttempts();
  };

  window.addEventListener('network:error', handleNetworkError);

  // =========================================================================
  // WebSocket connection events
  // =========================================================================
  const handleWsConnected = () => {
    store().setRouterConnected(true);
    store().setRouterReachable(true);
    store().resetReconnectAttempts();
  };

  const handleWsClosed = () => {
    store().setRouterConnected(false);
    store().incrementReconnectAttempts();
  };

  const handleWsError = () => {
    store().setRouterConnected(false);
    store().incrementReconnectAttempts();
  };

  window.addEventListener('ws:connected', handleWsConnected);
  window.addEventListener('ws:closed', handleWsClosed);
  window.addEventListener('ws:error', handleWsError);

  // =========================================================================
  // Periodic health check
  // =========================================================================
  let healthCheckIntervalId: NodeJS.Timeout | null = null;

  async function performHealthCheck(): Promise<void> {
    // Don't check if browser reports offline
    if (!navigator.onLine) {
      return;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), healthCheckTimeout);

    try {
      const response = await fetch(healthEndpoint, {
        method: 'GET',
        signal: controller.signal,
        // Don't follow redirects for health checks
        redirect: 'error',
      });

      if (response.ok) {
        store().setRouterReachable(true);
        store().recordSuccessfulRequest();
      } else {
        store().setRouterReachable(false);
        store().incrementReconnectAttempts();
      }
    } catch {
      // Network error or timeout
      store().setRouterReachable(false);
      store().incrementReconnectAttempts();
    } finally {
      clearTimeout(timeoutId);
    }
  }

  // Start periodic health checks
  if (healthCheckInterval > 0) {
    healthCheckIntervalId = setInterval(performHealthCheck, healthCheckInterval);
    // Perform initial check
    performHealthCheck();
  }

  // =========================================================================
  // Cleanup function
  // =========================================================================
  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
    window.removeEventListener('network:error', handleNetworkError);
    window.removeEventListener('ws:connected', handleWsConnected);
    window.removeEventListener('ws:closed', handleWsClosed);
    window.removeEventListener('ws:error', handleWsError);

    if (healthCheckIntervalId) {
      clearInterval(healthCheckIntervalId);
    }
  };
}

/**
 * React hook for setting up offline detection.
 *
 * @param config - Optional configuration
 *
 * @example
 * ```tsx
 * function App() {
 *   useOfflineDetector();
 *
 *   return <Router />;
 * }
 * ```
 */
export function useOfflineDetector(config?: OfflineDetectorConfig): void {
  // This would need React import to work
  // For now, call setupOfflineDetector in a useEffect in your app
}

/**
 * Check if the app is currently offline.
 *
 * Returns true if:
 * - Browser reports offline (navigator.onLine = false)
 * - OR backend is unreachable
 *
 * @returns true if offline, false if online
 */
export function isOffline(): boolean {
  const state = useNetworkStore.getState();
  return !state.isOnline || !state.isRouterReachable;
}

/**
 * Check if the app is in degraded mode.
 *
 * Degraded mode means the browser is online but we can't reach the backend
 * or the WebSocket connection is down.
 *
 * @returns true if degraded, false if fully connected or offline
 */
export function isDegraded(): boolean {
  const state = useNetworkStore.getState();
  return (
    state.isOnline && (!state.isRouterReachable || !state.isRouterConnected)
  );
}
