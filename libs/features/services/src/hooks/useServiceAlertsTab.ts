/**
 * useServiceAlertsTab Hook
 *
 * Headless hook containing all business logic for ServiceAlertsTab.
 * Handles query/subscription integration, filtering, pagination, and multi-select.
 *
 * @see Task #12: Create ServiceAlertsTab with platform presenters
 */

import { useState, useMemo, useCallback, useEffect } from 'react';
import {
  useServiceAlerts,
  useServiceAlertSubscription,
  useAcknowledgeAlert,
  useAcknowledgeAlerts,
  type ServiceAlert,
  type AlertSeverity,
} from '@nasnet/api-client/queries';

// ============================================================================
// Types
// ============================================================================

/**
 * Filter options for alerts
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
 */
export interface PaginationState {
  currentPage: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

/**
 * Props for useServiceAlertsTab hook
 */
export interface UseServiceAlertsTabProps {
  /** Router ID */
  routerId: string;
  /** Service instance ID */
  instanceId: string;
  /** Initial page size (default: 25) */
  initialPageSize?: number;
  /** Enable real-time subscription (default: true) */
  enableSubscription?: boolean;
}

/**
 * Return type for useServiceAlertsTab hook
 */
export interface UseServiceAlertsTabReturn {
  // Data
  alerts: ServiceAlert[];
  filteredAlerts: ServiceAlert[];

  // Loading states
  loading: boolean;
  acknowledging: boolean;

  // Error state
  error: Error | undefined;

  // Filters
  filters: AlertFilters;
  setFilters: (filters: Partial<AlertFilters>) => void;
  clearFilters: () => void;

