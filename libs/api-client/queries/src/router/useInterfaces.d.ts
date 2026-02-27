/**
 * Network Interface Query Hooks
 * Fetches network interface data from RouterOS REST API
 * Uses rosproxy backend for RouterOS API communication
 */
import { UseQueryResult } from '@tanstack/react-query';
import type { NetworkInterface, TrafficStatistics, ARPEntry, IPAddress } from '@nasnet/core/types';
/**
 * Query keys for network interface queries
 * Follows TanStack Query best practices for hierarchical keys
 */
export declare const interfaceKeys: {
  all: readonly ['interfaces'];
  lists: (routerIp: string) => readonly ['interfaces', 'list', string];
  list: (routerIp: string) => readonly ['interfaces', 'list', string];
  traffic: (
    routerIp: string,
    interfaceId: string
  ) => readonly ['interfaces', 'traffic', string, string];
  arp: (routerIp: string) => readonly ['arp', string];
  ipAddresses: (routerIp: string) => readonly ['ip', 'addresses', string];
};
/**
 * Hook to fetch all network interfaces
 * Auto-refreshes every 5 seconds for real-time status updates
 *
 * Configuration:
 * - refetchInterval: 5000ms (5 seconds) - per FR0-13 requirement
 * - refetchIntervalInBackground: false - pause when tab inactive
 * - staleTime: 5000ms - matches refetch interval
 *
 * @param routerIp - Target router IP address
 * @returns Query result with NetworkInterface array
 */
export declare function useInterfaces(routerIp: string): UseQueryResult<NetworkInterface[], Error>;
/**
 * Hook to fetch traffic statistics for a specific interface
 * Lazy-loaded when interface details are expanded
 *
 * @param routerIp - Target router IP address
 * @param interfaceId - RouterOS interface ID
 * @returns Query result with TrafficStatistics
 */
export declare function useInterfaceTraffic(
  routerIp: string,
  interfaceId: string
): UseQueryResult<TrafficStatistics, Error>;
/**
 * Hook to fetch ARP table entries
 * Auto-refreshes every 10 seconds
 *
 * @param routerIp - Target router IP address
 * @returns Query result with ARPEntry array
 */
export declare function useARPTable(routerIp: string): UseQueryResult<ARPEntry[], Error>;
/**
 * Hook to fetch IP addresses
 * Auto-refreshes every 10 seconds
 *
 * @param routerIp - Target router IP address
 * @returns Query result with IPAddress array
 */
export declare function useIPAddresses(routerIp: string): UseQueryResult<IPAddress[], Error>;
//# sourceMappingURL=useInterfaces.d.ts.map
