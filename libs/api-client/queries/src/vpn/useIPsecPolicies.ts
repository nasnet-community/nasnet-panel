/**
 * IPsec Policies Query Hook
 * Fetches IPsec policies (IKEv2) from RouterOS REST API
 */

import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { makeRouterOSRequest } from '@nasnet/api-client/core';
import type { IPsecPolicy } from '@nasnet/core/types';
import { vpnKeys } from './queryKeys';

/**
 * Raw response from RouterOS API
 */
interface IPsecPolicyRaw {
  '.id': string;
  peer: string;
  'src-address': string;
  'dst-address': string;
  protocol?: string;
  'src-port'?: string;
  'dst-port'?: string;
  action?: string;
  level?: string;
  'ipsec-protocols'?: string;
  tunnel?: string;
  proposal?: string;
  disabled: string;
  active?: string;
  comment?: string;
}

/**
 * Transform raw API response to typed interface
 */
function transformIPsecPolicy(raw: IPsecPolicyRaw): IPsecPolicy {
  const ipsecProtocols = raw['ipsec-protocols']?.split(',').map(p => p.trim()) || ['esp'];
  
  return {
    id: raw['.id'],
    peer: raw.peer,
    srcAddress: raw['src-address'],
    dstAddress: raw['dst-address'],
    protocol: raw.protocol as IPsecPolicy['protocol'],
    srcPort: raw['src-port'],
    dstPort: raw['dst-port'],
    action: (raw.action as IPsecPolicy['action']) || 'encrypt',
    level: (raw.level as IPsecPolicy['level']) || 'require',
    ipsecProtocols: ipsecProtocols as IPsecPolicy['ipsecProtocols'],
    tunnel: raw.tunnel === 'yes',
    proposal: raw.proposal,
    disabled: raw.disabled === 'true',
    active: raw.active === 'yes',
    comment: raw.comment,
  };
}

/**
 * Fetch IPsec policies from RouterOS
 */
async function fetchIPsecPolicies(routerIp: string): Promise<IPsecPolicy[]> {
  const result = await makeRouterOSRequest<IPsecPolicyRaw[]>(
    routerIp,
    'ip/ipsec/policy'
  );

  if (!result.success || !result.data) {
    throw new Error(result.error || 'Failed to fetch IPsec policies');
  }

  const data = result.data;
  if (Array.isArray(data)) {
    return data.map(transformIPsecPolicy);
  }
  return [];
}

/**
 * Hook to fetch IPsec policies
 */
export function useIPsecPolicies(routerIp: string): UseQueryResult<IPsecPolicy[], Error> {
  return useQuery({
    queryKey: vpnKeys.ipsecPolicies(routerIp),
    queryFn: () => fetchIPsecPolicies(routerIp),
    staleTime: 10000,
    refetchInterval: 5000,
    refetchOnWindowFocus: true,
    refetchIntervalInBackground: false,
    enabled: !!routerIp,
  });
}

