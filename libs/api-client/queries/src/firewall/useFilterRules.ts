/**
 * Firewall Filter Rules Query and Mutation Hooks
 * Fetches and manages filter rules from RouterOS REST API
 * Uses rosproxy backend for RouterOS API communication
 *
 * Filter rules control which traffic is allowed or blocked through the router.
 * They are processed in order by chain (input, forward, output).
 *
 * Chains:
 * - input: Packets destined for the router itself
 * - forward: Packets passing through the router
 * - output: Packets originating from the router
 *
 * @see Docs/sprint-artifacts/Epic7-Security-Firewall/NAS-7-1-implement-firewall-filter-rules.md
 */

import { useQuery, useMutation, useQueryClient, UseQueryResult } from '@tanstack/react-query';
import { makeRouterOSRequest } from '@nasnet/api-client/core';
import type { FilterRule, FilterChain } from '@nasnet/core/types';

// ============================================================================
// Query Keys
// ============================================================================

/**
 * Query keys for firewall queries
 * Follows TanStack Query best practices for hierarchical keys
 */
export const firewallKeys = {
  all: (routerId: string) => ['firewall', routerId] as const,
  filter: (routerId: string, chain?: FilterChain) => [...firewallKeys.all(routerId), 'filter', chain] as const,
  nat: (routerId: string) => [...firewallKeys.all(routerId), 'nat'] as const,
  counters: (routerId: string) => [...firewallKeys.all(routerId), 'counters'] as const,
};

// ============================================================================
// Raw API Types
// ============================================================================

/**
 * Raw API response structure from MikroTik RouterOS
 * RouterOS REST API returns hyphenated keys that need transformation
 */
interface RawFilterRule {
  '.id': string;
  chain: string;
  action: string;

  // Basic matchers
  protocol?: string;
  'src-address'?: string;
  'dst-address'?: string;
  'src-port'?: string;
  'dst-port'?: string;

  // Address lists
  'src-address-list'?: string;
  'dst-address-list'?: string;

  // Interfaces
  'in-interface'?: string;
  'out-interface'?: string;
  'in-interface-list'?: string;
  'out-interface-list'?: string;

  // Connection state
  'connection-state'?: string; // comma-separated

  // Meta
  disabled?: string; // "true" or "false" as string
  comment?: string;

  // Logging
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
  return value.split(',').map(s => s.trim()).filter(Boolean);
}

/**
 * Transform raw API response to FilterRule type
 * Maps hyphenated keys to camelCase and converts string values
 */
function transformFilterRule(raw: RawFilterRule, index: number): FilterRule {
  return {
    id: raw['.id'],
    chain: raw.chain as FilterChain,
    action: raw.action as FilterRule['action'],
    order: index, // Use array index as order for positioning

    // Basic matchers
    protocol: raw.protocol as FilterRule['protocol'],
    srcAddress: raw['src-address'],
    dstAddress: raw['dst-address'],
    srcPort: raw['src-port'],
    dstPort: raw['dst-port'],

    // Address lists
    srcAddressList: raw['src-address-list'],
    dstAddressList: raw['dst-address-list'],

    // Interfaces
    inInterface: raw['in-interface'],
    outInterface: raw['out-interface'],
    inInterfaceList: raw['in-interface-list'],
    outInterfaceList: raw['out-interface-list'],

    // Connection state
    connectionState: parseCommaSeparated(raw['connection-state']) as FilterRule['connectionState'],

    // Meta
    disabled: raw.disabled === 'true',
    comment: raw.comment,

    // Logging
    log: raw.log === 'yes',
    logPrefix: raw['log-prefix'],

    // Counters
    packets: raw.packets ? parseInt(raw.packets, 10) : undefined,
    bytes: raw.bytes ? parseInt(raw.bytes, 10) : undefined,
  };
}

/**
 * Transform FilterRule to RouterOS API format
 * Maps camelCase to hyphenated keys and converts values to strings
 */
function transformToRawFilterRule(rule: Partial<FilterRule>): Record<string, string> {
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

  // Address lists
  if (rule.srcAddressList) raw['src-address-list'] = rule.srcAddressList;
  if (rule.dstAddressList) raw['dst-address-list'] = rule.dstAddressList;

  // Interfaces
  if (rule.inInterface) raw['in-interface'] = rule.inInterface;
  if (rule.outInterface) raw['out-interface'] = rule.outInterface;
  if (rule.inInterfaceList) raw['in-interface-list'] = rule.inInterfaceList;
  if (rule.outInterfaceList) raw['out-interface-list'] = rule.outInterfaceList;

  // Connection state
  if (rule.connectionState) raw['connection-state'] = rule.connectionState.join(',');

  // Meta
  if (rule.comment) raw.comment = rule.comment;
  if (rule.disabled !== undefined) raw.disabled = rule.disabled ? 'true' : 'false';

  // Logging
  if (rule.log !== undefined) raw.log = rule.log ? 'yes' : 'no';
  if (rule.logPrefix) raw['log-prefix'] = rule.logPrefix;

  return raw;
}

// ============================================================================
// Query Hook
// ============================================================================

