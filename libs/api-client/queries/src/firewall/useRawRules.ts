/**
 * Firewall RAW Rules Query and Mutation Hooks
 * Fetches and manages RAW rules from RouterOS REST API
 * Uses rosproxy backend for RouterOS API communication
 *
 * RAW rules operate BEFORE connection tracking (pre-conntrack):
 * - notrack: Disable connection tracking for performance
 * - drop: Early packet dropping (DDoS mitigation, bogon filtering)
 * - accept: Allow packet (continue to filter rules)
 *
 * Chains:
 * - prerouting: Before routing decision
 * - output: Packets originating from router
 *
 * @see https://wiki.mikrotik.com/wiki/Manual:IP/Firewall/Filter#RAW
 */

import { useQuery, useMutation, useQueryClient, UseQueryResult, UseMutationResult } from '@tanstack/react-query';
import { makeRouterOSRequest } from '@nasnet/api-client/core';
import type { RawRule, RawChain } from '@nasnet/core/types';

// ============================================================================
// Query Keys
// ============================================================================

/**
 * Query keys for RAW rule queries
 * Follows TanStack Query best practices for hierarchical keys
 */
export const rawRulesKeys = {
  all: (routerId: string) => ['raw', routerId] as const,
  byChain: (routerId: string, chain: RawChain) => [...rawRulesKeys.all(routerId), chain] as const,
  detail: (routerId: string, ruleId: string) => [...rawRulesKeys.all(routerId), ruleId] as const,
};

// ============================================================================
// Raw API Types
// ============================================================================

/**
 * Raw API response structure from MikroTik RouterOS
 * RouterOS REST API returns hyphenated keys that need transformation
 */
interface RawRawRule {
  '.id': string;
  chain: string;
  action: string;

  // Basic matchers
  protocol?: string;
  'src-address'?: string;
  'dst-address'?: string;
  'src-port'?: string;
  'dst-port'?: string;

  // Interfaces
  'in-interface'?: string;
  'out-interface'?: string;

  // Rate limiting
  limit?: string; // Format: "10/minute,5:packet" (rate, burst)

  // Action-specific
  'jump-target'?: string;
  'log-prefix'?: string;

  // Meta
  disabled?: string; // "true" or "false" as string
  comment?: string;

  // Counters
  packets?: string;
  bytes?: string;
}

// ============================================================================
// Transform Functions
// ============================================================================

/**
 * Parse RouterOS limit format to RateLimit type
 * Format: "10/minute,5:packet" or "10/minute"
 */
function parseRateLimit(limitStr?: string): RawRule['limit'] {
  if (!limitStr) return undefined;

  const [rate, burstStr] = limitStr.split(',');
  const burst = burstStr ? parseInt(burstStr.split(':')[0], 10) : undefined;

  return {
    rate,
    burst,
  };
}

/**
 * Convert RateLimit to RouterOS format
 */
function formatRateLimit(limit?: RawRule['limit']): string | undefined {
  if (!limit) return undefined;

  let formatted = limit.rate;
  if (limit.burst !== undefined) {
    formatted += `,${limit.burst}:packet`;
  }

  return formatted;
}

/**
 * Transform raw API response to RawRule type
 * Maps hyphenated keys to camelCase and converts string values
 */
function transformRawRule(raw: RawRawRule, index: number): RawRule {
  return {
    id: raw['.id'],
    chain: raw.chain as RawChain,
    action: raw.action as RawRule['action'],
    order: index, // Use array index as order for positioning

    // Basic matchers
    protocol: raw.protocol as RawRule['protocol'],
    srcAddress: raw['src-address'],
    dstAddress: raw['dst-address'],
    srcPort: raw['src-port'],
    dstPort: raw['dst-port'],

    // Interfaces
    inInterface: raw['in-interface'],
    outInterface: raw['out-interface'],

    // Rate limiting
    limit: parseRateLimit(raw.limit),

    // Action-specific
    jumpTarget: raw['jump-target'],
    logPrefix: raw['log-prefix'],

    // Meta
    disabled: raw.disabled === 'true',
    comment: raw.comment,

    // Counters
    packets: raw.packets ? parseInt(raw.packets, 10) : undefined,
    bytes: raw.bytes ? parseInt(raw.bytes, 10) : undefined,
  };
}

