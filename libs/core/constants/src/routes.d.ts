/**
 * Application Routes
 *
 * Defines all available routes in the NasNetConnect application.
 * Used for navigation, route matching, and link generation across the frontend.
 *
 * Routes are organized by feature:
 * - Main navigation (HOME, DASHBOARD)
 * - Router management (ROUTER_LIST, ROUTER_DETAIL, ROUTER_PANEL, etc.)
 * - Network configuration (WAN, LAN, FIREWALL, ROUTING, NAT, QOS)
 * - Wireless management (WIFI, WIFI_DETAIL)
 * - VPN management (VPN, VPN_SERVERS, VPN_CLIENTS, etc.)
 * - DHCP management (DHCP, DHCP_SERVER, DHCP_CLIENTS)
 * - Monitoring (STATUS, MONITOR, NETWORK, LOGS, METRICS)
 * - System settings (SETTINGS, SYSTEM_SETTINGS, BACKUP, RESTORE)
 * - User management (PROFILE, ACCOUNT, LOGOUT)
 * - Error pages (NOT_FOUND, UNAUTHORIZED, FORBIDDEN, SERVER_ERROR)
 *
 * @example
 * import { ROUTES } from '@nasnet/core/constants';
 * navigate(ROUTES.ROUTER_LIST);
 * const url = ROUTES.ROUTER_DETAIL('router-1');
 */
export declare const ROUTES: {
    readonly HOME: "/";
    readonly DASHBOARD: "/dashboard";
    readonly ROUTER_LIST: "/routers";
    readonly ROUTER_DETAIL: "/routers/:id";
    readonly ROUTER_SETTINGS: "/routers/:id/settings";
    readonly ROUTER_PANEL: "/router/:id";
    readonly ROUTER_OVERVIEW: "/router/:id";
    readonly ROUTER_WIFI: "/router/:id/wifi";
    readonly ROUTER_VPN: "/router/:id/vpn";
    readonly ROUTER_FIREWALL: "/router/:id/firewall";
    readonly ROUTER_DHCP: "/router/:id/dhcp";
    readonly ROUTER_NETWORK: "/router/:id/network";
    readonly ROUTER_LOGS: "/router/:id/logs";
    readonly WAN: "/network/wan";
    readonly LAN: "/network/lan";
    readonly FIREWALL: "/network/firewall";
    readonly ROUTING: "/network/routing";
    readonly NAT: "/network/nat";
    readonly QOS: "/network/qos";
    readonly WIFI: "/wifi";
    readonly WIFI_DETAIL: "/wifi/:interfaceName";
    readonly VPN: "/vpn";
    readonly VPN_SERVERS: "/vpn/servers";
    readonly VPN_CLIENTS: "/vpn/clients";
    readonly VPN_SERVER_DETAIL: "/vpn/servers/:protocol/:id";
    readonly VPN_CLIENT_DETAIL: "/vpn/clients/:protocol/:id";
    readonly VPN_SERVER_ADD: "/vpn/servers/:protocol/add";
    readonly VPN_CLIENT_ADD: "/vpn/clients/:protocol/add";
    readonly VPN_SERVER_EDIT: "/vpn/servers/:protocol/:id/edit";
    readonly VPN_CLIENT_EDIT: "/vpn/clients/:protocol/:id/edit";
    readonly DHCP: "/network/dhcp";
    readonly DHCP_SERVER: "/network/dhcp/server";
    readonly DHCP_CLIENTS: "/network/dhcp/clients";
    readonly STATUS: "/status";
    readonly MONITOR: "/monitor";
    readonly NETWORK: "/network";
    readonly LOGS: "/logs";
    readonly METRICS: "/metrics";
    readonly SETTINGS: "/settings";
    readonly SYSTEM_SETTINGS: "/settings/system";
    readonly NETWORK_SETTINGS: "/settings/network";
    readonly SECURITY_SETTINGS: "/settings/security";
    readonly BACKUP: "/settings/backup";
    readonly RESTORE: "/settings/restore";
    readonly PROFILE: "/profile";
    readonly ACCOUNT: "/account";
    readonly LOGOUT: "/logout";
    readonly NOT_FOUND: "/404";
    readonly UNAUTHORIZED: "/401";
    readonly FORBIDDEN: "/403";
    readonly SERVER_ERROR: "/500";
};
/**
 * Type representing any valid application route.
 *
 * Extracted from ROUTES constant to provide type-safe route values.
 * Use for function parameters that accept route strings.
 *
 * @example
 * function navigateTo(route: Route) {
 *   router.push(route);
 * }
 */
export type Route = typeof ROUTES[keyof typeof ROUTES];
//# sourceMappingURL=routes.d.ts.map