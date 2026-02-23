/**
 * useBlockedIPsTable Hook
 *
 * Headless hook for BlockedIPsTable pattern component.
 * Provides filtering, sorting, and selection logic for blocked IPs data.
 *
 * @see ADR-018: Headless Platform Presenters
 * @see [Headless + Platform Presenters Pattern](../PLATFORM_PRESENTER_GUIDE.md)
 */
import type { BlockedIP, BlockedIPFilter, BlockedIPSort, BlockedIPSortField } from './types';
export interface UseBlockedIPsTableOptions {
    /** Blocked IP entries to display */
    blockedIPs: BlockedIP[];
    /** Initial filter state */
    initialFilter?: Partial<BlockedIPFilter>;
    /** Initial sort state */
    initialSort?: BlockedIPSort;
    /** Callback when refresh is triggered */
    onRefresh?: () => void;
}
export interface UseBlockedIPsTableReturn {
    filteredBlockedIPs: BlockedIP[];
    totalCount: number;
    filteredCount: number;
    filter: BlockedIPFilter;
    setFilter: (filter: Partial<BlockedIPFilter>) => void;
    clearFilter: () => void;
    hasActiveFilter: boolean;
    sort: BlockedIPSort;
    setSort: (field: BlockedIPSortField) => void;
    toggleSortDirection: () => void;
    selectedIPs: string[];
    toggleSelection: (address: string) => void;
    selectAll: () => void;
    clearSelection: () => void;
    isSelected: (address: string) => boolean;
    hasSelection: boolean;
    refresh: () => void;
}
/**
 * Headless hook for blocked IPs table logic.
 *
 * Manages filtering by IP address (wildcard support) and list,
 * sorting by any field with direction toggle, and multi-select functionality.
 *
 * @param options - Configuration options for the table hook
 * @returns Object containing filtered data, filter controls, sort controls, selection controls, and refresh function
 *
 * @example
 * ```tsx
 * const table = useBlockedIPsTable({
 *   blockedIPs: dhcpLeases,
 *   initialFilter: { list: 'blacklist' },
 *   initialSort: { field: 'lastBlocked', direction: 'desc' },
 *   onRefresh: () => refetchBlockedIPs(),
 * });
 *
 * return (
 *   <div>
 *     <input
 *       value={table.filter.ipAddress}
 *       onChange={(e) => table.setFilter({ ipAddress: e.target.value })}
 *       placeholder="Filter by IP (supports 192.168.1.*)"
 *     />
 *     <table>
 *       <tbody>
 *         {table.filteredBlockedIPs.map((ip) => (
 *           <tr
 *             key={ip.address}
 *             onClick={() => table.toggleSelection(ip.address)}
 *           >
 *             <td>
 *               <Checkbox checked={table.isSelected(ip.address)} />
 *             </td>
 *             <td>{ip.address}</td>
 *             <td>{ip.list}</td>
 *           </tr>
 *         ))}
 *       </tbody>
 *     </table>
 *     <p>Showing {table.filteredCount} of {table.totalCount} IPs</p>
 *   </div>
 * );
 * ```
 */
export declare function useBlockedIPsTable(options: UseBlockedIPsTableOptions): UseBlockedIPsTableReturn;
//# sourceMappingURL=use-blocked-ips-table.d.ts.map