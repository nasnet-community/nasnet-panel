/**
 * TanStack Query hook for fetching active firewall connections
 * NAS-7.4: Connection Tracking - Query Layer
 * Uses rosproxy backend for RouterOS API communication
 *
 * Endpoint: GET /rest/ip/firewall/connection
 */
import { UseQueryResult } from '@tanstack/react-query';
import type { Connection, ConnectionFilters } from '@nasnet/core/types';
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
export declare function useConnections({ routerIp, filters, enablePolling, pollingInterval, enabled, }: UseConnectionsOptions): UseQueryResult<Connection[], Error>;
//# sourceMappingURL=useConnections.d.ts.map