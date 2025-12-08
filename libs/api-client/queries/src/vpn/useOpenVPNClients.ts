/**
 * OpenVPN Client Query Hook
 * Fetches OpenVPN client interfaces from RouterOS REST API
 */

import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { makeRouterOSRequest } from '@nasnet/api-client/core';
import type { OpenVPNClient } from '@nasnet/core/types';
import { vpnKeys } from './queryKeys';

/**
 * Raw response from RouterOS API
 */
interface OpenVPNClientRaw {
  '.id': string;
  name: string;
  disabled: string;
  running: string;
  'connect-to': string;
  port: string;
  mode: string;
  protocol?: string;
  'max-mtu'?: string;
  user?: string;
  password?: string;
  certificate?: string;
  'verify-server-certificate'?: string;
  auth?: string;
  cipher?: string;
  'add-default-route'?: string;
  'route-nopull'?: string;
  'rx-byte'?: string;
  'tx-byte'?: string;
  uptime?: string;
  comment?: string;
}

/**
 * Transform raw API response to typed interface
 */
function transformOpenVPNClient(raw: OpenVPNClientRaw): OpenVPNClient {
  return {
    id: raw['.id'],
    name: raw.name,
    type: 'ovpn-client',
    disabled: raw.disabled === 'true',
    running: raw.running === 'true',
    connectTo: raw['connect-to'],
    port: parseInt(raw.port, 10) || 1194,
    mode: (raw.mode as 'ip' | 'ethernet') || 'ip',
    protocol: (raw.protocol as 'tcp' | 'udp') || 'tcp',
    maxMtu: parseInt(raw['max-mtu'] || '1500', 10),
    user: raw.user,
    password: raw.password,
    certificate: raw.certificate,
    verifyCertificate: raw['verify-server-certificate'] === 'yes',
    auth: (raw.auth as OpenVPNClient['auth']) || 'sha1',
    cipher: (raw.cipher as OpenVPNClient['cipher']) || 'aes256-cbc',
    addDefaultRoute: raw['add-default-route'] === 'yes',
    routeNopull: raw['route-nopull'] === 'yes',
    rx: raw['rx-byte'] ? parseInt(raw['rx-byte'], 10) : undefined,
    tx: raw['tx-byte'] ? parseInt(raw['tx-byte'], 10) : undefined,
    uptime: raw.uptime,
    comment: raw.comment,
  };
}

/**
 * Fetch OpenVPN clients from RouterOS
 */
async function fetchOpenVPNClients(routerIp: string): Promise<OpenVPNClient[]> {
  const result = await makeRouterOSRequest<OpenVPNClientRaw[]>(
    routerIp,
    'interface/ovpn-client'
  );

  if (!result.success || !result.data) {
    throw new Error(result.error || 'Failed to fetch OpenVPN clients');
  }

  const data = result.data;
  if (Array.isArray(data)) {
    return data.map(transformOpenVPNClient);
  }
  return [];
}

/**
 * Hook to fetch OpenVPN clients
 */
export function useOpenVPNClients(routerIp: string): UseQueryResult<OpenVPNClient[], Error> {
  return useQuery({
    queryKey: vpnKeys.openvpnClients(routerIp),
    queryFn: () => fetchOpenVPNClients(routerIp),
    staleTime: 10000,
    refetchInterval: 5000,
    refetchOnWindowFocus: true,
    refetchIntervalInBackground: false,
    enabled: !!routerIp,
  });
}

