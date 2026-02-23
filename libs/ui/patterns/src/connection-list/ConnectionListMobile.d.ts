/**
 * ConnectionListMobile Component
 *
 * Mobile presenter for connection tracking list.
 * Uses VirtualizedList with card layout for touch-friendly interface.
 */
import type { ConnectionEntry } from './types';
import type { UseConnectionListReturn } from './use-connection-list';
export interface ConnectionListMobileProps {
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
 * Mobile presenter for ConnectionList
 *
 * Features:
 * - Virtualized card list for performance
 * - Touch-friendly 44px minimum touch targets
 * - Full-width cards with connection details
 * - Filter controls in collapsible panel
 * - Pull to refresh support
 */
export declare function ConnectionListMobile({ connectionList, onKillConnection, isKillingConnection, loading, className, }: ConnectionListMobileProps): import("react/jsx-runtime").JSX.Element;
export declare namespace ConnectionListMobile {
    var displayName: string;
}
//# sourceMappingURL=ConnectionListMobile.d.ts.map