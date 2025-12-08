/**
 * NAT Rules Query Hook
 * Fetches NAT rules from RouterOS REST API
 * Uses rosproxy backend for RouterOS API communication
 */

import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { makeRouterOSRequest } from '@nasnet/api-client/core';
import type { NATRule } from '@nasnet/core/types';
import { firewallKeys } from './useFilterRules';

/**
 * Raw API response structure from MikroTik RouterOS NAT endpoint
 */
interface RawNATRule {
  '.id': string;
  chain: string;
  action: string;
  protocol?: string;
  'src-address'?: string;
  'dst-address'?: string;
  'src-port'?: string;
  'dst-port'?: string;
  'in-interface'?: string;
  'out-interface'?: string;
  'to-addresses'?: string;
  'to-ports'?: string;
  disabled?: string;
  comment?: string;
}

/**
 * Transform raw NAT API response to NATRule type
 */
function transformNATRule(raw: RawNATRule, index: number): NATRule {
  return {
    id: raw['.id'],
    chain: raw.chain as NATRule['chain'],
    action: raw.action as NATRule['action'],
    protocol: raw.protocol as NATRule['protocol'],
    srcAddress: raw['src-address'],
    dstAddress: raw['dst-address'],
    srcPort: raw['src-port'],
    dstPort: raw['dst-port'],
    inInterface: raw['in-interface'],
    outInterface: raw['out-interface'],
    toAddresses: raw['to-addresses'],
    toPorts: raw['to-ports'],
    disabled: raw.disabled === 'true',
    comment: raw.comment,
    order: index,
  };
}

/**
 * Fetch NAT rules from RouterOS via rosproxy
 * Endpoint: GET /rest/ip/firewall/nat
 *
 * @param routerIp - Target router IP address
 * @returns Array of NAT rules
 */
async function fetchNATRules(routerIp: string): Promise<NATRule[]> {
  const result = await makeRouterOSRequest<RawNATRule[]>(routerIp, 'ip/firewall/nat');

  if (!result.success || !result.data) {
    throw new Error(result.error || 'Failed to fetch NAT rules');
  }

  const data = result.data;
  if (!Array.isArray(data)) return [];
  return data.map((raw: RawNATRule, index: number) => transformNATRule(raw, index));
}

/**
 * Hook to fetch NAT rules
 *
 * Configuration:
 * - staleTime: 300000ms (5 minutes) - NAT rules change infrequently
 * - Read-only data - no mutations in Phase 0
 *
 * @param routerIp - Target router IP address
 * @returns Query result with NATRule[] data
 */
export function useNATRules(routerIp: string): UseQueryResult<NATRule[], Error> {
  return useQuery({
    queryKey: firewallKeys.nat(routerIp),
    queryFn: () => fetchNATRules(routerIp),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!routerIp, // Only fetch if router IP is provided
  });
}
