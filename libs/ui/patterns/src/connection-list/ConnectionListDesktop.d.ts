/**
 * ConnectionListDesktop Component
 *
 * Desktop presenter for connection tracking list.
 * Uses VirtualizedTable for high-performance rendering of large connection lists.
 */
import type { ConnectionEntry } from './types';
import type { UseConnectionListReturn } from './use-connection-list';
export interface ConnectionListDesktopProps {
    /** Connection list hook return value */
    connectionList: UseConnectionListReturn;
    /** Callback when kill connection is clicked */
    onKillConnection?: (connection: ConnectionEntry) => void;
    /** Whether kill action is loading */
    isKillingConnection?: boolean;
    /** Loading state */
    loading?: boolean;
    /** Container className */
    className?: string;
}
/**
 * Desktop presenter for ConnectionList
 *
 * Features:
 * - Virtualized table for performance with 10,000+ connections
 * - Sortable columns
 * - Kill connection action per row
 * - Compact, data-dense layout for desktop
 * - Filter bar above table
 */
export declare function ConnectionListDesktop({ connectionList, onKillConnection, isKillingConnection, loading, className, }: ConnectionListDesktopProps): import("react/jsx-runtime").JSX.Element;
export declare namespace ConnectionListDesktop {
    var displayName: string;
}
//# sourceMappingURL=ConnectionListDesktop.d.ts.map