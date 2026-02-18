/**
 * Rate Limiting Query Hooks
 * NAS-7.11: Implement Connection Rate Limiting
 *
 * Provides hooks for managing connection rate limiting, SYN flood protection,
 * and blocked IP statistics. Uses TanStack Query for data fetching and caching.
 *
 * @see Docs/sprint-artifacts/Epic7-Security-Firewall/NAS-7-11-implement-connection-rate-limiting.md
 */

import { useQuery, useMutation, useQueryClient, UseQueryResult } from '@tanstack/react-query';
import { makeRouterOSRequest } from '@nasnet/api-client/core';
import {
  RateLimitRule,
  RateLimitRuleInput,
  SynFloodConfig,
  BlockedIP,
  RateLimitStats,
  connectionRateToRouterOS,
  routerOSToConnectionRate,
} from '@nasnet/core/types';

// =============================================================================
// Types
// =============================================================================

/**
 * Raw filter rule from MikroTik RouterOS REST API
 */
interface RawFilterRule {
  '.id': string;
  chain?: string;
  action?: string;
  'connection-rate'?: string;
  'src-address'?: string;
  'src-address-list'?: string;
  'address-list'?: string;
  'address-list-timeout'?: string;
  comment?: string;
  disabled?: string; // "true" or "false" as string
  packets?: string; // Number as string
  bytes?: string; // Number as string
}

/**
 * Raw RAW firewall rule for SYN flood protection
 */
interface RawRAWRule {
  '.id': string;
  chain?: string;
  protocol?: string;
  'tcp-flags'?: string;
  'connection-state'?: string;
  limit?: string; // Format: "limit,burst" e.g., "100,5"
  action?: string;
  comment?: string;
  disabled?: string;
}

/**
 * Raw address list entry from RouterOS
 */
interface RawAddressListEntry {
  '.id': string;
  list: string;
  address: string;
  comment?: string;
  timeout?: string;
  'creation-time'?: string;
  dynamic?: string;
  disabled?: string;
}

/**
 * Input for creating a rate limit rule
 */
export interface CreateRateLimitRuleInput extends Omit<RateLimitRuleInput, 'id' | 'packets' | 'bytes'> {}

/**
 * Input for updating a rate limit rule
 */
export interface UpdateRateLimitRuleInput extends Partial<CreateRateLimitRuleInput> {
  id: string;
}

/**
 * Input for whitelisting an IP
 */
export interface WhitelistIPInput {
  address: string;
  timeout?: string; // e.g., "1h", "1d", "1w", or "" for permanent
  comment?: string;
}

// =============================================================================
// Query Keys
// =============================================================================

/**
 * Query keys for rate limiting operations
 * Follows TanStack Query best practices for hierarchical keys
 */
export const rateLimitingKeys = {
  all: (routerId: string) => ['rateLimiting', routerId] as const,
  rules: (routerId: string) => ['rateLimiting', 'rules', routerId] as const,
  synFlood: (routerId: string) => ['rateLimiting', 'synFlood', routerId] as const,
  stats: (routerId: string) => ['rateLimiting', 'stats', routerId] as const,
  blockedIPs: (routerId: string, listNames: string[]) =>
    ['rateLimiting', 'blockedIPs', routerId, listNames] as const,
};

// =============================================================================
// Transformation Functions
// =============================================================================

/**
 * Transform raw filter rule to RateLimitRule type
 * Maps hyphenated keys to camelCase and parses connection-rate string
 */
function transformRateLimitRule(raw: RawFilterRule): RateLimitRule | null {
  // Only process rules with connection-rate matcher
  if (!raw['connection-rate']) {
    return null;
  }

  const rate = routerOSToConnectionRate(raw['connection-rate']);
  if (!rate) {
    return null;
  }

  return {
    id: raw['.id'],
    srcAddress: raw['src-address'],
    srcAddressList: raw['src-address-list'],
    connectionLimit: rate.limit,
    timeWindow: rate.timeWindow,
    action: raw.action === 'add-src-to-address-list'
      ? 'add-to-list'
      : (raw.action as 'drop' | 'tarpit'),
    addressList: raw['address-list'],
    addressListTimeout: raw['address-list-timeout'],
    comment: raw.comment,
    disabled: raw.disabled === 'true',
    packets: raw.packets ? parseInt(raw.packets, 10) : undefined,
    bytes: raw.bytes ? parseInt(raw.bytes, 10) : undefined,
  };
}

