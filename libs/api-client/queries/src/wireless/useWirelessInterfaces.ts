/**
 * TanStack Query hook for fetching wireless interfaces
 * Provides caching, auto-refresh, and optimistic updates for wireless data
 * Uses rosproxy backend for RouterOS API communication
 */

import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { makeRouterOSRequest } from '@nasnet/api-client/core';
import type { WirelessInterface } from '@nasnet/core/types';

/**
 * Query key factory for wireless-related queries
 * Follows hierarchical pattern: ['domain', 'resource', ...params]
 */
export const wirelessKeys = {
  all: ['wireless'] as const,
  interfaces: (routerIp: string) => [...wirelessKeys.all, 'interfaces', routerIp] as const,
  interface: (routerIp: string, id: string) => [...wirelessKeys.interfaces(routerIp), id] as const,
} as const;

/**
 * Fetches all wireless interfaces from RouterOS via rosproxy
 * Maps RouterOS API response to WirelessInterface type
 */
async function fetchWirelessInterfaces(routerIp: string): Promise<WirelessInterface[]> {
  const result = await makeRouterOSRequest<WirelessInterface[]>(routerIp, 'interface/wifi');

  if (!result.success || !result.data) {
    throw new Error(result.error || 'Failed to fetch wireless interfaces');
  }

  // Transform RouterOS response to our interface type
  // RouterOS returns kebab-case properties and string booleans/numbers
  return result.data.map((iface: any) => ({
    id: iface['.id'] || iface.id || '',
    name: iface.name || 'unknown',
    macAddress: iface['mac-address'] || iface.macAddress || '',
    ssid: iface.ssid || null,
    disabled: iface.disabled === 'true' || iface.disabled === true,
    running: iface.running === 'true' || iface.running === true,
    band: determineBand(
      typeof iface.frequency === 'string' ? parseInt(iface.frequency) : iface.frequency || 0
    ),
    frequency:
      typeof iface.frequency === 'string' ? parseInt(iface.frequency) : iface.frequency || 0,
    channel: iface.channel || '',
    mode: iface.mode || 'ap-bridge',
    txPower:
      typeof iface['tx-power'] === 'string' ? parseInt(iface['tx-power']) : iface.txPower || 0,
    securityProfile: iface['security-profile'] || iface.securityProfile || 'default',
    connectedClients:
      typeof iface['registered-clients'] === 'string' ?
        parseInt(iface['registered-clients'])
      : iface.connectedClients || 0,
    countryCode: iface.country || iface.countryCode,
  }));
}

/**
 * Helper to determine frequency band from MHz value
 */
function determineBand(frequencyMHz: number): '2.4GHz' | '5GHz' | '6GHz' | 'Unknown' {
  if (frequencyMHz >= 2400 && frequencyMHz < 2500) return '2.4GHz';
  if (frequencyMHz >= 5000 && frequencyMHz < 6000) return '5GHz';
  if (frequencyMHz >= 6000 && frequencyMHz < 7000) return '6GHz';
  return 'Unknown';
}

/**
 * React Query hook for wireless interfaces
 *
 * @param routerIp - Target router IP address
 * @returns Query result with wireless interfaces data, loading state, and error
 *
 * @example
 * ```tsx
 * function WirelessList() {
 *   const routerIp = useConnectionStore(state => state.currentRouterIp);
 *   const { data: interfaces, isLoading, error } = useWirelessInterfaces(routerIp || '');
 *
 *   if (isLoading) return <Skeleton />;
 *   if (error) return <Error message={error.message} />;
 *
 *   return interfaces.map(iface => <WirelessCard key={iface.id} interface={iface} />);
 * }
 * ```
 */
export function useWirelessInterfaces(
  routerIp: string
): UseQueryResult<WirelessInterface[], Error> {
  return useQuery({
    queryKey: wirelessKeys.interfaces(routerIp),
    queryFn: () => fetchWirelessInterfaces(routerIp),
    staleTime: 30_000, // 30 seconds - wireless config doesn't change often
    refetchOnWindowFocus: true,
    retry: 2,
    enabled: !!routerIp, // Only fetch if router IP is provided
  });
}