/**
 * Transform RawRule to RouterOS API format
 * Maps camelCase to hyphenated keys and converts values to strings
 */
function transformToRawRawRule(rule: Partial<RawRule>): Record<string, string> {
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

  // Rate limiting
  const formattedLimit = formatRateLimit(rule.limit);
  if (formattedLimit) raw.limit = formattedLimit;

  // Action-specific
  if (rule.jumpTarget) raw['jump-target'] = rule.jumpTarget;
  if (rule.logPrefix) raw['log-prefix'] = rule.logPrefix;

  // Meta
  if (rule.comment) raw.comment = rule.comment;
  if (rule.disabled !== undefined) raw.disabled = rule.disabled ? 'true' : 'false';

  return raw;
}

// ============================================================================
// Query Hook
// ============================================================================

/**
 * Fetch RAW rules from RouterOS via rosproxy
 * Endpoint: GET /rest/ip/firewall/raw
 *
 * @param routerId - Target router ID
 * @param chain - Optional filter by chain
 * @returns Array of RAW rules
 */
async function fetchRawRules(routerId: string, chain?: RawChain): Promise<RawRule[]> {
  const result = await makeRouterOSRequest<RawRawRule[]>(routerId, 'ip/firewall/raw');

  if (!result.success || !result.data) {
    throw new Error(result.error || 'Failed to fetch RAW rules');
  }

  const data = result.data;
  if (!Array.isArray(data)) return [];

  // Transform and optionally filter by chain
  let rules = data.map((raw: RawRawRule, index: number) => transformRawRule(raw, index));

  if (chain) {
    rules = rules.filter((rule: RawRule) => rule.chain === chain);
  }

  return rules;
}

/**
 * Hook to fetch RAW rules
 *
 * Configuration:
 * - staleTime: 300000ms (5 minutes) - RAW rules change infrequently
 * - Auto-refresh disabled - user must manually refresh
 * - Supports configurable polling via refetchInterval for counter updates
 *
 * @param routerId - Target router ID
 * @param options - Query options including chain filter, enabled state, and polling interval
 * @returns Query result with RawRule[] data
 */
interface UseRawRulesOptions {
  chain?: RawChain;
  enabled?: boolean;
  /**
   * Polling interval in milliseconds for real-time counter updates
   * Set to false to disable polling (default)
   * Recommended intervals: 5000, 10000, 30000, 60000 (5s, 10s, 30s, 60s)
   */
  refetchInterval?: number | false;
}

export function useRawRules(
  routerId: string,
  options?: UseRawRulesOptions
): UseQueryResult<RawRule[], Error> {
  return useQuery({
    queryKey: options?.chain
      ? rawRulesKeys.byChain(routerId, options.chain)
      : rawRulesKeys.all(routerId),
    queryFn: () => fetchRawRules(routerId, options?.chain),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!routerId && (options?.enabled ?? true),
    refetchInterval: options?.refetchInterval ?? false,
  });
}

/**
 * Fetch a single RAW rule by ID
 * Endpoint: GET /rest/ip/firewall/raw/:id
 *
 * @param routerId - Target router ID
 * @param ruleId - Rule ID
 * @returns Single RAW rule
 */
async function fetchRawRule(routerId: string, ruleId: string): Promise<RawRule> {
  const result = await makeRouterOSRequest<RawRawRule>(routerId, `ip/firewall/raw/${ruleId}`);

  if (!result.success || !result.data) {
    throw new Error(result.error || 'Failed to fetch RAW rule');
  }

  return transformRawRule(result.data, 0);
}