  // Pagination
  pagination: PaginationState;
  goToPage: (page: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  setPageSize: (size: number) => void;

  // Selection
  selectedAlertIds: Set<string>;
  toggleSelect: (alertId: string) => void;
  selectAll: () => void;
  clearSelection: () => void;
  hasSelection: boolean;

  // Actions
  acknowledgeAlert: (alertId: string) => Promise<void>;
  acknowledgeBulk: () => Promise<void>;
  refetch: () => void;

  // Computed stats
  stats: {
    total: number;
    critical: number;
    warning: number;
    info: number;
    unacknowledged: number;
  };
}

// ============================================================================
// Hook Implementation
// ============================================================================

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
export function useServiceAlertsTab(
  props: UseServiceAlertsTabProps
): UseServiceAlertsTabReturn {
  const {
    routerId,
    instanceId,
    initialPageSize = 25,
    enableSubscription = true,
  } = props;

  // ===== State =====

  const [filters, setFiltersState] = useState<AlertFilters>({
    severity: undefined,
    acknowledged: undefined,
    searchTerm: '',
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [selectedAlertIds, setSelectedAlertIds] = useState<Set<string>>(
    new Set()
  );

  // ===== GraphQL Hooks =====

  // Fetch alerts with current filters and pagination
  const offset = (currentPage - 1) * pageSize;

  const { alerts: alertsData, loading, error, refetch } = useServiceAlerts({
    instanceId,
    severity: filters.severity,
    acknowledged: filters.acknowledged,
    limit: pageSize,
    offset,
  });

  // Real-time subscription for alert updates
  const { alertEvent } = useServiceAlertSubscription(
    { deviceId: routerId },
    enableSubscription
  );

  // Acknowledge mutations
  const [acknowledgeAlertMutation, { loading: acknowledgingOne }] =
    useAcknowledgeAlert();
  const [acknowledgeAlertsMutation, { loading: acknowledgingBulk }] =
    useAcknowledgeAlerts();

  const acknowledging = acknowledgingOne || acknowledgingBulk;

  // ===== Derived Data =====

  // Extract alerts from connection
  const alerts = useMemo(() => {
    return alertsData?.edges.map((edge) => edge.node) ?? [];
  }, [alertsData]);

  // Client-side filtering (search term)
  const filteredAlerts = useMemo(() => {
    if (!filters.searchTerm) {
      return alerts;
    }

    const searchLower = filters.searchTerm.toLowerCase();
    return alerts.filter(
      (alert) =>
        alert.title.toLowerCase().includes(searchLower) ||
        alert.message.toLowerCase().includes(searchLower) ||
        alert.eventType.toLowerCase().includes(searchLower)
    );
  }, [alerts, filters.searchTerm]);

  // Pagination state
  const totalCount = alertsData?.totalCount ?? 0;
  const totalPages = Math.ceil(totalCount / pageSize);

  const pagination = useMemo<PaginationState>(
    () => ({
      currentPage,
      pageSize,
      totalCount,
      totalPages,
    }),
    [currentPage, pageSize, totalCount, totalPages]
  );

  // Statistics
  const stats = useMemo(() => {
    const all = alerts;
    return {
      total: all.length,
      critical: all.filter((a) => a.severity === 'CRITICAL').length,
      warning: all.filter((a) => a.severity === 'WARNING').length,
      info: all.filter((a) => a.severity === 'INFO').length,
      unacknowledged: all.filter((a) => !a.acknowledgedAt).length,
    };
  }, [alerts]);

  // ===== Filter Actions =====

  const setFilters = useCallback((newFilters: Partial<AlertFilters>) => {
    setFiltersState((prev) => ({ ...prev, ...newFilters }));
    // Reset to page 1 when filters change
    setCurrentPage(1);
  }, []);

  const clearFilters = useCallback(() => {
    setFiltersState({
      severity: undefined,
      acknowledged: undefined,
      searchTerm: '',
    });
    setCurrentPage(1);
  }, []);

  // ===== Pagination Actions =====

  const goToPage = useCallback(
    (page: number) => {
      const validPage = Math.max(1, Math.min(page, totalPages));
      setCurrentPage(validPage);
    },
    [totalPages]
  );

  const nextPage = useCallback(() => {
    if (currentPage < totalPages) {
      setCurrentPage((prev) => prev + 1);
    }
  }, [currentPage, totalPages]);

  const prevPage = useCallback(() => {
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
    }
  }, [currentPage]);

  const handleSetPageSize = useCallback((size: number) => {
    setPageSize(size);
    setCurrentPage(1); // Reset to first page
  }, []);

  // ===== Selection Actions =====

  const toggleSelect = useCallback((alertId: string) => {
    setSelectedAlertIds((prev) => {
      const next = new Set(prev);
      if (next.has(alertId)) {
        next.delete(alertId);
      } else {
        next.add(alertId);
      }
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    const allIds = filteredAlerts.map((alert) => alert.id);
    setSelectedAlertIds(new Set(allIds));
  }, [filteredAlerts]);

  const clearSelection = useCallback(() => {
    setSelectedAlertIds(new Set());
  }, []);

  const hasSelection = selectedAlertIds.size > 0;

  // ===== Acknowledge Actions =====

  const acknowledgeAlert = useCallback(
    async (alertId: string) => {
      try {
        const result = await acknowledgeAlertMutation({
          variables: { alertId },
        });

        if (result.data?.acknowledgeAlert.errors?.length) {
          throw new Error(result.data.acknowledgeAlert.errors[0].message);
        }

        // Optimistically remove from selection
        setSelectedAlertIds((prev) => {
          const next = new Set(prev);
          next.delete(alertId);
          return next;
        });
      } catch (err) {
        console.error('Failed to acknowledge alert:', err);
        throw err;
      }
    },
    [acknowledgeAlertMutation]
  );

  const acknowledgeBulk = useCallback(async () => {
    if (selectedAlertIds.size === 0) return;

    try {
      const alertIds = Array.from(selectedAlertIds);
      const result = await acknowledgeAlertsMutation({
        variables: { alertIds },
      });

      if (result.data?.acknowledgeAlerts.errors?.length) {
        throw new Error(result.data.acknowledgeAlerts.errors[0].message);
      }

      // Clear selection on success
      clearSelection();
    } catch (err) {
      console.error('Failed to acknowledge alerts:', err);
      throw err;
    }
  }, [selectedAlertIds, acknowledgeAlertsMutation, clearSelection]);

  // ===== Effects =====

  // Log subscription events (optional - for debugging)
  useEffect(() => {
    if (alertEvent) {
      console.log(
        `[ServiceAlertsTab] Real-time event: ${alertEvent.action} - ${alertEvent.alert.title}`
      );
      // Apollo cache is automatically updated by subscription
      // No manual cache updates needed
    }
  }, [alertEvent]);

  // ===== Return State =====

  return {
    // Data
    alerts,
    filteredAlerts,

    // Loading states
    loading,
    acknowledging,

    // Error state
    error: error as Error | undefined,

    // Filters
    filters,
    setFilters,
    clearFilters,

    // Pagination
    pagination,
    goToPage,
    nextPage,
    prevPage,
    setPageSize: handleSetPageSize,

    // Selection
    selectedAlertIds,
    toggleSelect,
    selectAll,
    clearSelection,
    hasSelection,

    // Actions
    acknowledgeAlert,
    acknowledgeBulk,
    refetch,

    // Stats
    stats,
  };
}
