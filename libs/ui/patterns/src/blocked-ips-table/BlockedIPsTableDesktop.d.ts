/**
 * BlockedIPsTableDesktop Component
 *
 * Desktop presenter for blocked IPs table.
 * Uses VirtualizedTable for high-performance rendering of large blocked IP lists.
 */
import * as React from 'react';
import type { UseBlockedIPsTableReturn } from './use-blocked-ips-table';
export interface BlockedIPsTableDesktopProps {
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
 * Desktop presenter for BlockedIPsTable
 *
 * Features:
 * - Virtualized table for performance with 10,000+ entries
 * - Sortable columns
 * - Row selection with checkboxes
 * - Per-row actions: Whitelist, Remove
 * - Bulk actions: Whitelist Selected, Remove Selected
 * - Compact, data-dense layout for desktop
 */
export declare const BlockedIPsTableDesktop: React.NamedExoticComponent<BlockedIPsTableDesktopProps>;
//# sourceMappingURL=BlockedIPsTableDesktop.d.ts.map