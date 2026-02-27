/**
 * Firewall Mangle Rules Query and Mutation Hooks
 * Fetches and manages mangle rules from RouterOS REST API
 * Uses rosproxy backend for RouterOS API communication
 *
 * Mangle rules are used for traffic marking and manipulation:
 * - mark-connection: Mark all packets in a connection (for QoS)
 * - mark-packet: Mark individual packets
 * - mark-routing: Mark for routing decisions (policy routing)
 * - change-dscp: Set DSCP priority for QoS
 * - change-ttl: Modify Time To Live
 * - change-mss: Clamp Maximum Segment Size
 *
 * @see Docs/sprint-artifacts/Epic7-Security-Firewall/NAS-7-5-implement-mangle-rules.md
 */

import { useQuery, useMutation, useQueryClient, UseQueryResult } from '@tanstack/react-query';
import { makeRouterOSRequest } from '@nasnet/api-client/core';
import type { MangleRule, MangleChain } from '@nasnet/core/types';

// ============================================================================
// Query Keys
// ============================================================================

/**
 * Query keys for mangle rule queries
 * Follows TanStack Query best practices for hierarchical keys
 */
export const mangleRulesKeys = {
  all: (routerId: string) => ['mangle', routerId] as const,
  byChain: (routerId: string, chain: MangleChain) =>
    [...mangleRulesKeys.all(routerId), chain] as const,
};

// ============================================================================
// Raw API Types
// ============================================================================

/**
 * Raw API response structure from MikroTik RouterOS
 * RouterOS REST API returns hyphenated keys that need transformation
 */
interface RawMangleRule {
  '.id': string;
  chain: string;
  action: string;

  // Basic matchers
  protocol?: string;
  'src-address'?: string;
  'dst-address'?: string;
  'src-port'?: string;
  'dst-port'?: string;
  'src-address-list'?: string;
  'dst-address-list'?: string;
  'in-interface'?: string;
  'out-interface'?: string;
  'in-interface-list'?: string;
  'out-interface-list'?: string;

  // Connection matchers
  'connection-state'?: string; // comma-separated
  'connection-nat-state'?: string; // comma-separated
  'connection-mark'?: string;
  'packet-mark'?: string;
  'routing-mark'?: string;

  // Advanced matchers
  'packet-size'?: string;
  'layer7-protocol'?: string;
  content?: string;
  'tcp-flags'?: string;

  // Mark actions
  'new-connection-mark'?: string;
  'new-packet-mark'?: string;
  'new-routing-mark'?: string;
  passthrough?: string; // "yes" or "no"

  // DSCP/TTL actions
  'new-dscp'?: string;
  'new-ttl'?: string;
  'new-mss'?: string;

  // Jump
  'jump-target'?: string;

  // Meta
  comment?: string;
  disabled?: string; // "true" or "false"
  log?: string; // "yes" or "no"
  'log-prefix'?: string;

  // Counters
  packets?: string;
  bytes?: string;
}

// ============================================================================
// Transform Functions
// ============================================================================

/**
 * Parse comma-separated string to array
 */