/**
 * Transform raw RAW rule to SynFloodConfig
 * Parses limit parameter (e.g., "100,5" → synLimit=100, burst=5)
 */
function transformSynFloodConfig(raw: RawRAWRule | null): SynFloodConfig {
  if (!raw || raw.disabled === 'true') {
    return {
      enabled: false,
      synLimit: 100,
      burst: 5,
      action: 'drop',
    };
  }

  // Parse limit parameter: "100,5" → synLimit=100, burst=5
  const limitMatch = raw.limit?.match(/^(\d+),(\d+)$/);
  const synLimit = limitMatch ? parseInt(limitMatch[1], 10) : 100;
  const burst = limitMatch ? parseInt(limitMatch[2], 10) : 5;

  return {
    enabled: true,
    synLimit,
    burst,
    action: (raw.action as 'drop' | 'tarpit') || 'drop',
  };
}

/**
 * Transform raw address list entry to BlockedIP
 */
function transformBlockedIP(raw: RawAddressListEntry): BlockedIP {
  return {
    address: raw.address,
    list: raw.list,
    blockCount: 1, // Will be aggregated later
    firstBlocked: raw['creation-time'] ? new Date(raw['creation-time']) : undefined,
    lastBlocked: raw['creation-time'] ? new Date(raw['creation-time']) : undefined,
    timeout: raw.timeout || 'permanent',
    dynamic: raw.dynamic === 'true',
  };
}

// =============================================================================
// API Functions
// =============================================================================

/**
 * Fetch all firewall filter rules with connection-rate matcher
 */
async function fetchRateLimitRules(routerId: string): Promise<RateLimitRule[]> {
  const response = await makeRouterOSRequest<RawFilterRule[]>(
    routerId,
    'ip/firewall/filter',
    {
      params: {
        '.proplist': '.id,chain,action,connection-rate,src-address,src-address-list,address-list,address-list-timeout,comment,disabled,packets,bytes',
      },
    }
  );

  if (!response.success || !response.data) {
    throw new Error(response.error || 'Failed to fetch rate limit rules');
  }

  // Filter and transform only rules with connection-rate matcher
  const data = response.data;
  return data
    .map(transformRateLimitRule)
    .filter((rule): rule is RateLimitRule => rule !== null);
}

/**
 * Fetch SYN flood protection configuration from RAW table
 */
async function fetchSynFloodConfig(routerId: string): Promise<SynFloodConfig> {
  const response = await makeRouterOSRequest<RawRAWRule[]>(
    routerId,
    'ip/firewall/raw'
  );

  if (!response.success || !response.data) {
    throw new Error(response.error || 'Failed to fetch SYN flood config');
  }

  // Find rule with SYN flood protection comment
  const rawData = response.data;
  const synFloodRule = rawData.find((rule: RawRAWRule) =>
    rule.comment?.includes('SYN flood protection')
  );

  return transformSynFloodConfig(synFloodRule || null);
}

/**
 * Fetch rate limit statistics
 * Aggregates data from filter rules and address lists
 */
async function fetchRateLimitStats(routerId: string): Promise<RateLimitStats> {
  // Fetch all rate limit rules for counters
  const rules = await fetchRateLimitRules(routerId);

  // Calculate total blocked connections from packet counters
  const totalBlocked = rules.reduce((sum, rule) => sum + (rule.packets || 0), 0);

  // Extract address list names from rules
  const listNames = rules
    .filter((rule) => rule.action === 'add-to-list' && rule.addressList)
    .map((rule) => rule.addressList!);

  // Fetch blocked IPs from address lists
  let topBlockedIPs: BlockedIP[] = [];
  if (listNames.length > 0) {
    const blockedIPsResults = await Promise.all(
      listNames.map((listName) => fetchBlockedIPsForList(routerId, listName))
    );

    // Flatten and sort by block count
    topBlockedIPs = blockedIPsResults
      .flat()
      .sort((a, b) => b.blockCount - a.blockCount)
      .slice(0, 10); // Top 10
  }

  // Generate 24-hour timeline (hourly buckets)
  // For now, return empty array - would need historical data
  const triggerEvents: Array<{ hour: string; count: number }> = [];

  return {
    totalBlocked,
    topBlockedIPs,
    triggerEvents,
    lastUpdated: new Date(),
  };
}

