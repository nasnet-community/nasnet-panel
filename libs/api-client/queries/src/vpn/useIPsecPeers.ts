/**
 * IPsec Peers Query Hook
 * Fetches IPsec peers (IKEv2) from RouterOS REST API
 */

import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { makeRouterOSRequest } from '@nasnet/api-client/core';
import type { IPsecPeer } from '@nasnet/core/types';
import { vpnKeys } from './queryKeys';

/**
 * Raw response from RouterOS API
 */
interface IPsecPeerRaw {
  '.id': string;
  name: string;
  address: string;
  profile: string;
  'exchange-mode'?: string;
  passive?: string;
  'send-initial-contact'?: string;
  'local-address'?: string;
  port?: string;
  disabled: string;
  comment?: string;
}

/**
 * Transform raw API response to typed interface
 */
function transformIPsecPeer(raw: IPsecPeerRaw): IPsecPeer {
  return {
    id: raw['.id'],
    name: raw.name,
    address: raw.address,
    profile: raw.profile,
    exchangeMode: (raw['exchange-mode'] as IPsecPeer['exchangeMode']) || 'ike2',
    isPassive: raw.passive === 'yes',
    shouldSendInitialContact: raw['send-initial-contact'] === 'yes',
    localAddress: raw['local-address'],
    port: parseInt(raw.port || '500', 10),
    isDisabled: raw.disabled === 'true',
    comment: raw.comment,
  };
}

/**
 * Fetch IPsec peers from RouterOS
 */
async function fetchIPsecPeers(routerIp: string): Promise<IPsecPeer[]> {
  const result = await makeRouterOSRequest<IPsecPeerRaw[]>(
    routerIp,
    'ip/ipsec/peer'
  );

  if (!result.success || !result.data) {
    throw new Error(result.error || 'Failed to fetch IPsec peers');
  }

  const data = result.data;
  if (Array.isArray(data)) {
    return data.map(transformIPsecPeer);
  }
  return [];
}

/**
 * Hook to fetch IPsec peers
 */
export function useIPsecPeers(routerIp: string): UseQueryResult<IPsecPeer[], Error> {
  return useQuery({
    queryKey: vpnKeys.ipsecPeers(routerIp),
    queryFn: () => fetchIPsecPeers(routerIp),
    staleTime: 10000,
    refetchInterval: 5000,
    refetchOnWindowFocus: true,
    refetchIntervalInBackground: false,
    enabled: !!routerIp,
  });
}

