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
import { Client } from 'graphql-ws';
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
export declare function createWsClient(options?: WsClientOptions): Client;
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
export declare const wsClient: Client;
//# sourceMappingURL=apollo-ws-client.d.ts.map
