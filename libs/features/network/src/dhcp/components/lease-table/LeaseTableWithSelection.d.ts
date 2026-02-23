/**
 * LeaseTableWithSelection Component
 *
 * Extends the base LeaseTable pattern with:
 * - Checkbox column for bulk selection
 * - "Select All" functionality
 * - Row expansion for lease details
 * - Pulse animation for new leases
 * - "New" badge indicator
 *
 * Integrates with bulk operations for batch actions.
 *
 * @module features/network/dhcp/components/lease-table
 */
import * as React from 'react';
import type { DHCPLease } from '@nasnet/core/types';
export interface LeaseTableWithSelectionProps {
    /** Array of DHCP leases to display */
    leases: DHCPLease[];
    /** Loading state */
    isLoading?: boolean;
    /** Set of selected lease IDs for bulk operations */
    selectedIds: Set<string>;
    /** Callback when selection changes */
    onSelectionChange: (ids: Set<string>) => void;
    /** Set of new lease IDs to highlight with animation */
    newLeaseIds?: Set<string>;
    /** Additional CSS classes */
    className?: string;
}
/**
 * LeaseTableWithSelection Component
 *
 * Desktop table with bulk selection and expandable row details.
 * Highlights new leases with pulse animation and "New" badge.
 *
 * @example
 * ```tsx
 * <LeaseTableWithSelection
 *   leases={leases}
 *   selectedIds={selectedIds}
 *   onSelectionChange={setSelectedIds}
 *   newLeaseIds={newLeaseIds}
 * />
 * ```
 */
export declare const LeaseTableWithSelection: React.ForwardRefExoticComponent<LeaseTableWithSelectionProps & React.RefAttributes<HTMLDivElement>>;
//# sourceMappingURL=LeaseTableWithSelection.d.ts.map