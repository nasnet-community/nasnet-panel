/**
 * DHCP Query Hooks
 * Fetches DHCP server, lease, client, and pool data from RouterOS REST API
 * Uses rosproxy backend for RouterOS API communication
 *
 * Epic 0.5: DHCP Management
 */
import { UseQueryResult } from '@tanstack/react-query';
import type { DHCPServer, DHCPPool, DHCPLease, DHCPClient } from '@nasnet/core/types';
/**
 * Query keys for DHCP queries
 * Follows TanStack Query best practices for hierarchical keys
 */
export declare const dhcpKeys: {
    all: readonly ["dhcp"];
    servers: (routerIp: string) => readonly ["dhcp", "servers", string];
    server: (routerIp: string, serverId: string) => readonly ["dhcp", "servers", string, string];
    leases: (routerIp: string) => readonly ["dhcp", "leases", string];
    clients: (routerIp: string) => readonly ["dhcp", "clients", string];
    pools: (routerIp: string) => readonly ["dhcp", "pools", string];
};
/**
 * Hook to fetch DHCP server configurations
 *
 * Configuration:
 * - staleTime: 60000ms (1 minute) - server config changes rarely
 * - No polling - configuration is relatively stable
 *
 * @param routerIp - Target router IP address
 * @returns Query result with DHCPServer[] data
 */
export declare function useDHCPServers(routerIp: string): UseQueryResult<DHCPServer[], Error>;
/**
 * Hook to fetch a single DHCP server by ID
 *
 * Fetches all servers and filters client-side to find the requested server.
 * Uses the same query key as useDHCPServers for cache sharing.
 *
 * @param routerIp - Target router IP address
 * @param serverId - DHCP server ID to fetch
 * @returns Query result with single DHCPServer or undefined
 */
export declare function useDHCPServer(routerIp: string, serverId: string): UseQueryResult<DHCPServer | undefined, Error>;
/**
 * Hook to fetch DHCP address pools
 *
 * Configuration:
 * - staleTime: 60000ms (1 minute) - pool config changes rarely
 *
 * @param routerIp - Target router IP address
 * @returns Query result with DHCPPool[] data
 */
export declare function useDHCPPools(routerIp: string): UseQueryResult<DHCPPool[], Error>;
/**
 * Hook to fetch DHCP leases
 *
 * Configuration:
 * - refetchInterval: 30000ms (30 seconds) - leases change frequently
 * - staleTime: 10000ms (10 seconds) - short stale time for freshness
 * - refetchIntervalInBackground: false - pause when tab not visible
 *
 * @param routerIp - Target router IP address
 * @returns Query result with DHCPLease[] data
 */
export declare function useDHCPLeases(routerIp: string): UseQueryResult<DHCPLease[], Error>;
/**
 * Hook to fetch DHCP client status on WAN interfaces
 *
 * Configuration:
 * - staleTime: 30000ms (30 seconds) - WAN status relatively stable
 * - No active polling - WAN lease changes are less frequent
 *
 * @param routerIp - Target router IP address
 * @returns Query result with DHCPClient[] data
 */
export declare function useDHCPClients(routerIp: string): UseQueryResult<DHCPClient[], Error>;
//# sourceMappingURL=useDHCP.d.ts.map