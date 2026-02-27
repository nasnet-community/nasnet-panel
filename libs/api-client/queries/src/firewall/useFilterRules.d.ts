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
import { UseQueryResult } from '@tanstack/react-query';
import type { FilterRule, FilterChain } from '@nasnet/core/types';
/**
 * Query keys for firewall queries
 * Follows TanStack Query best practices for hierarchical keys
 */
export declare const firewallKeys: {
  all: (routerId: string) => readonly ['firewall', string];
  filter: (
    routerId: string,
    chain?: FilterChain
  ) => readonly ['firewall', string, 'filter', 'input' | 'forward' | 'output' | undefined];
  nat: (routerId: string) => readonly ['firewall', string, 'nat'];
  counters: (routerId: string) => readonly ['firewall', string, 'counters'];
};
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
export declare function useFilterRules(
  routerId: string,
  options?: UseFilterRulesOptions
): UseQueryResult<FilterRule[], Error>;
/**
 * Create a new filter rule
 * Endpoint: POST /rest/ip/firewall/filter/add
 */
export declare function useCreateFilterRule(
  routerId: string
): import('@tanstack/react-query').UseMutationResult<
  unknown,
  Error,
  Partial<{
    log: boolean;
    chain: 'input' | 'forward' | 'output';
    action: 'passthrough' | 'accept' | 'drop' | 'jump' | 'log' | 'reject' | 'tarpit';
    disabled: boolean;
    id?: string | undefined;
    protocol?: 'tcp' | 'udp' | 'icmp' | 'ipv6-icmp' | 'all' | undefined;
    srcAddress?: string | undefined;
    dstAddress?: string | undefined;
    srcPort?: string | undefined;
    dstPort?: string | undefined;
    srcAddressList?: string | undefined;
    dstAddressList?: string | undefined;
    inInterface?: string | undefined;
    outInterface?: string | undefined;
    inInterfaceList?: string | undefined;
    outInterfaceList?: string | undefined;
    connectionState?: ('established' | 'new' | 'related' | 'invalid' | 'untracked')[] | undefined;
    jumpTarget?: string | undefined;
    comment?: string | undefined;
    logPrefix?: string | undefined;
    packets?: number | undefined;
    bytes?: number | undefined;
    order?: number | undefined;
  }>,
  unknown
>;
/**
 * Update an existing filter rule
 * Endpoint: POST /rest/ip/firewall/filter/set
 */
export declare function useUpdateFilterRule(
  routerId: string
): import('@tanstack/react-query').UseMutationResult<
  unknown,
  Error,
  {
    ruleId: string;
    updates: Partial<FilterRule>;
  },
  unknown
>;
/**
 * Delete a filter rule
 * Endpoint: POST /rest/ip/firewall/filter/remove
 */
export declare function useDeleteFilterRule(
  routerId: string
): import('@tanstack/react-query').UseMutationResult<unknown, Error, string, unknown>;
/**
 * Move a filter rule to a new position (drag-drop reordering)
 * Endpoint: POST /rest/ip/firewall/filter/move
 */
export declare function useMoveFilterRule(
  routerId: string
): import('@tanstack/react-query').UseMutationResult<
  unknown,
  Error,
  {
    ruleId: string;
    destination: number;
  },
  unknown
>;
/**
 * Toggle enable/disable state of a filter rule (convenience wrapper)
 * Endpoint: POST /rest/ip/firewall/filter/set
 */
export declare function useToggleFilterRule(
  routerId: string
): import('@tanstack/react-query').UseMutationResult<
  unknown,
  Error,
  {
    ruleId: string;
    disabled: boolean;
  },
  unknown
>;
export {};
//# sourceMappingURL=useFilterRules.d.ts.map
