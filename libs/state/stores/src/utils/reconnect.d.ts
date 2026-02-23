/**
 * Reconnection Utilities
 *
 * Exponential backoff and reconnection management utilities.
 * Used by WebSocket client and connection store.
 *
 * @see NAS-4.9: Implement Connection & Auth Stores
 */
import { type WebSocketStatus } from '../connection/connection.store';
/**
 * Calculate exponential backoff delay with jitter.
 *
 * Formula: min(baseDelay * 2^attempt + jitter, maxDelay)
 *
 * Delays for each attempt:
 * - Attempt 0: ~1-2s
 * - Attempt 1: ~2-3s
 * - Attempt 2: ~4-5s
 * - Attempt 3: ~8-9s
 * - Attempt 4: ~16-17s
 * - Attempt 5+: ~30s (capped)
 *
 * @param attempt - Current attempt number (0-indexed)
 * @returns Delay in milliseconds
 */
export declare function calculateBackoff(attempt: number): number;
/**
 * Sleep for a specified duration
 *
 * @param ms - Milliseconds to sleep
 */
export declare function sleep(ms: number): Promise<void>;
/**
 * Reconnection manager configuration
 */
export interface ReconnectionManagerConfig {
    /**
     * Maximum reconnection attempts (default: 10)
     */
    maxAttempts?: number;
    /**
     * Callback to perform the actual connection
     */
    connect: () => Promise<void>;
    /**
     * Callback when status changes
     */
    onStatusChange?: (status: WebSocketStatus) => void;
    /**
     * Whether to show notifications (default: true)
     */
    showNotifications?: boolean;
}
/**
 * Reconnection manager state
 */
export interface ReconnectionManager {
    /**
     * Start reconnection attempts
     */
    start: () => void;
    /**
     * Stop reconnection attempts
     */
    stop: () => void;
    /**
     * Reset attempt counter
     */
    reset: () => void;
    /**
     * Get current attempt count
     */
    getAttempts: () => number;
    /**
     * Check if reconnection is active
     */
    isActive: () => boolean;
}
/**
 * Create a reconnection manager with exponential backoff.
 *
 * Handles automatic reconnection with:
 * - Exponential backoff (1s, 2s, 4s, 8s... max 30s)
 * - Jitter to prevent thundering herd
 * - Max 10 attempts before giving up
 * - Integration with connection store
 * - Toast notifications for status changes
 *
 * Usage:
 * ```ts
 * const manager = createReconnectionManager({
 *   connect: async () => {
 *     await websocket.connect();
 *   },
 *   onStatusChange: (status) => {
 *     console.log('Connection status:', status);
 *   },
 * });
 *
 * // Start reconnecting
 * manager.start();
 *
 * // Stop when done
 * manager.stop();
 * ```
 *
 * @param config - Reconnection configuration
 * @returns Reconnection manager instance
 */
export declare function createReconnectionManager(config: ReconnectionManagerConfig): ReconnectionManager;
/**
 * Create a debounced latency updater.
 *
 * Limits latency updates to once per interval to prevent
 * excessive store updates during high-frequency pings.
 *
 * @param intervalMs - Minimum interval between updates (default: 100ms)
 * @returns Debounced update function
 */
export declare function createLatencyUpdater(intervalMs?: number): (routerId: string, latencyMs: number) => void;
//# sourceMappingURL=reconnect.d.ts.map