/**
 * Fetch firewall filter rules from RouterOS via rosproxy
 * Endpoint: GET /rest/ip/firewall/filter
 *
 * @param routerId - Target router ID
 * @param chain - Optional filter by chain (input/forward/output)
 * @returns Array of firewall filter rules
 */
async function fetchFilterRules(routerId: string, chain?: FilterChain): Promise<FilterRule[]> {
  const result = await makeRouterOSRequest<RawFilterRule[]>(routerId, 'ip/firewall/filter');

  if (!result.success || !result.data) {
    throw new Error(result.error || 'Failed to fetch firewall rules');
  }

  const data = result.data;
  if (!Array.isArray(data)) return [];

  // Transform and optionally filter by chain
  let rules = data.map((raw: RawFilterRule, index: number) => transformFilterRule(raw, index));

  if (chain) {
    rules = rules.filter((rule: FilterRule) => rule.chain === chain);
  }

  return rules;
}

/**
 * Hook to fetch firewall filter rules
 *
 * Configuration:
 * - staleTime: 300000ms (5 minutes) - firewall rules change infrequently
 * - Auto-refresh disabled by default - user must manually refresh
 * - Supports configurable polling via refetchInterval for counter updates
 *
 * @param routerId - Target router ID
 * @param options - Query options including chain filter, enabled state, and polling interval
 * @returns Query result with FilterRule[] data
 */
interface UseFilterRulesOptions {
  chain?: FilterChain;
  enabled?: boolean;
  /**
   * Polling interval in milliseconds for real-time counter updates
   * Set to false to disable polling (default)
   * Recommended intervals: 5000, 10000, 30000, 60000 (5s, 10s, 30s, 60s)
   */
  refetchInterval?: number | false;
}

export function useFilterRules(
  routerId: string,
  options?: UseFilterRulesOptions
): UseQueryResult<FilterRule[], Error> {
  return useQuery({
    queryKey: options?.chain
      ? firewallKeys.filter(routerId, options.chain)
      : firewallKeys.filter(routerId),
    queryFn: () => fetchFilterRules(routerId, options?.chain),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!routerId && (options?.enabled ?? true),
    refetchInterval: options?.refetchInterval ?? false,
  });
}

// ============================================================================
// Mutation Hooks
// ============================================================================

/**
 * Create a new filter rule
 * Endpoint: POST /rest/ip/firewall/filter/add
 */
export function useCreateFilterRule(routerId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (rule: Partial<FilterRule>) => {
      const payload = transformToRawFilterRule(rule);
      const result = await makeRouterOSRequest(routerId, 'ip/firewall/filter/add', {
        method: 'POST',
        body: payload,
      });

      if (!result.success) {
        throw new Error(result.error || 'Failed to create filter rule');
      }

      return result.data;
    },
    onSuccess: () => {
      // Invalidate all filter rules queries for this router
      queryClient.invalidateQueries({ queryKey: firewallKeys.all(routerId) });
    },
  });
}

/**
 * Update an existing filter rule
 * Endpoint: POST /rest/ip/firewall/filter/set
 */
export function useUpdateFilterRule(routerId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ ruleId, updates }: { ruleId: string; updates: Partial<FilterRule> }) => {
      const payload = {
        '.id': ruleId,
        ...transformToRawFilterRule(updates),
      };

      const result = await makeRouterOSRequest(routerId, 'ip/firewall/filter/set', {
        method: 'POST',
        body: payload,
      });

      if (!result.success) {
        throw new Error(result.error || 'Failed to update filter rule');
      }

      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: firewallKeys.all(routerId) });
    },
  });
}

/**
 * Delete a filter rule
 * Endpoint: POST /rest/ip/firewall/filter/remove
 */
export function useDeleteFilterRule(routerId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ruleId: string) => {
      const result = await makeRouterOSRequest(routerId, 'ip/firewall/filter/remove', {
        method: 'POST',
        body: { '.id': ruleId },
      });

      if (!result.success) {
        throw new Error(result.error || 'Failed to delete filter rule');
      }

      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: firewallKeys.all(routerId) });
    },
  });
}

/**
 * Move a filter rule to a new position (drag-drop reordering)
 * Endpoint: POST /rest/ip/firewall/filter/move
 */
export function useMoveFilterRule(routerId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ ruleId, destination }: { ruleId: string; destination: number }) => {
      const result = await makeRouterOSRequest(routerId, 'ip/firewall/filter/move', {
        method: 'POST',
        body: {
          '.id': ruleId,
          destination: destination.toString(),
        },
      });

      if (!result.success) {
        throw new Error(result.error || 'Failed to move filter rule');
      }

      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: firewallKeys.all(routerId) });
    },
  });
}

/**
 * Toggle enable/disable state of a filter rule (convenience wrapper)
 * Endpoint: POST /rest/ip/firewall/filter/set
 */
export function useToggleFilterRule(routerId: string) {
  const updateMutation = useUpdateFilterRule(routerId);

  return useMutation({
    mutationFn: async ({ ruleId, disabled }: { ruleId: string; disabled: boolean }) => {
      return updateMutation.mutateAsync({ ruleId, updates: { disabled } });
    },
  });
}
