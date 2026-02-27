/**
 * Offline Detector
 *
 * Monitors network connectivity and updates the network store.
 * Integrates with browser events, Apollo errors, and health checks.
 *
 * @module @nasnet/api-client/core/apollo
 */
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
export declare function setupOfflineDetector(config?: OfflineDetectorConfig): CleanupFunction;
/**
 * React hook for setting up offline detection.
 *
 * Sets up browser online/offline listeners, Apollo network error handling,
 * WebSocket connection tracking, and periodic health checks.
 * Automatically cleans up on unmount.
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
export declare function useOfflineDetector(config?: OfflineDetectorConfig): void;
/**
 * Check if the app is currently offline.
 *
 * Returns true if:
 * - Browser reports offline (navigator.onLine = false)
 * - OR backend is unreachable
 *
 * @returns true if offline, false if online
 */
export declare function isOffline(): boolean;
/**
 * Check if the app is in degraded mode.
 *
 * Degraded mode means the browser is online but we can't reach the backend
 * or the WebSocket connection is down.
 *
 * @returns true if degraded, false if fully connected or offline
 */
export declare function isDegraded(): boolean;
export {};
//# sourceMappingURL=offline-detector.d.ts.map
