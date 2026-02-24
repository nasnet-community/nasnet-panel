/**
 * DHCP Lease Management - Mobile Presenter
 *
 * Story: NAS-6.11 - Implement DHCP Lease Management
 *
 * Mobile layout with:
 * - Compact header with title
 * - Search input (full width)
 * - Status/server filter buttons (horizontal scroll)
 * - LeaseCard list with LeaseCardSkeleton during loading
 * - Floating action button for export (bottom-right)
 *
 * @description Responsive mobile presenter for DHCP lease management with search, filtering, and bulk operations.
 */

import * as React from 'react';
import { useCallback } from 'react';
import type { DHCPLease } from '@nasnet/core/types';
import { Button, Input } from '@nasnet/ui/primitives';
import { LeaseCard } from '../components/lease-card/LeaseCard';
import { LeaseCardSkeleton } from '../components/lease-card/LeaseCardSkeleton';
import { Download, Search } from 'lucide-react';
import { useDHCPUIStore } from '@nasnet/state/stores';

export interface DHCPLeaseManagementMobileProps {
  /** Filtered and sorted leases */
  leases: DHCPLease[];

  /** Available DHCP servers */
  servers: string[];

  /** Set of lease IDs that are new (for "New" badge) */
  newLeaseIds: Set<string>;

  /** Loading states */
  isLoading: boolean;
  isError: boolean;
  error?: Error;

  /** Bulk operations */
  makeAllStatic: (leaseIds: string[], leases: DHCPLease[]) => Promise<void>;
  deleteMultiple: (leaseIds: string[]) => Promise<void>;

  /** Export function */
  exportToCSV: () => void;
}

/**
 * Mobile Presenter for DHCP Lease Management
 *
 * Layout:
 * - Compact header
 * - Search bar (full width)
 * - Horizontal scrolling filter chips
 * - Scrollable card list
 * - Floating Export button (bottom-right)
 *
 * Features:
 * - Swipe gestures on cards (right = Make Static, left = Delete)
 * - Tap card to expand details in bottom sheet
 * - 44px minimum touch targets (WCAG AAA)
 * - Optimized for one-handed use
 */
export const DHCPLeaseManagementMobile = React.memo(function DHCPLeaseManagementMobile({
  leases,
  servers,
  newLeaseIds,
  isLoading,
  isError,
  error,
  makeAllStatic,
  deleteMultiple,
  exportToCSV,
}: DHCPLeaseManagementMobileProps) {
  const {
    leaseSearch,
    setLeaseSearch,
    leaseStatusFilter,
    setLeaseStatusFilter,
    leaseServerFilter,
    setLeaseServerFilter,
  } = useDHCPUIStore();

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setLeaseSearch(e.target.value);
    },
    [setLeaseSearch]
  );

  const handleStatusFilterChange = useCallback(
    (status: 'all' | 'bound' | 'waiting' | 'static') => {
      setLeaseStatusFilter(status);
    },
    [setLeaseStatusFilter]
  );

  const handleServerFilterChange = useCallback(
    (server: string) => {
      setLeaseServerFilter(server);
    },
    [setLeaseServerFilter]
  );

  const handleMakeStatic = useCallback(
    async (leaseId: string, lease: DHCPLease) => {
      await makeAllStatic([leaseId], [lease]);
    },
    [makeAllStatic]
  );

  const handleDelete = useCallback(
    async (leaseId: string) => {
      await deleteMultiple([leaseId]);
    },
    [deleteMultiple]
  );

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b border-border bg-card px-page-mobile py-component-sm">
        <h1 className="font-display text-lg font-semibold">DHCP Leases</h1>
      </div>

      {/* Search Bar */}
      <div className="border-b border-border px-page-mobile py-component-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input
            type="search"
            placeholder="Search IP, MAC, or hostname..."
            value={leaseSearch}
            onChange={handleSearchChange}
            className="pl-9 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            aria-label="Search DHCP leases"
          />
        </div>
      </div>

      {/* Filter Chips - Horizontal Scroll */}
      <div className="border-b border-border px-page-mobile py-component-sm">
        <div className="flex gap-component-sm overflow-x-auto pb-1">
          {/* Status Filter */}
          <div className="flex shrink-0 gap-component-sm">
            {(['all', 'bound', 'waiting', 'static'] as const).map((status) => (
              <Button
                key={status}
                variant={leaseStatusFilter === status ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleStatusFilterChange(status)}
                className="min-w-[80px] min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
              </Button>
            ))}
          </div>

          {/* Server Filter */}
          {servers.length > 1 && (
            <>
              <div className="w-px shrink-0 bg-border" />
              <div className="flex shrink-0 gap-component-sm">
                <Button
                  variant={leaseServerFilter === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleServerFilterChange('all')}
                  className="min-w-[80px] min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  All Servers
                </Button>
                {servers.map((server) => (
                  <Button
                    key={server}
                    variant={leaseServerFilter === server ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleServerFilterChange(server)}
                    className="min-w-[80px] min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    {server}
                  </Button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Error State */}
      {isError && (
        <div className="mx-page-mobile mt-component-md rounded-[var(--semantic-radius-card)] border border-error bg-error/10 p-component-md" role="alert">
          <p className="text-sm font-medium text-error">
            Failed to load DHCP leases
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {error?.message || 'An unexpected error occurred'}
          </p>
        </div>
      )}

      {/* Lease Cards - Scrollable */}
      <div className="flex-1 overflow-y-auto">
        <div className="space-y-component-sm p-page-mobile">
          {/* Loading Skeleton */}
          {isLoading && (
            <>
              {[1, 2, 3, 4, 5].map((i) => (
                <LeaseCardSkeleton key={i} />
              ))}
            </>
          )}

          {/* Lease Cards */}
          {!isLoading && !isError && leases.map((lease) => (
            <LeaseCard
              key={lease.id}
              lease={lease}
              isNew={newLeaseIds.has(lease.id)}
              onMakeStatic={() => handleMakeStatic(lease.id, lease)}
              onDelete={() => handleDelete(lease.id)}
            />
          ))}

          {/* Empty State */}
          {!isLoading && !isError && leases.length === 0 && (
            <div className="flex min-h-[200px] items-center justify-center rounded-[var(--semantic-radius-card)] border border-dashed border-border p-component-lg">
              <div className="text-center">
                <p className="text-sm font-medium">No DHCP leases found</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Try adjusting your filters
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Floating Export Button */}
      {!isLoading && leases.length > 0 && (
        <div className="fixed bottom-6 right-6">
          <Button
            onClick={exportToCSV}
            size="lg"
            className="h-14 w-14 min-h-[44px] rounded-full shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            aria-label="Export leases to CSV"
          >
            <Download className="h-5 w-5" aria-hidden="true" />
          </Button>
        </div>
      )}
    </div>
  );
});
