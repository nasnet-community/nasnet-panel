/**
 * Firewall Filter Rules Query Hook
 * Fetches firewall filter rules from RouterOS REST API
 * Uses rosproxy backend for RouterOS API communication
 */

import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { makeRouterOSRequest } from '@nasnet/api-client/core';
import type { FirewallRule } from '@nasnet/core/types';

/**
 * Query keys for firewall queries
 * Follows TanStack Query best practices for hierarchical keys
 */
export const firewallKeys = {
  all: ['firewall'] as const,
  filter: (routerIp: string, chain?: string) => [...firewallKeys.all, 'filter', routerIp, { chain }] as const,
  nat: (routerIp: string) => [...firewallKeys.all, 'nat', routerIp] as const,
};

/**
 * Raw API response structure from MikroTik RouterOS
 * RouterOS REST API returns hyphenated keys that need transformation
 */
interface RawFilterRule {
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
  disabled?: string; // "true" or "false" as string
  comment?: string;
}

/**
 * Transform raw API response to FirewallRule type
 * Maps hyphenated keys to camelCase and converts string booleans
 */
function transformFilterRule(raw: RawFilterRule, index: number): FirewallRule {
  return {
    id: raw['.id'],
    chain: raw.chain as FirewallRule['chain'],
    action: raw.action as FirewallRule['action'],
    protocol: raw.protocol as FirewallRule['protocol'],
    srcAddress: raw['src-address'],
    dstAddress: raw['dst-address'],
    srcPort: raw['src-port'],
    dstPort: raw['dst-port'],
    inInterface: raw['in-interface'],
    outInterface: raw['out-interface'],
    disabled: raw.disabled === 'true',
    comment: raw.comment,
    order: index, // Use array index as order
  };
}

/**
 * Fetch firewall filter rules from RouterOS via rosproxy
 * Endpoint: GET /rest/ip/firewall/filter
 *
 * @param routerIp - Target router IP address
 * @param chain - Optional filter by chain (input/forward/output)
 * @returns Array of firewall filter rules
 */
async function fetchFilterRules(routerIp: string, chain?: string): Promise<FirewallRule[]> {
  const result = await makeRouterOSRequest<RawFilterRule[]>(routerIp, 'ip/firewall/filter');

  if (!result.success || !result.data) {
    throw new Error(result.error || 'Failed to fetch firewall rules');
  }

  const data = result.data;
  if (!Array.isArray(data)) return [];

  // Transform and optionally filter by chain
  let rules = data.map((raw: RawFilterRule, index: number) => transformFilterRule(raw, index));

  if (chain) {
    rules = rules.filter((rule: FirewallRule) => rule.chain === chain);
  }

  return rules;
}

/**
 * Hook to fetch firewall filter rules
 *
 * Configuration:
 * - staleTime: 300000ms (5 minutes) - firewall rules change infrequently
 * - Auto-refresh disabled - user must manually refresh
 * - Read-only data - no mutations in Phase 0
 *
 * @param routerIp - Target router IP address
 * @param options - Query options including chain filter and enabled state
 * @returns Query result with FirewallRule[] data
 */
interface UseFilterRulesOptions {
  chain?: string;
  enabled?: boolean;
}

export function useFilterRules(
  routerIp: string,
  options?: UseFilterRulesOptions
): UseQueryResult<FirewallRule[], Error> {
  return useQuery({
    queryKey: firewallKeys.filter(routerIp, options?.chain),
    queryFn: () => fetchFilterRules(routerIp, options?.chain),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!routerIp && (options?.enabled ?? true),
  });
}
