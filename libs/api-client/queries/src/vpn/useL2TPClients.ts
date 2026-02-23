/**
 * L2TP Clients Query Hook
 * Fetches L2TP client interfaces from RouterOS REST API
 */

import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { makeRouterOSRequest } from '@nasnet/api-client/core';
import type { L2TPClient } from '@nasnet/core/types';
import { vpnKeys } from './queryKeys';

/**
 * Raw response from RouterOS API
 */
interface L2TPClientRaw {
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
  'use-ipsec'?: string;
  'ipsec-secret'?: string;
  'allow-fast-path'?: string;
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
function transformL2TPClient(raw: L2TPClientRaw): L2TPClient {
  return {
    id: raw['.id'],
    name: raw.name,
    type: 'l2tp-client',
    isDisabled: raw.disabled === 'true',
    isRunning: raw.running === 'true',
    connectTo: raw['connect-to'],
    user: raw.user,
    password: raw.password,
    profile: raw.profile,
    maxMtu: parseInt(raw['max-mtu'] || '1450', 10),
    maxMru: parseInt(raw['max-mru'] || '1450', 10),
    mrru: raw.mrru ? parseInt(raw.mrru, 10) : undefined,
    shouldUseIpsec: raw['use-ipsec'] === 'yes' || raw['use-ipsec'] === 'required',
    ipsecSecret: raw['ipsec-secret'],
    shouldAllowFastPath: raw['allow-fast-path'] === 'yes',
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
 * Fetch L2TP clients from RouterOS
 */
async function fetchL2TPClients(routerIp: string): Promise<L2TPClient[]> {
  const result = await makeRouterOSRequest<L2TPClientRaw[]>(
    routerIp,
    'interface/l2tp-client'
  );

  if (!result.success || !result.data) {
    throw new Error(result.error || 'Failed to fetch L2TP clients');
  }

  const data = result.data;
  if (Array.isArray(data)) {
    return data.map(transformL2TPClient);
  }
  return [];
}

/**
 * Hook to fetch L2TP clients
 */
export function useL2TPClients(routerIp: string): UseQueryResult<L2TPClient[], Error> {
  return useQuery({
    queryKey: vpnKeys.l2tpClients(routerIp),
    queryFn: () => fetchL2TPClients(routerIp),
    staleTime: 10000,
    refetchInterval: 5000,
    refetchOnWindowFocus: true,
    refetchIntervalInBackground: false,
    enabled: !!routerIp,
  });
}

