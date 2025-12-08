/**
 * Routing Table Query Hook
 * Fetches routing table entries from RouterOS REST API
 * Uses rosproxy backend for RouterOS API communication
 */

import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { makeRouterOSRequest } from '@nasnet/api-client/core';
import type { RouteEntry } from '@nasnet/core/types';

/**
 * Query keys for routing queries
 */
export const routingKeys = {
  all: ['routing'] as const,
  routes: (routerIp: string) => [...routingKeys.all, 'routes', routerIp] as const,
};

/**
 * Raw API response structure from MikroTik RouterOS routing endpoint
 */
interface RawRoute {
  '.id': string;
  'dst-address': string;
  gateway?: string;
  interface?: string;
  distance: string | number;
  disabled?: string;
  dynamic?: string;
  active?: string;
  comment?: string;
}

/**
 * Transform raw routing API response to RouteEntry type
 */
function transformRoute(raw: RawRoute): RouteEntry {
  return {
    id: raw['.id'],
    destination: raw['dst-address'],
    gateway: raw.gateway,
    interface: raw.interface,
    distance: typeof raw.distance === 'string' ? parseInt(raw.distance, 10) : raw.distance,
    disabled: raw.disabled === 'true',
    dynamic: raw.dynamic === 'true',
    active: raw.active === 'true',
    routeType: 'unicast', // Default to unicast, can be enhanced
  };
}

/**
 * Fetch routing table from RouterOS via rosproxy
 * Endpoint: GET /rest/ip/route
 *
 * @param routerIp - Target router IP address
 * @returns Array of routing table entries
 */
async function fetchRoutes(routerIp: string): Promise<RouteEntry[]> {
  const result = await makeRouterOSRequest<RawRoute[]>(routerIp, 'ip/route');

  if (!result.success || !result.data) {
    throw new Error(result.error || 'Failed to fetch routes');
  }

  const data = result.data;
  if (!Array.isArray(data)) return [];
  return data.map(transformRoute);
}

/**
 * Hook to fetch routing table
 *
 * Configuration:
 * - staleTime: 300000ms (5 minutes) - routes change infrequently
 * - Read-only data - no modifications in Phase 0
 *
 * @param routerIp - Target router IP address
 * @returns Query result with RouteEntry[] data
 */
export function useRoutes(routerIp: string): UseQueryResult<RouteEntry[], Error> {
  return useQuery({
    queryKey: routingKeys.routes(routerIp),
    queryFn: () => fetchRoutes(routerIp),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!routerIp, // Only fetch if router IP is provided
  });
}
