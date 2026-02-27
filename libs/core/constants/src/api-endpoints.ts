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
export const API_ENDPOINTS = {
  // Router Management
  ROUTER_LIST: '/api/v1/routers',
  ROUTER_DETAIL: (id: string) => `/api/v1/routers/${id}`,
  ROUTER_ADD: '/api/v1/routers',
  ROUTER_UPDATE: (id: string) => `/api/v1/routers/${id}`,
  ROUTER_DELETE: (id: string) => `/api/v1/routers/${id}`,
  ROUTER_CONNECT: (id: string) => `/api/v1/routers/${id}/connect`,
  ROUTER_DISCONNECT: (id: string) => `/api/v1/routers/${id}/disconnect`,

  // Router Info & Status
  ROUTER_STATUS: '/api/v1/router/status',
  ROUTER_INFO: '/api/v1/router/info',
  ROUTER_UPTIME: '/api/v1/router/uptime',
  ROUTER_REBOOT: '/api/v1/router/reboot',
  ROUTER_FACTORY_RESET: '/api/v1/router/factory-reset',

  // Network Configuration
  WAN_CONFIG: '/api/v1/network/wan',
  WAN_DETAIL: (id: string) => `/api/v1/network/wan/${id}`,
  LAN_CONFIG: '/api/v1/network/lan',
  LAN_INTERFACE: (id: string) => `/api/v1/network/lan/${id}`,
  FIREWALL_RULES: '/api/v1/network/firewall/rules',
  FIREWALL_RULE: (id: string) => `/api/v1/network/firewall/rules/${id}`,
  FIREWALL_NAT: '/api/v1/network/firewall/nat',
  FIREWALL_MANGLE: '/api/v1/network/firewall/mangle',
  ROUTING_TABLE: '/api/v1/network/routing/table',
  ROUTING_ROUTE: (id: string) => `/api/v1/network/routing/routes/${id}`,
  QOS_CONFIG: '/api/v1/network/qos',

  // DHCP
  DHCP_CONFIG: '/api/v1/network/dhcp',
  DHCP_LEASES: '/api/v1/network/dhcp/leases',
  DHCP_LEASE: (mac: string) => `/api/v1/network/dhcp/leases/${mac}`,

  // VPN
  VPN_CONNECTIONS: '/api/v1/vpn/connections',
  VPN_CONNECTION: (id: string) => `/api/v1/vpn/connections/${id}`,
  VPN_CONNECT: (id: string) => `/api/v1/vpn/connections/${id}/connect`,
  VPN_DISCONNECT: (id: string) => `/api/v1/vpn/connections/${id}/disconnect`,
  VPN_CREATE: '/api/v1/vpn/connections',
  VPN_UPDATE: (id: string) => `/api/v1/vpn/connections/${id}`,
  VPN_DELETE: (id: string) => `/api/v1/vpn/connections/${id}`,
  VPN_SERVER_CONFIG: '/api/v1/vpn/server',
  VPN_CLIENT_CONFIG: '/api/v1/vpn/client',
  VPN_CERTIFICATE: '/api/v1/vpn/certificate',
  VPN_KEY: '/api/v1/vpn/key',

  // Configuration
  CONFIG_GET: '/api/v1/config',
  CONFIG_SET: '/api/v1/config',
  CONFIG_APPLY: '/api/v1/config/apply',
  CONFIG_ROLLBACK: '/api/v1/config/rollback',
  CONFIG_BACKUP: '/api/v1/config/backup',
  CONFIG_RESTORE: '/api/v1/config/restore',
  CONFIG_HISTORY: '/api/v1/config/history',
  CONFIG_EXPORT: '/api/v1/config/export',
  CONFIG_IMPORT: '/api/v1/config/import',

  // Monitoring & Logs
  LOGS_LIST: '/api/v1/logs',
  LOGS_SYSTEM: '/api/v1/logs/system',
  LOGS_FIREWALL: '/api/v1/logs/firewall',
  LOGS_VPN: '/api/v1/logs/vpn',
  LOGS_SEARCH: '/api/v1/logs/search',
  METRICS: '/api/v1/metrics',
  METRICS_CPU: '/api/v1/metrics/cpu',
  METRICS_MEMORY: '/api/v1/metrics/memory',
  METRICS_DISK: '/api/v1/metrics/disk',
  METRICS_NETWORK: '/api/v1/metrics/network',
  METRICS_BANDWIDTH: '/api/v1/metrics/bandwidth',

  // System Management
  SYSTEM_INFO: '/api/v1/system/info',
  SYSTEM_STATS: '/api/v1/system/stats',
  SYSTEM_TIME: '/api/v1/system/time',
  SYSTEM_NTP: '/api/v1/system/ntp',
  SYSTEM_DNS: '/api/v1/system/dns',
  SYSTEM_HOSTNAME: '/api/v1/system/hostname',

  // User & Authentication
  AUTH_LOGIN: '/api/v1/auth/login',
  AUTH_LOGOUT: '/api/v1/auth/logout',
  AUTH_REFRESH: '/api/v1/auth/refresh',
  AUTH_VERIFY: '/api/v1/auth/verify',
  USER_PROFILE: '/api/v1/user/profile',
  USER_CHANGE_PASSWORD: '/api/v1/user/change-password',
  USER_PREFERENCES: '/api/v1/user/preferences',

  // Health & Status
  HEALTH: '/api/v1/health',
  HEALTH_PING: '/api/v1/health/ping',
  HEALTH_READY: '/api/v1/health/ready',
  HEALTH_LIVE: '/api/v1/health/live',
} as const;
