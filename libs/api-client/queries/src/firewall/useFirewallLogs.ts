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

import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { makeRouterOSRequest } from '@nasnet/api-client/core';
import { parseFirewallLogMessage } from '@nasnet/core-utils';
import type {
  FirewallLogEntry,
  ParsedFirewallLog,
  FirewallLogChain,
  InferredAction,
  LogSeverity,
} from '@nasnet/core/types';
import { useMemo } from 'react';

// ============================================================================
// Query Keys
// ============================================================================

/**
 * Query keys for firewall logs
 * Follows TanStack Query best practices for hierarchical keys
 */
export const firewallLogKeys = {
  all: (routerId: string) => ['firewall', routerId, 'logs'] as const,
  list: (routerId: string, filters?: FirewallLogFilters) =>
    [...firewallLogKeys.all(routerId), 'list', filters] as const,
  stats: (routerId: string) => [...firewallLogKeys.all(routerId), 'stats'] as const,
};

// ============================================================================
// Types
// ============================================================================

/**
 * Raw log entry from RouterOS /log endpoint
 */
interface RawLogEntry {
  '.id': string;
  time: string;
  topics: string;
  message: string;
}

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
  topBlockedIps: Array<{ ip: string; count: number }>;

  /**
   * Top destination ports (top 10)
   */
  topPorts: Array<{ port: number; count: number; protocol: string }>;

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

// ============================================================================
// Transform Functions
// ============================================================================

/**
 * Transform raw log entry to FirewallLogEntry
 * Parses the message using parseFirewallLogMessage()
 */
function transformLogEntry(raw: RawLogEntry): FirewallLogEntry | null {
  try {
    // Only process firewall logs
    if (!raw.topics.includes('firewall')) {
      return null;
    }

    // Parse the log message
    const parsed = parseFirewallLogMessage(raw.message);

    // Create timestamp from RouterOS time format
    const timestamp = parseRouterOSTime(raw.time);

    return {
      id: raw['.id'],
      timestamp,
      topic: 'firewall',
      severity: 'info' as LogSeverity, // RouterOS firewall logs are typically info level
      message: raw.message,
      parsed,
    };
  } catch (error) {
    // Failed to parse - return null to filter out invalid entries
    return null;
  }
}

/**
 * Parse RouterOS time format to Date
 * RouterOS returns time in various formats (relative or absolute)
 */
function parseRouterOSTime(time: string): Date {
  // Try parsing as ISO date
  const isoDate = new Date(time);
  if (!isNaN(isoDate.getTime())) {
    return isoDate;
  }

  // Fallback to current time if parsing fails
  return new Date();
}

/**
 * Check if IP matches pattern (supports wildcards)
 * Examples: "192.168.*.*", "10.0.0.*"
 */
function matchesIPPattern(ip: string | undefined, pattern: string): boolean {
  if (!ip) return false;

  const regexPattern = pattern
    .split('.')
    .map(part => (part === '*' ? '\\d{1,3}' : part))
    .join('\\.');

  const regex = new RegExp(`^${regexPattern}$`);
  return regex.test(ip);
}

/**
 * Check if port is in range
 * Supports single port ("80") or range ("8000-9000")
 */
function matchesPortRange(port: number | undefined, range: string): boolean {
  if (!port) return false;

  if (range.includes('-')) {
    const [min, max] = range.split('-').map(p => parseInt(p.trim(), 10));
    return port >= min && port <= max;
  }

  return port === parseInt(range, 10);
}

/**
 * Apply client-side filters to log entries
 */
function applyFilters(
  entries: FirewallLogEntry[],
  filters: FirewallLogFilters = {}
): FirewallLogEntry[] {
  let filtered = entries;

  // Filter by chain
  if (filters.chain) {
    filtered = filtered.filter(entry => entry.parsed?.chain === filters.chain);
  }

  // Filter by action
  if (filters.action) {
    filtered = filtered.filter(entry => entry.parsed?.action === filters.action);
  }

  // Filter by source IP (with wildcard support)
  if (filters.srcIp) {
    filtered = filtered.filter(entry =>
      entry.parsed && matchesIPPattern(entry.parsed.srcIp, filters.srcIp!)
    );
  }

  // Filter by destination IP (with wildcard support)
  if (filters.dstIp) {
    filtered = filtered.filter(entry =>
      entry.parsed && matchesIPPattern(entry.parsed.dstIp, filters.dstIp!)
    );
  }

  // Filter by port (supports ranges)
  if (filters.port) {
    filtered = filtered.filter(entry =>
      entry.parsed && (
        matchesPortRange(entry.parsed.srcPort, filters.port!) ||
        matchesPortRange(entry.parsed.dstPort, filters.port!)
      )
    );
  }

  // Filter by prefix
  if (filters.prefix) {
    const prefixLower = filters.prefix.toLowerCase();
    filtered = filtered.filter(entry =>
      entry.parsed?.prefix?.toLowerCase().includes(prefixLower)
    );
  }

  // Apply rate limiting (max entries per render)
  const limit = Math.min(filters.limit || 100, 500);
  return filtered.slice(0, limit);
}