function parseCommaSeparated(value?: string): string[] | undefined {
  if (!value) return undefined;
  return value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Transform raw API response to MangleRule type
 * Maps hyphenated keys to camelCase and converts string values
 */
function transformMangleRule(raw: RawMangleRule, index: number): MangleRule {
  return {
    id: raw['.id'],
    chain: raw.chain as MangleChain,
    action: raw.action as MangleRule['action'],
    position: index, // Use array index as position for ordering

    // Basic matchers
    protocol: raw.protocol,
    srcAddress: raw['src-address'],
    dstAddress: raw['dst-address'],
    srcPort: raw['src-port'],
    dstPort: raw['dst-port'],
    srcAddressList: raw['src-address-list'],
    dstAddressList: raw['dst-address-list'],
    inInterface: raw['in-interface'],
    outInterface: raw['out-interface'],
    inInterfaceList: raw['in-interface-list'],
    outInterfaceList: raw['out-interface-list'],

    // Connection matchers
    connectionState: parseCommaSeparated(raw['connection-state']) as MangleRule['connectionState'],
    connectionNatState: parseCommaSeparated(
      raw['connection-nat-state']
    ) as MangleRule['connectionNatState'],
    connectionMark: raw['connection-mark'],
    packetMark: raw['packet-mark'],
    routingMark: raw['routing-mark'],

    // Advanced matchers
    packetSize: raw['packet-size'],
    layer7Protocol: raw['layer7-protocol'],
    content: raw.content,
    tcpFlags: raw['tcp-flags'],

    // Mark actions
    newConnectionMark: raw['new-connection-mark'],
    newPacketMark: raw['new-packet-mark'],
    newRoutingMark: raw['new-routing-mark'],
    passthrough: raw.passthrough === 'yes' || raw.passthrough === undefined, // Default true

    // DSCP/TTL actions
    newDscp: raw['new-dscp'] ? parseInt(raw['new-dscp'], 10) : undefined,
    newTtl: raw['new-ttl'],
    newMss: raw['new-mss'] ? parseInt(raw['new-mss'], 10) : undefined,

    // Jump
    jumpTarget: raw['jump-target'],

    // Meta
    comment: raw.comment,
    disabled: raw.disabled === 'true',
    log: raw.log === 'yes',
    logPrefix: raw['log-prefix'],

    // Counters
    packets: raw.packets ? parseInt(raw.packets, 10) : undefined,
    bytes: raw.bytes ? parseInt(raw.bytes, 10) : undefined,
  };
}

/**
 * Transform MangleRule to RouterOS API format
 * Maps camelCase to hyphenated keys and converts values to strings
 */
function transformToRawMangleRule(rule: Partial<MangleRule>): Record<string, string> {
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
  if (rule.srcAddressList) raw['src-address-list'] = rule.srcAddressList;
  if (rule.dstAddressList) raw['dst-address-list'] = rule.dstAddressList;
  if (rule.inInterface) raw['in-interface'] = rule.inInterface;
  if (rule.outInterface) raw['out-interface'] = rule.outInterface;
  if (rule.inInterfaceList) raw['in-interface-list'] = rule.inInterfaceList;
  if (rule.outInterfaceList) raw['out-interface-list'] = rule.outInterfaceList;

  // Connection matchers
  if (rule.connectionState) raw['connection-state'] = rule.connectionState.join(',');
  if (rule.connectionNatState) raw['connection-nat-state'] = rule.connectionNatState.join(',');
  if (rule.connectionMark) raw['connection-mark'] = rule.connectionMark;
  if (rule.packetMark) raw['packet-mark'] = rule.packetMark;
  if (rule.routingMark) raw['routing-mark'] = rule.routingMark;

  // Advanced matchers
  if (rule.packetSize) raw['packet-size'] = rule.packetSize;
  if (rule.layer7Protocol) raw['layer7-protocol'] = rule.layer7Protocol;
  if (rule.content) raw.content = rule.content;
  if (rule.tcpFlags) raw['tcp-flags'] = rule.tcpFlags;

  // Mark actions
  if (rule.newConnectionMark) raw['new-connection-mark'] = rule.newConnectionMark;
  if (rule.newPacketMark) raw['new-packet-mark'] = rule.newPacketMark;
  if (rule.newRoutingMark) raw['new-routing-mark'] = rule.newRoutingMark;
  if (rule.passthrough !== undefined) raw.passthrough = rule.passthrough ? 'yes' : 'no';

  // DSCP/TTL actions
  if (rule.newDscp !== undefined) raw['new-dscp'] = rule.newDscp.toString();
  if (rule.newTtl) raw['new-ttl'] = rule.newTtl;
  if (rule.newMss !== undefined) raw['new-mss'] = rule.newMss.toString();

  // Jump
  if (rule.jumpTarget) raw['jump-target'] = rule.jumpTarget;

  // Meta
  if (rule.comment) raw.comment = rule.comment;
  if (rule.disabled !== undefined) raw.disabled = rule.disabled ? 'true' : 'false';
  if (rule.log !== undefined) raw.log = rule.log ? 'yes' : 'no';
  if (rule.logPrefix) raw['log-prefix'] = rule.logPrefix;

  return raw;
}

// ============================================================================
// Query Hook
// ============================================================================

/**
 * Fetch mangle rules from RouterOS via rosproxy
 * Endpoint: GET /rest/ip/firewall/mangle
 *
 * @param routerId - Target router ID
 * @param chain - Optional filter by chain
 * @returns Array of mangle rules
 */
async function fetchMangleRules(routerId: string, chain?: MangleChain): Promise<MangleRule[]> {
  const result = await makeRouterOSRequest<RawMangleRule[]>(routerId, 'ip/firewall/mangle');

  if (!result.success || !result.data) {
    throw new Error(result.error || 'Failed to fetch mangle rules');
  }

  const data = result.data;
  if (!Array.isArray(data)) return [];

  // Transform and optionally filter by chain
  let rules = data.map((raw: RawMangleRule, index: number) => transformMangleRule(raw, index));

  if (chain) {
    rules = rules.filter((rule: MangleRule) => rule.chain === chain);
  }

  return rules;
}

/**
 * Hook to fetch mangle rules
 *
 * Configuration:
 * - staleTime: 300000ms (5 minutes) - mangle rules change infrequently
 * - Auto-refresh disabled - user must manually refresh
 *
 * @param routerId - Target router ID
 * @param options - Query options including chain filter and enabled state
 * @returns Query result with MangleRule[] data
 */
interface UseMangleRulesOptions {
  chain?: MangleChain;
  enabled?: boolean;
}

export function useMangleRules(
  routerId: string,
  options?: UseMangleRulesOptions
): UseQueryResult<MangleRule[], Error> {
  return useQuery({
    queryKey:
      options?.chain ?
        mangleRulesKeys.byChain(routerId, options.chain)
      : mangleRulesKeys.all(routerId),
    queryFn: () => fetchMangleRules(routerId, options?.chain),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!routerId && (options?.enabled ?? true),
  });
}

// ============================================================================
// Mutation Hooks
// ============================================================================

/**
 * Create a new mangle rule
 * Endpoint: POST /rest/ip/firewall/mangle/add
 */
export function useCreateMangleRule(routerId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (rule: Partial<MangleRule>) => {
      const payload = transformToRawMangleRule(rule);
      const result = await makeRouterOSRequest(routerId, 'ip/firewall/mangle/add', {
        method: 'POST',
        body: payload,
      });

      if (!result.success) {
        throw new Error(result.error || 'Failed to create mangle rule');
      }

      return result.data;
    },
    onSuccess: () => {
      // Invalidate all mangle rules queries for this router
      queryClient.invalidateQueries({ queryKey: mangleRulesKeys.all(routerId) });
    },
  });
}

