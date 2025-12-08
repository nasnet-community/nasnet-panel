/**
 * PPTP Server Query Hook
 * Fetches PPTP server configuration from RouterOS REST API
 */

import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { makeRouterOSRequest } from '@nasnet/api-client/core';
import type { PPTPServer } from '@nasnet/core/types';
import { vpnKeys } from './queryKeys';

/**
 * Raw response from RouterOS API
 */
interface PPTPServerRaw {
  enabled: string;
  'max-mtu'?: string;
  'max-mru'?: string;
  mrru?: string;
  authentication?: string;
  'default-profile'?: string;
  'keepalive-timeout'?: string;
}

/**
 * Transform raw API response to typed interface
 */
function transformPPTPServer(raw: PPTPServerRaw): PPTPServer {
  const authMethods = raw.authentication?.split(',').map(a => a.trim()) || ['mschap2'];
  
  return {
    id: 'pptp-server',
    name: 'PPTP Server',
    type: 'pptp-server',
    disabled: raw.enabled !== 'true',
    running: raw.enabled === 'true',
    enabled: raw.enabled === 'true',
    maxMtu: parseInt(raw['max-mtu'] || '1450', 10),
    maxMru: parseInt(raw['max-mru'] || '1450', 10),
    mrru: raw.mrru ? parseInt(raw.mrru, 10) : undefined,
    authentication: authMethods as PPTPServer['authentication'],
    defaultProfile: raw['default-profile'],
    keepaliveTimeout: raw['keepalive-timeout'] ? parseInt(raw['keepalive-timeout'], 10) : undefined,
  };
}

/**
 * Fetch PPTP server configuration from RouterOS
 */
async function fetchPPTPServer(routerIp: string): Promise<PPTPServer> {
  const result = await makeRouterOSRequest<PPTPServerRaw>(
    routerIp,
    'interface/pptp-server'
  );

  if (!result.success || !result.data) {
    throw new Error(result.error || 'Failed to fetch PPTP server');
  }

  return transformPPTPServer(result.data);
}

/**
 * Hook to fetch PPTP server configuration
 */
export function usePPTPServer(routerIp: string): UseQueryResult<PPTPServer, Error> {
  return useQuery({
    queryKey: vpnKeys.pptpServer(routerIp),
    queryFn: () => fetchPPTPServer(routerIp),
    staleTime: 30000,
    refetchInterval: 10000,
    refetchOnWindowFocus: true,
    refetchIntervalInBackground: false,
    enabled: !!routerIp,
  });
}

