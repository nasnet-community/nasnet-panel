/**
 * PPP Active Connections Query Hook
 * Fetches active PPP connections (L2TP, PPTP, SSTP, OpenVPN server clients) from RouterOS
 */

import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { makeRouterOSRequest } from '@nasnet/api-client/core';
import type { PPPActiveConnection } from '@nasnet/core/types';
import { vpnKeys } from './queryKeys';

/**
 * Raw response from RouterOS API
 */
interface PPPActiveRaw {
  '.id': string;
  name: string;
  service: string;
  'caller-id'?: string;
  address: string;
  uptime: string;
  encoding?: string;
  'session-id'?: string;
  'limit-bytes-in'?: string;
  'limit-bytes-out'?: string;
  'rx-byte'?: string;
  'tx-byte'?: string;
}

/**
 * Transform raw API response to typed interface
 */
function transformPPPActive(raw: PPPActiveRaw): PPPActiveConnection {
  return {
    id: raw['.id'],
    name: raw.name,
    service: raw.service as PPPActiveConnection['service'],
    callerId: raw['caller-id'],
    address: raw.address,
    uptime: raw.uptime,
    encoding: raw.encoding,
    sessionId: raw['session-id'],
    limitBytesIn: raw['limit-bytes-in'] ? parseInt(raw['limit-bytes-in'], 10) : undefined,
    limitBytesOut: raw['limit-bytes-out'] ? parseInt(raw['limit-bytes-out'], 10) : undefined,
    rx: parseInt(raw['rx-byte'] || '0', 10),
    tx: parseInt(raw['tx-byte'] || '0', 10),
  };
}

/**
 * Fetch PPP active connections from RouterOS
 */
async function fetchPPPActive(routerIp: string): Promise<PPPActiveConnection[]> {
  const result = await makeRouterOSRequest<PPPActiveRaw[]>(
    routerIp,
    'ppp/active'
  );

  if (!result.success || !result.data) {
    throw new Error(result.error || 'Failed to fetch PPP active connections');
  }

  const data = result.data;
  if (Array.isArray(data)) {
    return data.map(transformPPPActive);
  }
  return [];
}

/**
 * Hook to fetch PPP active connections
 */
export function usePPPActive(routerIp: string): UseQueryResult<PPPActiveConnection[], Error> {
  return useQuery({
    queryKey: vpnKeys.pppActive(routerIp),
    queryFn: () => fetchPPPActive(routerIp),
    staleTime: 5000,
    refetchInterval: 3000,
    refetchOnWindowFocus: true,
    refetchIntervalInBackground: false,
    enabled: !!routerIp,
  });
}