/**
 * Fetch blocked IPs for a specific address list
 */
async function fetchBlockedIPsForList(routerId: string, listName: string): Promise<BlockedIP[]> {
  const response = await makeRouterOSRequest<RawAddressListEntry[]>(
    routerId,
    'ip/firewall/address-list',
    {
      params: {
        list: listName,
      },
    }
  );

  if (!response.success || !response.data) {
    return [];
  }

  const entries = response.data;
  return entries.map(transformBlockedIP);
}

/**
 * Fetch blocked IPs from multiple address lists
 */
async function fetchBlockedIPs(routerId: string, listNames: string[]): Promise<BlockedIP[]> {
  if (listNames.length === 0) {
    return [];
  }

  const results = await Promise.all(
    listNames.map((listName) => fetchBlockedIPsForList(routerId, listName))
  );

  return results.flat();
}

/**
 * Create a new rate limit rule
 */
async function createRateLimitRule(
  routerId: string,
  input: CreateRateLimitRuleInput
): Promise<RateLimitRule> {
  const connectionRate = connectionRateToRouterOS(input.connectionLimit, input.timeWindow);

  const body: Record<string, unknown> = {
    chain: 'input',
    action: input.action === 'add-to-list' ? 'add-src-to-address-list' : input.action,
    'connection-rate': connectionRate,
    disabled: input.disabled || false,
  };

  if (input.srcAddress) {
    body['src-address'] = input.srcAddress;
  }

  if (input.srcAddressList) {
    body['src-address-list'] = input.srcAddressList;
  }

  if (input.action === 'add-to-list' && input.addressList) {
    body['address-list'] = input.addressList;

    if (input.addressListTimeout) {
      body['address-list-timeout'] = input.addressListTimeout;
    }
  }

  if (input.comment) {
    body.comment = input.comment;
  }

  const response = await makeRouterOSRequest<{ ret: string }>(
    routerId,
    'ip/firewall/filter/add',
    {
      method: 'POST',
      body,
    }
  );

  if (!response.success || !response.data) {
    throw new Error(response.error || 'Failed to create rate limit rule');
  }

  const newId = response.data.ret;

  // Fetch the created rule
  const rules = await fetchRateLimitRules(routerId);
  const createdRule = rules.find((rule) => rule.id === newId);

  if (!createdRule) {
    throw new Error('Failed to fetch created rule');
  }

  return createdRule;
}

/**
 * Update an existing rate limit rule
 */
async function updateRateLimitRule(
  routerId: string,
  input: UpdateRateLimitRuleInput
): Promise<void> {
  const body: Record<string, unknown> = {
    '.id': input.id,
  };

  if (input.connectionLimit !== undefined && input.timeWindow !== undefined) {
    body['connection-rate'] = connectionRateToRouterOS(input.connectionLimit, input.timeWindow);
  }

  if (input.srcAddress !== undefined) {
    body['src-address'] = input.srcAddress;
  }

  if (input.srcAddressList !== undefined) {
    body['src-address-list'] = input.srcAddressList;
  }

  if (input.action !== undefined) {
    body.action = input.action === 'add-to-list' ? 'add-src-to-address-list' : input.action;
  }

  if (input.addressList !== undefined) {
    body['address-list'] = input.addressList;
  }

  if (input.addressListTimeout !== undefined) {
    body['address-list-timeout'] = input.addressListTimeout;
  }

  if (input.comment !== undefined) {
    body.comment = input.comment;
  }

  if (input.disabled !== undefined) {
    body.disabled = input.disabled;
  }

  await makeRouterOSRequest(
    routerId,
    'ip/firewall/filter/set',
    {
      method: 'POST',
      body,
    }
  );
}

/**
 * Delete a rate limit rule
 */
