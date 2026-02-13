/**
 * BlockedIPsTable Pattern Component
 *
 * Headless + Platform Presenters pattern for displaying blocked IP addresses
 * from rate limiting rules.
 *
 * @example
 * ```tsx
 * import { useBlockedIPsTable, BlockedIPsTable } from '@nasnet/ui/patterns';
 * import { useBlockedIPs, useWhitelistIP, useRemoveBlockedIP } from '@nasnet/api-client/queries';
 *
 * function BlockedIPsPage() {
 *   const routerId = '192.168.1.1';
 *   const listNames = ['rate-limit-blocked'];
 *
 *   const { data: blockedIPs = [], isLoading, refetch } = useBlockedIPs(routerId, listNames, {
 *     pollingInterval: 5000, // Auto-refresh every 5 seconds
 *   });
 *
 *   const { mutateAsync: whitelistIP, isPending: isWhitelisting } = useWhitelistIP(routerId);
 *   const { mutateAsync: removeIP, isPending: isRemoving } = useRemoveBlockedIP(routerId);
 *
 *   const blockedIPsTable = useBlockedIPsTable({
 *     blockedIPs,
 *     onRefresh: refetch,
 *   });
 *
 *   const handleWhitelist = async (address: string, timeout: string, comment?: string) => {
 *     await whitelistIP({ address, timeout, comment });
 *   };
 *
 *   const handleRemove = async (address: string) => {
 *     // Find the entry ID from the blocked IPs list
 *     const entry = blockedIPs.find(ip => ip.address === address);
 *     if (entry?.id) {
 *       await removeIP(entry.id);
 *     }
 *   };
 *
 *   return (
 *     <BlockedIPsTable
 *       blockedIPsTable={blockedIPsTable}
 *       onWhitelist={handleWhitelist}
 *       onRemove={handleRemove}
 *       isWhitelisting={isWhitelisting}
 *       isRemoving={isRemoving}
 *       loading={isLoading}
 *     />
 *   );
 * }
 * ```
 */

// Main component
export { BlockedIPsTable, type BlockedIPsTableProps } from './BlockedIPsTable';

// Headless hook
export {
  useBlockedIPsTable,
  type UseBlockedIPsTableOptions,
  type UseBlockedIPsTableReturn,
} from './use-blocked-ips-table';

// Platform presenters (exported for testing and custom layouts)
export { BlockedIPsTableDesktop } from './BlockedIPsTableDesktop';
export { BlockedIPsTableMobile } from './BlockedIPsTableMobile';

// Types
export type {
  BlockedIP,
  BlockedIPFilter,
  BlockedIPSort,
  BlockedIPSortField,
  SortDirection,
  WhitelistTimeout,
  WhitelistTimeoutPreset,
} from './types';
export { WHITELIST_TIMEOUT_PRESETS } from './types';
