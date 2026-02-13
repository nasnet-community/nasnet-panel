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
 */

import * as React from 'react';
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
  servers: string[];

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
export function DHCPLeaseManagementDesktop({
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
  return (
    <div className="flex h-full flex-col gap-6 p-6">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-semibold tracking-tight">
            DHCP Leases
          </h1>
          <p className="text-sm text-muted-foreground">
            View and manage DHCP leases across all servers. Make leases static or delete them in bulk.
          </p>
        </div>

        <Button
          onClick={exportToCSV}
          variant="outline"
          disabled={isLoading || leases.length === 0}
          aria-label="Export leases to CSV"
        >
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Filters */}
      <LeaseFilters servers={servers} />

      {/* Bulk Actions Toolbar - shows when items selected */}
      {selectedLeases.length > 0 && (
        <BulkActionsToolbar
          selectedCount={selectedLeases.length}
          onMakeStatic={() => makeAllStatic(selectedLeases, leases)}
          onDelete={() => deleteMultiple(selectedLeases)}
          onClear={clearSelection}
        />
      )}

      {/* Error State */}
      {isError && (
        <div
          className="rounded-md border border-destructive bg-destructive/10 p-4"
          role="alert"
        >
          <p className="text-sm font-medium text-destructive">
            Failed to load DHCP leases
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
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
          makeStatic={async (leaseId) => {
            const lease = leases.find(l => l.id === leaseId);
            if (lease) {
              await makeAllStatic([leaseId], [lease]);
            }
          }}
          deleteLease={async (leaseId) => {
            await deleteMultiple([leaseId]);
          }}
        />
      </div>

      {/* Empty State */}
      {!isLoading && !isError && leases.length === 0 && (
        <div className="flex flex-1 items-center justify-center rounded-md border border-dashed p-8">
          <div className="text-center">
            <p className="text-sm font-medium">No DHCP leases found</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Try adjusting your filters or check that DHCP servers are configured
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

DHCPLeaseManagementDesktop.displayName = 'DHCPLeaseManagementDesktop';