/**
 * Update an existing mangle rule
 * Endpoint: POST /rest/ip/firewall/mangle/set
 */
export function useUpdateMangleRule(routerId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ ruleId, updates }: { ruleId: string; updates: Partial<MangleRule> }) => {
      const payload = {
        '.id': ruleId,
        ...transformToRawMangleRule(updates),
      };

      const result = await makeRouterOSRequest(routerId, 'ip/firewall/mangle/set', {
        method: 'POST',
        body: payload,
      });

      if (!result.success) {
        throw new Error(result.error || 'Failed to update mangle rule');
      }

      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mangleRulesKeys.all(routerId) });
    },
  });
}

/**
 * Delete a mangle rule
 * Endpoint: POST /rest/ip/firewall/mangle/remove
 */
export function useDeleteMangleRule(routerId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ruleId: string) => {
      const result = await makeRouterOSRequest(routerId, 'ip/firewall/mangle/remove', {
        method: 'POST',
        body: { '.id': ruleId },
      });

      if (!result.success) {
        throw new Error(result.error || 'Failed to delete mangle rule');
      }

      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mangleRulesKeys.all(routerId) });
    },
  });
}

/**
 * Move a mangle rule to a new position (drag-drop reordering)
 * Endpoint: POST /rest/ip/firewall/mangle/move
 */
export function useMoveMangleRule(routerId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ ruleId, destination }: { ruleId: string; destination: number }) => {
      const result = await makeRouterOSRequest(routerId, 'ip/firewall/mangle/move', {
        method: 'POST',
        body: {
          '.id': ruleId,
          destination: destination.toString(),
        },
      });

      if (!result.success) {
        throw new Error(result.error || 'Failed to move mangle rule');
      }

      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mangleRulesKeys.all(routerId) });
    },
  });
}

/**
 * Toggle enable/disable state of a mangle rule (convenience wrapper)
 * Endpoint: POST /rest/ip/firewall/mangle/set
 */
export function useToggleMangleRule(routerId: string) {
  const updateMutation = useUpdateMangleRule(routerId);

  return useMutation({
    mutationFn: async ({ ruleId, disabled }: { ruleId: string; disabled: boolean }) => {
      return updateMutation.mutateAsync({ ruleId, updates: { disabled } });
    },
  });
}
