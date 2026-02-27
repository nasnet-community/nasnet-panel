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
import { UseQueryResult, UseMutationResult } from '@tanstack/react-query';
import type { RawRule, RawChain } from '@nasnet/core/types';
/**
 * Query keys for RAW rule queries
 * Follows TanStack Query best practices for hierarchical keys
 */
export declare const rawRulesKeys: {
  all: (routerId: string) => readonly ['raw', string];
  byChain: (routerId: string, chain: RawChain) => readonly ['raw', string, 'prerouting' | 'output'];
  detail: (routerId: string, ruleId: string) => readonly ['raw', string, string];
};
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
export declare function useRawRules(
  routerId: string,
  options?: UseRawRulesOptions
): UseQueryResult<RawRule[], Error>;
/**
 * Hook to fetch a single RAW rule
 *
 * @param routerId - Target router ID
 * @param ruleId - Rule ID
 * @param options - Query options
 * @returns Query result with RawRule data
 */
export declare function useRawRule(
  routerId: string,
  ruleId: string,
  options?: {
    enabled?: boolean;
  }
): UseQueryResult<RawRule, Error>;
/**
 * Create a new RAW rule
 * Endpoint: POST /rest/ip/firewall/raw/add
 */
export declare function useCreateRawRule(routerId: string): UseMutationResult<
  unknown,
  Error,
  Partial<{
    chain: 'prerouting' | 'output';
    action: 'accept' | 'drop' | 'jump' | 'log' | 'notrack';
    disabled: boolean;
    id?: string | undefined;
    protocol?: 'tcp' | 'udp' | 'icmp' | 'ipv6-icmp' | 'all' | undefined;
    srcAddress?: string | undefined;
    dstAddress?: string | undefined;
    srcPort?: string | undefined;
    dstPort?: string | undefined;
    inInterface?: string | undefined;
    outInterface?: string | undefined;
    jumpTarget?: string | undefined;
    comment?: string | undefined;
    logPrefix?: string | undefined;
    packets?: number | undefined;
    bytes?: number | undefined;
    order?: number | undefined;
    limit?:
      | {
          rate: string;
          burst?: number | undefined;
        }
      | undefined;
  }>,
  unknown
>;
/**
 * Update an existing RAW rule
 * Endpoint: POST /rest/ip/firewall/raw/set
 */
export declare function useUpdateRawRule(routerId: string): UseMutationResult<
  unknown,
  Error,
  {
    ruleId: string;
    updates: Partial<RawRule>;
  },
  unknown
>;
/**
 * Delete a RAW rule
 * Endpoint: POST /rest/ip/firewall/raw/remove
 */
export declare function useDeleteRawRule(
  routerId: string
): UseMutationResult<unknown, Error, string, unknown>;
/**
 * Reorder RAW rules (drag-drop)
 * Endpoint: POST /rest/ip/firewall/raw/move
 */
export declare function useReorderRawRules(routerId: string): UseMutationResult<
  unknown,
  Error,
  {
    ruleId: string;
    destination: number;
  },
  unknown
>;
/**
 * Toggle enable/disable state of a RAW rule (convenience wrapper)
 * Endpoint: POST /rest/ip/firewall/raw/set
 */
export declare function useToggleRawRule(routerId: string): UseMutationResult<
  unknown,
  Error,
  {
    ruleId: string;
    disabled: boolean;
  },
  unknown
>;
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
export declare function useBatchCreateRawRules(routerId: string): UseMutationResult<
  {
    success: number;
    failed: number;
    errors: Error[];
  },
  Error,
  {
    rules: Partial<RawRule>[];
    onProgress?: (progress: BatchProgress) => void;
  },
  unknown
>;
/**
 * Batch delete RAW rules
 * Deletes multiple rules sequentially with progress tracking
 *
 * @param routerId - Target router ID
 * @returns Mutation hook with progress tracking
 */
export declare function useBatchDeleteRawRules(routerId: string): UseMutationResult<
  {
    success: number;
    failed: number;
    errors: Error[];
  },
  Error,
  {
    ruleIds: string[];
    onProgress?: (progress: BatchProgress) => void;
  },
  unknown
>;
/**
 * Batch update RAW rules
 * Updates multiple rules sequentially with progress tracking
 *
 * @param routerId - Target router ID
 * @returns Mutation hook with progress tracking
 */
export declare function useBatchUpdateRawRules(routerId: string): UseMutationResult<
  {
    success: number;
    failed: number;
    errors: Error[];
  },
  Error,
  {
    updates: Array<{
      ruleId: string;
      updates: Partial<RawRule>;
    }>;
    onProgress?: (progress: BatchProgress) => void;
  },
  unknown
>;
export {};
//# sourceMappingURL=useRawRules.d.ts.map
