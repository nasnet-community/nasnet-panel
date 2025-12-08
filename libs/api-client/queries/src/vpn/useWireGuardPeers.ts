/**
 * WireGuard Peers Query Hook
 * Fetches WireGuard peers from RouterOS REST API
 * Uses rosproxy backend for RouterOS API communication
 */

import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { makeRouterOSRequest } from '@nasnet/api-client/core';
import type { WireGuardPeer } from '@nasnet/core/types';
import { vpnKeys } from './queryKeys';

/**
 * Fetch WireGuard peers from RouterOS via rosproxy
 * Endpoint: GET /rest/interface/wireguard/peers
 *
 * @param routerIp - Target router IP address
 * @param interfaceName - Optional interface name filter
 * @returns Array of WireGuard peers
 */
async function fetchWireGuardPeers(
  routerIp: string,
  interfaceName?: string
): Promise<WireGuardPeer[]> {
  const endpoint = interfaceName
    ? `interface/wireguard/peers?interface=${encodeURIComponent(interfaceName)}`
    : 'interface/wireguard/peers';

  const result = await makeRouterOSRequest<WireGuardPeer[]>(routerIp, endpoint);

  if (!result.success || !result.data) {
    throw new Error(result.error || 'Failed to fetch WireGuard peers');
  }

  return result.data;
}

/**
 * Hook to fetch WireGuard peers
 *
 * @param routerIp - Target router IP address
 * @param interfaceName - Optional interface name to filter peers
 * @returns Query result with WireGuardPeer array
 *
 * @example
 * ```tsx
 * const routerIp = useConnectionStore(state => state.currentRouterIp);
 * const { data, isLoading, error } = useWireGuardPeers(routerIp || '', 'wg0');
 * ```
 */
export function useWireGuardPeers(
  routerIp: string,
  interfaceName?: string
): UseQueryResult<WireGuardPeer[], Error> {
  return useQuery({
    queryKey: vpnKeys.wireguardPeers(routerIp, interfaceName),
    queryFn: () => fetchWireGuardPeers(routerIp, interfaceName),
    staleTime: 10000, // 10 seconds
    enabled: !!routerIp && !!interfaceName, // Only fetch when both are provided
  });
}
