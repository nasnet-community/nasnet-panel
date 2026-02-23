/**
 * BlockedIPsTableMobile Component
 *
 * Mobile presenter for blocked IPs table.
 * Uses VirtualizedList with card layout for touch-friendly interface.
 */
import type { UseBlockedIPsTableReturn } from './use-blocked-ips-table';
export interface BlockedIPsTableMobileProps {
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
 * Mobile presenter for BlockedIPsTable
 *
 * Features:
 * - Virtualized card list for performance
 * - Touch-friendly 44px minimum touch targets
 * - Full-width cards with blocked IP details
 * - Filter controls in collapsible panel
 * - Selection mode with bulk actions
 */
export declare function BlockedIPsTableMobile({ blockedIPsTable, onWhitelist, onRemove, isWhitelisting, isRemoving, loading, className, }: BlockedIPsTableMobileProps): import("react/jsx-runtime").JSX.Element;
export declare namespace BlockedIPsTableMobile {
    var displayName: string;
}
//# sourceMappingURL=BlockedIPsTableMobile.d.ts.map