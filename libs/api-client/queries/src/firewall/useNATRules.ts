/**
 * NAT Rules Query and Mutation Hooks
 * Fetches and manages NAT rules from RouterOS REST API
 * Uses rosproxy backend for RouterOS API communication
 *
 * NAT rules control network address translation for packets.
 * They are processed in order by chain (srcnat, dstnat).
 *
 * Chains:
 * - srcnat: Source NAT (typically masquerade for outbound traffic)
 * - dstnat: Destination NAT (typically port forwarding for inbound traffic)
 */

import { useQuery, useMutation, useQueryClient, UseQueryResult } from '@tanstack/react-query';
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
 * Transform NATRule to RouterOS API format
 * Maps camelCase to hyphenated keys and converts values to strings
 */
function transformToRawNATRule(rule: Partial<NATRule>): Record<string, string> {
  const raw: Record<string, string> = {};

  // Required fields
  if (rule.chain) raw.chain = rule.chain;
  if (rule.action) raw.action = rule.action;

  // Basic matchers
  if (rule.protocol) raw.protocol = rule.protocol;
  if (rule.srcAddress) raw['src-address'] = rule.srcAddress;
  if (rule.dstAddress) raw['dst-address'] = rule.dstAddress;
  if (rule.srcPort) raw['src-port'] = rule.srcPort;
  if (rule.dstPort) raw['dst-port'] = rule.dstPort;

  // Interfaces
  if (rule.inInterface) raw['in-interface'] = rule.inInterface;
  if (rule.outInterface) raw['out-interface'] = rule.outInterface;

  // NAT-specific fields
  if (rule.toAddresses) raw['to-addresses'] = rule.toAddresses;
  if (rule.toPorts) raw['to-ports'] = rule.toPorts;

  // Meta
  if (rule.comment) raw.comment = rule.comment;
  if (rule.disabled !== undefined) raw.disabled = rule.disabled ? 'true' : 'false';

  return raw;
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
 * - Auto-refresh disabled - user must manually refresh
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

// ============================================================================
// Mutation Hooks
// ============================================================================

/**
 * Create a new NAT rule
 * Endpoint: POST /rest/ip/firewall/nat/add
 */
export function useCreateNATRule(routerIp: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (rule: Partial<NATRule>) => {
      const payload = transformToRawNATRule(rule);
      const result = await makeRouterOSRequest(routerIp, 'ip/firewall/nat/add', {
        method: 'POST',
        body: payload,
      });

      if (!result.success) {
        throw new Error(result.error || 'Failed to create NAT rule');
      }

      return result.data;
    },
    onSuccess: () => {
      // Invalidate all firewall queries for this router
      queryClient.invalidateQueries({ queryKey: firewallKeys.all(routerIp) });
    },
  });
}

/**
 * Update an existing NAT rule
 * Endpoint: POST /rest/ip/firewall/nat/set
 */
export function useUpdateNATRule(routerIp: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ ruleId, updates }: { ruleId: string; updates: Partial<NATRule> }) => {
      const payload = {
        '.id': ruleId,
        ...transformToRawNATRule(updates),
      };

      const result = await makeRouterOSRequest(routerIp, 'ip/firewall/nat/set', {
        method: 'POST',
        body: payload,
      });

      if (!result.success) {
        throw new Error(result.error || 'Failed to update NAT rule');
      }

      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: firewallKeys.all(routerIp) });
    },
  });
}

/**
 * Delete a NAT rule
 * Endpoint: POST /rest/ip/firewall/nat/remove
 */
export function useDeleteNATRule(routerIp: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ruleId: string) => {
      const result = await makeRouterOSRequest(routerIp, 'ip/firewall/nat/remove', {
        method: 'POST',
        body: { '.id': ruleId },
      });

      if (!result.success) {
        throw new Error(result.error || 'Failed to delete NAT rule');
      }

      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: firewallKeys.all(routerIp) });
    },
  });
}

/**
 * Create a port forwarding rule (convenience wrapper for dstnat)
 * Automatically configures a destination NAT rule for port forwarding
 *
 * @example
 * ```typescript
 * const createPortForward = useCreatePortForward(routerIp);
 * createPortForward.mutate({
 *   protocol: 'tcp',
 *   dstPort: '8080',
 *   toAddresses: '192.168.1.100',
 *   toPorts: '80',
 *   inInterface: 'ether1',
 *   comment: 'Forward web traffic to internal server'
 * });
 * ```
 */
export function useCreatePortForward(routerIp: string) {
  const createNATRule = useCreateNATRule(routerIp);

  return useMutation({
    mutationFn: async (config: {
      protocol: 'tcp' | 'udp';
      dstPort: string;
      toAddresses: string;
      toPorts: string;
      inInterface?: string;
      dstAddress?: string;
      comment?: string;
      disabled?: boolean;
    }) => {
      const rule: Partial<NATRule> = {
        chain: 'dstnat' as any,
        action: 'dst-nat',
        protocol: config.protocol,
        dstPort: config.dstPort,
        toAddresses: config.toAddresses,
        toPorts: config.toPorts,
        inInterface: config.inInterface,
        dstAddress: config.dstAddress,
        comment:
          config.comment ||
          `Port forward ${config.dstPort} -> ${config.toAddresses}:${config.toPorts}`,
        disabled: config.disabled ?? false,
      };

      return createNATRule.mutateAsync(rule);
    },
  });
}

/**
 * Create a masquerade rule (convenience wrapper for srcnat)
 * Automatically configures source NAT masquerading for outbound traffic
 *
 * @example
 * ```typescript
 * const createMasquerade = useCreateMasqueradeRule(routerIp);
 * createMasquerade.mutate({
 *   outInterface: 'ether1',
 *   srcAddress: '192.168.1.0/24',
 *   comment: 'Masquerade LAN traffic'
 * });
 * ```
 */
export function useCreateMasqueradeRule(routerIp: string) {
  const createNATRule = useCreateNATRule(routerIp);

  return useMutation({
    mutationFn: async (config: {
      outInterface: string;
      srcAddress?: string;
      comment?: string;
      disabled?: boolean;
    }) => {
      const rule: Partial<NATRule> = {
        chain: 'srcnat' as any,
        action: 'masquerade',
        outInterface: config.outInterface,
        srcAddress: config.srcAddress,
        comment: config.comment || `Masquerade on ${config.outInterface}`,
        disabled: config.disabled ?? false,
      };

      return createNATRule.mutateAsync(rule);
    },
  });
}

/**
 * Toggle enable/disable state of a NAT rule (convenience wrapper)
 * Endpoint: POST /rest/ip/firewall/nat/set
 */
export function useToggleNATRule(routerIp: string) {
  const updateMutation = useUpdateNATRule(routerIp);

  return useMutation({
    mutationFn: async ({ ruleId, disabled }: { ruleId: string; disabled: boolean }) => {
      return updateMutation.mutateAsync({ ruleId, updates: { disabled } });
    },
  });
}
