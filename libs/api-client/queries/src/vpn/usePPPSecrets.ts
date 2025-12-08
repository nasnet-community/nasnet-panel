/**
 * PPP Secrets Query Hook
 * Fetches PPP secrets (VPN users) from RouterOS REST API
 */

import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { makeRouterOSRequest } from '@nasnet/api-client/core';
import type { PPPSecret } from '@nasnet/core/types';
import { vpnKeys } from './queryKeys';

/**
 * Raw response from RouterOS API
 */
interface PPPSecretRaw {
  '.id': string;
  name: string;
  password?: string;
  service?: string;
  'caller-id'?: string;
  profile?: string;
  'local-address'?: string;
  'remote-address'?: string;
  routes?: string;
  'limit-bytes-in'?: string;
  'limit-bytes-out'?: string;
  disabled: string;
  comment?: string;
}

/**
 * Transform raw API response to typed interface
 */
function transformPPPSecret(raw: PPPSecretRaw): PPPSecret {
  return {
    id: raw['.id'],
    name: raw.name,
    password: raw.password,
    service: (raw.service as PPPSecret['service']) || 'any',
    callerId: raw['caller-id'],
    profile: raw.profile,
    localAddress: raw['local-address'],
    remoteAddress: raw['remote-address'],
    routes: raw.routes,
    limitBytesIn: raw['limit-bytes-in'] ? parseInt(raw['limit-bytes-in'], 10) : undefined,
    limitBytesOut: raw['limit-bytes-out'] ? parseInt(raw['limit-bytes-out'], 10) : undefined,
    disabled: raw.disabled === 'true',
    comment: raw.comment,
  };
}

/**
 * Fetch PPP secrets from RouterOS
 */
async function fetchPPPSecrets(routerIp: string): Promise<PPPSecret[]> {
  const result = await makeRouterOSRequest<PPPSecretRaw[]>(
    routerIp,
    'ppp/secret'
  );

  if (!result.success || !result.data) {
    throw new Error(result.error || 'Failed to fetch PPP secrets');
  }

  const data = result.data;
  if (Array.isArray(data)) {
    return data.map(transformPPPSecret);
  }
  return [];
}

/**
 * Hook to fetch PPP secrets
 */
export function usePPPSecrets(routerIp: string): UseQueryResult<PPPSecret[], Error> {
  return useQuery({
    queryKey: vpnKeys.pppSecrets(routerIp),
    queryFn: () => fetchPPPSecrets(routerIp),
    staleTime: 30000,
    refetchInterval: 15000,
    refetchOnWindowFocus: true,
    refetchIntervalInBackground: false,
    enabled: !!routerIp,
  });
}

