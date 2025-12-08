/**
 * Router Information Query Hook
 * Fetches system resource and identity data from RouterOS REST API
 * Uses rosproxy backend for RouterOS API communication
 */

import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { makeRouterOSRequest } from '@nasnet/api-client/core';
import type { SystemResource, SystemInfo } from '@nasnet/core/types';

/**
 * Query keys for router information queries
 * Follows TanStack Query best practices for hierarchical keys
 */
export const routerKeys = {
  all: ['router'] as const,
  resource: (routerIp: string) => [...routerKeys.all, 'resource', routerIp] as const,
  info: (routerIp: string) => [...routerKeys.all, 'info', routerIp] as const,
  routerboard: (routerIp: string) => [...routerKeys.all, 'routerboard', routerIp] as const,
};

/**
 * Fetch system resource data from RouterOS via rosproxy
 * Endpoint: GET /rest/system/resource
 *
 * @param routerIp - Target router IP address
 * @returns System resource data including CPU, memory, disk, uptime
 */
async function fetchSystemResource(routerIp: string): Promise<SystemResource> {
  const result = await makeRouterOSRequest<SystemResource>(routerIp, 'system/resource');

  if (!result.success || !result.data) {
    throw new Error(result.error || 'Failed to fetch system resource');
  }

  return result.data;
}

/**
 * Fetch system identity from RouterOS via rosproxy
 * Endpoint: GET /rest/system/identity
 *
 * @param routerIp - Target router IP address
 * @returns Router identity/name
 */
async function fetchSystemIdentity(routerIp: string): Promise<{ name: string }> {
  const result = await makeRouterOSRequest<{ name: string }>(routerIp, 'system/identity');

  if (!result.success || !result.data) {
    throw new Error(result.error || 'Failed to fetch system identity');
  }

  return result.data;
}

/**
 * Hook to fetch combined system information
 * Combines system resource and identity data into a single SystemInfo object
 *
 * Configuration:
 * - staleTime: 60000ms (1 minute) - system info changes rarely
 * - No polling - static information
 *
 * @param routerIp - Target router IP address
 * @returns Query result with SystemInfo data
 */
export function useRouterInfo(routerIp: string): UseQueryResult<SystemInfo, Error> {
  return useQuery({
    queryKey: routerKeys.info(routerIp),
    queryFn: async () => {
      // Fetch both endpoints in parallel
      const [resource, identity] = await Promise.all([
        fetchSystemResource(routerIp),
        fetchSystemIdentity(routerIp),
      ]);

      // Transform into SystemInfo format
      const systemInfo: SystemInfo = {
        identity: identity.name,
        model: resource.boardName,
        routerOsVersion: resource.version,
        cpuArchitecture: resource.architecture,
        uptime: resource.uptime,
      };

      return systemInfo;
    },
    staleTime: 60000, // 1 minute - system info changes rarely
    enabled: !!routerIp, // Only fetch if router IP is provided
  });
}

/**
 * Hook to fetch system resource data only
 * For components that need real-time resource monitoring
 *
 * @param routerIp - Target router IP address
 * @returns Query result with SystemResource data
 */
export function useRouterResource(routerIp: string): UseQueryResult<SystemResource, Error> {
  return useQuery({
    queryKey: routerKeys.resource(routerIp),
    queryFn: () => fetchSystemResource(routerIp),
    refetchInterval: 5000, // 5 second polling for real-time updates
    refetchIntervalInBackground: false, // Pause when tab not visible
    refetchOnWindowFocus: true, // Immediately refetch when tab becomes visible
    staleTime: 5000,
    enabled: !!routerIp, // Only fetch if router IP is provided
  });
}
