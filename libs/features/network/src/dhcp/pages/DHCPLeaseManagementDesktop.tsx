/**
 * DHCP Lease Management - Desktop Presenter
 *
 * Story: NAS-6.11 - Implement DHCP Lease Management
 *
 * Desktop layout with:
 * - Page header with title, description, Export CSV button
 * - LeaseFilters component (status/server dropdowns)
 * - LeaseTableWithSelection component
 * - BulkActionsToolbar (shows when items selected)
 *
 * @description Desktop presenter for DHCP lease management with advanced filtering, table selection, and bulk operations.
 */

import * as React from 'react';
import { useCallback } from 'react';
import type { DHCPLease } from '@nasnet/core/types';
import { Button } from '@nasnet/ui/primitives';
import { LeaseFilters } from '../components/lease-filters/LeaseFilters';
import { LeaseTableWithSelection } from '../components/lease-table/LeaseTableWithSelection';
import { BulkActionsToolbar } from '../components/lease-table/BulkActionsToolbar';
import { Download } from 'lucide-react';

export interface DHCPLeaseManagementDesktopProps {
  /** Filtered and sorted leases */
  leases: DHCPLease[];

  /** Available DHCP servers */
  servers: Array<{ name: string; interface: string }>;

  /** Set of lease IDs that are new (for "New" badge) */
  newLeaseIds: Set<string>;

  /** Loading states */
  isLoading: boolean;
  isError: boolean;
  error?: Error;

  /** Selection state */
  selectedLeases: string[];
  clearSelection: () => void;

  /** Bulk operations */
  makeAllStatic: (leaseIds: string[], leases: DHCPLease[]) => Promise<void>;
  deleteMultiple: (leaseIds: string[]) => Promise<void>;

  /** Export function */
  exportToCSV: () => void;
}

/**
 * Desktop Presenter for DHCP Lease Management
 *
 * Layout:
 * - Header with title and Export button
 * - Filters (status, server dropdowns)
 * - Table with checkboxes, expandable rows, sorting
 * - Bulk actions toolbar (when items selected)
 *
 * Accessibility:
 * - ARIA labels on all interactive elements
 * - Keyboard navigation support
 * - Screen reader announcements for selection
 */
export const DHCPLeaseManagementDesktop = React.memo(function DHCPLeaseManagementDesktop({
  leases,
  servers,
  newLeaseIds,
  isLoading,
  isError,
  error,
  selectedLeases,
  clearSelection,
  makeAllStatic,
  deleteMultiple,
  exportToCSV,
}: DHCPLeaseManagementDesktopProps) {
  const handleMakeStatic = useCallback(async () => {
    const leasesToConvert = leases.filter((l) => selectedLeases.includes(l.id));
    await makeAllStatic(selectedLeases, leasesToConvert);
  }, [selectedLeases, leases, makeAllStatic]);

  const handleDelete = useCallback(async () => {
    await deleteMultiple(selectedLeases);
  }, [selectedLeases, deleteMultiple]);
  return (
    <div className="gap-component-lg p-component-lg flex h-full flex-col">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-component-sm">
          <h1 className="font-display text-3xl font-semibold tracking-tight">DHCP Leases</h1>
          <p className="text-muted-foreground text-sm">
            View and manage DHCP leases across all servers. Make leases static or delete them in
            bulk.
          </p>
        </div>

        <Button
          onClick={exportToCSV}
          variant="outline"
          disabled={isLoading || leases.length === 0}
          aria-label="Export leases to CSV"
          className="focus-visible:ring-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        >
          <Download
            className="mr-component-sm h-4 w-4"
            aria-hidden="true"
          />
          Export CSV
        </Button>
      </div>

      {/* Filters */}
      <LeaseFilters servers={servers.map((s) => ({ id: s.name, name: s.name }))} />

      {/* Bulk Actions Toolbar - shows when items selected */}
      {selectedLeases.length > 0 && (
        <BulkActionsToolbar
          selectedCount={selectedLeases.length}
          onMakeStatic={handleMakeStatic}
          onDelete={handleDelete}
          onClear={clearSelection}
        />
      )}

      {/* Error State */}
      {isError && (
        <div
          className="border-error bg-error/10 p-component-md rounded-[var(--semantic-radius-card)] border"
          role="alert"
        >
          <p className="text-error text-sm font-medium">Failed to load DHCP leases</p>
          <p className="mt-component-xs text-muted-foreground text-sm">
            {error?.message || 'An unexpected error occurred'}
          </p>
        </div>
      )}

      {/* Table */}
      <div className="flex-1 overflow-hidden">
        <LeaseTableWithSelection
          leases={leases}
          newLeaseIds={newLeaseIds}
          isLoading={isLoading}
          selectedIds={new Set(selectedLeases)}
          onSelectionChange={(ids: Set<string>) => {
            // sync selection
          }}
        />
      </div>

      {/* Empty State */}
      {!isLoading && !isError && leases.length === 0 && (
        <div className="border-border p-component-lg flex flex-1 items-center justify-center rounded-[var(--semantic-radius-card)] border border-dashed">
          <div className="text-center">
            <p className="text-sm font-medium">No DHCP leases found</p>
            <p className="mt-component-sm text-muted-foreground text-sm">
              Try adjusting your filters or check that DHCP servers are configured
            </p>
          </div>
        </div>
      )}
    </div>
  );
});
