/**
 * IPsec Active Connections Query Hook
 * Fetches active IPsec connections from RouterOS REST API
 */

import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { makeRouterOSRequest } from '@nasnet/api-client/core';
import type { IPsecActiveConnection } from '@nasnet/core/types';
import { vpnKeys } from './queryKeys';

/**
 * Raw response from RouterOS API
 */
interface IPsecActiveRaw {
  '.id': string;
  peer: string;
  state: string;
  side: string;
  'ph2-count'?: string;
  'local-address': string;
  'remote-address': string;
  'rx-bytes'?: string;
  'tx-bytes'?: string;
  uptime?: string;
}

/**
 * Transform raw API response to typed interface
 */
function transformIPsecActive(raw: IPsecActiveRaw): IPsecActiveConnection {
  return {
    id: raw['.id'],
    peer: raw.peer,
    state: raw.state as IPsecActiveConnection['state'],
    side: raw.side as IPsecActiveConnection['side'],
    phase2Count: parseInt(raw['ph2-count'] || '0', 10),
    localAddress: raw['local-address'],
    remoteAddress: raw['remote-address'],
    rx: raw['rx-bytes'] ? parseInt(raw['rx-bytes'], 10) : undefined,
    tx: raw['tx-bytes'] ? parseInt(raw['tx-bytes'], 10) : undefined,
    uptime: raw.uptime,
  };
}

/**
 * Fetch IPsec active connections from RouterOS
 */
async function fetchIPsecActive(routerIp: string): Promise<IPsecActiveConnection[]> {
  const result = await makeRouterOSRequest<IPsecActiveRaw[]>(routerIp, 'ip/ipsec/active-peers');

  if (!result.success || !result.data) {
    throw new Error(result.error || 'Failed to fetch IPsec active connections');
  }

  const data = result.data;
  if (Array.isArray(data)) {
    return data.map(transformIPsecActive);
  }
  return [];
}

/**
 * Hook to fetch IPsec active connections
 */
export function useIPsecActive(routerIp: string): UseQueryResult<IPsecActiveConnection[], Error> {
  return useQuery({
    queryKey: vpnKeys.ipsecActive(routerIp),
    queryFn: () => fetchIPsecActive(routerIp),
    staleTime: 5000,
    refetchInterval: 3000,
    refetchOnWindowFocus: true,
    refetchIntervalInBackground: false,
    enabled: !!routerIp,
  });
}