/**
 * Hook to fetch a single RAW rule
 *
 * @param routerId - Target router ID
 * @param ruleId - Rule ID
 * @param options - Query options
 * @returns Query result with RawRule data
 */
export function useRawRule(
  routerId: string,
  ruleId: string,
  options?: { enabled?: boolean }
): UseQueryResult<RawRule, Error> {
  return useQuery({
    queryKey: rawRulesKeys.detail(routerId, ruleId),
    queryFn: () => fetchRawRule(routerId, ruleId),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!routerId && !!ruleId && (options?.enabled ?? true),
  });
}

// ============================================================================
// Mutation Hooks
// ============================================================================

/**
 * Create a new RAW rule
 * Endpoint: POST /rest/ip/firewall/raw/add
 */
export function useCreateRawRule(routerId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (rule: Partial<RawRule>) => {
      const payload = transformToRawRawRule(rule);
      const result = await makeRouterOSRequest(routerId, 'ip/firewall/raw/add', {
        method: 'POST',
        body: payload,
      });

      if (!result.success) {
        throw new Error(result.error || 'Failed to create RAW rule');
      }

      return result.data;
    },
    onSuccess: () => {
      // Invalidate all RAW rules queries for this router
      queryClient.invalidateQueries({ queryKey: rawRulesKeys.all(routerId) });
    },
  });
}

/**
 * Update an existing RAW rule
 * Endpoint: POST /rest/ip/firewall/raw/set
 */
export function useUpdateRawRule(routerId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ ruleId, updates }: { ruleId: string; updates: Partial<RawRule> }) => {
      const payload = {
        '.id': ruleId,
        ...transformToRawRawRule(updates),
      };

      const result = await makeRouterOSRequest(routerId, 'ip/firewall/raw/set', {
        method: 'POST',
        body: payload,
      });

      if (!result.success) {
        throw new Error(result.error || 'Failed to update RAW rule');
      }

      return result.data;
    },
    onSuccess: (_, { ruleId }) => {
      queryClient.invalidateQueries({ queryKey: rawRulesKeys.all(routerId) });
      queryClient.invalidateQueries({ queryKey: rawRulesKeys.detail(routerId, ruleId) });
    },
  });
}

/**
 * Delete a RAW rule
 * Endpoint: POST /rest/ip/firewall/raw/remove
 */
export function useDeleteRawRule(routerId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ruleId: string) => {
      const result = await makeRouterOSRequest(routerId, 'ip/firewall/raw/remove', {
        method: 'POST',
        body: { '.id': ruleId },
      });

      if (!result.success) {
        throw new Error(result.error || 'Failed to delete RAW rule');
      }

      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rawRulesKeys.all(routerId) });
    },
  });
}

/**
 * Reorder RAW rules (drag-drop)
 * Endpoint: POST /rest/ip/firewall/raw/move
 */
export function useReorderRawRules(routerId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ ruleId, destination }: { ruleId: string; destination: number }) => {
      const result = await makeRouterOSRequest(routerId, 'ip/firewall/raw/move', {
        method: 'POST',
        body: {
          '.id': ruleId,
          destination: destination.toString(),
        },
      });

      if (!result.success) {
        throw new Error(result.error || 'Failed to reorder RAW rule');
      }

      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rawRulesKeys.all(routerId) });
    },
  });
}

/**
 * Toggle enable/disable state of a RAW rule (convenience wrapper)
 * Endpoint: POST /rest/ip/firewall/raw/set
 */
export function useToggleRawRule(routerId: string) {
  const updateMutation = useUpdateRawRule(routerId);

  return useMutation({
    mutationFn: async ({ ruleId, disabled }: { ruleId: string; disabled: boolean }) => {
      return updateMutation.mutateAsync({ ruleId, updates: { disabled } });
    },
  });
}

// ============================================================================
// Batch Operations
// ============================================================================

/**
 * Progress callback for batch operations
 */
