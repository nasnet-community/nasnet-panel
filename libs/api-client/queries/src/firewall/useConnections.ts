/**
 * TanStack Query hook for fetching active firewall connections
 * NAS-7.4: Connection Tracking - Query Layer
 * Uses rosproxy backend for RouterOS API communication
 *
 * Endpoint: GET /rest/ip/firewall/connection
 */

import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { makeRouterOSRequest } from '@nasnet/api-client/core';
import type { Connection, ConnectionFilters, ConnectionTrackingState } from '@nasnet/core/types';
import { firewallConnectionKeys } from './queryKeys';

// ============================================================================
// Raw API Types
// ============================================================================

/**
 * Raw API response structure from MikroTik RouterOS
 * RouterOS REST API returns hyphenated keys that need transformation
 */
interface RawConnection {
  '.id': string;
  protocol: string;
  'src-address': string;
  'src-port'?: string;
  'dst-address': string;
  'dst-port'?: string;
  'reply-dst-address'?: string;
  'reply-dst-port'?: string;
  'connection-state'?: string;
  timeout: string;
  packets?: string;
  bytes?: string;
  assured?: string; // "true" or "false"
  confirmed?: string; // "true" or "false"
}

// ============================================================================
// Transform Functions
// ============================================================================

/**
 * Extract IP address from "ip:port" or "ip" format
 */
function parseAddress(address: string): { ip: string; port?: number } {
  const parts = address.split(':');
  return {
    ip: parts[0],
    port: parts[1] ? parseInt(parts[1], 10) : undefined,
  };
}

/**
 * Transform raw API response to Connection type
 * Maps hyphenated keys to camelCase and converts string values
 */
function transformConnection(raw: RawConnection): Connection {
  const srcParsed = parseAddress(raw['src-address']);
  const dstParsed = parseAddress(raw['dst-address']);
  const replyDstParsed = raw['reply-dst-address']
    ? parseAddress(raw['reply-dst-address'])
    : { ip: undefined, port: undefined };

  return {
    id: raw['.id'],
    protocol: raw.protocol,
    srcAddress: srcParsed.ip,
    srcPort: srcParsed.port || (raw['src-port'] ? parseInt(raw['src-port'], 10) : undefined),
    dstAddress: dstParsed.ip,
    dstPort: dstParsed.port || (raw['dst-port'] ? parseInt(raw['dst-port'], 10) : undefined),
    replyDstAddress: replyDstParsed.ip,
    replyDstPort: replyDstParsed.port || (raw['reply-dst-port'] ? parseInt(raw['reply-dst-port'], 10) : undefined),
    state: (raw['connection-state'] as ConnectionTrackingState) || 'established',
    timeout: raw.timeout,
    packets: raw.packets ? parseInt(raw.packets, 10) : 0,
    bytes: raw.bytes ? parseInt(raw.bytes, 10) : 0,
    assured: raw.assured === 'true',
    confirmed: raw.confirmed === 'true',
  };
}

/**
 * Apply client-side filtering to connections list
 * Server-side filtering is limited, so we filter on the client
 */
function applyFilters(connections: Connection[], filters?: ConnectionFilters): Connection[] {
  if (!filters) return connections;

  return connections.filter((conn) => {
    // Filter by IP address (supports wildcards like 192.168.1.*)
    if (filters.ipAddress) {
      const pattern = filters.ipAddress.replace(/\*/g, '.*');
      const regex = new RegExp(`^${pattern}$`);
      const matchesIp =
        regex.test(conn.srcAddress) ||
        regex.test(conn.dstAddress) ||
        (conn.replyDstAddress && regex.test(conn.replyDstAddress));
      if (!matchesIp) return false;
    }

    // Filter by port
    if (filters.port !== undefined) {
      const matchesPort =
        conn.srcPort === filters.port ||
        conn.dstPort === filters.port ||
        conn.replyDstPort === filters.port;
      if (!matchesPort) return false;
    }

    // Filter by protocol
    if (filters.protocol) {
      if (conn.protocol.toLowerCase() !== filters.protocol.toLowerCase()) {
        return false;
      }
    }

    // Filter by state
    if (filters.state) {
      if (conn.state !== filters.state) {
        return false;
      }
    }

    return true;
  });
}

// ============================================================================
// API Functions
// ============================================================================

/**
 * Fetches active firewall connections from RouterOS via rosproxy
 * Endpoint: GET /rest/ip/firewall/connection
 *
 * @param routerIp - Target router IP address
 * @param filters - Optional filters for connections
 * @returns Promise with list of active connections
 */
async function fetchConnections(
  routerIp: string,
  filters?: ConnectionFilters
): Promise<Connection[]> {
  const result = await makeRouterOSRequest<RawConnection[]>(
    routerIp,
    'ip/firewall/connection'
  );

  if (!result.success || !result.data) {
    throw new Error(result.error || 'Failed to fetch connections');
  }

  // Transform and filter
  const connections = result.data.map(transformConnection);
  return applyFilters(connections, filters);
}

// ============================================================================
// React Query Hooks
// ============================================================================

export interface UseConnectionsOptions {
  /**
   * Target router IP address
   */
  routerIp: string;

  /**
   * Optional filters for connections
   */
  filters?: ConnectionFilters;

  /**
   * Enable automatic polling (default: true)
   * Connections change frequently, so polling is enabled by default
   */
  enablePolling?: boolean;

  /**
   * Polling interval in milliseconds (default: 5000ms = 5s)
   */
  pollingInterval?: number;

  /**
   * Skip query execution if true
   */
  enabled?: boolean;
}

/**
 * React Query hook for active firewall connections
 *
 * Fetches the list of active connections from the connection tracking table.
 * Supports optional filtering and automatic polling for live updates.
 *
 * @param options - Hook configuration options
 * @returns Query result with connections list
 *
 * @example
 * ```tsx
 * function ConnectionsTable() {
 *   const routerIp = useConnectionStore(state => state.currentRouterIp);
 *   const { data: connections, isLoading } = useConnections({
 *     routerIp: routerIp || '',
 *     filters: { protocol: 'tcp' },
 *     enablePolling: true,
 *     pollingInterval: 5000,
 *   });
 *
 *   return (
 *     <Table>
 *       {connections?.map(conn => (
 *         <TableRow key={conn.id}>
 *           <TableCell>{conn.srcAddress}:{conn.srcPort}</TableCell>
 *           <TableCell>{conn.dstAddress}:{conn.dstPort}</TableCell>
 *           <TableCell>{conn.protocol}</TableCell>
 *           <TableCell>{conn.state}</TableCell>
 *         </TableRow>
 *       ))}
 *     </Table>
 *   );
 * }
 * ```
 */
export function useConnections({
  routerIp,
  filters,
  enablePolling = true,
  pollingInterval = 5000,
  enabled = true,
}: UseConnectionsOptions): UseQueryResult<Connection[], Error> {
  return useQuery({
    queryKey: firewallConnectionKeys.list(routerIp, filters),
    queryFn: () => fetchConnections(routerIp, filters),
    staleTime: 0, // Always consider stale (for polling)
    refetchInterval: enablePolling ? pollingInterval : false,
    retry: 2,
    enabled: enabled && !!routerIp,
  });
}
