/**
 * BlockedIPsTable Component
 *
 * Wrapper component that selects the appropriate platform presenter.
 * Uses Headless + Platform Presenters pattern.
 *
 * @example
 * ```tsx
 * import { useBlockedIPsTable, BlockedIPsTable } from '@nasnet/ui/patterns';
 * import { useBlockedIPs, useWhitelistIP, useRemoveBlockedIP } from '@nasnet/api-client/queries';
 *
 * function BlockedIPsManagement() {
 *   const routerId = '192.168.1.1';
 *   const listNames = ['rate-limit-blocked'];
 *
 *   const { data: blockedIPs = [], isLoading, refetch } = useBlockedIPs(routerId, listNames);
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
 *     await removeIP(address);
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

import * as React from 'react';

import { usePlatform } from '@nasnet/ui/layouts';

import { BlockedIPsTableDesktop } from './BlockedIPsTableDesktop';
import { BlockedIPsTableMobile } from './BlockedIPsTableMobile';

import type { UseBlockedIPsTableReturn } from './use-blocked-ips-table';

export interface BlockedIPsTableProps {
  /** Blocked IPs table hook return value */
  blockedIPsTable: UseBlockedIPsTableReturn;

  /** Callback when whitelist is clicked */
  onWhitelist?: (address: string, timeout: string, comment?: string) => Promise<void>;

  /** Callback when remove is clicked */
  onRemove?: (address: string) => Promise<void>;

  /** Whether whitelist action is loading */
  isWhitelisting?: boolean;

  /** Whether remove action is loading */
  isRemoving?: boolean;

  /** Loading state */
  loading?: boolean;

  /** Container className */
  className?: string;
}

/**
 * BlockedIPsTable - Platform-adaptive blocked IPs table
 *
 * Automatically selects Mobile or Desktop presenter based on viewport size.
 *
 * Features:
 * - Virtualized rendering for 10,000+ entries
 * - Per-row actions: Whitelist (with timeout), Remove (with confirmation)
 * - Bulk actions: Whitelist Selected, Remove Selected
 * - Search/filter by IP address with wildcard support
 * - Sort by block count, last blocked (default)
 * - WCAG AAA accessible (keyboard navigation, screen reader support)
 *
 * Performance:
 * - Virtualized rendering with react-window
 * - Debounced search input
 * - Memoized row components
 *
 * Mobile:
 * - Card-based virtualized list
 * - 44px touch targets
 * - Swipe actions (future enhancement)
 *
 * Desktop:
 * - Dense table with inline actions
 * - Sortable columns
 * - Bulk selection with checkboxes
 */
export function BlockedIPsTable(props: BlockedIPsTableProps) {
  const platform = usePlatform();

  return platform === 'mobile' ?
      <BlockedIPsTableMobile {...props} />
    : <BlockedIPsTableDesktop {...props} />;
}

BlockedIPsTable.displayName = 'BlockedIPsTable';