async function deleteRateLimitRule(routerId: string, ruleId: string): Promise<void> {
  await makeRouterOSRequest(
    routerId,
    'ip/firewall/filter/remove',
    {
      method: 'POST',
      body: {
        '.id': ruleId,
      },
    }
  );
}

/**
 * Toggle a rate limit rule (enable/disable)
 */
async function toggleRateLimitRule(routerId: string, ruleId: string, disabled: boolean): Promise<void> {
  await makeRouterOSRequest(
    routerId,
    'ip/firewall/filter/set',
    {
      method: 'POST',
      body: {
        '.id': ruleId,
        disabled,
      },
    }
  );
}

/**
 * Update SYN flood protection configuration
 */
async function updateSynFloodConfig(routerId: string, config: SynFloodConfig): Promise<void> {
  // Fetch existing SYN flood rule
  const response = await makeRouterOSRequest<RawRAWRule[]>(
    routerId,
    'ip/firewall/raw'
  );

  const rawRules = response.data;
  const existingRule = rawRules?.find((rule: RawRAWRule) =>
    rule.comment?.includes('SYN flood protection')
  );

  if (!config.enabled) {
    // Remove existing rule if disabling
    if (existingRule) {
      await makeRouterOSRequest(
        routerId,
        'ip/firewall/raw/remove',
        {
          method: 'POST',
          body: {
            '.id': existingRule['.id'],
          },
        }
      );
    }
    return;
  }

  // Build rule body
  const body: Record<string, unknown> = {
    chain: 'prerouting',
    protocol: 'tcp',
    'tcp-flags': 'syn',
    'connection-state': 'new',
    limit: `${config.synLimit},${config.burst}`,
    action: config.action,
    comment: 'SYN flood protection',
  };

  if (existingRule) {
    // Update existing rule
    await makeRouterOSRequest(
      routerId,
      'ip/firewall/raw/set',
      {
        method: 'POST',
        body: {
          '.id': existingRule['.id'],
          ...body,
        },
      }
    );
  } else {
    // Create new rule
    await makeRouterOSRequest(
      routerId,
      'ip/firewall/raw/add',
      {
        method: 'POST',
        body,
      }
    );
  }
}

/**
 * Whitelist an IP address
 */
async function whitelistIP(routerId: string, input: WhitelistIPInput): Promise<void> {
  await makeRouterOSRequest(
    routerId,
    'ip/firewall/address-list/add',
    {
      method: 'POST',
      body: {
        list: 'rate-limit-whitelist',
        address: input.address,
        timeout: input.timeout || '', // Empty string for permanent
        comment: input.comment,
      },
    }
  );
}

/**
 * Remove a blocked IP from address list
 */
async function removeBlockedIP(routerId: string, entryId: string): Promise<void> {
  await makeRouterOSRequest(
    routerId,
    'ip/firewall/address-list/remove',
    {
      method: 'POST',
      body: {
        '.id': entryId,
      },
    }
  );
}

// =============================================================================
// Query Hooks
// =============================================================================

/**
 * Hook to fetch all rate limit rules
 *
 * Fetches firewall filter rules with connection-rate matcher
 * Stale time: 30 seconds
 *
 * @param routerId - Target router IP address
 * @param options - Query options
 * @returns Query result with RateLimitRule[] data
 */
interface UseRateLimitRulesOptions {
  enabled?: boolean;
}

export function useRateLimitRules(
  routerId: string,
  options?: UseRateLimitRulesOptions
): UseQueryResult<RateLimitRule[], Error> {
  return useQuery({
    queryKey: rateLimitingKeys.rules(routerId),
    queryFn: () => fetchRateLimitRules(routerId),
    enabled: !!routerId && (options?.enabled ?? true),
    staleTime: 30_000, // 30 seconds
    refetchOnWindowFocus: true,
  });
}

/**
 * Hook to fetch SYN flood protection configuration
 *
 * Fetches RAW firewall rules for SYN flood protection
 * Stale time: 60 seconds
 *
 * @param routerId - Target router IP address
 * @param options - Query options
 * @returns Query result with SynFloodConfig data
 */
interface UseSynFloodConfigOptions {
  enabled?: boolean;
}

