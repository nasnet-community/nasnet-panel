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
import type { DHCPLease } from '@nasnet/core/types';
export interface DHCPLeaseManagementDesktopProps {
    /** Filtered and sorted leases */
    leases: DHCPLease[];
    /** Available DHCP servers */
    servers: Array<{
        name: string;
        interface: string;
    }>;
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
export declare const DHCPLeaseManagementDesktop: React.NamedExoticComponent<DHCPLeaseManagementDesktopProps>;
//# sourceMappingURL=DHCPLeaseManagementDesktop.d.ts.map