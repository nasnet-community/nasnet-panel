/**
 * DHCP Query Hooks
 * Fetches DHCP server, lease, client, and pool data from RouterOS REST API
 * Uses rosproxy backend for RouterOS API communication
 *
 * Epic 0.5: DHCP Management
 */

import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { makeRouterOSRequest } from '@nasnet/api-client/core';
import type {
  DHCPServer,
  DHCPPool,
  DHCPLease,
  DHCPClient,
} from '@nasnet/core/types';

/**
 * Query keys for DHCP queries
 * Follows TanStack Query best practices for hierarchical keys
 */
export const dhcpKeys = {
  all: ['dhcp'] as const,
  servers: (routerIp: string) => [...dhcpKeys.all, 'servers', routerIp] as const,
  leases: (routerIp: string) => [...dhcpKeys.all, 'leases', routerIp] as const,
  clients: (routerIp: string) => [...dhcpKeys.all, 'clients', routerIp] as const,
  pools: (routerIp: string) => [...dhcpKeys.all, 'pools', routerIp] as const,
};

/**
 * Fetch DHCP server configurations via rosproxy
 * Endpoint: GET /rest/ip/dhcp-server
 *
 * @param routerIp - Target router IP address
 * @returns Array of DHCP server configurations
 */
async function fetchDHCPServers(routerIp: string): Promise<DHCPServer[]> {
  const result = await makeRouterOSRequest<DHCPServer[]>(routerIp, 'ip/dhcp-server');

  if (!result.success || !result.data) {
    throw new Error(result.error || 'Failed to fetch DHCP servers');
  }

  const data = result.data;
  return Array.isArray(data) ? data : [];
}

/**
 * Fetch DHCP address pools via rosproxy
 * Endpoint: GET /rest/ip/pool
 *
 * @param routerIp - Target router IP address
 * @returns Array of address pools
 */
async function fetchDHCPPools(routerIp: string): Promise<DHCPPool[]> {
  const result = await makeRouterOSRequest<DHCPPool[]>(routerIp, 'ip/pool');

  if (!result.success || !result.data) {
    throw new Error(result.error || 'Failed to fetch DHCP pools');
  }

  const data = result.data;
  return Array.isArray(data) ? data : [];
}

/**
 * Fetch DHCP leases via rosproxy
 * Endpoint: GET /rest/ip/dhcp-server/lease
 *
 * @param routerIp - Target router IP address
 * @returns Array of DHCP leases (active and static)
 */
async function fetchDHCPLeases(routerIp: string): Promise<DHCPLease[]> {
  const result = await makeRouterOSRequest<DHCPLease[]>(routerIp, 'ip/dhcp-server/lease');

  if (!result.success || !result.data) {
    throw new Error(result.error || 'Failed to fetch DHCP leases');
  }

  const data = result.data;
  return Array.isArray(data) ? data : [];
}

/**
 * Fetch DHCP client status via rosproxy
 * Endpoint: GET /rest/ip/dhcp-client
 *
 * @param routerIp - Target router IP address
 * @returns Array of DHCP clients on WAN interfaces
 */
async function fetchDHCPClients(routerIp: string): Promise<DHCPClient[]> {
  const result = await makeRouterOSRequest<DHCPClient[]>(routerIp, 'ip/dhcp-client');

  if (!result.success || !result.data) {
    throw new Error(result.error || 'Failed to fetch DHCP clients');
  }

  const data = result.data;
  return Array.isArray(data) ? data : [];
}

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
export function useDHCPServers(routerIp: string): UseQueryResult<DHCPServer[], Error> {
  return useQuery({
    queryKey: dhcpKeys.servers(routerIp),
    queryFn: () => fetchDHCPServers(routerIp),
    staleTime: 60000, // 1 minute
    enabled: !!routerIp, // Only fetch if router IP is provided
  });
}

/**
 * Hook to fetch DHCP address pools
 *
 * Configuration:
 * - staleTime: 60000ms (1 minute) - pool config changes rarely
 *
 * @param routerIp - Target router IP address
 * @returns Query result with DHCPPool[] data
 */
export function useDHCPPools(routerIp: string): UseQueryResult<DHCPPool[], Error> {
  return useQuery({
    queryKey: dhcpKeys.pools(routerIp),
    queryFn: () => fetchDHCPPools(routerIp),
    staleTime: 60000, // 1 minute
    enabled: !!routerIp, // Only fetch if router IP is provided
  });
}

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
export function useDHCPLeases(routerIp: string): UseQueryResult<DHCPLease[], Error> {
  return useQuery({
    queryKey: dhcpKeys.leases(routerIp),
    queryFn: () => fetchDHCPLeases(routerIp),
    refetchInterval: 30000, // 30 seconds - lease table updates frequently
    refetchIntervalInBackground: false, // Pause when tab not visible
    staleTime: 10000, // 10 seconds
    enabled: !!routerIp, // Only fetch if router IP is provided
  });
}

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
export function useDHCPClients(routerIp: string): UseQueryResult<DHCPClient[], Error> {
  return useQuery({
    queryKey: dhcpKeys.clients(routerIp),
    queryFn: () => fetchDHCPClients(routerIp),
    staleTime: 30000, // 30 seconds
    enabled: !!routerIp, // Only fetch if router IP is provided
  });
}
