/**
 * SSTP Clients Query Hook
 * Fetches SSTP client interfaces from RouterOS REST API
 */

import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { makeRouterOSRequest } from '@nasnet/api-client/core';
import type { SSTPClient } from '@nasnet/core/types';
import { vpnKeys } from './queryKeys';

/**
 * Raw response from RouterOS API
 */
interface SSTPClientRaw {
  '.id': string;
  name: string;
  disabled: string;
  running: string;
  'connect-to': string;
  port?: string;
  user?: string;
  password?: string;
  profile?: string;
  'max-mtu'?: string;
  'max-mru'?: string;
  mrru?: string;
  certificate?: string;
  'verify-server-certificate'?: string;
  'verify-server-address-from-certificate'?: string;
  'tls-version'?: string;
  'pem-encoding'?: string;
  'add-default-route'?: string;
  'dial-on-demand'?: string;
  'http-proxy'?: string;
  'http-proxy-port'?: string;
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
function transformSSTPClient(raw: SSTPClientRaw): SSTPClient {
  return {
    id: raw['.id'],
    name: raw.name,
    type: 'sstp-client',
    isDisabled: raw.disabled === 'true',
    isRunning: raw.running === 'true',
    connectTo: raw['connect-to'],
    port: parseInt(raw.port || '443', 10),
    user: raw.user,
    password: raw.password,
    profile: raw.profile,
    maxMtu: parseInt(raw['max-mtu'] || '1500', 10),
    maxMru: parseInt(raw['max-mru'] || '1500', 10),
    mrru: raw.mrru ? parseInt(raw.mrru, 10) : undefined,
    certificate: raw.certificate,
    shouldVerifyServerCertificate: raw['verify-server-certificate'] === 'yes',
    shouldVerifyServerAddressFromCertificate: raw['verify-server-address-from-certificate'] === 'yes',
    tlsVersion: (raw['tls-version'] as 'any' | 'only-1.2') || 'any',
    hasPemEncoding: raw['pem-encoding'] === 'yes',
    shouldAddDefaultRoute: raw['add-default-route'] === 'yes',
    shouldDialOnDemand: raw['dial-on-demand'] === 'yes',
    httpProxy: raw['http-proxy'],
    httpProxyPort: raw['http-proxy-port'] ? parseInt(raw['http-proxy-port'], 10) : undefined,
    rx: raw['rx-byte'] ? parseInt(raw['rx-byte'], 10) : undefined,
    tx: raw['tx-byte'] ? parseInt(raw['tx-byte'], 10) : undefined,
    uptime: raw.uptime,
    localAddress: raw['local-address'],
    remoteAddress: raw['remote-address'],
    comment: raw.comment,
  };
}

/**
 * Fetch SSTP clients from RouterOS
 */
async function fetchSSTPClients(routerIp: string): Promise<SSTPClient[]> {
  const result = await makeRouterOSRequest<SSTPClientRaw[]>(
    routerIp,
    'interface/sstp-client'
  );

  if (!result.success || !result.data) {
    throw new Error(result.error || 'Failed to fetch SSTP clients');
  }

  const data = result.data;
  if (Array.isArray(data)) {
    return data.map(transformSSTPClient);
  }
  return [];
}

/**
 * Hook to fetch SSTP clients
 */
export function useSSTPClients(routerIp: string): UseQueryResult<SSTPClient[], Error> {
  return useQuery({
    queryKey: vpnKeys.sstpClients(routerIp),
    queryFn: () => fetchSSTPClients(routerIp),
    staleTime: 10000,
    refetchInterval: 5000,
    refetchOnWindowFocus: true,
    refetchIntervalInBackground: false,
    enabled: !!routerIp,
  });
}