export function useSynFloodConfig(
  routerId: string,
  options?: UseSynFloodConfigOptions
): UseQueryResult<SynFloodConfig, Error> {
  return useQuery({
    queryKey: rateLimitingKeys.synFlood(routerId),
    queryFn: () => fetchSynFloodConfig(routerId),
    enabled: !!routerId && (options?.enabled ?? true),
    staleTime: 60_000, // 60 seconds
    refetchOnWindowFocus: true,
  });
}

/**
 * Hook to fetch rate limit statistics
 *
 * Aggregates counters and blocked IPs from rate limit rules
 * Stale time: 5 seconds (for polling)
 *
 * @param routerId - Target router IP address
 * @param options - Query options with polling interval
 * @returns Query result with RateLimitStats data
 */
interface UseRateLimitStatsOptions {
  enabled?: boolean;
  pollingInterval?: number; // milliseconds
}

export function useRateLimitStats(
  routerId: string,
  options?: UseRateLimitStatsOptions
): UseQueryResult<RateLimitStats, Error> {
  return useQuery({
    queryKey: rateLimitingKeys.stats(routerId),
    queryFn: () => fetchRateLimitStats(routerId),
    enabled: !!routerId && (options?.enabled ?? true),
    staleTime: 5_000, // 5 seconds
    refetchInterval: options?.pollingInterval ?? 5_000, // Poll every 5 seconds by default
    refetchOnWindowFocus: false, // Polling handles updates
  });
}

/**
 * Hook to fetch blocked IPs from address lists
 *
 * Fetches IPs from specified address lists
 * Stale time: 30 seconds
 *
 * @param routerId - Target router IP address
 * @param listNames - Array of address list names
 * @param options - Query options
 * @returns Query result with BlockedIP[] data
 */
interface UseBlockedIPsOptions {
  enabled?: boolean;
}

export function useBlockedIPs(
  routerId: string,
  listNames: string[],
  options?: UseBlockedIPsOptions
): UseQueryResult<BlockedIP[], Error> {
  return useQuery({
    queryKey: rateLimitingKeys.blockedIPs(routerId, listNames),
    queryFn: () => fetchBlockedIPs(routerId, listNames),
    enabled: !!routerId && listNames.length > 0 && (options?.enabled ?? true),
    staleTime: 30_000, // 30 seconds
  });
}

// =============================================================================
// Mutation Hooks
// =============================================================================

/**
 * Hook to create a new rate limit rule
 *
 * Automatically invalidates rate limit rules and stats queries
 * Uses optimistic updates for instant UI feedback
 *
 * @returns Mutation function and state
 */
export function useCreateRateLimitRule(routerId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateRateLimitRuleInput) => createRateLimitRule(routerId, input),
    onSuccess: () => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: rateLimitingKeys.rules(routerId) });
      queryClient.invalidateQueries({ queryKey: rateLimitingKeys.stats(routerId) });
    },
  });
}

/**
 * Hook to update an existing rate limit rule
 *
 * Automatically invalidates rate limit rules query
 * Uses optimistic updates for instant UI feedback
 *
 * @returns Mutation function and state
 */
export function useUpdateRateLimitRule(routerId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateRateLimitRuleInput) => updateRateLimitRule(routerId, input),
    onMutate: async (input) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: rateLimitingKeys.rules(routerId) });

      // Snapshot previous value
      const previousRules = queryClient.getQueryData<RateLimitRule[]>(
        rateLimitingKeys.rules(routerId)
      );

      // Optimistically update
      if (previousRules) {
        queryClient.setQueryData<RateLimitRule[]>(
          rateLimitingKeys.rules(routerId),
          previousRules.map((rule) =>
            rule.id === input.id ? { ...rule, ...input } : rule
          )
        );
      }

      return { previousRules };
    },
    onError: (_error, _input, context) => {
      // Rollback on error
      if (context?.previousRules) {
        queryClient.setQueryData(rateLimitingKeys.rules(routerId), context.previousRules);
      }
    },
    onSettled: () => {
      // Refetch after mutation
      queryClient.invalidateQueries({ queryKey: rateLimitingKeys.rules(routerId) });
    },
  });
}

/**
 * Hook to delete a rate limit rule
 *
 * Automatically invalidates rate limit rules and stats queries
 * Uses optimistic updates for instant UI feedback
 *
 * @returns Mutation function and state
 */
