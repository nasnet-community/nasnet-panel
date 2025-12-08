/**
 * Application Routes
 * Defines all available routes in the NasNetConnect application
 */

export const ROUTES = {
  // Main navigation
  HOME: '/',
  DASHBOARD: '/dashboard',

  // Router management
  ROUTER_LIST: '/routers',
  ROUTER_DETAIL: '/routers/:id',
  ROUTER_SETTINGS: '/routers/:id/settings',

  // Router panel tabs (Epic 0.9)
  ROUTER_PANEL: '/router/:id',
  ROUTER_OVERVIEW: '/router/:id',
  ROUTER_WIFI: '/router/:id/wifi',
  ROUTER_VPN: '/router/:id/vpn',
  ROUTER_FIREWALL: '/router/:id/firewall',
  ROUTER_DHCP: '/router/:id/dhcp',
  ROUTER_NETWORK: '/router/:id/network',
  ROUTER_LOGS: '/router/:id/logs',

  // Network configuration
  WAN: '/network/wan',
  LAN: '/network/lan',
  FIREWALL: '/network/firewall',
  ROUTING: '/network/routing',
  NAT: '/network/nat',
  QOS: '/network/qos',

  // Wireless management
  WIFI: '/wifi',
  WIFI_DETAIL: '/wifi/:interfaceName',

  // VPN management (Dashboard redesign)
  VPN: '/vpn', // Main VPN Dashboard
  VPN_SERVERS: '/vpn/servers', // Server management
  VPN_CLIENTS: '/vpn/clients', // Client management
  VPN_SERVER_DETAIL: '/vpn/servers/:protocol/:id', // Server details
  VPN_CLIENT_DETAIL: '/vpn/clients/:protocol/:id', // Client details
  VPN_SERVER_ADD: '/vpn/servers/:protocol/add', // Add server
  VPN_CLIENT_ADD: '/vpn/clients/:protocol/add', // Add client
  VPN_SERVER_EDIT: '/vpn/servers/:protocol/:id/edit', // Edit server
  VPN_CLIENT_EDIT: '/vpn/clients/:protocol/:id/edit', // Edit client

  // DHCP management
  DHCP: '/network/dhcp',
  DHCP_SERVER: '/network/dhcp/server',
  DHCP_CLIENTS: '/network/dhcp/clients',

  // Monitoring
  STATUS: '/status',
  MONITOR: '/monitor',
  NETWORK: '/network',
  LOGS: '/logs',
  METRICS: '/metrics',

  // System
  SETTINGS: '/settings',
  SYSTEM_SETTINGS: '/settings/system',
  NETWORK_SETTINGS: '/settings/network',
  SECURITY_SETTINGS: '/settings/security',
  BACKUP: '/settings/backup',
  RESTORE: '/settings/restore',

  // User
  PROFILE: '/profile',
  ACCOUNT: '/account',
  LOGOUT: '/logout',

  // Error pages
  NOT_FOUND: '/404',
  UNAUTHORIZED: '/401',
  FORBIDDEN: '/403',
  SERVER_ERROR: '/500'
} as const;

export type Route = typeof ROUTES[keyof typeof ROUTES];
