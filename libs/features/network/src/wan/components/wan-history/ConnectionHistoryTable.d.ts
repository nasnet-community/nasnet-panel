/**
 * Connection History Table Component
 *
 * Display WAN connection events with filtering, pagination, and platform-responsive layout.
 * Supports searching by IP/interface/reason and filtering by event type.
 *
 * Story: NAS-6.8 - Implement WAN Link Configuration (Phase 6: Connection History)
 */
import type { ConnectionEventData } from '../../types/wan.types';
export interface ConnectionHistoryTableProps {
    /** Array of connection events to display */
    events: ConnectionEventData[];
    /** Loading state indicator */
    loading?: boolean;
    /** Error state with message */
    error?: Error | null;
    /** Callback when refresh button is clicked */
    onRefresh?: () => void;
    /** Number of events per page (default: 20) */
    pageSize?: number;
    /** Additional CSS classes */
    className?: string;
}
/**
 * Connection History Table - Filterable, paginated event timeline
 */
declare function ConnectionHistoryTableComponent({ events, loading, error, onRefresh, pageSize, className, }: ConnectionHistoryTableProps): import("react/jsx-runtime").JSX.Element;
export declare const ConnectionHistoryTable: typeof ConnectionHistoryTableComponent & {
    displayName: string;
};
export {};
//# sourceMappingURL=ConnectionHistoryTable.d.ts.map