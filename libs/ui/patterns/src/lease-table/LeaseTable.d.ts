/**
 * DHCP Lease Table Component
 * Displays DHCP leases with sorting, filtering, and status badges
 *
 * Epic 0.5: DHCP Management - Story 0.5.2
 */
import * as React from 'react';
import type { DHCPLease } from '@nasnet/core/types';
export interface LeaseTableProps {
    /** Array of DHCP leases to display */
    leases: DHCPLease[];
    /** Loading state */
    isLoading?: boolean;
    /** Additional CSS classes */
    className?: string;
}
/**
 * Memoized LeaseTable component for performance optimization
 */
export declare const LeaseTable: React.MemoExoticComponent<React.ForwardRefExoticComponent<LeaseTableProps & React.RefAttributes<HTMLDivElement>>>;
//# sourceMappingURL=LeaseTable.d.ts.map