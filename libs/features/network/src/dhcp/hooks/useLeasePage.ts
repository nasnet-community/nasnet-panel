/**
 * useLeasePage Hook
 * Main orchestration hook for DHCP Lease Management page
 *
 * Story: NAS-6.11 - DHCP Lease Management
 *
 * Combines:
 * - Data fetching (useDHCPLeases, useDHCPServers)
 * - UI state (useDHCPUIStore)
 * - New lease detection (useNewLeaseDetection)
 * - Bulk operations (useBulkOperations)
 * - CSV export functionality
 *
 * @module libs/features/network/src/dhcp/hooks/useLeasePage
 */

import { useCallback, useMemo } from 'react';

import { useDHCPLeases, useDHCPServers } from '@nasnet/api-client/queries';
import type { DHCPLease } from '@nasnet/core/types';
import { useDHCPUIStore } from '@nasnet/state/stores';

import { useBulkOperations } from './useBulkOperations';
import { useNewLeaseDetection } from './useNewLeaseDetection';
import { exportLeasesToCSV } from '../utils/csv-export';

/**
 * Return type for lease page hook
 */
export interface UseLeasePageReturn {
  /** Filtered and sorted leases based on UI state */
  leases: DHCPLease[];

  /** Available DHCP servers for server filter */
  servers: Array<{ name: string; interface: string }>;

  /** Loading state for leases query */
  isLoadingLeases: boolean;

  /** Loading state for servers query */
  isLoadingServers: boolean;

  /** Error from leases query */
  leasesError: Error | null;

  /** Error from servers query */
  serversError: Error | null;

  /** Set of new lease IDs (auto-fades after 5s) */
  newLeaseIds: Set<string>;

  /** Current search term */
  search: string;

  /** Set search term */
  setSearch: (search: string) => void;

  /** Current status filter */
  statusFilter: 'all' | 'bound' | 'waiting' | 'static';

  /** Set status filter */
  setStatusFilter: (filter: 'all' | 'bound' | 'waiting' | 'static') => void;

  /** Current server filter */
  serverFilter: string;

  /** Set server filter */
  setServerFilter: (server: string) => void;

  /** Selected lease IDs */
  selectedLeases: string[];

  /** Toggle lease selection */
  toggleLeaseSelection: (leaseId: string) => void;

  /** Clear all selections */
  clearLeaseSelection: () => void;

  /** Select all leases (filtered) */
  selectAllLeases: () => void;

  /** Convert selected leases to static bindings */
  makeAllStatic: () => Promise<void>;

  /** Delete selected leases */
  deleteMultiple: () => Promise<void>;

  /** Whether bulk make static is in progress */
  isMakingStatic: boolean;

  /** Whether bulk delete is in progress */
  isDeleting: boolean;

  /** Export filtered leases to CSV */
  handleExport: () => void;

  /** Total count (unfiltered) */
  totalCount: number;

  /** Filtered count */
  filteredCount: number;
}

/**
 * Checks if a lease matches the search term
 */
function matchesSearch(lease: DHCPLease, search: string): boolean {
  if (!search) return true;

  const searchLower = search.toLowerCase();
  const hostname = lease.hostname?.toLowerCase() || '';

  return (
    lease.address.toLowerCase().includes(searchLower) ||
    lease.macAddress.toLowerCase().includes(searchLower) ||
    hostname.includes(searchLower)
  );
}

/**
 * Main orchestration hook for DHCP Lease Management page
 * @description Combines data fetching, filtering, new lease detection, bulk operations, and CSV export
 *
 * Features:
 * - Fetches leases with 30s polling (from useDHCPLeases)
 * - Fetches server list for filter dropdown
 * - Applies search, status, and server filters
 * - Detects new leases with auto-fade
 * - Provides bulk operations (make static, delete)
 * - CSV export with filtered data
 * - Selection management
 *
 * @param routerIp - Target router IP address
 * @returns Complete page state and actions
 *
 * @example
 * ```tsx
 * function DHCPLeaseManagementPage({ routerIp }: Props) {
 *   const {
 *     leases,
 *     servers,
 *     isLoadingLeases,
 *     newLeaseIds,
 *     search,
 *     setSearch,
 *     statusFilter,
 *     setStatusFilter,
 *     serverFilter,
 *     setServerFilter,
 *     selectedLeases,
 *     toggleLeaseSelection,
 *     makeAllStatic,
 *     deleteMultiple,
 *     handleExport,
 *   } = useLeasePage(routerIp);
 *
 *   if (isLoadingLeases) return <LeaseTableSkeleton />;
 *
 *   return (
 *     <div>
 *       <LeaseFilters
 *         search={search}
 *         onSearchChange={setSearch}
 *         status={statusFilter}
 *         onStatusChange={setStatusFilter}
 *         server={serverFilter}
 *         onServerChange={setServerFilter}
 *         servers={servers}
 *       />
 *       <LeaseTable
 *         leases={leases}
 *         newLeaseIds={newLeaseIds}
 *         selectedLeases={selectedLeases}
 *         onToggleSelection={toggleLeaseSelection}
 *       />
 *       <BulkActionsToolbar
 *         count={selectedLeases.length}
 *         onMakeStatic={makeAllStatic}
 *         onDelete={deleteMultiple}
 *         onExport={handleExport}
 *       />
 *     </div>
 *   );
 * }
 * ```
 */
