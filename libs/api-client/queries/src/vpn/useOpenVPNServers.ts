/**
 * OpenVPN Server Query Hook
 * Fetches OpenVPN server interfaces from RouterOS REST API
 */

import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { makeRouterOSRequest } from '@nasnet/api-client/core';
import type { OpenVPNServer } from '@nasnet/core/types';
import { vpnKeys } from './queryKeys';

/**
 * Raw response from RouterOS API
 */
interface OpenVPNServerRaw {
  '.id': string;
  name: string;
  disabled: string;
  running: string;
  port: string;
  mode: string;
  protocol?: string;
  'max-mtu'?: string;
  'default-profile'?: string;
  certificate?: string;
  'require-client-certificate'?: string;
  auth?: string;
  cipher?: string;
  'enable-tun-ipv6'?: string;
  'mac-address'?: string;
  'keepalive-timeout'?: string;
  comment?: string;
}

/**
 * Transform raw API response to typed interface
 */
function transformOpenVPNServer(raw: OpenVPNServerRaw): OpenVPNServer {
  return {
    id: raw['.id'],
    name: raw.name,
    type: 'ovpn-server',
    isDisabled: raw.disabled === 'true',
    isRunning: raw.running === 'true',
    port: parseInt(raw.port, 10) || 1194,
    mode: (raw.mode as 'ip' | 'ethernet') || 'ip',
    protocol: (raw.protocol as 'tcp' | 'udp') || 'tcp',
    maxMtu: parseInt(raw['max-mtu'] || '1500', 10),
    defaultProfile: raw['default-profile'],
    certificate: raw.certificate,
    shouldRequireClientCertificate: raw['require-client-certificate'] === 'yes',
    auth: (raw.auth as OpenVPNServer['auth']) || 'sha1',
    cipher: (raw.cipher as OpenVPNServer['cipher']) || 'aes256-cbc',
    shouldEnableTunIpv6: raw['enable-tun-ipv6'] === 'yes',
    macAddress: raw['mac-address'],
    keepaliveTimeout: raw['keepalive-timeout'] ? parseInt(raw['keepalive-timeout'], 10) : undefined,
    comment: raw.comment,
  };
}

/**
 * Fetch OpenVPN servers from RouterOS
 */
async function fetchOpenVPNServers(routerIp: string): Promise<OpenVPNServer[]> {
  const result = await makeRouterOSRequest<OpenVPNServerRaw[]>(routerIp, 'interface/ovpn-server');

  if (!result.success || !result.data) {
    throw new Error(result.error || 'Failed to fetch OpenVPN servers');
  }

  const data = result.data;
  if (Array.isArray(data)) {
    return data.map(transformOpenVPNServer);
  }
  return [];
}

/**
 * Hook to fetch OpenVPN servers
 */
export function useOpenVPNServers(routerIp: string): UseQueryResult<OpenVPNServer[], Error> {
  return useQuery({
    queryKey: vpnKeys.openvpnServers(routerIp),
    queryFn: () => fetchOpenVPNServers(routerIp),
    staleTime: 10000,
    refetchInterval: 5000,
    refetchOnWindowFocus: true,
    refetchIntervalInBackground: false,
    enabled: !!routerIp,
  });
}
