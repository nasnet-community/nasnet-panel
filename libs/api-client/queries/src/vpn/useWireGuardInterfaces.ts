/**
 * WireGuard Interfaces Query Hook
 * Fetches WireGuard interface list from RouterOS REST API
 * Uses rosproxy backend for RouterOS API communication
 */

import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { makeRouterOSRequest } from '@nasnet/api-client/core';
import type { WireGuardInterface } from '@nasnet/core/types';
import { vpnKeys } from './queryKeys';

/**
 * Fetch WireGuard interfaces from RouterOS via rosproxy
 * Endpoint: GET /rest/interface/wireguard
 *
 * @param routerIp - Target router IP address
 * @returns Array of WireGuard interface configurations
 */
async function fetchWireGuardInterfaces(routerIp: string): Promise<WireGuardInterface[]> {
  const result = await makeRouterOSRequest<WireGuardInterface[]>(routerIp, 'interface/wireguard');

  if (!result.success || !result.data) {
    throw new Error(result.error || 'Failed to fetch WireGuard interfaces');
  }

  const data = result.data;
  // Ensure we always return an array
  if (Array.isArray(data)) {
    return data;
  }
  // Handle wrapped response or return empty array
  return [];
}

/**
 * Hook to fetch WireGuard interfaces
 *
 * Configuration:
 * - staleTime: 10000ms (10 seconds) - VPN config changes infrequently
 * - refetchInterval: 5000ms (5 seconds) - Real-time connection status updates
 * - refetchOnWindowFocus: true - Immediate update when tab becomes visible
 * - refetchIntervalInBackground: false - Pause refetch when tab is hidden
 * - Error handling: Provides error state for graceful degradation
 *
 * @param routerIp - Target router IP address
 * @returns Query result with WireGuardInterface array
 *
 * @example
 * ```tsx
 * const routerIp = useConnectionStore(state => state.currentRouterIp);
 * const { data, isLoading, error } = useWireGuardInterfaces(routerIp || '');
 * ```
 */
export function useWireGuardInterfaces(
  routerIp: string
): UseQueryResult<WireGuardInterface[], Error> {
  return useQuery({
    queryKey: vpnKeys.wireguardInterfaces(routerIp),
    queryFn: () => fetchWireGuardInterfaces(routerIp),
    staleTime: 10000, // 10 seconds
    refetchInterval: 5000, // Auto-refresh every 5 seconds for real-time connection status
    refetchOnWindowFocus: true, // Immediate update when tab becomes visible
    refetchIntervalInBackground: false, // Pause refetch when tab is not visible
    enabled: !!routerIp, // Only fetch if router IP is provided
  });
}
