/**
 * WebSocket Events
 *
 * Defines all Socket.io event names used for real-time communication between client and server.
 * Events are organized into three categories:
 * - `SOCKET_EVENTS_EMIT`: Client → Server events (client sends, server listens)
 * - `SOCKET_EVENTS_ON`: Server → Client events (server sends, client listens)
 * - `SOCKET_EVENTS`: Combined object containing all events
 *
 * @module @nasnet/core/constants/socket-events
 *
 * @example
 * ```ts
 * import { SOCKET_EVENTS_EMIT, SOCKET_EVENTS_ON } from '@nasnet/core/constants';
 * import { io } from 'socket.io-client';
 *
 * const socket = io('http://localhost:8080');
 *
 * // Emit an event from client to server
 * socket.emit(SOCKET_EVENTS_EMIT.ROUTER_SUBSCRIBE, { routerId: 'router-123' });
 *
 * // Listen for server events
 * socket.on(SOCKET_EVENTS_ON.ROUTER_STATUS_UPDATE, (data) => {
 *   console.log('Router status updated:', data);
 * });
 * ```
 */

/**
 * Client to Server events (Emit).
 * Events that the client sends to the server.
 */
export const SOCKET_EVENTS_EMIT = {
  // Connection
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',

  // Router events
  ROUTER_SUBSCRIBE: 'router:subscribe',
  ROUTER_UNSUBSCRIBE: 'router:unsubscribe',
  ROUTER_REQUEST_STATUS: 'router:request-status',
  ROUTER_REQUEST_CONFIG: 'router:request-config',

  // VPN events
  VPN_SUBSCRIBE: 'vpn:subscribe',
  VPN_UNSUBSCRIBE: 'vpn:unsubscribe',
  VPN_REQUEST_STATUS: 'vpn:request-status',
  VPN_CONNECT: 'vpn:connect',
  VPN_DISCONNECT: 'vpn:disconnect',

  // Firewall events
  FIREWALL_SUBSCRIBE: 'firewall:subscribe',
  FIREWALL_UNSUBSCRIBE: 'firewall:unsubscribe',
  FIREWALL_RULE_UPDATE: 'firewall:rule-update',

  // Network events
  NETWORK_SUBSCRIBE: 'network:subscribe',
  NETWORK_UNSUBSCRIBE: 'network:unsubscribe',
  NETWORK_INTERFACE_UPDATE: 'network:interface-update',

  // Monitoring events
  METRICS_SUBSCRIBE: 'metrics:subscribe',
  METRICS_UNSUBSCRIBE: 'metrics:unsubscribe',
  LOGS_SUBSCRIBE: 'logs:subscribe',
  LOGS_UNSUBSCRIBE: 'logs:unsubscribe',

  // Config events
  CONFIG_APPLY: 'config:apply',
  CONFIG_ROLLBACK: 'config:rollback',

  // System events
  SYSTEM_REBOOT: 'system:reboot',
  SYSTEM_SHUTDOWN: 'system:shutdown'
} as const;

/**
 * Server to Client events (On/Listen).
 * Events that the server sends to the client.
 */
export const SOCKET_EVENTS_ON = {
  // Connection
  CONNECTED: 'connected',
  DISCONNECTED: 'disconnected',
  ERROR: 'error',
  RECONNECT: 'reconnect',
  RECONNECT_ATTEMPT: 'reconnect_attempt',

  // Router events
  ROUTER_STATUS_UPDATE: 'router:status-update',
  ROUTER_CONFIG_UPDATE: 'router:config-update',
  ROUTER_CONNECTED: 'router:connected',
  ROUTER_DISCONNECTED: 'router:disconnected',
  ROUTER_ERROR: 'router:error',

  // VPN events
  VPN_STATUS_UPDATE: 'vpn:status-update',
  VPN_CONNECTION_UPDATED: 'vpn:connection-updated',
  VPN_CONNECTED: 'vpn:connected',
  VPN_DISCONNECTED: 'vpn:disconnected',
  VPN_ERROR: 'vpn:error',

  // Firewall events
  FIREWALL_RULE_UPDATED: 'firewall:rule-updated',
  FIREWALL_RULE_ADDED: 'firewall:rule-added',
  FIREWALL_RULE_DELETED: 'firewall:rule-deleted',
  FIREWALL_RULES_RELOADED: 'firewall:rules-reloaded',
  FIREWALL_ERROR: 'firewall:error',

  // Network events
  NETWORK_INTERFACE_UPDATED: 'network:interface-updated',
  NETWORK_INTERFACE_UP: 'network:interface-up',
  NETWORK_INTERFACE_DOWN: 'network:interface-down',
  NETWORK_IP_CHANGED: 'network:ip-changed',
  NETWORK_ERROR: 'network:error',

  // Monitoring events
  METRICS_UPDATE: 'metrics:update',
  METRICS_CPU_UPDATE: 'metrics:cpu-update',
  METRICS_MEMORY_UPDATE: 'metrics:memory-update',
  METRICS_DISK_UPDATE: 'metrics:disk-update',
  METRICS_NETWORK_UPDATE: 'metrics:network-update',
  LOG_ENTRY: 'log:entry',
  LOG_ENTRIES: 'log:entries',

  // Config events
  CONFIG_APPLIED: 'config:applied',
  CONFIG_APPLY_FAILED: 'config:apply-failed',
  CONFIG_ROLLED_BACK: 'config:rolled-back',
  CONFIG_ROLLBACK_FAILED: 'config:rollback-failed',

  // System events
  SYSTEM_REBOOTING: 'system:rebooting',
  SYSTEM_SHUTTING_DOWN: 'system:shutting-down',
  SYSTEM_TEMPERATURE_WARNING: 'system:temperature-warning',
  SYSTEM_TEMPERATURE_CRITICAL: 'system:temperature-critical',

  // Alert events
  ALERT: 'alert',
  WARNING: 'warning',
  INFO: 'info',
  SUCCESS: 'success'
} as const;

/**
 * Combined event object containing all socket events.
 * Convenience export for accessing any event by name.
 */
export const SOCKET_EVENTS = {
  ...SOCKET_EVENTS_EMIT,
  ...SOCKET_EVENTS_ON
} as const;

/**
 * Union type of all socket event names.
 */
export type SocketEvent = typeof SOCKET_EVENTS[keyof typeof SOCKET_EVENTS];

/**
 * Union type of all client → server event names.
 */
export type SocketEmitEvent = typeof SOCKET_EVENTS_EMIT[keyof typeof SOCKET_EVENTS_EMIT];

/**
 * Union type of all server → client event names.
 */
export type SocketOnEvent = typeof SOCKET_EVENTS_ON[keyof typeof SOCKET_EVENTS_ON];
