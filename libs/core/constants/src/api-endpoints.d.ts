/**
 * API Endpoints
 *
 * Defines all available API endpoints for the backend service.
 * Organized by domain: router management, network, DHCP, VPN, configuration, monitoring, and system management.
 *
 * @module @nasnet/core/constants/api-endpoints
 *
 * @example
 * ```ts
 * import { API_ENDPOINTS } from '@nasnet/core/constants';
 *
 * // Static endpoints
 * const listUrl = API_ENDPOINTS.ROUTER_LIST; // '/api/v1/routers'
 *
 * // Dynamic endpoints with parameters
 * const detailUrl = API_ENDPOINTS.ROUTER_DETAIL('router-123');
 * ```
 */
/**
 * All available API endpoints organized by domain.
 * Endpoints may be either static strings or functions that accept parameters.
 */
export declare const API_ENDPOINTS: {
    readonly ROUTER_LIST: "/api/v1/routers";
    readonly ROUTER_DETAIL: (id: string) => string;
    readonly ROUTER_ADD: "/api/v1/routers";
    readonly ROUTER_UPDATE: (id: string) => string;
    readonly ROUTER_DELETE: (id: string) => string;
    readonly ROUTER_CONNECT: (id: string) => string;
    readonly ROUTER_DISCONNECT: (id: string) => string;
    readonly ROUTER_STATUS: "/api/v1/router/status";
    readonly ROUTER_INFO: "/api/v1/router/info";
    readonly ROUTER_UPTIME: "/api/v1/router/uptime";
    readonly ROUTER_REBOOT: "/api/v1/router/reboot";
    readonly ROUTER_FACTORY_RESET: "/api/v1/router/factory-reset";
    readonly WAN_CONFIG: "/api/v1/network/wan";
    readonly WAN_DETAIL: (id: string) => string;
    readonly LAN_CONFIG: "/api/v1/network/lan";
    readonly LAN_INTERFACE: (id: string) => string;
    readonly FIREWALL_RULES: "/api/v1/network/firewall/rules";
    readonly FIREWALL_RULE: (id: string) => string;
    readonly FIREWALL_NAT: "/api/v1/network/firewall/nat";
    readonly FIREWALL_MANGLE: "/api/v1/network/firewall/mangle";
    readonly ROUTING_TABLE: "/api/v1/network/routing/table";
    readonly ROUTING_ROUTE: (id: string) => string;
    readonly QOS_CONFIG: "/api/v1/network/qos";
    readonly DHCP_CONFIG: "/api/v1/network/dhcp";
    readonly DHCP_LEASES: "/api/v1/network/dhcp/leases";
    readonly DHCP_LEASE: (mac: string) => string;
    readonly VPN_CONNECTIONS: "/api/v1/vpn/connections";
    readonly VPN_CONNECTION: (id: string) => string;
    readonly VPN_CONNECT: (id: string) => string;
    readonly VPN_DISCONNECT: (id: string) => string;
    readonly VPN_CREATE: "/api/v1/vpn/connections";
    readonly VPN_UPDATE: (id: string) => string;
    readonly VPN_DELETE: (id: string) => string;
    readonly VPN_SERVER_CONFIG: "/api/v1/vpn/server";
    readonly VPN_CLIENT_CONFIG: "/api/v1/vpn/client";
    readonly VPN_CERTIFICATE: "/api/v1/vpn/certificate";
    readonly VPN_KEY: "/api/v1/vpn/key";
    readonly CONFIG_GET: "/api/v1/config";
    readonly CONFIG_SET: "/api/v1/config";
    readonly CONFIG_APPLY: "/api/v1/config/apply";
    readonly CONFIG_ROLLBACK: "/api/v1/config/rollback";
    readonly CONFIG_BACKUP: "/api/v1/config/backup";
    readonly CONFIG_RESTORE: "/api/v1/config/restore";
    readonly CONFIG_HISTORY: "/api/v1/config/history";
    readonly CONFIG_EXPORT: "/api/v1/config/export";
    readonly CONFIG_IMPORT: "/api/v1/config/import";
    readonly LOGS_LIST: "/api/v1/logs";
    readonly LOGS_SYSTEM: "/api/v1/logs/system";
    readonly LOGS_FIREWALL: "/api/v1/logs/firewall";
    readonly LOGS_VPN: "/api/v1/logs/vpn";
    readonly LOGS_SEARCH: "/api/v1/logs/search";
    readonly METRICS: "/api/v1/metrics";
    readonly METRICS_CPU: "/api/v1/metrics/cpu";
    readonly METRICS_MEMORY: "/api/v1/metrics/memory";
    readonly METRICS_DISK: "/api/v1/metrics/disk";
    readonly METRICS_NETWORK: "/api/v1/metrics/network";
    readonly METRICS_BANDWIDTH: "/api/v1/metrics/bandwidth";
    readonly SYSTEM_INFO: "/api/v1/system/info";
    readonly SYSTEM_STATS: "/api/v1/system/stats";
    readonly SYSTEM_TIME: "/api/v1/system/time";
    readonly SYSTEM_NTP: "/api/v1/system/ntp";
    readonly SYSTEM_DNS: "/api/v1/system/dns";
    readonly SYSTEM_HOSTNAME: "/api/v1/system/hostname";
    readonly AUTH_LOGIN: "/api/v1/auth/login";
    readonly AUTH_LOGOUT: "/api/v1/auth/logout";
    readonly AUTH_REFRESH: "/api/v1/auth/refresh";
    readonly AUTH_VERIFY: "/api/v1/auth/verify";
    readonly USER_PROFILE: "/api/v1/user/profile";
    readonly USER_CHANGE_PASSWORD: "/api/v1/user/change-password";
    readonly USER_PREFERENCES: "/api/v1/user/preferences";
    readonly HEALTH: "/api/v1/health";
    readonly HEALTH_PING: "/api/v1/health/ping";
    readonly HEALTH_READY: "/api/v1/health/ready";
    readonly HEALTH_LIVE: "/api/v1/health/live";
};
//# sourceMappingURL=api-endpoints.d.ts.map