export function useLeasePage(routerIp: string): UseLeasePageReturn {
  // Fetch data (30s polling for leases already configured)
  const {
    data: leasesData = [],
    isLoading: isLoadingLeases,
    error: leasesError,
  } = useDHCPLeases(routerIp);

  const {
    data: serversData = [],
    isLoading: isLoadingServers,
    error: serversError,
  } = useDHCPServers(routerIp);

  // Get UI state from store
  const {
    leaseSearch,
    setLeaseSearch,
    leaseStatusFilter,
    setLeaseStatusFilter,
    leaseServerFilter,
    setLeaseServerFilter,
    selectedLeases,
    toggleLeaseSelection,
    clearLeaseSelection,
    selectAllLeases: selectAllInStore,
  } = useDHCPUIStore();

  // New lease detection (auto-fade after 5s)
  const { newLeaseIds } = useNewLeaseDetection(leasesData);

  // Bulk operations
  const {
    makeAllStatic: makeAllStaticBulk,
    deleteMultiple: deleteMultipleBulk,
    isMakingStatic,
    isDeleting,
  } = useBulkOperations(routerIp);

  // Filter leases based on search, status, and server
  const filteredLeases = useMemo(() => {
    return leasesData.filter((lease) => {
      // Apply search filter
      if (leaseSearch && !matchesSearch(lease, leaseSearch)) {
        return false;
      }

      // Apply status filter
      if (leaseStatusFilter !== 'all') {
        if (leaseStatusFilter === 'static' && lease.dynamic) {
          return false;
        }
        if (leaseStatusFilter !== 'static' && lease.status !== leaseStatusFilter) {
          return false;
        }
      }

      // Apply server filter
      if (leaseServerFilter !== 'all' && lease.server !== leaseServerFilter) {
        return false;
      }

      return true;
    });
  }, [leasesData, leaseSearch, leaseStatusFilter, leaseServerFilter]);

  // Extract server list for filter dropdown
  const servers = useMemo(() => {
    return serversData.map((server) => ({
      name: server.name,
      interface: server.interface,
    }));
  }, [serversData]);

  /**
   * Select all filtered leases
   * @description Memoized to prevent unnecessary re-renders in child components
   */
  const selectAllLeases = useCallback(() => {
    const filteredIds = filteredLeases.map((lease) => lease.id);
    selectAllInStore(filteredIds);
  }, [filteredLeases, selectAllInStore]);

  /**
   * Bulk make static operation
   * @description Wraps useBulkOperations.makeAllStatic with current lease data
   * Memoized callback for stable reference across renders
   */
  const makeAllStatic = useCallback(async () => {
    await makeAllStaticBulk(selectedLeases, leasesData);
  }, [selectedLeases, leasesData, makeAllStaticBulk]);

  /**
   * Bulk delete operation
   * @description Wraps useBulkOperations.deleteMultiple with selection tracking
   * Memoized callback for stable reference across renders
   */
  const deleteMultiple = useCallback(async () => {
    await deleteMultipleBulk(selectedLeases);
  }, [selectedLeases, deleteMultipleBulk]);

  /**
   * Export filtered leases to CSV
   * @description Respects active search, status, and server filters
   * Memoized callback for stable reference across renders
   */
  const handleExport = useCallback(() => {
    exportLeasesToCSV(leasesData, {
      search: leaseSearch,
      status: leaseStatusFilter,
      server: leaseServerFilter,
    });
  }, [leasesData, leaseSearch, leaseStatusFilter, leaseServerFilter]);

  return {
    leases: filteredLeases,
    servers,
    isLoadingLeases,
    isLoadingServers,
    leasesError: leasesError as Error | null,
    serversError: serversError as Error | null,
    newLeaseIds,
    search: leaseSearch,
    setSearch: setLeaseSearch,
    statusFilter: leaseStatusFilter,
    setStatusFilter: setLeaseStatusFilter,
    serverFilter: leaseServerFilter,
    setServerFilter: setLeaseServerFilter,
    selectedLeases,
    toggleLeaseSelection,
    clearLeaseSelection,
    selectAllLeases,
    makeAllStatic,
    deleteMultiple,
    isMakingStatic,
    isDeleting,
    handleExport,
    totalCount: leasesData.length,
    filteredCount: filteredLeases.length,
  };
}
