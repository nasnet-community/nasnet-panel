/**
 * Firewall Logs Query Hooks
 * Fetches and transforms firewall log entries from RouterOS
 * Uses rosproxy backend for RouterOS API communication
 *
 * Firewall logs contain information about packets matched by firewall rules,
 * including source/destination IPs and ports, protocols, interfaces, and actions taken.
 *
 * @see libs/core/types/src/firewall/firewall-log.types.ts
 * @see libs/core/utils/src/firewall/parse-firewall-log.ts
 */
import { UseQueryResult } from '@tanstack/react-query';
import type { FirewallLogEntry, FirewallLogChain, InferredAction } from '@nasnet/core/types';
/**
 * Query keys for firewall logs
 * Follows TanStack Query best practices for hierarchical keys
 */
export declare const firewallLogKeys: {
  all: (routerId: string) => readonly ['firewall', string, 'logs'];
  list: (
    routerId: string,
    filters?: FirewallLogFilters
  ) => readonly ['firewall', string, 'logs', 'list', FirewallLogFilters | undefined];
  stats: (routerId: string) => readonly ['firewall', string, 'logs', 'stats'];
};
/**
 * Client-side filtering options for firewall logs
 */
export interface FirewallLogFilters {
  /**
   * Filter by chain (input/forward/output)
   */
  chain?: FirewallLogChain;
  /**
   * Filter by action (accept/drop/reject/unknown)
   */
  action?: InferredAction;
  /**
   * Filter by source IP (supports wildcards: 192.168.*.*)
   */
  srcIp?: string;
  /**
   * Filter by destination IP (supports wildcards: 10.0.*.*)
   */
  dstIp?: string;
  /**
   * Filter by port (single port or range: "80" or "8000-9000")
   */
  port?: string;
  /**
   * Filter by log prefix
   */
  prefix?: string;
  /**
   * Maximum number of entries to return (client-side limit)
   * Default: 100, Max: 500
   */
  limit?: number;
}
/**
 * Hook options for useFirewallLogs
 */
export interface UseFirewallLogsOptions {
  /**
   * Client-side filters
   */
  filters?: FirewallLogFilters;
  /**
   * Enable/disable the query
   */
  enabled?: boolean;
  /**
   * Polling interval in milliseconds
   * Default: 5000 (5 seconds)
   * Set to false to disable polling
   */
  refetchInterval?: number | false;
  /**
   * Maximum entries per API request
   * Default: 500
   */
  pageSize?: number;
}
/**
 * Statistics for firewall logs
 */
export interface FirewallLogStats {
  /**
   * Top blocked IPs (top 10)
   */
  topBlockedIps: Array<{
    ip: string;
    count: number;
  }>;
  /**
   * Top destination ports (top 10)
   */
  topPorts: Array<{
    port: number;
    count: number;
    protocol: string;
  }>;
  /**
   * Action distribution counts
   */
  actionCounts: {
    accept: number;
    drop: number;
    reject: number;
    unknown: number;
  };
  /**
   * Total log entries
   */
  total: number;
}
/**
 * Hook to fetch firewall logs with polling and filtering
 *
 * Configuration:
 * - staleTime: 1000ms (1 second) - logs change frequently
 * - Polling enabled by default (5 seconds)
 * - Client-side filtering for IP wildcards, port ranges, etc.
 * - Rate limiting (max 100 entries by default, 500 max)
 *
 * @param routerId - Target router ID
 * @param options - Query options including filters, polling interval, and page size
 * @returns Query result with FirewallLogEntry[] data
 *
 * @example
 * const { data: logs, isLoading } = useFirewallLogs('router-1', {
 *   filters: {
 *     action: 'drop',
 *     srcIp: '192.168.*.*',
 *     limit: 50,
 *   },
 *   refetchInterval: 5000, // Poll every 5 seconds
 * });
 */
export declare function useFirewallLogs(
  routerId: string,
  options?: UseFirewallLogsOptions
): UseQueryResult<FirewallLogEntry[], Error>;
/**
 * Hook to compute firewall log statistics
 *
 * Aggregates log data to provide insights:
 * - Top blocked IPs (top 10)
 * - Top destination ports (top 10)
 * - Action distribution counts
 *
 * @param routerId - Target router ID
 * @param options - Query options (inherits from useFirewallLogs)
 * @returns Query result with FirewallLogStats data
 *
 * @example
 * const { data: stats } = useFirewallLogStats('router-1');
 * console.log(stats?.topBlockedIps); // [{ ip: '1.2.3.4', count: 42 }, ...]
 */
export declare function useFirewallLogStats(
  routerId: string,
  options?: Omit<UseFirewallLogsOptions, 'filters'>
): UseQueryResult<FirewallLogStats, Error>;
//# sourceMappingURL=useFirewallLogs.d.ts.map