export interface BatchProgress {
  current: number;
  total: number;
  percentage: number;
  currentItem?: string;
}

/**
 * Batch create RAW rules (for DDoS wizard, bogon filter)
 * Creates multiple rules sequentially with progress tracking
 *
 * @param routerId - Target router ID
 * @returns Mutation hook with progress tracking
 */
export function useBatchCreateRawRules(routerId: string) {
  const queryClient = useQueryClient();
  const createMutation = useCreateRawRule(routerId);

  return useMutation<
    { success: number; failed: number; errors: Error[] },
    Error,
    { rules: Partial<RawRule>[]; onProgress?: (progress: BatchProgress) => void }
  >({
    mutationFn: async ({ rules, onProgress }) => {
      const results = {
        success: 0,
        failed: 0,
        errors: [] as Error[],
      };

      for (let i = 0; i < rules.length; i++) {
        const rule = rules[i];

        // Report progress
        if (onProgress) {
          onProgress({
            current: i + 1,
            total: rules.length,
            percentage: ((i + 1) / rules.length) * 100,
            currentItem: rule.comment || `Rule ${i + 1}`,
          });
        }

        try {
          await createMutation.mutateAsync(rule);
          results.success++;
        } catch (error) {
          results.failed++;
          results.errors.push(error as Error);
        }
      }

      return results;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rawRulesKeys.all(routerId) });
    },
  });
}

/**
 * Batch delete RAW rules
 * Deletes multiple rules sequentially with progress tracking
 *
 * @param routerId - Target router ID
 * @returns Mutation hook with progress tracking
 */
export function useBatchDeleteRawRules(routerId: string) {
  const queryClient = useQueryClient();
  const deleteMutation = useDeleteRawRule(routerId);

  return useMutation<
    { success: number; failed: number; errors: Error[] },
    Error,
    { ruleIds: string[]; onProgress?: (progress: BatchProgress) => void }
  >({
    mutationFn: async ({ ruleIds, onProgress }) => {
      const results = {
        success: 0,
        failed: 0,
        errors: [] as Error[],
      };

      for (let i = 0; i < ruleIds.length; i++) {
        const ruleId = ruleIds[i];

        // Report progress
        if (onProgress) {
          onProgress({
            current: i + 1,
            total: ruleIds.length,
            percentage: ((i + 1) / ruleIds.length) * 100,
            currentItem: `Rule ${ruleId}`,
          });
        }

        try {
          await deleteMutation.mutateAsync(ruleId);
          results.success++;
        } catch (error) {
          results.failed++;
          results.errors.push(error as Error);
        }
      }

      return results;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rawRulesKeys.all(routerId) });
    },
  });
}

/**
 * Batch update RAW rules
 * Updates multiple rules sequentially with progress tracking
 *
 * @param routerId - Target router ID
 * @returns Mutation hook with progress tracking
 */
export function useBatchUpdateRawRules(routerId: string) {
  const queryClient = useQueryClient();
  const updateMutation = useUpdateRawRule(routerId);

  return useMutation<
    { success: number; failed: number; errors: Error[] },
    Error,
    { updates: Array<{ ruleId: string; updates: Partial<RawRule> }>; onProgress?: (progress: BatchProgress) => void }
  >({
    mutationFn: async ({ updates, onProgress }) => {
      const results = {
        success: 0,
        failed: 0,
        errors: [] as Error[],
      };

      for (let i = 0; i < updates.length; i++) {
        const update = updates[i];

        // Report progress
        if (onProgress) {
          onProgress({
            current: i + 1,
            total: updates.length,
            percentage: ((i + 1) / updates.length) * 100,
            currentItem: `Rule ${update.ruleId}`,
          });
        }

        try {
          await updateMutation.mutateAsync(update);
          results.success++;
        } catch (error) {
          results.failed++;
          results.errors.push(error as Error);
        }
      }

      return results;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rawRulesKeys.all(routerId) });
    },
  });
}
