/**
 * PPTP Clients Query Hook
 * Fetches PPTP client interfaces from RouterOS REST API
 */

import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { makeRouterOSRequest } from '@nasnet/api-client/core';
import type { PPTPClient } from '@nasnet/core/types';
import { vpnKeys } from './queryKeys';

/**
 * Raw response from RouterOS API
 */
interface PPTPClientRaw {
  '.id': string;
  name: string;
  disabled: string;
  running: string;
  'connect-to': string;
  user?: string;
  password?: string;
  profile?: string;
  'max-mtu'?: string;
  'max-mru'?: string;
  mrru?: string;
  'add-default-route'?: string;
  'dial-on-demand'?: string;
  'rx-byte'?: string;
  'tx-byte'?: string;
  uptime?: string;
  'local-address'?: string;
  'remote-address'?: string;
  comment?: string;
}

/**
 * Transform raw API response to typed interface
 */
function transformPPTPClient(raw: PPTPClientRaw): PPTPClient {
  return {
    id: raw['.id'],
    name: raw.name,
    type: 'pptp-client',
    isDisabled: raw.disabled === 'true',
    isRunning: raw.running === 'true',
    connectTo: raw['connect-to'],
    user: raw.user,
    password: raw.password,
    profile: raw.profile,
    maxMtu: parseInt(raw['max-mtu'] || '1450', 10),
    maxMru: parseInt(raw['max-mru'] || '1450', 10),
    mrru: raw.mrru ? parseInt(raw.mrru, 10) : undefined,
    shouldAddDefaultRoute: raw['add-default-route'] === 'yes',
    shouldDialOnDemand: raw['dial-on-demand'] === 'yes',
    rx: raw['rx-byte'] ? parseInt(raw['rx-byte'], 10) : undefined,
    tx: raw['tx-byte'] ? parseInt(raw['tx-byte'], 10) : undefined,
    uptime: raw.uptime,
    localAddress: raw['local-address'],
    remoteAddress: raw['remote-address'],
    comment: raw.comment,
  };
}

/**
 * Fetch PPTP clients from RouterOS
 */
async function fetchPPTPClients(routerIp: string): Promise<PPTPClient[]> {
  const result = await makeRouterOSRequest<PPTPClientRaw[]>(
    routerIp,
    'interface/pptp-client'
  );

  if (!result.success || !result.data) {
    throw new Error(result.error || 'Failed to fetch PPTP clients');
  }

  const data = result.data;
  if (Array.isArray(data)) {
    return data.map(transformPPTPClient);
  }
  return [];
}

/**
 * Hook to fetch PPTP clients
 */
export function usePPTPClients(routerIp: string): UseQueryResult<PPTPClient[], Error> {
  return useQuery({
    queryKey: vpnKeys.pptpClients(routerIp),
    queryFn: () => fetchPPTPClients(routerIp),
    staleTime: 10000,
    refetchInterval: 5000,
    refetchOnWindowFocus: true,
    refetchIntervalInBackground: false,
    enabled: !!routerIp,
  });
}

