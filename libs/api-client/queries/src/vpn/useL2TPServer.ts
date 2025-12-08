/**
 * L2TP Server Query Hook
 * Fetches L2TP server configuration from RouterOS REST API
 */

import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { makeRouterOSRequest } from '@nasnet/api-client/core';
import type { L2TPServer } from '@nasnet/core/types';
import { vpnKeys } from './queryKeys';

/**
 * Raw response from RouterOS API
 */
interface L2TPServerRaw {
  enabled: string;
  'max-mtu'?: string;
  'max-mru'?: string;
  mrru?: string;
  authentication?: string;
  'default-profile'?: string;
  'use-ipsec'?: string;
  'ipsec-secret'?: string;
  'allow-fast-path'?: string;
  'caller-id-type'?: string;
  'one-session-per-host'?: string;
  'max-sessions'?: string;
}

/**
 * Transform raw API response to typed interface
 */
function transformL2TPServer(raw: L2TPServerRaw): L2TPServer {
  const authMethods = raw.authentication?.split(',').map(a => a.trim()) || ['mschap2'];
  
  return {
    id: 'l2tp-server',
    name: 'L2TP Server',
    type: 'l2tp-server',
    disabled: raw.enabled !== 'true',
    running: raw.enabled === 'true',
    enabled: raw.enabled === 'true',
    maxMtu: parseInt(raw['max-mtu'] || '1450', 10),
    maxMru: parseInt(raw['max-mru'] || '1450', 10),
    mrru: raw.mrru ? parseInt(raw.mrru, 10) : undefined,
    authentication: authMethods as L2TPServer['authentication'],
    defaultProfile: raw['default-profile'],
    useIpsec: raw['use-ipsec'] === 'yes' || raw['use-ipsec'] === 'required',
    ipsecSecret: raw['ipsec-secret'],
    allowFastPath: raw['allow-fast-path'] === 'yes',
    callerIdType: raw['caller-id-type'] as 'ip-address' | 'number',
    oneSessionPerHost: raw['one-session-per-host'] === 'yes',
    maxSessions: raw['max-sessions'] ? parseInt(raw['max-sessions'], 10) : undefined,
  };
}

/**
 * Fetch L2TP server configuration from RouterOS
 */
async function fetchL2TPServer(routerIp: string): Promise<L2TPServer> {
  const result = await makeRouterOSRequest<L2TPServerRaw>(
    routerIp,
    'interface/l2tp-server'
  );

  if (!result.success || !result.data) {
    throw new Error(result.error || 'Failed to fetch L2TP server');
  }

  return transformL2TPServer(result.data);
}

/**
 * Hook to fetch L2TP server configuration
 */
export function useL2TPServer(routerIp: string): UseQueryResult<L2TPServer, Error> {
  return useQuery({
    queryKey: vpnKeys.l2tpServer(routerIp),
    queryFn: () => fetchL2TPServer(routerIp),
    staleTime: 30000,
    refetchInterval: 10000,
    refetchOnWindowFocus: true,
    refetchIntervalInBackground: false,
    enabled: !!routerIp,
  });
}

