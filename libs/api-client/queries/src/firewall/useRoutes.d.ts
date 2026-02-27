/**
 * Routing Table Query Hook
 * Fetches routing table entries from RouterOS REST API
 * Uses rosproxy backend for RouterOS API communication
 */
import { UseQueryResult } from '@tanstack/react-query';
import type { RouteEntry } from '@nasnet/core/types';
/**
 * Query keys for routing queries
 */
export declare const routingKeys: {
  all: readonly ['routing'];
  routes: (routerIp: string) => readonly ['routing', 'routes', string];
};
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
export declare function useRoutes(routerIp: string): UseQueryResult<RouteEntry[], Error>;
//# sourceMappingURL=useRoutes.d.ts.map