// ============================================================================
// Query Hook
// ============================================================================

/**
 * Fetch firewall logs from RouterOS via rosproxy
 * Endpoint: GET /rest/log
 *
 * @param routerId - Target router ID
 * @param pageSize - Maximum entries per request (default: 500)
 * @returns Array of firewall log entries
 */
async function fetchFirewallLogs(
  routerId: string,
  pageSize: number = 500
): Promise<FirewallLogEntry[]> {
  const result = await makeRouterOSRequest<RawLogEntry[]>(routerId, 'log', {
    params: {
      topics: 'firewall',
      '.proplist': '.id,time,topics,message',
    },
  });

  if (!result.success || !result.data) {
    throw new Error(result.error || 'Failed to fetch firewall logs');
  }

  const data = result.data;
  if (!Array.isArray(data)) return [];

  // Transform and filter out null entries
  const entries = data
    .map(transformLogEntry)
    .filter((entry): entry is FirewallLogEntry => entry !== null)
    .slice(0, pageSize); // Limit at API level

  return entries;
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
export function useFirewallLogs(
  routerId: string,
  options?: UseFirewallLogsOptions
): UseQueryResult<FirewallLogEntry[], Error> {
  const pageSize = Math.min(options?.pageSize || 500, 500);

  const query = useQuery({
    queryKey: firewallLogKeys.list(routerId, options?.filters),
    queryFn: () => fetchFirewallLogs(routerId, pageSize),
    staleTime: 1000, // 1 second - logs change frequently
    enabled: !!routerId && (options?.enabled ?? true),
    refetchInterval: options?.refetchInterval ?? 5000, // Default 5s polling
  });

  // Apply client-side filters
  const filteredData = useMemo(() => {
    if (!query.data) return [];
    return applyFilters(query.data, options?.filters);
  }, [query.data, options?.filters]);

  return {
    ...query,
    data: filteredData,
  } as UseQueryResult<FirewallLogEntry[], Error>;
}

// ============================================================================
// Statistics Hook
// ============================================================================

/**
 * Compute statistics from firewall log entries
 */
function computeStats(entries: FirewallLogEntry[]): FirewallLogStats {
  // Count actions
  const actionCounts = {
    accept: 0,
    drop: 0,
    reject: 0,
    unknown: 0,
  };

  // Track IPs and ports
  const ipCounts = new Map<string, number>();
  const portCounts = new Map<string, number>(); // key: "port:protocol"

  for (const entry of entries) {
    const { parsed } = entry;

    // Skip entries without parsed data
    if (!parsed) continue;

    // Count actions
    actionCounts[parsed.action]++;

    // Count blocked IPs (drop/reject actions)
    if (parsed.action === 'drop' || parsed.action === 'reject') {
      if (parsed.srcIp) {
        ipCounts.set(parsed.srcIp, (ipCounts.get(parsed.srcIp) || 0) + 1);
      }
    }

    // Count destination ports
    if (parsed.dstPort) {
      const key = `${parsed.dstPort}:${parsed.protocol}`;
      portCounts.set(key, (portCounts.get(key) || 0) + 1);
    }
  }

  // Get top 10 blocked IPs
  const topBlockedIps = Array.from(ipCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([ip, count]) => ({ ip, count }));

  // Get top 10 ports
  const topPorts = Array.from(portCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([key, count]) => {
      const [portStr, protocol] = key.split(':');
      return {
        port: parseInt(portStr, 10),
        protocol,
        count,
      };
    });

  return {
    topBlockedIps,
    topPorts,
    actionCounts,
    total: entries.length,
  };
}

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
export function useFirewallLogStats(
  routerId: string,
  options?: Omit<UseFirewallLogsOptions, 'filters'>
): UseQueryResult<FirewallLogStats, Error> {
  const query = useQuery({
    queryKey: firewallLogKeys.stats(routerId),
    queryFn: () => fetchFirewallLogs(routerId, options?.pageSize || 500),
    staleTime: 1000,
    enabled: !!routerId && (options?.enabled ?? true),
    refetchInterval: options?.refetchInterval ?? 5000,
  });

  // Compute stats from raw data
  const stats = useMemo(() => {
    if (!query.data) return null;
    return computeStats(query.data);
  }, [query.data]);

  return {
    ...query,
    data: stats ?? undefined,
  } as unknown as UseQueryResult<FirewallLogStats, Error>;
}
