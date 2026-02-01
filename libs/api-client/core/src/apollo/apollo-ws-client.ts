/**
 * Apollo WebSocket Client
 *
 * GraphQL WebSocket client for subscriptions with automatic reconnection.
 * Uses graphql-ws transport with exponential backoff retry strategy.
 * Integrates with connection store for status tracking.
 *
 * @module @nasnet/api-client/core/apollo
 * @see NAS-4.9: Implement Connection & Auth Stores
 */

import { createClient, Client } from 'graphql-ws';
import {
  useConnectionStore,
  useAuthStore,
  useNotificationStore,
  getAuthToken,
  calculateBackoff,
} from '@nasnet/state/stores';

// ===== Types =====

/**
 * WebSocket client configuration options
 */
export interface WsClientOptions {
  /**
   * WebSocket URL (default: auto-detected from current location)
   */
  url?: string;

  /**
   * Maximum retry attempts (default: 10)
   */
  maxRetries?: number;

  /**
   * Whether to show notifications for status changes (default: true)
   */
  showNotifications?: boolean;
}

// ===== Helper Functions =====

/**
 * Construct WebSocket URL from current location.
 * Uses secure WebSocket (wss:) when page is served over HTTPS.
 *
 * @returns WebSocket URL for GraphQL subscriptions
 */
function getWebSocketUrl(): string {
  if (typeof window === 'undefined') {
    // SSR fallback (won't actually be used)
    return 'ws://localhost:8080/graphql';
  }

  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = window.location.host;
  return `${protocol}//${host}/graphql`;
}

/**
 * Get stored credentials from sessionStorage.
 * @param routerId - The router ID to get credentials for
 */