export function useDeleteRateLimitRule(routerId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ruleId: string) => deleteRateLimitRule(routerId, ruleId),
    onMutate: async (ruleId) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: rateLimitingKeys.rules(routerId) });

      // Snapshot previous value
      const previousRules = queryClient.getQueryData<RateLimitRule[]>(
        rateLimitingKeys.rules(routerId)
      );

      // Optimistically remove rule
      if (previousRules) {
        queryClient.setQueryData<RateLimitRule[]>(
          rateLimitingKeys.rules(routerId),
          previousRules.filter((rule) => rule.id !== ruleId)
        );
      }

      return { previousRules };
    },
    onError: (_error, _ruleId, context) => {
      // Rollback on error
      if (context?.previousRules) {
        queryClient.setQueryData(rateLimitingKeys.rules(routerId), context.previousRules);
      }
    },
    onSettled: () => {
      // Refetch after mutation
      queryClient.invalidateQueries({ queryKey: rateLimitingKeys.rules(routerId) });
      queryClient.invalidateQueries({ queryKey: rateLimitingKeys.stats(routerId) });
    },
  });
}

/**
 * Hook to toggle a rate limit rule (enable/disable)
 *
 * Automatically invalidates rate limit rules query
 * Uses optimistic updates for instant UI feedback
 *
 * @returns Mutation function and state
 */
export function useToggleRateLimitRule(routerId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ ruleId, disabled }: { ruleId: string; disabled: boolean }) =>
      toggleRateLimitRule(routerId, ruleId, disabled),
    onMutate: async ({ ruleId, disabled }) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: rateLimitingKeys.rules(routerId) });

      // Snapshot previous value
      const previousRules = queryClient.getQueryData<RateLimitRule[]>(
        rateLimitingKeys.rules(routerId)
      );

      // Optimistically toggle disabled field
      if (previousRules) {
        queryClient.setQueryData<RateLimitRule[]>(
          rateLimitingKeys.rules(routerId),
          previousRules.map((rule) =>
            rule.id === ruleId ? { ...rule, disabled } : rule
          )
        );
      }

      return { previousRules };
    },
    onError: (_error, _input, context) => {
      // Rollback on error
      if (context?.previousRules) {
        queryClient.setQueryData(rateLimitingKeys.rules(routerId), context.previousRules);
      }
    },
    onSettled: () => {
      // Refetch after mutation (only on success due to optimistic update)
      queryClient.invalidateQueries({ queryKey: rateLimitingKeys.rules(routerId) });
    },
  });
}

/**
 * Hook to update SYN flood protection configuration
 *
 * Automatically invalidates SYN flood config query
 *
 * @returns Mutation function and state
 */
export function useUpdateSynFloodConfig(routerId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (config: SynFloodConfig) => updateSynFloodConfig(routerId, config),
    onSuccess: () => {
      // Invalidate SYN flood config query
      queryClient.invalidateQueries({ queryKey: rateLimitingKeys.synFlood(routerId) });
    },
  });
}

/**
 * Hook to whitelist an IP address
 *
 * Automatically invalidates blocked IPs and address lists queries
 *
 * @returns Mutation function and state
 */
export function useWhitelistIP(routerId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: WhitelistIPInput) => whitelistIP(routerId, input),
    onSuccess: () => {
      // Invalidate blocked IPs queries
      queryClient.invalidateQueries({ queryKey: ['rateLimiting', 'blockedIPs', routerId] });
      // Invalidate address lists (from Story 7.3)
      queryClient.invalidateQueries({ queryKey: ['addressLists', routerId] });
    },
  });
}

/**
 * Hook to remove a blocked IP from address list
 *
 * Automatically invalidates blocked IPs and stats queries
 *
 * @returns Mutation function and state
 */
export function useRemoveBlockedIP(routerId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (entryId: string) => removeBlockedIP(routerId, entryId),
    onSuccess: () => {
      // Invalidate blocked IPs queries
      queryClient.invalidateQueries({ queryKey: ['rateLimiting', 'blockedIPs', routerId] });
      // Invalidate stats
      queryClient.invalidateQueries({ queryKey: rateLimitingKeys.stats(routerId) });
    },
  });
}
