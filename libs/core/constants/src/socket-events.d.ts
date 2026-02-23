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
export declare const SOCKET_EVENTS_EMIT: {
    readonly CONNECT: "connect";
    readonly DISCONNECT: "disconnect";
    readonly ROUTER_SUBSCRIBE: "router:subscribe";
    readonly ROUTER_UNSUBSCRIBE: "router:unsubscribe";
    readonly ROUTER_REQUEST_STATUS: "router:request-status";
    readonly ROUTER_REQUEST_CONFIG: "router:request-config";
    readonly VPN_SUBSCRIBE: "vpn:subscribe";
    readonly VPN_UNSUBSCRIBE: "vpn:unsubscribe";
    readonly VPN_REQUEST_STATUS: "vpn:request-status";
    readonly VPN_CONNECT: "vpn:connect";
    readonly VPN_DISCONNECT: "vpn:disconnect";
    readonly FIREWALL_SUBSCRIBE: "firewall:subscribe";
    readonly FIREWALL_UNSUBSCRIBE: "firewall:unsubscribe";
    readonly FIREWALL_RULE_UPDATE: "firewall:rule-update";
    readonly NETWORK_SUBSCRIBE: "network:subscribe";
    readonly NETWORK_UNSUBSCRIBE: "network:unsubscribe";
    readonly NETWORK_INTERFACE_UPDATE: "network:interface-update";
    readonly METRICS_SUBSCRIBE: "metrics:subscribe";
    readonly METRICS_UNSUBSCRIBE: "metrics:unsubscribe";
    readonly LOGS_SUBSCRIBE: "logs:subscribe";
    readonly LOGS_UNSUBSCRIBE: "logs:unsubscribe";
    readonly CONFIG_APPLY: "config:apply";
    readonly CONFIG_ROLLBACK: "config:rollback";
    readonly SYSTEM_REBOOT: "system:reboot";
    readonly SYSTEM_SHUTDOWN: "system:shutdown";
};
/**
 * Server to Client events (On/Listen).
 * Events that the server sends to the client.
 */
export declare const SOCKET_EVENTS_ON: {
    readonly CONNECTED: "connected";
    readonly DISCONNECTED: "disconnected";
    readonly ERROR: "error";
    readonly RECONNECT: "reconnect";
    readonly RECONNECT_ATTEMPT: "reconnect_attempt";
    readonly ROUTER_STATUS_UPDATE: "router:status-update";
    readonly ROUTER_CONFIG_UPDATE: "router:config-update";
    readonly ROUTER_CONNECTED: "router:connected";
    readonly ROUTER_DISCONNECTED: "router:disconnected";
    readonly ROUTER_ERROR: "router:error";
    readonly VPN_STATUS_UPDATE: "vpn:status-update";
    readonly VPN_CONNECTION_UPDATED: "vpn:connection-updated";
    readonly VPN_CONNECTED: "vpn:connected";
    readonly VPN_DISCONNECTED: "vpn:disconnected";
    readonly VPN_ERROR: "vpn:error";
    readonly FIREWALL_RULE_UPDATED: "firewall:rule-updated";
    readonly FIREWALL_RULE_ADDED: "firewall:rule-added";
    readonly FIREWALL_RULE_DELETED: "firewall:rule-deleted";
    readonly FIREWALL_RULES_RELOADED: "firewall:rules-reloaded";
    readonly FIREWALL_ERROR: "firewall:error";
    readonly NETWORK_INTERFACE_UPDATED: "network:interface-updated";
    readonly NETWORK_INTERFACE_UP: "network:interface-up";
    readonly NETWORK_INTERFACE_DOWN: "network:interface-down";
    readonly NETWORK_IP_CHANGED: "network:ip-changed";
    readonly NETWORK_ERROR: "network:error";
    readonly METRICS_UPDATE: "metrics:update";
    readonly METRICS_CPU_UPDATE: "metrics:cpu-update";
    readonly METRICS_MEMORY_UPDATE: "metrics:memory-update";
    readonly METRICS_DISK_UPDATE: "metrics:disk-update";
    readonly METRICS_NETWORK_UPDATE: "metrics:network-update";
    readonly LOG_ENTRY: "log:entry";
    readonly LOG_ENTRIES: "log:entries";
    readonly CONFIG_APPLIED: "config:applied";
    readonly CONFIG_APPLY_FAILED: "config:apply-failed";
    readonly CONFIG_ROLLED_BACK: "config:rolled-back";
    readonly CONFIG_ROLLBACK_FAILED: "config:rollback-failed";
    readonly SYSTEM_REBOOTING: "system:rebooting";
    readonly SYSTEM_SHUTTING_DOWN: "system:shutting-down";
    readonly SYSTEM_TEMPERATURE_WARNING: "system:temperature-warning";
    readonly SYSTEM_TEMPERATURE_CRITICAL: "system:temperature-critical";
    readonly ALERT: "alert";
    readonly WARNING: "warning";
    readonly INFO: "info";
    readonly SUCCESS: "success";
};
/**
 * Combined event object containing all socket events.
 * Convenience export for accessing any event by name.
 */
