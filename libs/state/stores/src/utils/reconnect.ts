/**
 * Reconnection Utilities
 *
 * Exponential backoff and reconnection management utilities.
 * Used by WebSocket client and connection store.
 *
 * @see NAS-4.9: Implement Connection & Auth Stores
 */

import { useConnectionStore, type WebSocketStatus } from '../connection/connection.store';
import { useNotificationStore } from '../ui/notification.store';

// ===== Constants =====

/**
 * Base delay for exponential backoff (1 second)
 */
const BASE_DELAY_MS = 1000;

/**
 * Maximum delay cap (30 seconds)
 */
const MAX_DELAY_MS = 30000;

/**
 * Maximum reconnection attempts before giving up
 */
const MAX_ATTEMPTS = 10;

// ===== Exponential Backoff =====

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
export function calculateBackoff(attempt: number): number {
  const exponentialDelay = BASE_DELAY_MS * Math.pow(2, attempt);
  const jitter = Math.random() * 1000; // Random jitter 0-1s
  return Math.min(exponentialDelay + jitter, MAX_DELAY_MS);
}

/**
 * Sleep for a specified duration
 *
 * @param ms - Milliseconds to sleep
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ===== Reconnection Manager =====

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
export function createReconnectionManager(
  config: ReconnectionManagerConfig
): ReconnectionManager {
  const {
    maxAttempts = MAX_ATTEMPTS,
    connect,
    onStatusChange,
    showNotifications = true,
  } = config;

  let attempts = 0;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let active = false;

  const updateStatus = (status: WebSocketStatus) => {
    useConnectionStore.getState().setWsStatus(status);
    onStatusChange?.(status);
  };

  const showToast = (type: 'success' | 'error', title: string, message?: string) => {
    if (showNotifications) {
      useNotificationStore.getState().addNotification({
        type,
        title,
        message,
      });
    }
  };

  const scheduleReconnect = () => {
    if (!active) return;

    if (attempts >= maxAttempts) {
      // Max attempts reached
      updateStatus('error');
      useConnectionStore.getState().setWsStatus('error', 'Maximum reconnection attempts exceeded');

      showToast(
        'error',
        'Connection failed',
        'Unable to reconnect. Click "Retry" to try again.'
      );
      return;
    }

    const delay = calculateBackoff(attempts);
    attempts++;

    useConnectionStore.getState().incrementReconnectAttempts();
    updateStatus('connecting');

    timeoutId = setTimeout(async () => {
      if (!active) return;

      try {
        await connect();

        // Success!
        attempts = 0;
        active = false;
        useConnectionStore.getState().resetReconnection();
        updateStatus('connected');

        showToast('success', 'Connection restored');
      } catch {
        // Failed, try again
        scheduleReconnect();
      }
    }, delay);
  };

  return {
    start: () => {
      if (active) return;
      active = true;
      scheduleReconnect();
    },

    stop: () => {
      active = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
    },

    reset: () => {
      attempts = 0;
      useConnectionStore.getState().resetReconnection();
    },

    getAttempts: () => attempts,

    isActive: () => active,
  };
}

// ===== Debounced Latency Update =====

/**
 * Create a debounced latency updater.
 *
 * Limits latency updates to once per interval to prevent
 * excessive store updates during high-frequency pings.
 *
 * @param intervalMs - Minimum interval between updates (default: 100ms)
 * @returns Debounced update function
 */
export function createLatencyUpdater(intervalMs = 100) {
  let lastUpdate = 0;
  let pendingLatency: number | null = null;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return (routerId: string, latencyMs: number) => {
    const now = Date.now();
    pendingLatency = latencyMs;

    // If enough time has passed, update immediately
    if (now - lastUpdate >= intervalMs) {
      lastUpdate = now;
      useConnectionStore.getState().updateLatency(routerId, latencyMs);
      pendingLatency = null;
      return;
    }

    // Otherwise, schedule an update
    if (timeoutId) return;

    timeoutId = setTimeout(() => {
      if (pendingLatency !== null) {
        lastUpdate = Date.now();
        useConnectionStore.getState().updateLatency(routerId, pendingLatency);
        pendingLatency = null;
      }
      timeoutId = null;
    }, intervalMs - (now - lastUpdate));
  };
}

// ===== Type Exports =====

// Types are already exported inline above
