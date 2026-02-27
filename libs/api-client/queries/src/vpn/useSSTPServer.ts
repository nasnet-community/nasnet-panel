/**
 * SSTP Server Query Hook
 * Fetches SSTP server configuration from RouterOS REST API
 */

import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { makeRouterOSRequest } from '@nasnet/api-client/core';
import type { SSTPServer } from '@nasnet/core/types';
import { vpnKeys } from './queryKeys';

/**
 * Raw response from RouterOS API
 */
interface SSTPServerRaw {
  enabled: string;
  port?: string;
  'max-mtu'?: string;
  'max-mru'?: string;
  mrru?: string;
  authentication?: string;
  'default-profile'?: string;
  certificate?: string;
  'pem-encoding'?: string;
  'verify-client-certificate'?: string;
  'tls-version'?: string;
  'force-aes'?: string;
}

/**
 * Transform raw API response to typed interface
 */
function transformSSTPServer(raw: SSTPServerRaw): SSTPServer {
  const authMethods = raw.authentication?.split(',').map((a) => a.trim()) || ['mschap2'];

  return {
    id: 'sstp-server',
    name: 'SSTP Server',
    type: 'sstp-server',
    isDisabled: raw.enabled !== 'true',
    isRunning: raw.enabled === 'true',
    isEnabled: raw.enabled === 'true',
    port: parseInt(raw.port || '443', 10),
    maxMtu: parseInt(raw['max-mtu'] || '1500', 10),
    maxMru: parseInt(raw['max-mru'] || '1500', 10),
    mrru: raw.mrru ? parseInt(raw.mrru, 10) : undefined,
    authentication: authMethods as SSTPServer['authentication'],
    defaultProfile: raw['default-profile'],
    certificate: raw.certificate,
    hasPemEncoding: raw['pem-encoding'] === 'yes',
    shouldVerifyClientCertificate: raw['verify-client-certificate'] === 'yes',
    tlsVersion: (raw['tls-version'] as 'any' | 'only-1.2') || 'any',
    shouldForceAes: raw['force-aes'] === 'yes',
  };
}

/**
 * Fetch SSTP server configuration from RouterOS
 */
async function fetchSSTPServer(routerIp: string): Promise<SSTPServer> {
  const result = await makeRouterOSRequest<SSTPServerRaw>(routerIp, 'interface/sstp-server');

  if (!result.success || !result.data) {
    throw new Error(result.error || 'Failed to fetch SSTP server');
  }

  return transformSSTPServer(result.data);
}

/**
 * Hook to fetch SSTP server configuration
 */
export function useSSTPServer(routerIp: string): UseQueryResult<SSTPServer, Error> {
  return useQuery({
    queryKey: vpnKeys.sstpServer(routerIp),
    queryFn: () => fetchSSTPServer(routerIp),
    staleTime: 30000,
    refetchInterval: 10000,
    refetchOnWindowFocus: true,
    refetchIntervalInBackground: false,
    enabled: !!routerIp,
  });
}