export declare const SOCKET_EVENTS: {
    readonly CONNECTED: "connected";
    readonly DISCONNECTED: "disconnected";
    readonly ERROR: "error";
    readonly RECONNECT: "reconnect";
    readonly RECONNECT_ATTEMPT: "reconnect_attempt";
    readonly ROUTER_STATUS_UPDATE: "router:status-update";
    readonly ROUTER_CONFIG_UPDATE: "router:config-update";
    readonly ROUTER_CONNECTED: "router:connected";
    readonly ROUTER_DISCONNECTED: "router:disconnected";
    readonly ROUTER_ERROR: "router:error";
    readonly VPN_STATUS_UPDATE: "vpn:status-update";
    readonly VPN_CONNECTION_UPDATED: "vpn:connection-updated";
    readonly VPN_CONNECTED: "vpn:connected";
    readonly VPN_DISCONNECTED: "vpn:disconnected";
    readonly VPN_ERROR: "vpn:error";
    readonly FIREWALL_RULE_UPDATED: "firewall:rule-updated";
    readonly FIREWALL_RULE_ADDED: "firewall:rule-added";
    readonly FIREWALL_RULE_DELETED: "firewall:rule-deleted";
    readonly FIREWALL_RULES_RELOADED: "firewall:rules-reloaded";
    readonly FIREWALL_ERROR: "firewall:error";
    readonly NETWORK_INTERFACE_UPDATED: "network:interface-updated";
    readonly NETWORK_INTERFACE_UP: "network:interface-up";
    readonly NETWORK_INTERFACE_DOWN: "network:interface-down";
    readonly NETWORK_IP_CHANGED: "network:ip-changed";
    readonly NETWORK_ERROR: "network:error";
    readonly METRICS_UPDATE: "metrics:update";
    readonly METRICS_CPU_UPDATE: "metrics:cpu-update";
    readonly METRICS_MEMORY_UPDATE: "metrics:memory-update";
    readonly METRICS_DISK_UPDATE: "metrics:disk-update";
    readonly METRICS_NETWORK_UPDATE: "metrics:network-update";
    readonly LOG_ENTRY: "log:entry";
    readonly LOG_ENTRIES: "log:entries";
    readonly CONFIG_APPLIED: "config:applied";
    readonly CONFIG_APPLY_FAILED: "config:apply-failed";
    readonly CONFIG_ROLLED_BACK: "config:rolled-back";
    readonly CONFIG_ROLLBACK_FAILED: "config:rollback-failed";
    readonly SYSTEM_REBOOTING: "system:rebooting";
    readonly SYSTEM_SHUTTING_DOWN: "system:shutting-down";
    readonly SYSTEM_TEMPERATURE_WARNING: "system:temperature-warning";
    readonly SYSTEM_TEMPERATURE_CRITICAL: "system:temperature-critical";
    readonly ALERT: "alert";
    readonly WARNING: "warning";
    readonly INFO: "info";
    readonly SUCCESS: "success";
    readonly CONNECT: "connect";
    readonly DISCONNECT: "disconnect";
    readonly ROUTER_SUBSCRIBE: "router:subscribe";
    readonly ROUTER_UNSUBSCRIBE: "router:unsubscribe";
    readonly ROUTER_REQUEST_STATUS: "router:request-status";
    readonly ROUTER_REQUEST_CONFIG: "router:request-config";
    readonly VPN_SUBSCRIBE: "vpn:subscribe";
    readonly VPN_UNSUBSCRIBE: "vpn:unsubscribe";
    readonly VPN_REQUEST_STATUS: "vpn:request-status";
    readonly VPN_CONNECT: "vpn:connect";
    readonly VPN_DISCONNECT: "vpn:disconnect";
    readonly FIREWALL_SUBSCRIBE: "firewall:subscribe";
    readonly FIREWALL_UNSUBSCRIBE: "firewall:unsubscribe";
    readonly FIREWALL_RULE_UPDATE: "firewall:rule-update";
    readonly NETWORK_SUBSCRIBE: "network:subscribe";
    readonly NETWORK_UNSUBSCRIBE: "network:unsubscribe";
    readonly NETWORK_INTERFACE_UPDATE: "network:interface-update";
    readonly METRICS_SUBSCRIBE: "metrics:subscribe";
    readonly METRICS_UNSUBSCRIBE: "metrics:unsubscribe";
    readonly LOGS_SUBSCRIBE: "logs:subscribe";
    readonly LOGS_UNSUBSCRIBE: "logs:unsubscribe";
    readonly CONFIG_APPLY: "config:apply";
    readonly CONFIG_ROLLBACK: "config:rollback";
    readonly SYSTEM_REBOOT: "system:reboot";
    readonly SYSTEM_SHUTDOWN: "system:shutdown";
};
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
//# sourceMappingURL=socket-events.d.ts.map