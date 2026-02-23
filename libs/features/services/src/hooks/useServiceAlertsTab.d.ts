/**
 * useServiceAlertsTab Hook
 *
 * Headless hook containing all business logic for ServiceAlertsTab.
 * Handles query/subscription integration, filtering, pagination, and multi-select.
 *
 * @description Manages alert data lifecycle including fetching, filtering, pagination,
 * selection, and acknowledge operations. Platform presenters consume this hook.
 *
 * @example
 * ```tsx
 * const tabState = useServiceAlertsTab({
 *   routerId: 'router-1',
 *   instanceId: 'service-1',
 * });
 * ```
 *
 * @see Task #12: Create ServiceAlertsTab with platform presenters
 */
import { type ServiceAlert, type AlertSeverity } from '@nasnet/api-client/queries';
/**
 * Filter options for alerts
 *
 * @description Configuration object for filtering alerts by severity, acknowledgement status,
 * and search term. All properties are optional.
 */
export interface AlertFilters {
    /** Filter by severity (undefined = all) */
    severity?: AlertSeverity;
    /** Filter by acknowledged status (undefined = all) */
    acknowledged?: boolean;
    /** Search term for title/message */
    searchTerm?: string;
}
/**
 * Pagination state
 *
 * @description Tracks current pagination position and total counts.
 */
export interface PaginationState {
    /** Currently active page number (1-indexed) */
    currentPage: number;
    /** Number of items per page */
    pageSize: number;
    /** Total number of items across all pages */
    totalCount: number;
    /** Total number of pages */
    totalPages: number;
}
/**
 * Props for useServiceAlertsTab hook
 *
 * @description Configuration for initializing the ServiceAlertsTab hook.
 */
export interface UseServiceAlertsTabProps {
    /** Router ID for context */
    routerId: string;
    /** Service instance ID for fetching alerts */
    instanceId: string;
    /** Initial page size (default: 25) */
    initialPageSize?: number;
    /** Enable real-time subscription (default: true) */
    enableSubscription?: boolean;
}
/**
 * Return type for useServiceAlertsTab hook
 *
 * @description Complete state and action interface for managing service alerts.
 * Includes data, filters, pagination, selection, and operations.
 */
export interface UseServiceAlertsTabReturn {
    /** All loaded alerts from GraphQL query */
    alerts: ServiceAlert[];
    /** Alerts after applying client-side filters */
    filteredAlerts: ServiceAlert[];
    /** Initial data loading in progress */
    loading: boolean;
    /** Acknowledge operation in progress */
    acknowledging: boolean;
    /** GraphQL query error if any */
    error: Error | undefined;
    /** Current filter configuration */
    filters: AlertFilters;
    /** Update filter configuration */
    setFilters: (filters: Partial<AlertFilters>) => void;
    /** Reset all filters to defaults */
    clearFilters: () => void;
    /** Current pagination state */
    pagination: PaginationState;
    /** Navigate to specific page */
    goToPage: (page: number) => void;
    /** Move to next page */
    nextPage: () => void;
    /** Move to previous page */
    prevPage: () => void;
    /** Change page size */
    setPageSize: (size: number) => void;
    /** Set of selected alert IDs */
    selectedAlertIds: Set<string>;
    /** Toggle selection for a single alert */
    toggleSelect: (alertId: string) => void;
    /** Select all visible alerts */
    selectAll: () => void;
    /** Clear all selections */
    clearSelection: () => void;
    /** Whether any alerts are selected */
    hasSelection: boolean;
    /** Acknowledge a single alert */
    acknowledgeAlert: (alertId: string) => Promise<void>;
    /** Acknowledge all selected alerts */
    acknowledgeBulk: () => Promise<void>;
    /** Refetch alerts from server */
    refetch: () => void;
    /** Alert statistics (totals by severity and status) */
    stats: {
        total: number;
        critical: number;
        warning: number;
        info: number;
        unacknowledged: number;
    };
}
/**
 * Headless hook for ServiceAlertsTab
 *
 * Manages alert data fetching, real-time updates, filtering, pagination,
 * and multi-select operations. Platform presenters consume this hook.
 *
 * @example
 * ```tsx
 * function ServiceAlertsTabMobile(props) {
 *   const tabState = useServiceAlertsTab({
 *     routerId: props.routerId,
 *     instanceId: props.instanceId,
 *   });
 *
 *   return (
 *     <div>
 *       {tabState.filteredAlerts.map(alert => (
 *         <AlertCard
 *           key={alert.id}
 *           alert={alert}
 *           onAcknowledge={() => tabState.acknowledgeAlert(alert.id)}
 *         />
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */
export declare function useServiceAlertsTab(props: UseServiceAlertsTabProps): UseServiceAlertsTabReturn;
//# sourceMappingURL=useServiceAlertsTab.d.ts.map