function getStoredCredentials(
  routerId: string | null
): { username: string; password: string } | null {
  if (!routerId || typeof sessionStorage === 'undefined') return null;

  try {
    const stored = sessionStorage.getItem(`router-credentials-${routerId}`);
    if (!stored) return null;

    const parsed = JSON.parse(stored);
    if (
      typeof parsed.username === 'string' &&
      typeof parsed.password === 'string'
    ) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Get authorization value for WebSocket connection.
 * Prioritizes JWT token, falls back to Basic auth.
 */
function getAuthorization(routerId: string | null): string | undefined {
  // First try JWT token
  const jwtToken = getAuthToken();
  if (jwtToken) {
    return `Bearer ${jwtToken}`;
  }

  // Fall back to Basic auth
  const credentials = getStoredCredentials(routerId);
  if (credentials) {
    return `Basic ${btoa(`${credentials.username}:${credentials.password}`)}`;
  }

  return undefined;
}

// ===== WebSocket Client Factory =====

/**
 * Create a WebSocket client for GraphQL subscriptions.
 *
 * Features:
 * - Automatic reconnection with exponential backoff (jitter included)
 * - Re-authenticates on each reconnect
 * - Updates connection store status
 * - Shows toast notifications on status changes
 * - Maximum 10 retry attempts before showing manual retry
 *
 * Retry Strategy:
 * - Uses calculateBackoff from reconnect utilities
 * - Delays: ~1s, 2s, 4s, 8s, 16s, 30s (capped)
 * - Does not retry on authentication failures (code 4401, 4403)
 *
 * @param options - Configuration options
 * @returns graphql-ws Client instance
 */
export function createWsClient(options: WsClientOptions = {}): Client {
  const {
    url = getWebSocketUrl(),
    maxRetries = 10,
    showNotifications = true,
  } = options;

  const showToast = (type: 'success' | 'error' | 'info', title: string, message?: string) => {
    if (showNotifications) {
      useNotificationStore.getState().addNotification({
        type,
        title,
        message,
      });
    }
  };

  return createClient({
    url,

    // Re-authenticate on each connection (important for reconnects)
    connectionParams: () => {
      const { currentRouterId } = useConnectionStore.getState();
      const authorization = getAuthorization(currentRouterId);

      return {
        routerId: currentRouterId,
        authorization,
      };
    },

    // Retry configuration
    retryAttempts: maxRetries,

    retryWait: async (retries) => {
      // Use shared exponential backoff with jitter
      const delay = calculateBackoff(retries);
      await new Promise((resolve) => setTimeout(resolve, delay));
    },

    shouldRetry: (errOrCloseEvent) => {
      // Don't retry on authentication failures
      if (errOrCloseEvent instanceof CloseEvent) {
        // 4401 = Authentication failed (custom code)
        // 4403 = Forbidden
        if (errOrCloseEvent.code === 4401 || errOrCloseEvent.code === 4403) {
          return false;
        }
      }

      // Check if we've exceeded max attempts
      const { hasExceededMaxAttempts } = useConnectionStore.getState();
      if (hasExceededMaxAttempts()) {
        return false;
      }

      return true;
    },

    // Connection lifecycle events - update connection store
    on: {
      connecting: () => {
        const store = useConnectionStore.getState();
        store.setWsStatus('connecting');

        // Dispatch event for any listeners
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('ws:connecting'));
        }
      },

      connected: () => {
        const store = useConnectionStore.getState();
        store.setWsStatus('connected');
        store.resetReconnection();

        // Update active router connection
        const { activeRouterId } = store;
        if (activeRouterId) {
          store.setRouterConnection(activeRouterId, {
            status: 'connected',
            lastConnected: new Date(),
            lastError: null,
          });
        }

        // Show success toast if we were reconnecting
        if (store.reconnectAttempts > 0) {
          showToast('success', 'Connection restored', 'WebSocket connection re-established.');
        }

        // Dispatch event
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('ws:connected'));
        }
      },

      closed: (event) => {
        const store = useConnectionStore.getState();
        const wasClean = event instanceof CloseEvent ? event.wasClean : false;
        const code = event instanceof CloseEvent ? event.code : undefined;
        const reason = event instanceof CloseEvent ? event.reason : undefined;

        if (wasClean) {
          store.setWsStatus('disconnected');
        } else {
          store.setWsStatus('error', reason || 'Connection closed unexpectedly');
          store.incrementReconnectAttempts();

          // Update active router connection
          const { activeRouterId } = store;
          if (activeRouterId) {
            store.setRouterConnection(activeRouterId, {
              status: 'error',
              lastError: reason || 'Connection closed',
            });
          }

          // Check if max attempts exceeded
          if (store.hasExceededMaxAttempts()) {
            showToast(
              'error',
              'Connection failed',
              'Unable to reconnect. Click "Retry" to try again.'
            );
          }
        }

        // Dispatch event with details
        if (typeof window !== 'undefined') {
          window.dispatchEvent(
            new CustomEvent('ws:closed', {
              detail: { code, reason, wasClean },
            })
          );
        }
      },

      error: (error) => {
        console.error('[WebSocket Error]:', error);

        const store = useConnectionStore.getState();
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        store.setWsStatus('error', errorMessage);

        // Update active router connection
        const { activeRouterId } = store;
        if (activeRouterId) {
          store.setRouterConnection(activeRouterId, {
            status: 'error',
            lastError: errorMessage,
          });
        }

        // Dispatch event
        if (typeof window !== 'undefined') {
          window.dispatchEvent(
            new CustomEvent('ws:error', {
              detail: { error },
            })
          );
        }
      },
    },
  });
}

// ===== Default Client Instance =====

/**
 * Default WebSocket client for GraphQL subscriptions.
 *
 * Features:
 * - Automatic reconnection with exponential backoff
 * - Re-authenticates on each reconnect
 * - Dispatches connection status events
 * - Integrates with connection store
 *
 * Retry Strategy:
 * - Initial delay: 1 second
 * - Exponential backoff: 1s, 2s, 4s, 8s, 16s, 30s max
 * - Maximum 10 retry attempts before giving up
 * - Does not retry on authentication failures (code 4401)
 *
 * Usage:
 * ```ts
 * import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
 * import { wsClient } from './apollo-ws-client';
 *
 * const wsLink = new GraphQLWsLink(wsClient);
 * ```
 */
export const wsClient: Client = createWsClient();

// ===== Type Exports =====

export type { WsClientOptions };
