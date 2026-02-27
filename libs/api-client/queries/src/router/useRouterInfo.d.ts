/**
 * Router Information Query Hook
 * Fetches system resource and identity data from RouterOS REST API
 * Uses rosproxy backend for RouterOS API communication
 */
import { UseQueryResult } from '@tanstack/react-query';
import type { SystemResource, SystemInfo } from '@nasnet/core/types';
/**
 * Query keys for router information queries
 * Follows TanStack Query best practices for hierarchical keys
 */
export declare const routerKeys: {
  all: readonly ['router'];
  resource: (routerIp: string) => readonly ['router', 'resource', string];
  info: (routerIp: string) => readonly ['router', 'info', string];
  routerboard: (routerIp: string) => readonly ['router', 'routerboard', string];
};
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
export declare function useRouterInfo(routerIp: string): UseQueryResult<SystemInfo, Error>;
/**
 * Hook to fetch system resource data only
 * For components that need real-time resource monitoring
 *
 * @param routerIp - Target router IP address
 * @returns Query result with SystemResource data
 */
export declare function useRouterResource(routerIp: string): UseQueryResult<SystemResource, Error>;
//# sourceMappingURL=useRouterInfo.d.ts.map
