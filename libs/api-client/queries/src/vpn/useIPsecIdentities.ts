/**
 * IPsec Identities Query Hook
 * Fetches IPsec identities (IKEv2 authentication) from RouterOS REST API
 */

import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { makeRouterOSRequest } from '@nasnet/api-client/core';
import type { IPsecIdentity } from '@nasnet/core/types';
import { vpnKeys } from './queryKeys';

/**
 * Raw response from RouterOS API
 */
interface IPsecIdentityRaw {
  '.id': string;
  peer: string;
  'auth-method': string;
  secret?: string;
  certificate?: string;
  'remote-certificate'?: string;
  'my-id'?: string;
  'remote-id'?: string;
  'match-by'?: string;
  username?: string;
  password?: string;
  disabled: string;
  comment?: string;
}

/**
 * Transform raw API response to typed interface
 */
function transformIPsecIdentity(raw: IPsecIdentityRaw): IPsecIdentity {
  return {
    id: raw['.id'],
    peer: raw.peer,
    authMethod: raw['auth-method'] as IPsecIdentity['authMethod'],
    secret: raw.secret,
    certificate: raw.certificate,
    remoteCertificate: raw['remote-certificate'],
    myId: raw['my-id'],
    remoteId: raw['remote-id'],
    matchBy: (raw['match-by'] as IPsecIdentity['matchBy']) || 'remote-id',
    username: raw.username,
    password: raw.password,
    isDisabled: raw.disabled === 'true',
    comment: raw.comment,
  };
}

/**
 * Fetch IPsec identities from RouterOS
 */
async function fetchIPsecIdentities(routerIp: string): Promise<IPsecIdentity[]> {
  const result = await makeRouterOSRequest<IPsecIdentityRaw[]>(routerIp, 'ip/ipsec/identity');

  if (!result.success || !result.data) {
    throw new Error(result.error || 'Failed to fetch IPsec identities');
  }

  const data = result.data;
  if (Array.isArray(data)) {
    return data.map(transformIPsecIdentity);
  }
  return [];
}

/**
 * Hook to fetch IPsec identities
 */
export function useIPsecIdentities(routerIp: string): UseQueryResult<IPsecIdentity[], Error> {
  return useQuery({
    queryKey: vpnKeys.ipsecIdentities(routerIp),
    queryFn: () => fetchIPsecIdentities(routerIp),
    staleTime: 10000,
    refetchInterval: 5000,
    refetchOnWindowFocus: true,
    refetchIntervalInBackground: false,
    enabled: !!routerIp,
  });
}
